#!/bin/bash

# Quick script to start the backend
# Usage: ./start-backend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/apps/api"

export DATABASE_URL="postgres://nous:nous@localhost:5432/nous?sslmode=disable"

echo "🚀 Starting Nous API backend..."
echo "📁 Directory: $(pwd)"
echo "🔗 Database: $DATABASE_URL"
echo ""

# Check if local PostgreSQL is running and warn (but not Docker)
if lsof -i :5432 2>/dev/null | grep -q "^postgres" && ! lsof -i :5432 2>/dev/null | grep -q "com.docke"; then
    echo "⚠️  WARNING: Local PostgreSQL detected on port 5432!"
    echo "   This may interfere with Docker container connection."
    echo "   Stop it with: brew services stop postgresql@16"
    echo ""
fi

go run ./cmd/api
