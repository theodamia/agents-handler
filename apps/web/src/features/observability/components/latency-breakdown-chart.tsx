import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_CONFIG } from '@/constants/metrics';
import type { LatencyDataPoint } from '../types';

interface LatencyBreakdownChartProps {
	data: LatencyDataPoint[];
}

export function LatencyBreakdownChart({ data }: LatencyBreakdownChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Latency Breakdown - Performance by tool</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width='100%' height={300}>
					<BarChart data={data}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='tool' tick={{ fontSize: 12 }} />
						<YAxis
							domain={[0, CHART_CONFIG.LATENCY_BREAKDOWN.MAX_Y_AXIS]}
							tick={{ fontSize: 12 }}
							label={{
								value: 'Latency (ms)',
								angle: -90,
								position: 'insideLeft',
							}}
						/>
						<Tooltip />
						<Legend />
						<Bar dataKey='p50' fill='#3b82f6' name='p50' />
						<Bar dataKey='p95' fill='#10b981' name='p95' />
						<Bar dataKey='p99' fill='#f97316' name='p99' />
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
