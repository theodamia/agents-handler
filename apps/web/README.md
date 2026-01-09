# Nous Web - Frontend

React frontend dashboard for visualizing observability data from AI agents.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   cd apps/web
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

   Or use the helper script:
   ```bash
   ./start-frontend.sh
   ```

3. **Open the dashboard:**
   ```
   http://localhost:5173/observability
   ```

## Features

### Observability Dashboard

- **Real-time Metrics** - Live updates via WebSocket
- **Tool Call Tracking** - View recent tool calls and chains
- **Performance Metrics** - Latency, token usage, failure rates
- **Interactive Charts** - Visualize data trends over time

### WebSocket Connection

The dashboard automatically connects to the backend WebSocket server for real-time updates:

- **Connection Status** - "Live" badge shows connection state
- **Automatic Reconnection** - Handles disconnections gracefully
- **Real-time Updates** - Dashboard refreshes when new events arrive

## Project Structure

```
apps/web/
├── src/
│   ├── components/ui/        # Shadcn UI components
│   ├── features/observability/ # Observability feature
│   │   ├── components/        # Chart and UI components
│   │   ├── hooks/            # Data fetching hooks
│   │   └── types.ts          # TypeScript types
│   ├── hooks/                # Shared hooks (WebSocket, etc.)
│   ├── lib/                  # Utilities and API client
│   └── routes/               # Page components
└── public/                   # Static assets
```

## Key Components

### Observability Dashboard

**Location:** `src/routes/observability.tsx`

Main dashboard page displaying:
- Metric cards (total calls, latency, tokens, failure rate)
- Tool calls chart
- Latency breakdown chart
- Token usage chart
- Failure rate chart
- Recent tool calls list
- Tool call chain visualization

### WebSocket Hook

**Location:** `src/hooks/use-websocket.ts`

Manages WebSocket connection:
- Automatic reconnection with exponential backoff
- Connection state management
- Error handling
- Message parsing

### Real-time Updates Hook

**Location:** `src/features/observability/hooks/use-realtime-tool-calls.ts`

Listens for WebSocket messages and invalidates TanStack Query caches to trigger automatic refetch.

### Data Fetching Hooks

**Location:** `src/features/observability/hooks/use-observability-data.ts`

TanStack Query hooks for fetching:
- Metrics overview
- Tool calls metrics
- Latency metrics
- Token usage metrics
- Failure rate metrics
- Recent tool calls
- Tool call chains

## Configuration

### Environment Variables

Create a `.env` file in `apps/web/`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws
```

Defaults:
- `VITE_API_URL` - `http://localhost:8080/api/v1`
- `VITE_WS_URL` - `ws://localhost:8080/ws`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter
- `npm run format` - Format code
- `npm run check` - Run linter and formatter

### Tech Stack

- **React 19** - UI framework
- **TanStack Router** - Routing
- **TanStack Query** - Data fetching and caching
- **Recharts** - Chart library
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **Biome** - Linting and formatting
- **Vite** - Build tool

## Testing

### Manual Testing

1. **Start backend and frontend**
2. **Open dashboard:** http://localhost:5173/observability
3. **Check connection:** "Live" badge should be green
4. **Send test event:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/events \
     -H "Content-Type: application/json" \
     -d '{
       "request_id": "test-123",
       "tool_name": "SearchWeb",
       "duration_ms": 200,
       "status": "success",
       "input_tokens": 1000,
       "output_tokens": 500
     }'
   ```
5. **Verify dashboard updates** automatically

### Browser Console

Check for:
- ✅ `WebSocket connected` - Connection successful
- ✅ Query invalidation logs - Real-time updates working
- ❌ Connection errors - Check backend and CORS

## Troubleshooting

### WebSocket Not Connecting

**Symptoms:** "Live" badge is gray

**Solutions:**
1. Check backend is running: `curl http://localhost:8080/health`
2. Check browser console for errors
3. Verify `VITE_WS_URL` is correct
4. Check CORS settings in backend

### Dashboard Not Loading Data

**Symptoms:** Empty charts or loading states

**Solutions:**
1. Check API URL: `VITE_API_URL=http://localhost:8080/api/v1`
2. Check backend is running
3. Check browser console for API errors
4. Verify CORS allows your origin

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Linting Errors

```bash
# Auto-fix
npm run check:fix
```

## Production Build

```bash
# Build
npm run build

# Preview
npm run preview
```

Output is in `dist/` directory.

## Code Quality

### Pre-commit Hooks

Husky runs Biome linter/formatter on staged files before commit.

### Linting

Uses Biome for fast linting and formatting:
- TypeScript/JavaScript
- JSON
- CSS

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Accessible component primitives
- **CSS Variables** - Theme customization

## State Management

- **TanStack Query** - Server state (API data)
- **React State** - Local UI state
- **WebSocket** - Real-time updates

## Performance

- **Code Splitting** - Automatic route-based splitting
- **Query Caching** - TanStack Query caches API responses
- **Automatic Refetch** - Configurable refresh intervals
- **WebSocket** - Efficient real-time updates

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires WebSocket support (all modern browsers).
