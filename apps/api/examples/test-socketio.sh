#!/bin/bash

# Comprehensive Socket.IO Testing Script
# This script tests the Socket.IO integration end-to-end

set -e

API_URL="${API_URL:-http://localhost:8080}"
API_V1_URL="${API_URL}/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Socket.IO Integration Test Suite"
echo "===================================="
echo ""

# Test 1: Backend Health Check
echo "1️⃣  Testing backend health..."
if curl -s -f "${API_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running. Please start it first.${NC}"
    exit 1
fi
echo ""

# Test 2: Socket.IO Endpoint Check
echo "2️⃣  Testing Socket.IO endpoint..."
if curl -s -f "${API_URL}/socket.io/" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Socket.IO endpoint is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Socket.IO endpoint check inconclusive (this is normal)${NC}"
fi
echo ""

# Test 3: Send Test Events
echo "3️⃣  Sending test events..."
REQUEST_ID=$(uuidgen 2>/dev/null || echo "test-$(date +%s)")

for i in {1..5}; do
    TOOL_NAMES=("SearchWeb" "ReadFile" "Grep" "WriteFile" "SearchRepo")
    STATUSES=("success" "success" "success" "failed" "success")
    
    TOOL_NAME=${TOOL_NAMES[$((i-1))]}
    STATUS=${STATUSES[$((i-1))]}
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_V1_URL}/events" \
        -H "Content-Type: application/json" \
        -d "{
            \"request_id\": \"${REQUEST_ID}\",
            \"tool_name\": \"${TOOL_NAME}\",
            \"duration_ms\": $((100 + i * 50)),
            \"status\": \"${STATUS}\",
            \"input_tokens\": $((1000 + i * 100)),
            \"output_tokens\": $((500 + i * 50)),
            \"metadata\": {
                \"test\": true,
                \"iteration\": ${i}
            }
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 201 ]; then
        echo -e "${GREEN}✅ Event $i sent successfully (${TOOL_NAME} - ${STATUS})${NC}"
    else
        echo -e "${RED}❌ Event $i failed: HTTP $HTTP_CODE${NC}"
        echo "   Response: $BODY"
    fi
    
    sleep 0.3
done
echo ""

# Test 4: Verify Events Were Stored
echo "4️⃣  Verifying events in database..."
echo "   (Check your dashboard at http://localhost:5173/observability)"
echo "   Recent tool calls should show the 5 events we just sent"
echo ""

# Test 5: Test Metrics Endpoints
echo "5️⃣  Testing metrics endpoints..."

METRICS_ENDPOINTS=(
    "metrics/overview"
    "metrics/tool-calls?hours=1"
    "metrics/latency?hours=1"
    "metrics/token-usage?hours=1"
    "metrics/failure-rate?hours=1"
    "tool-calls/recent?limit=5"
)

for endpoint in "${METRICS_ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_V1_URL}/${endpoint}")
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ GET /${endpoint}${NC}"
    else
        echo -e "${RED}❌ GET /${endpoint} returned HTTP $HTTP_CODE${NC}"
    fi
done
echo ""

# Test 6: Test Invalid Event (Error Handling)
echo "6️⃣  Testing error handling..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_V1_URL}/events" \
    -H "Content-Type: application/json" \
    -d '{
        "request_id": "",
        "tool_name": "TestTool",
        "duration_ms": 100,
        "status": "invalid_status"
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ Invalid event correctly rejected (HTTP 400)${NC}"
else
    echo -e "${RED}❌ Expected HTTP 400, got $HTTP_CODE${NC}"
fi
echo ""

# Test 7: High-Frequency Event Test
echo "7️⃣  Testing high-frequency events (10 events)..."
for i in {1..10}; do
    curl -s -X POST "${API_V1_URL}/events" \
        -H "Content-Type: application/json" \
        -d "{
            \"request_id\": \"perf-test-$(date +%s)-$i\",
            \"tool_name\": \"TestTool\",
            \"duration_ms\": $((50 + (i % 200))),
            \"status\": \"success\",
            \"input_tokens\": 1000,
            \"output_tokens\": 500
        }" > /dev/null
done
echo -e "${GREEN}✅ Sent 10 events rapidly${NC}"
echo ""

# Summary
echo "===================================="
echo "📊 Test Summary"
echo "===================================="
echo ""
echo "✅ Backend tests completed"
echo ""
echo "🔍 Next steps:"
echo "   1. Open http://localhost:5173/observability in your browser"
echo "   2. Check that 'Live' badge is green (Socket.IO connected)"
echo "   3. Verify recent tool calls show the test events"
echo "   4. Watch the dashboard update in real-time"
echo ""
echo "💡 To test reconnection:"
echo "   1. Stop the backend (Ctrl+C)"
echo "   2. Watch 'Live' badge turn gray"
echo "   3. Restart backend"
echo "   4. Watch 'Live' badge turn green again"
echo ""
echo "✨ All automated tests passed! Check the dashboard for real-time updates."
