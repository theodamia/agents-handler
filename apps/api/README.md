# Nous API - Backend

Go backend API for collecting and serving observability data from AI agents.

## Quick Start

### Prerequisites

- Go 1.22+
- Docker and Docker Compose
- PostgreSQL client (optional, for direct DB access)

### Setup

1. **Start the database:**
   ```bash
   make docker-up
   # Or manually:
   docker-compose -f deploy/docker/docker-compose.yml up -d timescaledb
   ```

2. **Install dependencies:**
   ```bash
   cd apps/api
   go mod download
   ```

3. **Start the server:**
   ```bash
   export DATABASE_URL="postgres://nous:nous@localhost:5432/nous?sslmode=disable"
   go run ./cmd/api
   ```

   Or use the helper script:
   ```bash
   ./start-backend.sh
   ```

**Expected output:**
```
Migrations applied successfully
Server starting on port 8080
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agents    │────▶│   Nous API  │────▶│ TimescaleDB │────▶│  Dashboard  │
│ (Python/JS) │     │    (Go)     │     │             │     │   (React)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                                        ▲
      │                   │           ┌─────────────┐              │
      │                   └──────────▶│  WebSocket  │──────────────┘
      │                               │     Hub     │
      │                               └─────────────┘
      │
      ▼
  POST /api/v1/events
```

## API Endpoints

### Health Checks

The API provides separate health check endpoints following Kubernetes best practices:

#### Liveness Check

```bash
GET /healthz
```

**Purpose:** Verifies the application is running (doesn't check dependencies)

**Response:** `200 OK` with plain text "OK"

**Use case:** Kubernetes liveness probes, basic monitoring

**Local access:**
```bash
# Using curl
curl http://localhost:8080/healthz

# Or open in browser
open http://localhost:8080/healthz
```

#### Readiness Check

```bash
GET /readyz
```

**Purpose:** Verifies the application is ready to serve traffic (checks dependencies)

**Response:**
- `200 OK` with "OK" if ready
- `503 Service Unavailable` with "NOT READY" if dependencies are down

**Use case:** Kubernetes readiness probes, load balancers, webhooks

**Local access:**

**Plain text (default):**
```bash
curl http://localhost:8080/readyz
# Returns: OK or NOT READY
```

**JSON format** (for monitoring systems):
```bash
curl -H "Accept: application/json" http://localhost:8080/readyz
```

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2024-01-08T16:30:00Z",
  "services": {
    "database": {
      "status": "connected"
    },
    "websocket": {
      "status": "active",
      "connections": 2
    }
  }
}
```

**Quick test all endpoints:**
```bash
# Liveness (fast)
curl http://localhost:8080/healthz

# Readiness (checks dependencies)
curl http://localhost:8080/readyz

# Readiness with JSON
curl -H "Accept: application/json" http://localhost:8080/readyz

# WebSocket health check
curl http://localhost:8080/ws/health
```

### Agent Ingestion

```bash
POST /api/v1/events
Content-Type: application/json

{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "tool_name": "SearchWeb",
  "duration_ms": 245,
  "status": "success",
  "input_tokens": 1250,
  "output_tokens": 890,
  "error_message": null,
  "metadata": {}
}
```

**Response:** `201 Created`

### Observability Endpoints

- `GET /api/v1/metrics/overview?hours=24` - Overall metrics
- `GET /api/v1/metrics/tool-calls?hours=24` - Calls over time
- `GET /api/v1/metrics/latency?hours=24` - Latency breakdown
- `GET /api/v1/metrics/token-usage?hours=24` - Token consumption
- `GET /api/v1/metrics/failure-rate?hours=24` - Error rates
- `GET /api/v1/tool-calls/recent?limit=10` - Recent calls
- `GET /api/v1/tool-calls/chains/{requestId}` - Call chain

## WebSocket Real-Time Updates

The API includes a native WebSocket server for real-time updates.

### Endpoint

```
ws://localhost:8080/ws
```

### Health Check

Check WebSocket hub status:

```bash
GET /ws/health
```

**Response:**
```json
{
  "status": "active",
  "connections": 2,
  "endpoint": "/ws",
  "protocol": "RFC 6455 (WebSocket)"
}
```

**Local access:**
```bash
curl http://localhost:8080/ws/health
```

### Testing WebSocket Connection

**Using wscat (recommended):**
```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8080/ws

# You should see connection established
# Messages will appear when events are sent to /api/v1/events
```

**Using browser console:**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('Error:', error);
ws.onclose = () => console.log('Disconnected');
```

**Using curl (check endpoint):**
```bash
# This will attempt WebSocket upgrade (may show upgrade response)
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
  http://localhost:8080/ws
```

### Message Format

When a tool call event is received via `POST /api/v1/events`, it's automatically broadcast to all connected WebSocket clients:

```json
{
  "type": "tool_call",
  "data": {
    "request_id": "...",
    "tool_name": "...",
    "duration_ms": 245,
    "status": "success",
    ...
  }
}
```

### Connection Details

- **CORS:** Allowed origins: `http://localhost:5173`, `http://localhost:3000`
- **Protocol:** Native WebSocket (RFC 6455)
- **Ping/Pong:** Automatic keepalive every 54 seconds
- **Reconnection:** Handled by client

## Database

### Migrations

The project uses **golang-migrate** for database migrations. Migrations run automatically on startup.

**Quick start:**
```bash
# Create new migration (uses timestamp automatically)
cd apps/api
migrate create -ext sql -dir migrations add_column_name

# Migrations run automatically when you start the server
go run ./cmd/api
```

See `MIGRATIONS.md` for complete guide on:
- Creating migrations
- Running migrations manually
- Rollback procedures
- Troubleshooting

### Schema

The `tool_calls` table is a TimescaleDB hypertable optimized for time-series queries:

```sql
CREATE TABLE tool_calls (
    id UUID,
    request_id UUID NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    duration_ms INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('tool_calls', 'created_at');
```

## Database UI

Connect with TablePlus (macOS) or any PostgreSQL client:

1. **Install TablePlus:** https://tableplus.com

2. **Create new connection:**
   - Click **Create a new connection**
   - Select **PostgreSQL**

3. **Connection settings:**
   - **Name:** Nous Database
   - **Host:** `localhost`
   - **Port:** `5432`
   - **User:** `nous`
   - **Password:** `nous`
   - **Database:** `nous`

4. **Click Test** then **Connect**

You can now browse tables, run queries, and view data visually!

## Testing

### Quick Test

```bash
# Liveness check (fast, no dependencies)
curl http://localhost:8080/healthz

# Readiness check (checks database and WebSocket)
curl http://localhost:8080/readyz

# Readiness check with JSON (for monitoring)
curl -H "Accept: application/json" http://localhost:8080/readyz

# WebSocket health check
curl http://localhost:8080/ws/health

# Test WebSocket connection (install wscat first: npm install -g wscat)
# wscat -c ws://localhost:8080/ws

# Send test event
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "tool_name": "SearchWeb",
    "duration_ms": 200,
    "status": "success",
    "input_tokens": 1000,
    "output_tokens": 500
  }'

# Query metrics
curl "http://localhost:8080/api/v1/metrics/overview?hours=24"
```

### Example Scripts

```bash
cd apps/api/examples
./agent-example.sh  # Send sample tool call events
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: `8080`)
- `DATABASE_URL` - PostgreSQL connection string (default: `postgres://nous:nous@localhost:5432/nous?sslmode=disable`)

### Database Connection

Default connection string:
```
postgres://nous:nous@localhost:5432/nous?sslmode=disable
```

## Development

### Project Structure

```
apps/api/
├── cmd/api/          # Main entry point
├── internal/
│   ├── api/handlers/ # HTTP handlers
│   │   ├── handlers.go  # Business logic handlers (events, metrics)
│   │   └── health.go   # Health check handlers (liveness, readiness)
│   ├── database/     # Migration logic
│   ├── models/       # Data models
│   ├── repository/   # Database operations
│   └── websocket/    # WebSocket hub
├── examples/         # Test scripts
└── migrations/       # SQL migrations
```

### Key Components

- **Handlers** (`internal/api/handlers/`) - HTTP request handlers
  - `handlers.go` - Business logic handlers (events ingestion, metrics queries)
  - `health.go` - Infrastructure handlers (health checks, WebSocket status)
- **Repository** (`internal/repository/`) - Database operations
- **WebSocket Hub** (`internal/websocket/`) - Real-time broadcasting
- **Models** (`internal/models/`) - Data structures

### Code Quality

The project uses pre-commit hooks for code quality:

- **Go formatting:** Automatically formats code with `go fmt`
- **Go vet:** Catches common errors before commit
- **Frontend linting:** Biome checks for TypeScript/React files

## Troubleshooting

### Database Connection Issues

**Error:** `FATAL: role "nous" does not exist`

**Solution:** A local PostgreSQL instance may be running on port 5432. Stop it:

```bash
brew services stop postgresql@16
# Or check what's running:
ps aux | grep postgres | grep -v docker
```

**Verify database is running:**
```bash
docker ps | grep timescale
# Should show: docker-timescaledb-1 (healthy)
```

### Port Already in Use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Find what's using the port
lsof -i :8080

# Kill the process or use a different port
export PORT=8081
```

### WebSocket Not Connecting

1. Check backend is running: `curl http://localhost:8080/healthz`
2. Check readiness: `curl http://localhost:8080/readyz` (should return OK)
3. Check WebSocket health: `curl http://localhost:8080/ws/health` (should show active status)
4. Test WebSocket connection:
   ```bash
   # Install wscat: npm install -g wscat
   wscat -c ws://localhost:8080/ws
   ```
5. Check WebSocket endpoint: `curl http://localhost:8080/ws` (should attempt WebSocket upgrade)
6. Verify CORS settings allow your origin (`http://localhost:5173` or `http://localhost:3000`)
7. Check backend logs for connection errors
8. Verify frontend is connecting to correct WebSocket URL (`ws://localhost:8080/ws`)

### Dependencies Missing

```bash
cd apps/api
go mod download
go mod tidy
```

### Migration Issues

See `MIGRATIONS.md` for detailed troubleshooting guide.

## Production Considerations

- **Connection Pooling:** Uses `pgxpool` for efficient database connections
- **Graceful Shutdown:** Handles SIGINT/SIGTERM signals
- **Timeouts:** Read/Write/Idle timeouts configured
- **CORS:** Configured for allowed origins
- **Error Handling:** Proper error responses and logging

## Next Steps

- Add authentication (API keys, JWT)
- Add rate limiting
- Add data retention policies
- Add more metrics and aggregations
- Add alerting/webhooks
