import type {
	FailureRateDataPoint,
	LatencyDataPoint,
	TokenUsageDataPoint,
	ToolCall,
	ToolCallChain,
	ToolCallDataPoint,
} from '../types';

// Generate mock data for tool calls over time (24 hours)
export function generateToolCallsData(): ToolCallDataPoint[] {
	const hours = Array.from({ length: 24 }, (_, i) => {
		const hour = i.toString().padStart(2, '0');
		return `${hour}:00`;
	});

	return hours.map((hour, index) => {
		// Simulate peak around 14:00-16:00
		const baseSuccess = 2000;
		const peakMultiplier = index >= 14 && index <= 16 ? 2.25 : 1;
		const variation = Math.sin((index / 24) * Math.PI * 2) * 500;
		const success = Math.max(
			0,
			Math.round(baseSuccess * peakMultiplier + variation),
		);
		const failures = Math.round(success * 0.001); // ~0.1% failure rate

		return {
			hour,
			success,
			failures,
		};
	});
}

// Generate mock latency breakdown data
export function generateLatencyData(): LatencyDataPoint[] {
	return [
		{ tool: 'SearchWeb', p50: 180, p95: 320, p99: 450 },
		{ tool: 'ReadFile', p50: 45, p95: 120, p99: 200 },
		{ tool: 'Grep', p50: 80, p95: 180, p99: 280 },
		{ tool: 'WriteFile', p50: 60, p95: 150, p99: 250 },
		{ tool: 'SearchRepo', p50: 200, p95: 450, p99: 750 },
	];
}

// Generate mock token usage data
export function generateTokenUsageData(): TokenUsageDataPoint[] {
	const hours = Array.from({ length: 24 }, (_, i) => {
		const hour = i.toString().padStart(2, '0');
		return `${hour}:00`;
	});

	return hours.map((hour, index) => {
		const baseInput = 20000;
		const baseOutput = 15000;
		const variation = Math.sin((index / 24) * Math.PI * 2) * 10000;
		const input = Math.max(0, Math.round(baseInput + variation));
		const output = Math.max(0, Math.round(baseOutput + variation * 0.7));

		return {
			hour,
			input,
			output,
		};
	});
}

// Generate mock failure rate data
export function generateFailureRateData(): FailureRateDataPoint[] {
	const hours = Array.from({ length: 24 }, (_, i) => {
		const hour = i.toString().padStart(2, '0');
		return `${hour}:00`;
	});

	return hours.map(() => ({
		hour: hours[Math.floor(Math.random() * hours.length)],
		failurePercent: 0.5 + Math.random() * 1.5, // 0.5% to 2%
	}));
}

// Mock tool call chain
export function getMockToolCallChain(): ToolCallChain {
	return {
		requestId: 'req_8jf93kd92k3d',
		calls: [
			{
				id: '1',
				tool: 'SearchRepo',
				duration: 245,
				timestamp: '14:23:45.123',
				status: 'success',
				tokens: 1250,
			},
			{
				id: '2',
				tool: 'ReadFile',
				duration: 89,
				timestamp: '14:23:45.368',
				status: 'success',
				tokens: 2340,
			},
			{
				id: '3',
				tool: 'Grep',
				duration: 156,
				timestamp: '14:23:45.457',
				status: 'success',
				tokens: 890,
			},
			{
				id: '4',
				tool: 'WriteFile',
				duration: 124,
				timestamp: '14:23:45.613',
				status: 'success',
				tokens: 560,
			},
		],
		totalDuration: 614,
	};
}

// Mock recent tool calls
export function getMockRecentToolCalls(): ToolCall[] {
	return [
		{
			id: '8jf93kd92k3d',
			tool: 'SearchRepo',
			duration: 245,
			timestamp: '14:23:45.123',
			status: 'success',
			tokens: 1250,
		},
		{
			id: '7hg82jd81j2c',
			tool: 'WriteFile',
			duration: 124,
			timestamp: '14:20:45.000',
			status: 'success',
			tokens: 890,
		},
		{
			id: '6gf71ic70i1b',
			tool: 'Grep',
			duration: 0,
			timestamp: '14:18:45.000',
			status: 'failed',
			error: 'Pattern syntax error',
		},
		{
			id: '5fe60hb69h0a',
			tool: 'ReadFile',
			duration: 89,
			timestamp: '14:16:45.000',
			status: 'success',
			tokens: 2340,
		},
		{
			id: '4ed59ga58g9z',
			tool: 'SearchWeb',
			duration: 1820,
			timestamp: '14:13:45.000',
			status: 'success',
			tokens: 3450,
		},
		{
			id: '3dc48fz47f8y',
			tool: 'GetOrRequestIntegration',
			duration: 156,
			timestamp: '14:11:45.000',
			status: 'success',
			tokens: 780,
		},
	];
}
