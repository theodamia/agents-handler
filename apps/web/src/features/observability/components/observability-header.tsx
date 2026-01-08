import { Settings, Sun, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ObservabilityHeader() {
	return (
		<div className='flex items-center justify-between mb-6'>
			<div className='flex items-center gap-3'>
				<Waves className='h-6 w-6 text-primary' />
				<h1 className='text-3xl font-bold'>Nous</h1>
			</div>
			<div className='flex items-center gap-4'>
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
