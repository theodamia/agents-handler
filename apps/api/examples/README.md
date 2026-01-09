# Example Scripts

This directory contains example scripts for testing and integrating with the Nous API.

## Scripts

### `agent-example.sh`

Basic example showing how to send tool call events from an agent.

**Usage:**
```bash
./agent-example.sh
```

**What it does:**
- Generates a request ID
- Sends 4 example tool call events (SearchWeb, ReadFile, Grep, WriteFile)
- Demonstrates success and failure scenarios

### `load-test.sh`

Load testing script that simulates multiple concurrent agents sending events.

**Usage:**
```bash
# Default: 5 agents, 20 events each
./load-test.sh

# Custom configuration
CONCURRENT_AGENTS=10 EVENTS_PER_AGENT=50 DELAY_BETWEEN_EVENTS=0.5 ./load-test.sh
```

**Configuration:**
- `CONCURRENT_AGENTS` - Number of concurrent agents (default: 5)
- `EVENTS_PER_AGENT` - Events per agent (default: 20)
- `DELAY_BETWEEN_EVENTS` - Delay in seconds (default: 1)
- `API_URL` - API base URL (default: http://localhost:8080/api/v1)

**What it does:**
- Runs multiple agents concurrently
- Each agent sends events with realistic patterns
- 95% success rate simulation
- Random tool selection, durations, and token usage

### `load-test-continuous.sh`

Continuous load testing - sends events at a steady rate.

**Usage:**
```bash
# Default: 5 events/sec for 60 seconds
./load-test-continuous.sh

# Custom rate and duration
EVENTS_PER_SECOND=10 DURATION=120 ./load-test-continuous.sh

# Infinite (until Ctrl+C)
EVENTS_PER_SECOND=5 DURATION=0 ./load-test-continuous.sh
```

**Configuration:**
- `EVENTS_PER_SECOND` - Rate of events (default: 5)
- `DURATION` - Duration in seconds, 0 = infinite (default: 60)
- `API_URL` - API base URL (default: http://localhost:8080/api/v1)

**What it does:**
- Sends events at a steady rate
- Simulates ongoing production traffic
- Useful for testing WebSocket real-time updates
- Can run indefinitely until stopped

### `load-test-k6.js`

Professional load testing using k6 with detailed metrics and performance thresholds.

**Prerequisites:**
```bash
# Install k6
brew install k6
```

**Usage:**
```bash
# Basic usage (default: http://localhost:8080/api/v1)
k6 run load-test-k6.js

# Custom API URL
API_URL=http://localhost:8080/api/v1 k6 run load-test-k6.js

# Custom stages (see k6 documentation)
k6 run --stage 30s:10,1m:20,30s:0 load-test-k6.js
```

**Configuration:**
- `API_URL` - API base URL (default: http://localhost:8080/api/v1)
- Stages are configured in the script (ramp up/down pattern)
- Performance thresholds: 95% requests < 500ms, error rate < 1%

**What it does:**
- Runs a 3.5-minute load test with ramp-up/ramp-down stages
- Starts with 5 virtual users, ramps to 20 users
- Validates performance thresholds automatically
- Provides detailed metrics: p50, p95, p99 response times
- Shows requests per second and success/failure rates

**Test Stages:**
1. 0-30s: Ramp up to 5 users
2. 30s-1m30s: Stay at 10 users
3. 1m30s-2m: Ramp up to 20 users
4. 2m-3m30s: Stay at 20 users
5. 3m30s-4m: Ramp down to 0

**Example Output:**
```
     execution: local
        script: load-test-k6.js
     scenarios: (100.00%) 1 scenario, 20 max VUs, 4m0s max duration

     ✓ status is 201
     ✓ response time < 500ms

     checks.........................: 100.00% ✓ 1234      ✗ 0
     data_received..................: 234 KB  1.1 KB/s
     data_sent......................: 456 KB  2.1 KB/s
     http_req_duration..............: avg=45ms  min=12ms  med=38ms  max=234ms  p(95)=89ms  p(99)=156ms
     http_reqs......................: 1234     5.8/s
     iteration_duration.............: avg=545ms min=512ms med=538ms max=734ms
     vus............................: 20       min=1      max=20
     vus_max........................: 20       min=1      max=20
```

### `monitor.sh`

Real-time monitoring script for watching API health during load tests.

**Usage:**
```bash
# Default: refresh every 2 seconds
./monitor.sh

# Custom refresh interval
REFRESH_INTERVAL=1 ./monitor.sh
```

**What it shows:**
- Liveness status
- Readiness status (with database connectivity)
- WebSocket hub status and connection count
- Real-time updates

## Monitoring During Load Tests

### Using the Monitor Script

```bash
# Terminal 1: Start monitoring
cd apps/api/examples
./monitor.sh

# Terminal 2: Run load test
./load-test.sh
```

### Manual Monitoring

1. **Watch API logs** - Monitor for errors and performance
2. **Check dashboard** - http://localhost:5173/observability
3. **Monitor health endpoints:**
   ```bash
   watch -n 1 'curl -s http://localhost:8080/readyz | jq'
   ```
4. **Check WebSocket connections:**
   ```bash
   watch -n 1 'curl -s http://localhost:8080/ws/health | jq'
   ```

## Example Scenarios

### Light Load (Development)
```bash
CONCURRENT_AGENTS=2 EVENTS_PER_AGENT=10 ./load-test.sh
```

### Medium Load (Testing)
```bash
CONCURRENT_AGENTS=10 EVENTS_PER_AGENT=50 ./load-test.sh
```

### Heavy Load (Stress Testing)
```bash
CONCURRENT_AGENTS=50 EVENTS_PER_AGENT=100 DELAY_BETWEEN_EVENTS=0.1 ./load-test.sh
```

### Sustained Load (Production Simulation)
```bash
EVENTS_PER_SECOND=20 DURATION=300 ./load-test-continuous.sh
```

## Quick Start: Load Testing Workflow

1. **Start the backend:**
   ```bash
   cd apps/api
   go run ./cmd/api
   ```

2. **Start monitoring (Terminal 2):**
   ```bash
   cd apps/api/examples
   ./monitor.sh
   ```

3. **Run load test (Terminal 3):**
   ```bash
   cd apps/api/examples
   ./load-test.sh
   
   # Or use k6 for professional load testing:
   k6 run load-test-k6.js
   ```

4. **Watch the dashboard:**
   - Open http://localhost:5173/observability
   - Watch metrics update in real-time
   - Verify WebSocket connection (green "Live" badge)

## Performance Benchmarks

Expected performance on modern hardware:

- **Light load** (5 agents, 20 events each): ~100 events, completes in ~20s
- **Medium load** (10 agents, 50 events each): ~500 events, completes in ~50s
- **Heavy load** (50 agents, 100 events each): ~5000 events, completes in ~10s
- **Continuous** (20 events/sec): Sustained throughput

Monitor database and API performance during tests to identify bottlenecks.
