#!/bin/bash

# Quick script to start the frontend
# Usage: ./start-frontend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/apps/web"

echo "🚀 Starting Nous frontend..."
echo "📁 Directory: $(pwd)"
echo ""

npm run dev
