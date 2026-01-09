import { BrainCircuit, Circle, Settings, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ObservabilityHeaderProps {
	wsConnected?: boolean;
}

export function ObservabilityHeader({
	wsConnected = false,
}: ObservabilityHeaderProps) {
	return (
		<div className='flex items-center justify-between mb-6'>
			<div className='flex items-center gap-3'>
				<BrainCircuit className='h-6 w-6 text-primary' />
				<h1 className='text-3xl font-bold'>Nous</h1>
			</div>
			<div className='flex items-center gap-4'>
				{/* WebSocket Connection Status */}
				<Badge
					variant={wsConnected ? 'default' : 'secondary'}
					className='flex items-center gap-1.5'
				>
					<Circle
						className={`h-2 w-2 fill-current ${
							wsConnected ? 'text-green-500' : 'text-gray-400'
						}`}
					/>
					<span className='text-xs'>{wsConnected ? 'Live' : 'Offline'}</span>
				</Badge>
				<Tabs defaultValue='overview' className='w-auto'>
					<TabsList>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='traces'>Traces</TabsTrigger>
						<TabsTrigger value='metrics'>Metrics</TabsTrigger>
					</TabsList>
				</Tabs>
				<Select defaultValue='production'>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent position='popper' side='bottom' align='start'>
						<SelectItem value='production'>Production</SelectItem>
						<SelectItem value='staging'>Staging</SelectItem>
						<SelectItem value='development'>Development</SelectItem>
					</SelectContent>
				</Select>
				<Select defaultValue='last-hour'>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent position='popper' side='bottom' align='start'>
						<SelectItem value='last-hour'>Last hour</SelectItem>
						<SelectItem value='last-24-hours'>Last 24 hours</SelectItem>
						<SelectItem value='last-7-days'>Last 7 days</SelectItem>
						<SelectItem value='last-30-days'>Last 30 days</SelectItem>
					</SelectContent>
				</Select>
				<Button variant='ghost' size='icon'>
					<Settings className='h-5 w-5' />
				</Button>
				<Button variant='ghost' size='icon'>
					<Sun className='h-5 w-5' />
				</Button>
			</div>
		</div>
	);
}
