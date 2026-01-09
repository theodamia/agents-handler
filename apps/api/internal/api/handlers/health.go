package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// LivenessCheck verifies the application is running (doesn't check dependencies)
// Used by Kubernetes liveness probes - should return 200 if app is alive
func (h *Handlers) LivenessCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// ReadinessCheck verifies the application is ready to serve traffic (checks dependencies)
// Used by Kubernetes readiness probes and load balancers
// Returns 200 if ready, 503 if not ready
func (h *Handlers) ReadinessCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Check database connectivity
	dbHealthy := true
	if err := h.repo.Ping(ctx); err != nil {
		dbHealthy = false
		log.Printf("Readiness check failed: database ping error: %v", err)
	}

	status := "ready"
	statusCode := http.StatusOK

	if !dbHealthy {
		status = "not ready"
		statusCode = http.StatusServiceUnavailable
	}

	// Check if client wants JSON (for webhooks/monitoring) or plain text (for load balancers)
	acceptHeader := r.Header.Get("Accept")
	wantsJSON := acceptHeader == "application/json" || r.URL.Query().Get("format") == "json"

	if wantsJSON {
		// Detailed JSON format for webhooks and monitoring systems
		response := map[string]interface{}{
			"status":    status,
			"timestamp": time.Now().Format(time.RFC3339),
			"services": map[string]interface{}{
				"database": map[string]interface{}{
					"status": func() string {
						if dbHealthy {
							return "connected"
						}
						return "disconnected"
					}(),
				},
				"websocket": map[string]interface{}{
					"status":      "active",
					"connections": h.hub.GetClientCount(),
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Plain text format for load balancers and simple checks
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(statusCode)
	if statusCode == http.StatusOK {
		w.Write([]byte("OK"))
	} else {
		w.Write([]byte("NOT READY"))
	}
}

// WebSocketHealthCheck returns WebSocket hub status
func (h *Handlers) WebSocketHealthCheck(w http.ResponseWriter, r *http.Request) {
	clientCount := h.hub.GetClientCount()

	response := map[string]interface{}{
		"status":      "active",
		"connections": clientCount,
		"endpoint":    "/ws",
		"protocol":    "RFC 6455 (WebSocket)",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
