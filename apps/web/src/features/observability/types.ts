export interface MetricCard {
	label: string;
	value: string;
	changePercent: number;
	changeType: 'increase' | 'decrease';
	icon: string;
}

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
	tool: string;
	duration: number;
	timestamp: string;
	status: 'success' | 'failed';
	tokens?: number;
	error?: string;
}

export interface ToolCallChain {
	requestId: string;
	calls: ToolCall[];
	totalDuration: number;
}
