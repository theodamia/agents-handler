import type {
	FailureRateDataPoint,
	LatencyDataPoint,
	TokenUsageDataPoint,
	ToolCall,
	ToolCallChain,
	ToolCallDataPoint,
} from '@/features/observability/types';
import type {
	FailureRateDataPoint as ApiFailureRateDataPoint,
	LatencyDataPoint as ApiLatencyDataPoint,
	TokenUsageDataPoint as ApiTokenUsageDataPoint,
	ToolCall as ApiToolCall,
	ToolCallDataPoint as ApiToolCallDataPoint,
} from './api';

export function adaptToolCallDataPoint(
	api: ApiToolCallDataPoint,
): ToolCallDataPoint {
	return {
		hour: api.hour,
		success: api.success,
		failures: api.failures,
	};
}

export function adaptLatencyDataPoint(
	api: ApiLatencyDataPoint,
): LatencyDataPoint {
	return {
		tool: api.tool,
		p50: api.p50,
		p95: api.p95,
		p99: api.p99,
	};
}

export function adaptTokenUsageDataPoint(
	api: ApiTokenUsageDataPoint,
): TokenUsageDataPoint {
	return {
		hour: api.hour,
		input: api.input,
		output: api.output,
	};
}

export function adaptFailureRateDataPoint(
	api: ApiFailureRateDataPoint,
): FailureRateDataPoint {
	return {
		hour: api.hour,
		failurePercent: api.failurePercent,
	};
}

export function adaptToolCall(api: ApiToolCall): ToolCall {
	const createdDate = new Date(api.created_at);
	const hours = createdDate.getHours().toString().padStart(2, '0');
	const minutes = createdDate.getMinutes().toString().padStart(2, '0');
	const seconds = createdDate.getSeconds().toString().padStart(2, '0');
	const milliseconds = createdDate
		.getMilliseconds()
		.toString()
		.padStart(3, '0');
	const timestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;

	return {
		id: api.id,
		requestId: api.request_id,
		tool: api.tool_name,
		duration: api.duration_ms,
		timestamp,
		status: api.status,
		tokens: (api.input_tokens || 0) + (api.output_tokens || 0),
		error: api.error_message || undefined,
	};
}

export function adaptToolCallChain(apiCalls: ApiToolCall[]): ToolCallChain {
	if (apiCalls.length === 0) {
		return {
			requestId: '',
			calls: [],
			totalDuration: 0,
		};
	}

	const calls = apiCalls.map(adaptToolCall);
	const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0);

	return {
		requestId: apiCalls[0].request_id,
		calls,
		totalDuration,
	};
}
