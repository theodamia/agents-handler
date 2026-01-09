#!/bin/bash

# Monitoring script for Nous API during load testing
# Shows real-time health metrics and WebSocket status

set -e

API_URL="${API_URL:-http://localhost:8080}"
REFRESH_INTERVAL="${REFRESH_INTERVAL:-2}" # seconds

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Clear screen
clear

echo "📊 Nous API Monitor"
echo "==================="
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Trap Ctrl+C
trap 'echo ""; echo "Monitoring stopped."; exit 0' INT

while true; do
    # Get timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Liveness check
    LIVENESS=$(curl -s -w "\n%{http_code}" "${API_URL}/healthz" 2>/dev/null || echo -e "\n000")
    LIVENESS_CODE=$(echo "$LIVENESS" | tail -n1)
    
    # Readiness check (JSON)
    READINESS=$(curl -s -H "Accept: application/json" "${API_URL}/readyz" 2>/dev/null || echo '{"status":"unknown"}')
    DB_STATUS=$(echo "$READINESS" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
    
    # WebSocket health
    WS_HEALTH=$(curl -s "${API_URL}/ws/health" 2>/dev/null || echo '{"status":"unknown","connections":0}')
    WS_CONNECTIONS=$(echo "$WS_HEALTH" | grep -o '"connections":[0-9]*' | cut -d':' -f2 || echo "0")
    WS_STATUS=$(echo "$WS_HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    
    # Clear previous output (move cursor up)
    echo -ne "\033[2J\033[H"
    
    echo "📊 Nous API Monitor - $TIMESTAMP"
    echo "=================================="
    echo ""
    
    # Liveness
    if [ "$LIVENESS_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Liveness: OK${NC}"
    else
        echo -e "${RED}❌ Liveness: FAILED (HTTP $LIVENESS_CODE)${NC}"
    fi
    
    # Readiness
    if [ "$DB_STATUS" = "ready" ]; then
        echo -e "${GREEN}✅ Readiness: READY${NC}"
    elif [ "$DB_STATUS" = "not ready" ]; then
        echo -e "${RED}❌ Readiness: NOT READY${NC}"
    else
        echo -e "${YELLOW}⚠️  Readiness: UNKNOWN${NC}"
    fi
    
    # Database status
    DB_CONN_STATUS=$(echo "$READINESS" | grep -o '"database":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    if [ "$DB_CONN_STATUS" = "connected" ]; then
        echo -e "   ${GREEN}   Database: Connected${NC}"
    elif [ "$DB_CONN_STATUS" = "disconnected" ]; then
        echo -e "   ${RED}   Database: Disconnected${NC}"
    else
        echo -e "   ${YELLOW}   Database: Unknown${NC}"
    fi
    
    # WebSocket status
    if [ "$WS_STATUS" = "active" ]; then
        echo -e "${GREEN}✅ WebSocket: Active${NC}"
    else
        echo -e "${YELLOW}⚠️  WebSocket: $WS_STATUS${NC}"
    fi
    echo -e "   ${CYAN}   Connections: $WS_CONNECTIONS${NC}"
    
    echo ""
    echo "────────────────────────────────────"
    echo ""
    echo "💡 Tips:"
    echo "   • Watch connections increase during load tests"
    echo "   • Check dashboard: http://localhost:5173/observability"
    echo "   • Press Ctrl+C to stop monitoring"
    echo ""
    echo "Refreshing every ${REFRESH_INTERVAL}s..."
    
    sleep $REFRESH_INTERVAL
done
