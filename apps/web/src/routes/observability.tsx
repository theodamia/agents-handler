import { createFileRoute } from '@tanstack/react-router';
import { Activity, AlertTriangle, Clock, Zap } from 'lucide-react';
import { METRIC_DISPLAY } from '@/constants/metrics';
import {
	FailureRateChart,
	generateFailureRateData,
	generateLatencyData,
	generateTokenUsageData,
	generateToolCallsData,
	getMockRecentToolCalls,
	getMockToolCallChain,
	LatencyBreakdownChart,
	MetricCard,
	RecentToolCalls,
	TokenUsageChart,
	ToolCallChainComponent,
	ToolCallsChart,
} from '@/features/observability';
import { ObservabilityHeader } from '@/features/observability/components/observability-header';

export const Route = createFileRoute('/observability')({
	component: ObservabilityPage,
});

function ObservabilityPage() {
	const toolCallsData = generateToolCallsData();
	const latencyData = generateLatencyData();
	const tokenUsageData = generateTokenUsageData();
	const failureRateData = generateFailureRateData();
	const toolCallChain = getMockToolCallChain();
	const recentToolCalls = getMockRecentToolCalls();

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<ObservabilityHeader />

			{/* Metric Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<MetricCard
					label={METRIC_DISPLAY.TOTAL_CALLS.LABEL}
					value={METRIC_DISPLAY.TOTAL_CALLS.VALUE.toLocaleString()}
					changePercent={METRIC_DISPLAY.TOTAL_CALLS.CHANGE_PERCENT}
					changeType={METRIC_DISPLAY.TOTAL_CALLS.CHANGE_TYPE}
					icon={<Activity className='h-4 w-4 text-muted-foreground' />}
				/>
				<MetricCard
					label={METRIC_DISPLAY.AVG_LATENCY.LABEL}
					value={`${METRIC_DISPLAY.AVG_LATENCY.VALUE_MS}ms`}
					changePercent={METRIC_DISPLAY.AVG_LATENCY.CHANGE_PERCENT}
					changeType={METRIC_DISPLAY.AVG_LATENCY.CHANGE_TYPE}
					icon={<Clock className='h-4 w-4 text-muted-foreground' />}
				/>
				<MetricCard
					label={METRIC_DISPLAY.TOKEN_USAGE.LABEL}
					value={`${METRIC_DISPLAY.TOKEN_USAGE.VALUE_MILLIONS}M`}
					changePercent={METRIC_DISPLAY.TOKEN_USAGE.CHANGE_PERCENT}
					changeType={METRIC_DISPLAY.TOKEN_USAGE.CHANGE_TYPE}
					icon={<Zap className='h-4 w-4 text-muted-foreground' />}
				/>
				<MetricCard
					label={METRIC_DISPLAY.FAILURE_RATE.LABEL}
					value={`${METRIC_DISPLAY.FAILURE_RATE.VALUE_PERCENT}%`}
					changePercent={METRIC_DISPLAY.FAILURE_RATE.CHANGE_PERCENT}
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
			<ToolCallChainComponent chain={toolCallChain} />

			{/* Recent Tool Calls */}
			<RecentToolCalls calls={recentToolCalls} />
		</div>
	);
}
