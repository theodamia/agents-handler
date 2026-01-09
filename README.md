# Nous

Tool-use observability dashboard for AI agent systems in production.

Nous provides real-time monitoring, metrics, and insights for AI agents that use tools. Track tool calls, latency, token usage, failure rates, and more.

## Features

- 📊 **Real-time Dashboard** - Live updates via WebSocket
- 📈 **Metrics & Analytics** - Latency, token usage, failure rates
- 🔗 **Tool Call Chains** - Visualize request flows
- ⚡ **High Performance** - TimescaleDB for time-series data
- 🔌 **Easy Integration** - Simple REST API for agents

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

## Project Structure

```
nous/
├── apps/
│   ├── api/        # Go backend API
│   └── web/        # React frontend (Vite + TanStack Router)
├── packages/
│   └── sdk/        # Instrumentation SDK (future)
├── deploy/
│   └── docker/     # Docker Compose configuration
└── Makefile        # Development commands
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Go 1.22+ (for backend)
- Node.js 18+ (for frontend)

### 1. Start Infrastructure

```bash
# Start TimescaleDB and Redis
make docker-up

# Or manually:
docker-compose -f deploy/docker/docker-compose.yml up -d
```

### 2. Start Backend

```bash
# Option 1: Use helper script
./start-backend.sh

# Option 2: Manual start
cd apps/api
export DATABASE_URL="postgres://nous:nous@localhost:5432/nous?sslmode=disable"
go run ./cmd/api
```

### 3. Start Frontend

```bash
# Option 1: Use helper script
./start-frontend.sh

# Option 2: Manual start
cd apps/web
npm install
npm run dev
```

### 4. Access Dashboard

Open your browser to: **http://localhost:5173/observability**

## Services

| Service | Port | Description |
|---------|------|-------------|
| **API** | 8080 | Go backend + WebSocket |
| **Web** | 5173 | Vite dev server |
| **TimescaleDB** | 5432 | Time-series database |
| **Redis** | 6379 | Pub/sub (optional) |

## Integration

### Send Tool Call Events

```bash
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "tool_name": "SearchWeb",
    "duration_ms": 245,
    "status": "success",
    "input_tokens": 1250,
    "output_tokens": 890
  }'
```

See `apps/api/examples/agent-example.sh` for more examples.

## Documentation

- **[Backend API Documentation](apps/api/README.md)** - API endpoints, WebSocket, database setup
- **[Migrations Guide](apps/api/MIGRATIONS.md)** - Database migration management
- **[Frontend Documentation](apps/web/README.md)** - React app structure and development

## Development

### Make Commands

```bash
make docker-up      # Start Docker services
make docker-down    # Stop Docker services
make dev           # Start both frontend and backend (if configured)
```

### Code Quality

The project uses pre-commit hooks for code quality:

- **Go:** Automatic formatting with `go fmt` and checks with `go vet`
- **Frontend:** Biome for linting and formatting TypeScript/React

### Project Structure

- **`apps/api/`** - Go backend with Chi router, TimescaleDB, WebSocket hub
- **`apps/web/`** - React frontend with Vite, TanStack Router, TanStack Query
- **`deploy/docker/`** - Docker Compose configuration for local development

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/events` - Ingest tool call events
- `GET /api/v1/metrics/*` - Query metrics
- `GET /api/v1/tool-calls/*` - Query tool calls
- `ws://localhost:8080/ws` - WebSocket for real-time updates

See [Backend README](apps/api/README.md) for complete API documentation.

## Troubleshooting

### Database Connection Issues

If you see `FATAL: role "nous" does not exist`:

```bash
# Stop local PostgreSQL if running
brew services stop postgresql@16

# Verify Docker database is running
docker ps | grep timescale
```

### Port Already in Use

```bash
# Find what's using port 8080
lsof -i :8080

# Or use different port
export PORT=8081
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure pre-commit hooks pass
4. Submit a pull request

## License

[Add your license here]
