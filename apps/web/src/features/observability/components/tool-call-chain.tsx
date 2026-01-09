import {
	ArrowRight,
	CheckCircle2,
	Code,
	Database,
	FileText,
	Search,
	XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ToolCallChain } from '../types';

interface ToolCallChainProps {
	chain: ToolCallChain;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
	SearchRepo: <Search className='h-4 w-4' />,
	ReadFile: <FileText className='h-4 w-4' />,
	Grep: <Code className='h-4 w-4' />,
	WriteFile: <Database className='h-4 w-4' />,
	SearchWeb: <Search className='h-4 w-4' />,
};

export function ToolCallChainComponent({ chain }: ToolCallChainProps) {
	const maxDuration = Math.max(...chain.calls.map((call) => call.duration));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Latest Tool Call Chain</CardTitle>
				<p className='text-sm text-muted-foreground'>
					Request ID: {chain.requestId}
				</p>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					<div className='flex items-center gap-2 overflow-x-auto pb-2'>
						{chain.calls.map((call, index) => (
							<div key={call.id} className='flex items-center gap-2 shrink-0'>
								<div className='flex flex-col items-center gap-2'>
									<div
										className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
											call.status === 'success'
												? 'bg-green-50 border-green-200'
												: 'bg-red-50 border-red-200'
										}`}
									>
										{TOOL_ICONS[call.tool] || <FileText className='h-4 w-4' />}
										<span className='text-sm font-medium'>{call.tool}</span>
										{call.status === 'success' ? (
											<CheckCircle2 className='h-4 w-4 text-green-600' />
										) : (
											<XCircle className='h-4 w-4 text-red-600' />
										)}
									</div>
									<div className='text-xs text-muted-foreground'>
										{call.duration}ms
									</div>
									<div className='text-xs text-muted-foreground'>
										{call.timestamp}
									</div>
								</div>
								{index < chain.calls.length - 1 && (
									<ArrowRight className='h-5 w-5 text-muted-foreground mx-2' />
								)}
							</div>
						))}
					</div>
					<div className='space-y-2'>
						<div className='flex justify-between text-sm'>
							<span className='text-muted-foreground'>
								Total Chain Duration
							</span>
							<span className='font-medium'>{chain.totalDuration}ms</span>
						</div>
						<div className='w-full bg-muted rounded-full h-2'>
							<div
								className='bg-blue-600 h-2 rounded-full transition-all'
								style={{
									width: `${Math.min((chain.totalDuration / maxDuration) * 100, 100)}%`,
								}}
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
