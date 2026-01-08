// Metric display constants
export const METRIC_DISPLAY = {
	TOTAL_CALLS: {
		LABEL: 'Total Calls',
		VALUE: 48392,
		CHANGE_PERCENT: 12,
		CHANGE_TYPE: 'increase' as const,
	},
	AVG_LATENCY: {
		LABEL: 'Avg Latency',
		VALUE_MS: 342,
		CHANGE_PERCENT: 8,
		CHANGE_TYPE: 'decrease' as const,
	},
	TOKEN_USAGE: {
		LABEL: 'Token Usage',
		VALUE_MILLIONS: 2.4,
		CHANGE_PERCENT: 18,
		CHANGE_TYPE: 'increase' as const,
	},
	FAILURE_RATE: {
		LABEL: 'Failure Rate',
		VALUE_PERCENT: 0.8,
		CHANGE_PERCENT: 0.3,
		CHANGE_TYPE: 'decrease' as const,
	},
} as const;

// Chart configuration constants
export const CHART_CONFIG = {
	TOOL_CALLS: {
		MAX_Y_AXIS: 6000,
		Y_AXIS_TICKS: [0, 2000, 4000, 6000],
		HOURS_COUNT: 24,
	},
	LATENCY_BREAKDOWN: {
		MAX_Y_AXIS: 800,
		Y_AXIS_TICKS: [0, 200, 400, 600, 800],
	},
	TOKEN_USAGE: {
		MAX_Y_AXIS: 50000,
		Y_AXIS_TICKS: [0, 25000, 50000],
	},
	FAILURE_RATE: {
		MAX_Y_AXIS: 2,
		Y_AXIS_TICKS: [0, 1, 2],
	},
} as const;

// Tool names
export const TOOLS = [
	'SearchRepo',
	'ReadFile',
	'Grep',
	'WriteFile',
	'SearchWeb',
] as const;

// Percentile labels
export const PERCENTILES = ['p50', 'p95', 'p99'] as const;

// Time constants
export const TIME_CONSTANTS = {
	MILLISECONDS_PER_SECOND: 1000,
	SECONDS_PER_MINUTE: 60,
	MINUTES_PER_HOUR: 60,
} as const;
