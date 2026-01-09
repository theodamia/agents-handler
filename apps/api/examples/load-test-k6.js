import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate should be less than 1%
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';
const TOOLS = ['SearchWeb', 'ReadFile', 'Grep', 'WriteFile', 'SearchRepo', 'ExecuteCommand'];

function randomTool() {
  return TOOLS[Math.floor(Math.random() * TOOLS.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function () {
  const requestId = uuidv4();
  const toolName = randomTool();
  const durationMs = randomInt(50, 500);
  const status = Math.random() < 0.95 ? 'success' : 'failed';
  const inputTokens = randomInt(100, 2000);
  const outputTokens = randomInt(50, 1500);

  const payload = JSON.stringify({
    request_id: requestId,
    tool_name: toolName,
    duration_ms: durationMs,
    status: status,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    error_message: status === 'failed' ? 'Simulated error' : null,
    metadata: {
      test: true,
      load_test: 'k6',
      agent_id: randomInt(1, 100),
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${API_URL}/events`, payload, params);

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.5); // Wait 500ms between requests
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}================\n\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `${indent}Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}P99 Duration: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  
  return summary;
}
