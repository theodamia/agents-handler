import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ToolCall } from '../types';

interface RecentToolCallsProps {
	calls: ToolCall[];
}

function formatTimeAgo(index: number): string {
	const timeAgoMap: Record<number, string> = {
		0: '2 min ago',
		1: '3 min ago',
		2: '5 min ago',
		3: '7 min ago',
		4: '10 min ago',
		5: '12 min ago',
	};
	return timeAgoMap[index] || `${index + 2} min ago`;
}

export function RecentToolCalls({ calls }: RecentToolCallsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Tool Calls</CardTitle>
				<p className='text-sm text-muted-foreground'>
					Latest activity across all agents
				</p>
			</CardHeader>
			<CardContent>
				<div className='space-y-3'>
					{calls.map((call) => (
						<div
							key={call.id}
							className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
						>
							<div className='flex items-center gap-3'>
								{call.status === 'success' ? (
									<CheckCircle2 className='h-5 w-5 text-green-600' />
								) : (
									<XCircle className='h-5 w-5 text-red-600' />
								)}
								<div>
									<div className='font-medium'>{call.tool}</div>
									{call.error && (
										<div className='text-sm text-red-600'>{call.error}</div>
									)}
								</div>
							</div>
							<div className='flex items-center gap-4'>
								<div className='text-right text-sm'>
									<div className='text-muted-foreground'>Request ID</div>
									<div className='font-mono text-xs'>req_{call.id}</div>
								</div>
								<div className='text-right text-sm'>
									<div className='text-muted-foreground'>Metrics</div>
									<div className='flex items-center gap-2'>
										{call.duration > 0 && <span>{call.duration}ms</span>}
										<span className='text-muted-foreground'>•</span>
										<span className='flex items-center gap-1'>
											<Clock className='h-3 w-3' />
											{formatTimeAgo(calls.indexOf(call))}
										</span>
										{call.tokens && (
											<>
												<span className='text-muted-foreground'>•</span>
												<span>{call.tokens.toLocaleString()} tokens</span>
											</>
										)}
									</div>
								</div>
								<Badge
									variant={
										call.status === 'success' ? 'default' : 'destructive'
									}
								>
									{call.status}
								</Badge>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
