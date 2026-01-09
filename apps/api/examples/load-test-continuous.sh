#!/bin/bash

# Continuous load testing script
# Sends events at a steady rate to simulate ongoing traffic

set -e

API_URL="${API_URL:-http://localhost:8080/api/v1}"
EVENTS_PER_SECOND="${EVENTS_PER_SECOND:-5}"
DURATION="${DURATION:-60}" # seconds, 0 = infinite

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔄 Continuous Load Test"
echo "======================"
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Events per second: $EVENTS_PER_SECOND"
echo "  Duration: ${DURATION}s (0 = infinite)"
echo ""

# Check API
if ! curl -s -f "${API_URL%/api/v1}/healthz" > /dev/null; then
    echo -e "${RED}❌ API is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ API is running${NC}"
echo ""
echo "Press Ctrl+C to stop..."
echo ""

# Calculate delay between events
DELAY=$(echo "scale=3; 1 / $EVENTS_PER_SECOND" | bc)

# Tools for realistic simulation
TOOLS=("SearchWeb" "ReadFile" "Grep" "WriteFile" "SearchRepo")

START_TIME=$(date +%s)
EVENT_COUNT=0

# Trap Ctrl+C
trap 'echo ""; echo "Stopping..."; exit 0' INT

while true; do
    # Check duration
    if [ "$DURATION" -gt 0 ]; then
        CURRENT_TIME=$(date +%s)
        ELAPSED=$((CURRENT_TIME - START_TIME))
        if [ $ELAPSED -ge $DURATION ]; then
            break
        fi
    fi
    
    # Generate event
    REQUEST_ID=$(uuidgen 2>/dev/null || echo "req-$(date +%s)-$RANDOM")
    TOOL_NAME=${TOOLS[$RANDOM % ${#TOOLS[@]}]}
    DURATION_MS=$((50 + RANDOM % 450))
    
    # 95% success rate
    if [ $((RANDOM % 100)) -lt 5 ]; then
        STATUS="failed"
        ERROR_MSG="Simulated error"
    else
        STATUS="success"
        ERROR_MSG="null"
    fi
    
    INPUT_TOKENS=$((100 + RANDOM % 2000))
    OUTPUT_TOKENS=$((50 + RANDOM % 1500))
    
    # Send event (non-blocking)
    curl -s -X POST "$API_URL/events" \
        -H "Content-Type: application/json" \
        -d "{
            \"request_id\": \"$REQUEST_ID\",
            \"tool_name\": \"$TOOL_NAME\",
            \"duration_ms\": $DURATION_MS,
            \"status\": \"$STATUS\",
            \"input_tokens\": $INPUT_TOKENS,
            \"output_tokens\": $OUTPUT_TOKENS,
            \"error_message\": $ERROR_MSG,
            \"metadata\": {\"test\": true, \"continuous\": true}
        }" > /dev/null &
    
    EVENT_COUNT=$((EVENT_COUNT + 1))
    
    # Show progress every 10 events
    if [ $((EVENT_COUNT % 10)) -eq 0 ]; then
        echo -e "${GREEN}Sent $EVENT_COUNT events...${NC}"
    fi
    
    sleep $DELAY
done

echo ""
echo "📊 Summary:"
echo "  Total events sent: $EVENT_COUNT"
echo "  Duration: ${DURATION}s"
echo "  Average rate: $(echo "scale=2; $EVENT_COUNT / $DURATION" | bc) events/sec"
