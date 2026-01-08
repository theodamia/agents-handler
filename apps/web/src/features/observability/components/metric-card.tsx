import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
	label: string;
	value: string;
	changePercent: number;
	changeType: 'increase' | 'decrease';
	icon: React.ReactNode;
}

export function MetricCard({
	label,
	value,
	changePercent,
	changeType,
	icon,
}: MetricCardProps) {
	const isPositive = changeType === 'decrease';
	const TrendIcon = changeType === 'increase' ? TrendingUp : TrendingDown;
	const trendColor = isPositive ? 'text-green-600' : 'text-yellow-600';

	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium'>{label}</CardTitle>
				{icon}
			</CardHeader>
			<CardContent>
				<div className='text-2xl font-bold'>{value}</div>
				<div className={`flex items-center text-xs ${trendColor}`}>
					<TrendIcon className='mr-1 h-3 w-3' />
					<span>
						{changePercent}% {changeType === 'increase' ? 'increase' : 'faster'}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
