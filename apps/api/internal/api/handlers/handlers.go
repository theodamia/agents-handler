package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/yourorg/nous/internal/models"
	"github.com/yourorg/nous/internal/repository"
	"github.com/yourorg/nous/internal/websocket"
)

type Handlers struct {
	repo *repository.Repository
	hub  *websocket.Hub
}

func New(repo *repository.Repository) *Handlers {
	return &Handlers{
		repo: repo,
		hub:  nil, // Will be set by main
	}
}

func NewWithHub(repo *repository.Repository, hub *websocket.Hub) *Handlers {
	return &Handlers{
		repo: repo,
		hub:  hub,
	}
}

// IngestEvent handles incoming tool call events from agents
func (h *Handlers) IngestEvent(w http.ResponseWriter, r *http.Request) {
	var event models.ToolCallEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if event.RequestID == "" || event.ToolName == "" || event.Status == "" {
		log.Printf("Missing required fields: request_id=%q, tool_name=%q, status=%q", event.RequestID, event.ToolName, event.Status)
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Validate request_id is a valid UUID
	if _, err := uuid.Parse(event.RequestID); err != nil {
		log.Printf("Invalid request_id format: %q (error: %v)", event.RequestID, err)
		http.Error(w, "request_id must be a valid UUID", http.StatusBadRequest)
		return
	}

	if event.Status != "success" && event.Status != "failed" {
		http.Error(w, "Status must be 'success' or 'failed'", http.StatusBadRequest)
		return
	}

	if err := h.repo.IngestToolCall(r.Context(), event); err != nil {
		log.Printf("Error ingesting event: %v", err)
		http.Error(w, "Failed to ingest event", http.StatusInternalServerError)
		return
	}

	// Broadcast event to WebSocket clients using batched mode for high-frequency events
	// This reduces client-side load and prevents UI stuttering
	if h.hub != nil {
		h.hub.BroadcastMessageBatched("tool_call", event)
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// GetMetricsOverview returns aggregated overview metrics
func (h *Handlers) GetMetricsOverview(w http.ResponseWriter, r *http.Request) {
	hours := parseHours(r)
	overview, err := h.repo.GetMetricsOverview(r.Context(), hours)
	if err != nil {
		http.Error(w, "Failed to fetch metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(overview)
}

// GetToolCallsMetrics returns tool calls aggregated by hour
func (h *Handlers) GetToolCallsMetrics(w http.ResponseWriter, r *http.Request) {
	hours := parseHours(r)
	metrics, err := h.repo.GetToolCallsMetrics(r.Context(), hours)
	if err != nil {
		http.Error(w, "Failed to fetch tool calls metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// GetLatencyMetrics returns latency percentiles per tool
func (h *Handlers) GetLatencyMetrics(w http.ResponseWriter, r *http.Request) {
	hours := parseHours(r)
	metrics, err := h.repo.GetLatencyMetrics(r.Context(), hours)
	if err != nil {
		log.Printf("Error fetching latency metrics: %v", err)
		http.Error(w, "Failed to fetch latency metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// GetTokenUsageMetrics returns token usage aggregated by hour
func (h *Handlers) GetTokenUsageMetrics(w http.ResponseWriter, r *http.Request) {
	hours := parseHours(r)
	metrics, err := h.repo.GetTokenUsageMetrics(r.Context(), hours)
	if err != nil {
		http.Error(w, "Failed to fetch token usage metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// GetFailureRateMetrics returns failure rate aggregated by hour
func (h *Handlers) GetFailureRateMetrics(w http.ResponseWriter, r *http.Request) {
	hours := parseHours(r)
	metrics, err := h.repo.GetFailureRateMetrics(r.Context(), hours)
	if err != nil {
		http.Error(w, "Failed to fetch failure rate metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// GetRecentToolCalls returns the most recent tool calls
func (h *Handlers) GetRecentToolCalls(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	calls, err := h.repo.GetRecentToolCalls(r.Context(), limit)
	if err != nil {
		http.Error(w, "Failed to fetch recent tool calls", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(calls)
}

// GetToolCallChain returns all tool calls for a specific request ID
func (h *Handlers) GetToolCallChain(w http.ResponseWriter, r *http.Request) {
	requestIDStr := chi.URLParam(r, "requestId")
	requestID, err := uuid.Parse(requestIDStr)
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	calls, err := h.repo.GetToolCallChain(r.Context(), requestID)
	if err != nil {
		http.Error(w, "Failed to fetch tool call chain", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(calls)
}

// parseHours extracts hours parameter from query string, defaults to 24
func parseHours(r *http.Request) int {
	hours := 24
	if hoursStr := r.URL.Query().Get("hours"); hoursStr != "" {
		if parsed, err := strconv.Atoi(hoursStr); err == nil && parsed > 0 {
			hours = parsed
		}
	}
	return hours
}
