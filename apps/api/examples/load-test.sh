#!/bin/bash

# Load testing script for Nous API
# Simulates realistic traffic patterns with multiple concurrent agents

set -e

API_URL="${API_URL:-http://localhost:8080/api/v1}"
CONCURRENT_AGENTS="${CONCURRENT_AGENTS:-5}"
EVENTS_PER_AGENT="${EVENTS_PER_AGENT:-20}"
DELAY_BETWEEN_EVENTS="${DELAY_BETWEEN_EVENTS:-1}" # seconds

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 Nous API Load Test"
echo "====================="
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Concurrent Agents: $CONCURRENT_AGENTS"
echo "  Events per Agent: $EVENTS_PER_AGENT"
echo "  Delay between events: ${DELAY_BETWEEN_EVENTS}s"
echo ""

# Check if API is running
echo "1️⃣  Checking API health..."
if ! curl -s -f "${API_URL%/api/v1}/healthz" > /dev/null; then
    echo -e "${RED}❌ API is not running. Please start it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API is running${NC}"
echo ""

# Function to send events from a single agent
send_agent_events() {
    local agent_id=$1
    local request_id=$(uuidgen 2>/dev/null || echo "req-$(date +%s)-$agent_id")
    local success_count=0
    local fail_count=0
    
    echo -e "${BLUE}Agent $agent_id: Starting (Request ID: $request_id)${NC}"
    
    # Tool names for realistic simulation
    local tools=("SearchWeb" "ReadFile" "Grep" "WriteFile" "SearchRepo" "ExecuteCommand")
    
    for i in $(seq 1 $EVENTS_PER_AGENT); do
        # Random tool selection
        local tool_name=${tools[$RANDOM % ${#tools[@]}]}
        
        # Realistic duration (50-500ms)
        local duration=$((50 + RANDOM % 450))
        
        # 95% success rate
        local status="success"
        if [ $((RANDOM % 100)) -lt 5 ]; then
            status="failed"
            fail_count=$((fail_count + 1))
        else
            success_count=$((success_count + 1))
        fi
        
        # Realistic token usage
        local input_tokens=$((100 + RANDOM % 2000))
        local output_tokens=$((50 + RANDOM % 1500))
        
        # Send event
        local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/events" \
            -H "Content-Type: application/json" \
            -d "{
                \"request_id\": \"$request_id\",
                \"tool_name\": \"$tool_name\",
                \"duration_ms\": $duration,
                \"status\": \"$status\",
                \"input_tokens\": $input_tokens,
                \"output_tokens\": $output_tokens,
                \"metadata\": {
                    \"agent_id\": $agent_id,
                    \"event_number\": $i,
                    \"test\": true
                }
            }")
        
        local http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "201" ]; then
            echo -e "${GREEN}Agent $agent_id: Event $i sent ($tool_name, ${duration}ms, $status)${NC}"
        else
            echo -e "${RED}Agent $agent_id: Event $i failed (HTTP $http_code)${NC}"
        fi
        
        # Delay between events
        sleep $DELAY_BETWEEN_EVENTS
    done
    
    echo -e "${BLUE}Agent $agent_id: Completed ($success_count success, $fail_count failed)${NC}"
}

# Start time
START_TIME=$(date +%s)

# Run concurrent agents
echo "2️⃣  Starting $CONCURRENT_AGENTS concurrent agents..."
echo ""

PIDS=()
for i in $(seq 1 $CONCURRENT_AGENTS); do
    send_agent_events $i &
    PIDS+=($!)
done

# Wait for all agents to complete
for pid in "${PIDS[@]}"; do
    wait $pid
done

# End time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
TOTAL_EVENTS=$((CONCURRENT_AGENTS * EVENTS_PER_AGENT))

echo ""
echo "📊 Load Test Summary"
echo "==================="
echo "  Total Agents: $CONCURRENT_AGENTS"
echo "  Events per Agent: $EVENTS_PER_AGENT"
echo "  Total Events: $TOTAL_EVENTS"
echo "  Duration: ${DURATION}s"
echo "  Events/sec: $(echo "scale=2; $TOTAL_EVENTS / $DURATION" | bc)"
echo ""
echo -e "${GREEN}✅ Load test completed!${NC}"
echo ""
echo "💡 Check the dashboard at http://localhost:5173/observability"
echo "   to see the metrics update in real-time!"
