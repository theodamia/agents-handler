import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_CONFIG } from '@/constants/metrics';
import type { TokenUsageDataPoint } from '../types';

interface TokenUsageChartProps {
	data: TokenUsageDataPoint[];
}

export function TokenUsageChart({ data }: TokenUsageChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Token Usage</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width='100%' height={250}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='hour' tick={{ fontSize: 12 }} interval={2} />
						<YAxis
							domain={[0, CHART_CONFIG.TOKEN_USAGE.MAX_Y_AXIS]}
							tick={{ fontSize: 12 }}
						/>
						<Tooltip />
						<Legend />
						<Line
							type='monotone'
							dataKey='input'
							stroke='#a855f7'
							strokeWidth={2}
							name='Input'
							dot={false}
						/>
						<Line
							type='monotone'
							dataKey='output'
							stroke='#10b981'
							strokeWidth={2}
							name='Output'
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
