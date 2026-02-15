import { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useMultipleChains } from '../hooks/use-multiple-chains';
import { useRecentToolCalls } from '../hooks/use-observability-data';
import { ToolCallChainComponent } from './tool-call-chain';

interface MultiAgentChainsProps {
	/**
	 * Maximum number of agents/chains to display
	 * @default 5
	 */
	maxChains?: number;
}

/**
 * Component that displays multiple agents' tool call chains
 * Shows the most recent chains from different agents (different request IDs)
 */
export function MultiAgentChains({ maxChains = 5 }: MultiAgentChainsProps) {
	// Get recent tool calls to extract unique request IDs
	const { data: recentToolCalls = [], isLoading: isLoadingRecent } =
		useRecentToolCalls(maxChains * 3); // Get more to account for duplicates

	// Extract unique request IDs from recent tool calls
	const uniqueRequestIds = useMemo(() => {
		const seen = new Set<string>();
		const ids: string[] = [];

		for (const call of recentToolCalls) {
			if (call.requestId && !seen.has(call.requestId)) {
				seen.add(call.requestId);
				ids.push(call.requestId);
				if (ids.length >= maxChains) break;
			}
		}

		return ids;
	}, [recentToolCalls, maxChains]);

	// Fetch chains for all unique request IDs
	const { chains, isLoading: isLoadingChains } =
		useMultipleChains(uniqueRequestIds);

	const isLoading = isLoadingRecent || isLoadingChains;

	if (isLoading && chains.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Active Agent Chains</CardTitle>
					<p className='text-sm text-muted-foreground'>Loading chains...</p>
				</CardHeader>
			</Card>
		);
	}

	if (chains.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Active Agent Chains</CardTitle>
					<p className='text-sm text-muted-foreground'>
						No active agent chains found
					</p>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-bold'>Active Agent Chains</h2>
				<p className='text-sm text-muted-foreground'>
					{chains.length} active agent{chains.length !== 1 ? 's' : ''}
				</p>
			</div>

			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{chains.map((chain) => (
					<ToolCallChainComponent
						key={chain.requestId}
						chain={chain}
						requestId={chain.requestId}
					/>
				))}
			</div>
		</div>
	);
}
