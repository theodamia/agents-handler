import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { adaptToolCallChain } from '@/lib/api-adapters';
import type { ToolCallChain } from '../types';

/**
 * Hook to fetch multiple tool call chains by request IDs
 */
export function useMultipleChains(requestIds: string[]) {
	const queries = useQueries({
		queries: requestIds.map((requestId) => ({
			queryKey: ['tool-call-chain', requestId],
			queryFn: async () => {
				const data = await apiClient.getToolCallChain(requestId);
				return adaptToolCallChain(data);
			},
			enabled: !!requestId,
			refetchInterval: 30000,
		})),
	});

	const chains = useMemo(() => {
		return queries
			.map((query, index) => ({
				requestId: requestIds[index],
				chain: query.data,
				isLoading: query.isLoading,
				isError: query.isError,
			}))
			.filter((item) => item.chain !== undefined && item.chain !== null)
			.map((item) => item.chain as ToolCallChain);
	}, [queries, requestIds]);

	const isLoading = queries.some((query) => query.isLoading);
	const hasError = queries.some((query) => query.isError);

	return {
		chains,
		isLoading,
		hasError,
	};
}
