#!/bin/bash

# Example script showing how agents can send tool call events to the Nous API
# Events will be broadcast to all connected WebSocket clients in real-time

API_URL="${API_URL:-http://localhost:8080/api/v1}"

# Generate a request ID
REQUEST_ID=$(uuidgen 2>/dev/null || echo "req-$(date +%s)")

echo "Sending tool call events for request: $REQUEST_ID"

# Example 1: Successful SearchWeb call
curl -X POST "$API_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"tool_name\": \"SearchWeb\",
    \"duration_ms\": 245,
    \"status\": \"success\",
    \"input_tokens\": 1250,
    \"output_tokens\": 890,
    \"metadata\": {
      \"query\": \"example search query\",
      \"results_count\": 10
    }
  }"

sleep 1

# Example 2: Successful ReadFile call
curl -X POST "$API_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"tool_name\": \"ReadFile\",
    \"duration_ms\": 89,
    \"status\": \"success\",
    \"input_tokens\": 2340,
    \"output_tokens\": 0,
    \"metadata\": {
      \"file_path\": \"/path/to/file.ts\",
      \"file_size\": 1024
    }
  }"

sleep 1

# Example 3: Failed Grep call
curl -X POST "$API_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"tool_name\": \"Grep\",
    \"duration_ms\": 0,
    \"status\": \"failed\",
    \"error_message\": \"Pattern syntax error\",
    \"metadata\": {
      \"pattern\": \"invalid[pattern\"
    }
  }"

sleep 1

# Example 4: Successful WriteFile call
curl -X POST "$API_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"tool_name\": \"WriteFile\",
    \"duration_ms\": 124,
    \"status\": \"success\",
    \"input_tokens\": 560,
    \"output_tokens\": 0,
    \"metadata\": {
      \"file_path\": \"/path/to/output.ts\",
      \"bytes_written\": 2048
    }
  }"

echo ""
echo "✅ Done! Check the dashboard at http://localhost:5173/observability"
echo "   The dashboard should update automatically via WebSocket!"
echo ""
echo "💡 To verify WebSocket is working:"
echo "   1. Open the dashboard in your browser"
echo "   2. Check that 'Live' badge is green"
echo "   3. Watch the dashboard update in real-time as events are sent"
