import {
	ArrowRight,
	CheckCircle2,
	Code,
	Database,
	FileText,
	Search,
	Workflow,
	XCircle,
} from 'lucide-react';
import {
	createRef,
	memo,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ToolCallChain } from '../types';

interface ToolCallChainProps {
	chain: ToolCallChain | null;
	requestId?: string | null;
}

const INITIAL_RENDER_DELAY_MS = 100;
const DEFAULT_ICON = FileText;

const TOOL_ICON_MAP: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	SearchRepo: Search,
	ReadFile: FileText,
	Grep: Code,
	WriteFile: Database,
	SearchWeb: Search,
} as const;

const getToolIcon = (
	tool: string,
): React.ComponentType<{ className?: string }> => {
	return TOOL_ICON_MAP[tool] || DEFAULT_ICON;
};

const STATUS_CLASSES = {
	success: 'bg-green-50 border-green-200',
	failed: 'bg-red-50 border-red-200',
} as const;

interface ToolCallItemProps {
	call: ToolCallChain['calls'][0];
	showArrow: boolean;
	itemRef?: React.RefObject<HTMLDivElement | null>;
}

const ToolCallItem = memo(function ToolCallItem({
	call,
	showArrow,
	itemRef,
}: ToolCallItemProps) {
	const Icon = useMemo(() => getToolIcon(call.tool), [call.tool]);

	return (
		<div ref={itemRef} className='flex items-center gap-2 shrink-0'>
			<div className='flex flex-col items-center gap-2'>
				<div
					className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${STATUS_CLASSES[call.status]}`}
				>
					<Icon className='h-4 w-4' />
					<span className='text-sm font-medium'>{call.tool}</span>
					{call.status === 'success' ? (
						<CheckCircle2 className='h-4 w-4 text-green-600' />
					) : (
						<XCircle className='h-4 w-4 text-red-600' />
					)}
				</div>
				<div className='text-xs text-muted-foreground'>{call.duration}ms</div>
				<div className='text-xs text-muted-foreground'>{call.timestamp}</div>
			</div>
			{showArrow && (
				<ArrowRight className='h-5 w-5 text-muted-foreground mx-2' />
			)}
		</div>
	);
});

ToolCallItem.displayName = 'ToolCallItem';

const EmptyState = memo(function EmptyState({
	requestId,
}: {
	requestId?: string | null;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Latest Tool Call Chain</CardTitle>
				{requestId && (
					<p className='text-sm text-muted-foreground'>
						Request ID: {requestId}
					</p>
				)}
			</CardHeader>
			<CardContent>
				<div className='flex flex-col items-center justify-center py-12 px-4'>
					<div className='rounded-full bg-muted p-4 mb-4'>
						<Workflow className='h-8 w-8 text-muted-foreground' />
					</div>
					<h3 className='text-lg font-semibold mb-2'>No Tool Calls Yet</h3>
					<p className='text-sm text-muted-foreground text-center max-w-md'>
						This chain doesn't have any tool calls yet. Tool calls will appear
						here as agents execute tools for this request.
					</p>
					{requestId && (
						<p className='text-xs text-muted-foreground mt-4'>
							Request ID: {requestId}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
});

// Helper: Calculate total chain duration
function calculateTotalDuration(calls: ToolCallChain['calls']): number {
	return calls.reduce((sum, call) => sum + call.duration, 0);
}

export const ToolCallChainComponent = memo(function ToolCallChainComponent({
	chain,
	requestId,
}: ToolCallChainProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInitialRenderRef = useRef(true);
	const itemRefsRef = useRef<
		Map<string, React.RefObject<HTMLDivElement | null>>
	>(new Map());
	// Track previous chain to prevent empty state flash during updates
	const previousChainRef = useRef<ToolCallChain | null>(null);

	// Update previous chain ref when we have valid data
	useEffect(() => {
		if (chain && chain.calls.length > 0) {
			previousChainRef.current = chain;
		}
	}, [chain]);

	// Use previous chain if current is null/empty to prevent flash during updates
	const hasData = chain && chain.calls.length > 0;
	const hasPreviousData =
		previousChainRef.current && previousChainRef.current.calls.length > 0;
	const displayChain = hasData ? chain : previousChainRef.current;
	const displayCalls = hasData
		? chain.calls
		: (previousChainRef.current?.calls ?? []);

	// Use deferred value for updates, immediate for initial render
	const deferredCallsRaw = useDeferredValue(displayCalls);
	const deferredCalls = isInitialRenderRef.current
		? displayCalls
		: deferredCallsRaw;

	// Mark initial render as complete
	useEffect(() => {
		if (displayCalls.length > 0 && isInitialRenderRef.current) {
			const timeoutId = setTimeout(() => {
				isInitialRenderRef.current = false;
			}, INITIAL_RENDER_DELAY_MS);
			return () => clearTimeout(timeoutId);
		}
	}, [displayCalls.length]);

	// Calculate total chain duration
	const totalDuration = useMemo(
		() => calculateTotalDuration(deferredCalls),
		[deferredCalls],
	);

	// Create refs for each call item (optimized)
	const callRefs = useMemo(() => {
		const refs = new Map<string, React.RefObject<HTMLDivElement | null>>();
		const currentIds = new Set<string>();

		// Process calls and create refs in single pass
		for (const call of deferredCalls) {
			currentIds.add(call.id);
			if (!itemRefsRef.current.has(call.id)) {
				itemRefsRef.current.set(call.id, createRef<HTMLDivElement>());
			}
			refs.set(call.id, itemRefsRef.current.get(call.id)!);
		}

		// Clean up refs for removed calls
		for (const [id] of itemRefsRef.current) {
			if (!currentIds.has(id)) {
				itemRefsRef.current.delete(id);
			}
		}

		return refs;
	}, [deferredCalls]);

	// Now handle conditional rendering AFTER all hooks
	// Determine the request ID to display
	const displayRequestId = displayChain?.requestId ?? requestId ?? null;

	// Only show empty state if we've never had data (no previous chain)
	const shouldShowEmpty = !hasData && !hasPreviousData;

	if (shouldShowEmpty) {
		return <EmptyState requestId={displayRequestId} />;
	}

	if (!displayChain) {
		return <EmptyState requestId={displayRequestId} />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Latest Tool Call Chain</CardTitle>
				<p className='text-sm text-muted-foreground'>
					Request ID: {displayChain.requestId}
				</p>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					<div
						ref={containerRef}
						className='flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth'
						style={{
							scrollbarWidth: 'thin',
							contain: 'layout style paint',
						}}
					>
						{deferredCalls.map((call, index) => {
							const isLast = index === deferredCalls.length - 1;
							return (
								<ToolCallItem
									key={call.id}
									call={call}
									showArrow={!isLast}
									itemRef={callRefs.get(call.id)}
								/>
							);
						})}
					</div>
					<div className='flex justify-between text-sm pt-2 border-t'>
						<span className='text-muted-foreground'>Total Chain Duration</span>
						<span className='font-medium'>{totalDuration}ms</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
