import { useQueryClient } from '@tanstack/react-query';
import { useThrottle } from '@uidotdev/usehooks';
import {
	startTransition,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { useWebSocket } from '@/hooks/use-websocket';

// Query keys to invalidate
const QUERY_KEYS = [
	'recent-tool-calls',
	'tool-calls-metrics',
	'metrics-overview',
	'latency-metrics',
	'token-usage-metrics',
	'failure-rate-metrics',
	'tool-call-chain',
] as const;

// Throttle delay (ms)
const THROTTLE_DELAY_MS = 150;

export function useRealtimeToolCalls() {
	const queryClient = useQueryClient();

	// Use ref to keep callback stable and avoid re-creating socket connection
	const queryClientRef = useRef(queryClient);
	useEffect(() => {
		queryClientRef.current = queryClient;
	}, [queryClient]);

	// Batch invalidations to prevent excessive re-renders
	const invalidateQueries = useCallback(() => {
		startTransition(() => {
			// Batch all invalidations together
			QUERY_KEYS.forEach((queryKey) => {
				queryClientRef.current.invalidateQueries({ queryKey: [queryKey] });
			});
		});
	}, []);

	// Use useThrottle to throttle invalidation trigger
	const [invalidateTrigger, setInvalidateTrigger] = useState(0);
	const throttledTrigger = useThrottle(invalidateTrigger, THROTTLE_DELAY_MS);

	// Execute invalidation when throttled trigger changes
	useEffect(() => {
		if (throttledTrigger > 0) {
			invalidateQueries();
		}
	}, [throttledTrigger, invalidateQueries]);

	// Throttled invalidate function
	const throttledInvalidate = useCallback(() => {
		setInvalidateTrigger((prev) => prev + 1);
	}, []);

	const handleMessage = useCallback(
		(message: { type: string; data: unknown }) => {
			if (message.type === 'tool_call') {
				throttledInvalidate();
			} else if (message.type === 'batch') {
				const batch = message.data as Array<{ type: string; data: unknown }>;
				if (Array.isArray(batch) && batch.length > 0) {
					throttledInvalidate();
				}
			}
		},
		[throttledInvalidate],
	);

	const { isConnected, error } = useWebSocket(handleMessage);

	return {
		isConnected,
		error,
	};
}
