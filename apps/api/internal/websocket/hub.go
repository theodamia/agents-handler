package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512 * 1024 // 512KB
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:3000",
		}

		// Allow requests with no origin (e.g., mobile apps, Postman)
		if origin == "" {
			return true
		}

		for _, allowed := range allowedOrigins {
			if origin == allowed {
				log.Printf("WebSocket origin allowed: %s", origin)
				return true
			}
		}

		log.Printf("WebSocket origin rejected: %s", origin)
		return false
	},
}

// Client represents a single WebSocket connection
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
	mu   sync.Mutex
}

// Hub maintains the set of active clients and broadcasts messages to clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from clients
	broadcast chan []byte

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Batch buffer for high-frequency events
	batchBuffer []Message
	batchTimer  *time.Timer
	batchMutex  sync.Mutex

	mu sync.RWMutex
}

// Message represents a WebSocket message
type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

const (
	// Batch window for high-frequency events (50ms)
	batchWindow = 50 * time.Millisecond
	// Maximum batch size before flushing
	maxBatchSize = 10
)

// NewHub creates a new WebSocket hub
// The broadcast channel is buffered to prevent blocking during high-frequency events
// Buffer size of 256 is a reasonable default (can be tuned based on load)
func NewHub() *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		broadcast:   make(chan []byte, 256), // Buffered channel to prevent blocking
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		batchBuffer: make([]Message, 0, maxBatchSize),
	}
}

// Run starts the hub's main loop
// This should be run in a separate goroutine
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("WebSocket client connected. Total clients: %d", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("WebSocket client disconnected. Total clients: %d", len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			// Create a snapshot of clients to avoid holding lock during send
			clients := make([]*Client, 0, len(h.clients))
			for client := range h.clients {
				clients = append(clients, client)
			}
			h.mu.RUnlock()

			// Send to all clients without holding the lock
			for _, client := range clients {
				select {
				case client.send <- message:
				default:
					// Client's send channel is full, disconnect them
					h.mu.Lock()
					if _, ok := h.clients[client]; ok {
						delete(h.clients, client)
						close(client.send)
					}
					h.mu.Unlock()
				}
			}
		}
	}
}

// Shutdown gracefully shuts down the hub, flushing any pending batches
func (h *Hub) Shutdown() {
	h.batchMutex.Lock()

	// Stop timer if running
	if h.batchTimer != nil {
		h.batchTimer.Stop()
		h.batchTimer = nil
	}

	// Flush any remaining batched messages
	if len(h.batchBuffer) > 0 {
		h.flushBatch() // flushBatch maintains the lock
	}

	h.batchMutex.Unlock()
}

// flushBatch sends all batched messages at once
// Must be called with batchMutex already locked
// The mutex remains locked after this function returns
func (h *Hub) flushBatch() {
	if len(h.batchBuffer) == 0 {
		return
	}

	// Stop and clear timer before flushing
	if h.batchTimer != nil {
		h.batchTimer.Stop()
		h.batchTimer = nil
	}

	// Copy buffer to avoid holding lock during channel send
	buffer := make([]Message, len(h.batchBuffer))
	copy(buffer, h.batchBuffer)
	h.batchBuffer = h.batchBuffer[:0]

	// Unlock before potentially blocking channel operation
	h.batchMutex.Unlock()

	// Send all batched messages as a single batch
	batchMessage := Message{
		Type: "batch",
		Data: buffer,
	}

	jsonData, err := json.Marshal(batchMessage)
	if err != nil {
		log.Printf("Error marshaling batched WebSocket message: %v", err)
		h.batchMutex.Lock()
		return
	}

	select {
	case h.broadcast <- jsonData:
		// Success
	default:
		log.Printf("WebSocket broadcast channel full, dropping batch")
	}

	// Re-lock mutex before returning
	h.batchMutex.Lock()
}

// BroadcastMessage sends a message to all connected clients
// This is a non-blocking operation - if the channel is full, the message is dropped
func (h *Hub) BroadcastMessage(eventType string, data interface{}) {
	message := Message{
		Type: eventType,
		Data: data,
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling WebSocket message: %v", err)
		return
	}

	select {
	case h.broadcast <- jsonData:
	default:
		log.Printf("WebSocket broadcast channel full, dropping message")
	}
}

// BroadcastMessageBatched batches high-frequency events to reduce client load
// Events are batched for 50ms or until batch size reaches maxBatchSize
// This is thread-safe and non-blocking
func (h *Hub) BroadcastMessageBatched(eventType string, data interface{}) {
	h.batchMutex.Lock()

	message := Message{
		Type: eventType,
		Data: data,
	}

	h.batchBuffer = append(h.batchBuffer, message)

	// Flush if batch is full
	if len(h.batchBuffer) >= maxBatchSize {
		h.flushBatch() // flushBatch maintains the lock
		h.batchMutex.Unlock()
		return
	}

	// Start timer if this is the first message in the batch
	if h.batchTimer == nil {
		h.batchTimer = time.AfterFunc(batchWindow, func() {
			h.batchMutex.Lock()
			// Double-check timer is still valid (might have been flushed by size)
			if h.batchTimer != nil {
				h.flushBatch() // flushBatch maintains the lock
			}
			h.batchMutex.Unlock()
		})
	}

	h.batchMutex.Unlock()
}

// GetClientCount returns the number of connected clients
func (h *Hub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// ServeWS handles WebSocket requests from clients
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:  h,
		conn: conn,
		send: make(chan []byte, 256),
	}

	client.hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// readPump pumps messages from the WebSocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
