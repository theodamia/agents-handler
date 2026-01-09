const API_BASE_URL =
	import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface ToolCallDataPoint {
	hour: string;
	success: number;
	failures: number;
}

export interface LatencyDataPoint {
	tool: string;
	p50: number;
	p95: number;
	p99: number;
}

export interface TokenUsageDataPoint {
	hour: string;
	input: number;
	output: number;
}

export interface FailureRateDataPoint {
	hour: string;
	failurePercent: number;
}

export interface ToolCall {
	id: string;
	request_id: string;
	tool_name: string;
	duration_ms: number;
	status: 'success' | 'failed';
	input_tokens?: number;
	output_tokens?: number;
	error_message?: string;
	metadata?: Record<string, unknown>;
	created_at: string;
}

export interface ToolCallEvent {
	request_id: string;
	tool_name: string;
	duration_ms: number;
	status: 'success' | 'failed';
	input_tokens?: number;
	output_tokens?: number;
	error_message?: string;
	metadata?: Record<string, unknown>;
	timestamp?: string;
}

export interface ToolCallChain {
	requestId: string;
	calls: ToolCall[];
	totalDuration: number;
}

export interface MetricsOverview {
	total_calls: number;
	avg_latency_ms: number;
	total_tokens: number;
	failure_rate: number;
	change_percent: number;
}

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE_URL) {
		this.baseUrl = baseUrl;
	}

	private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options?.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		return response.json();
	}

	async getToolCallsMetrics(hours: number = 24): Promise<ToolCallDataPoint[]> {
		return this.fetch<ToolCallDataPoint[]>(
			`/metrics/tool-calls?hours=${hours}`,
		);
	}

	async getLatencyMetrics(hours: number = 24): Promise<LatencyDataPoint[]> {
		return this.fetch<LatencyDataPoint[]>(`/metrics/latency?hours=${hours}`);
	}

	async getTokenUsageMetrics(
		hours: number = 24,
	): Promise<TokenUsageDataPoint[]> {
		return this.fetch<TokenUsageDataPoint[]>(
			`/metrics/token-usage?hours=${hours}`,
		);
	}

	async getFailureRateMetrics(
		hours: number = 24,
	): Promise<FailureRateDataPoint[]> {
		return this.fetch<FailureRateDataPoint[]>(
			`/metrics/failure-rate?hours=${hours}`,
		);
	}

	async getRecentToolCalls(limit: number = 10): Promise<ToolCall[]> {
		return this.fetch<ToolCall[]>(`/tool-calls/recent?limit=${limit}`);
	}

	async getToolCallChain(requestId: string): Promise<ToolCall[]> {
		return this.fetch<ToolCall[]>(`/tool-calls/chains/${requestId}`);
	}

	async getMetricsOverview(hours: number = 24): Promise<MetricsOverview> {
		return this.fetch<MetricsOverview>(`/metrics/overview?hours=${hours}`);
	}

	async ingestEvent(event: ToolCallEvent): Promise<{ status: string }> {
		return this.fetch<{ status: string }>('/events', {
			method: 'POST',
			body: JSON.stringify(event),
		});
	}
}

export const apiClient = new ApiClient();
