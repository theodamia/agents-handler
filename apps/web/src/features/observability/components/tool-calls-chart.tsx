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
import type { ToolCallDataPoint } from '../types';

interface ToolCallsChartProps {
	data: ToolCallDataPoint[];
}

export function ToolCallsChart({ data }: ToolCallsChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Tool Calls - Total calls over time</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width='100%' height={300}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='hour' tick={{ fontSize: 12 }} interval={2} />
						<YAxis
							domain={[0, CHART_CONFIG.TOOL_CALLS.MAX_Y_AXIS]}
							tick={{ fontSize: 12 }}
						/>
						<Tooltip />
						<Legend />
						<Line
							type='monotone'
							dataKey='success'
							stroke='#3b82f6'
							strokeWidth={2}
							name='Success'
							dot={false}
						/>
						<Line
							type='monotone'
							dataKey='failures'
							stroke='#ef4444'
							strokeWidth={2}
							name='Failures'
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
