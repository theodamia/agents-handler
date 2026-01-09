import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';

export function useRealtimeToolCalls() {
	const queryClient = useQueryClient();

	// Use ref to keep callback stable and avoid re-creating socket connection
	const queryClientRef = useRef(queryClient);
	useEffect(() => {
		queryClientRef.current = queryClient;
	}, [queryClient]);

	const handleMessage = useCallback(
		(message: { type: string; data: unknown }) => {
			if (message.type === 'tool_call') {
				// The WebSocket sends ToolCallEvent format (from ingestion)
				// Invalidate queries to trigger refetch of latest data
				// This ensures we get the complete tool call data from the database
				queryClientRef.current.invalidateQueries({
					queryKey: ['recent-tool-calls'],
				});
				queryClientRef.current.invalidateQueries({
					queryKey: ['tool-calls-metrics'],
				});
				queryClientRef.current.invalidateQueries({
					queryKey: ['metrics-overview'],
				});
				queryClientRef.current.invalidateQueries({
					queryKey: ['latency-metrics'],
				});
				queryClientRef.current.invalidateQueries({
					queryKey: ['token-usage-metrics'],
				});
				queryClientRef.current.invalidateQueries({
					queryKey: ['failure-rate-metrics'],
				});
			}
		},
		[], // Empty deps - callback never changes
	);

	const { isConnected, error } = useWebSocket(handleMessage);

	return {
		isConnected,
		error,
	};
}
