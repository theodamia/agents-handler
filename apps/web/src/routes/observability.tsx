import { createFileRoute } from '@tanstack/react-router';
import { Activity, AlertTriangle, Clock, Zap } from 'lucide-react';
import { METRIC_DISPLAY } from '@/constants/metrics';
import {
	FailureRateChart,
	LatencyBreakdownChart,
	MetricCard,
	RecentToolCalls,
	TokenUsageChart,
	ToolCallChainComponent,
	ToolCallsChart,
} from '@/features/observability';
import { ObservabilityHeader } from '@/features/observability/components/observability-header';
import {
	useFailureRateMetrics,
	useLatencyMetrics,
	useMetricsOverview,
	useRecentToolCalls,
	useTokenUsageMetrics,
	useToolCallChain,
	useToolCallsMetrics,
} from '@/features/observability/hooks/use-observability-data';
import { useRealtimeToolCalls } from '@/features/observability/hooks/use-realtime-tool-calls';

export const Route = createFileRoute('/observability')({
	component: ObservabilityPage,
});

function ObservabilityPage() {
	const hours = 24; // TODO: Get from header selector

	// Real-time WebSocket connection
	const { isConnected: wsConnected } = useRealtimeToolCalls();

	// Data queries (auto-refresh via WebSocket invalidation)
	const { data: toolCallsData = [] } = useToolCallsMetrics(hours);
	const { data: latencyData = [] } = useLatencyMetrics(hours);
	const { data: tokenUsageData = [] } = useTokenUsageMetrics(hours);
	const { data: failureRateData = [] } = useFailureRateMetrics(hours);
	const { data: recentToolCalls = [] } = useRecentToolCalls(10);
	const { data: metricsOverview } = useMetricsOverview(hours);

	// Get first recent tool call's request ID for the chain demo
	const firstRequestId =
		recentToolCalls.length > 0 && recentToolCalls[0].requestId
			? recentToolCalls[0].requestId
			: null;
	const { data: toolCallChain } = useToolCallChain(firstRequestId);

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<ObservabilityHeader wsConnected={wsConnected} />

			{/* Metric Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<MetricCard
					label={METRIC_DISPLAY.TOTAL_CALLS.LABEL}
					value={
						metricsOverview
							? metricsOverview.total_calls.toLocaleString()
							: METRIC_DISPLAY.TOTAL_CALLS.VALUE.toLocaleString()
					}
					changePercent={
						metricsOverview?.change_percent ??
						METRIC_DISPLAY.TOTAL_CALLS.CHANGE_PERCENT
					}
					changeType={METRIC_DISPLAY.TOTAL_CALLS.CHANGE_TYPE}
					icon={<Activity className='h-4 w-4 text-muted-foreground' />}
				/>
				<MetricCard
					label={METRIC_DISPLAY.AVG_LATENCY.LABEL}
					value={
						metricsOverview
							? `${Math.round(metricsOverview.avg_latency_ms)}ms`
							: `${METRIC_DISPLAY.AVG_LATENCY.VALUE_MS}ms`
					}
					changePercent={
						metricsOverview?.change_percent ??
						METRIC_DISPLAY.AVG_LATENCY.CHANGE_PERCENT
					}
					changeType={METRIC_DISPLAY.AVG_LATENCY.CHANGE_TYPE}
					icon={<Clock className='h-4 w-4 text-muted-foreground' />}
				/>
				<MetricCard
					label={METRIC_DISPLAY.TOKEN_USAGE.LABEL}
					value={
						metricsOverview
							? `${(metricsOverview.total_tokens / 1_000_000).toFixed(1)}M`
							: `${METRIC_DISPLAY.TOKEN_USAGE.VALUE_MILLIONS}M`
					}
					changePercent={
						metricsOverview?.change_percent ??
						METRIC_DISPLAY.TOKEN_USAGE.CHANGE_PERCENT
					}
					changeType={METRIC_DISPLAY.TOKEN_USAGE.CHANGE_TYPE}
					icon={<Zap className='h-4 w-4 text-muted-foreground' />}
				/>
				<MetricCard
					label={METRIC_DISPLAY.FAILURE_RATE.LABEL}
					value={
						metricsOverview
							? `${metricsOverview.failure_rate.toFixed(2)}%`
							: `${METRIC_DISPLAY.FAILURE_RATE.VALUE_PERCENT}%`
					}
					changePercent={
						metricsOverview?.change_percent ??
						METRIC_DISPLAY.FAILURE_RATE.CHANGE_PERCENT
					}
					changeType={METRIC_DISPLAY.FAILURE_RATE.CHANGE_TYPE}
					icon={<AlertTriangle className='h-4 w-4 text-muted-foreground' />}
				/>
			</div>

			{/* Main Charts */}
			<div className='grid gap-4 md:grid-cols-2'>
				<ToolCallsChart data={toolCallsData} />
				<LatencyBreakdownChart data={latencyData} />
			</div>

			{/* Bottom Charts and Components */}
			<div className='grid gap-4 md:grid-cols-2'>
				<TokenUsageChart data={tokenUsageData} />
				<FailureRateChart data={failureRateData} />
			</div>

			{/* Tool Call Chain */}
			{toolCallChain && <ToolCallChainComponent chain={toolCallChain} />}

			{/* Recent Tool Calls */}
			<RecentToolCalls calls={recentToolCalls} />
		</div>
	);
}
