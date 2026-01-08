import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_CONFIG } from '@/constants/metrics';
import type { FailureRateDataPoint } from '../types';

interface FailureRateChartProps {
	data: FailureRateDataPoint[];
}

export function FailureRateChart({ data }: FailureRateChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Failure Rate</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width='100%' height={250}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='hour' tick={{ fontSize: 12 }} interval={2} />
						<YAxis
							domain={[0, CHART_CONFIG.FAILURE_RATE.MAX_Y_AXIS]}
							tick={{ fontSize: 12 }}
							label={{ value: 'Failure %', angle: -90, position: 'insideLeft' }}
						/>
						<Tooltip />
						<Line
							type='monotone'
							dataKey='failurePercent'
							stroke='#ef4444'
							strokeWidth={2}
							name='Failure %'
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
