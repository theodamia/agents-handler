import { useQuery } from '@tanstack/react-query';
import {
	type FailureRateDataPoint as ApiFailureRateDataPoint,
	type LatencyDataPoint as ApiLatencyDataPoint,
	type TokenUsageDataPoint as ApiTokenUsageDataPoint,
	type ToolCall as ApiToolCall,
	type ToolCallDataPoint as ApiToolCallDataPoint,
	apiClient,
	type MetricsOverview,
} from '@/lib/api';
import {
	adaptFailureRateDataPoint,
	adaptLatencyDataPoint,
	adaptTokenUsageDataPoint,
	adaptToolCall,
	adaptToolCallChain,
	adaptToolCallDataPoint,
} from '@/lib/api-adapters';
import type {
	FailureRateDataPoint,
	LatencyDataPoint,
	TokenUsageDataPoint,
	ToolCall,
	ToolCallChain,
	ToolCallDataPoint,
} from '../types';

export function useToolCallsMetrics(hours: number = 24) {
	return useQuery<ToolCallDataPoint[]>({
		queryKey: ['tool-calls-metrics', hours],
		queryFn: async () => {
			const data = await apiClient.getToolCallsMetrics(hours);
			return data.map(adaptToolCallDataPoint);
		},
		refetchInterval: 30000, // Refetch every 30 seconds
	});
}

export function useLatencyMetrics(hours: number = 24) {
	return useQuery<LatencyDataPoint[]>({
		queryKey: ['latency-metrics', hours],
		queryFn: async () => {
			const data = await apiClient.getLatencyMetrics(hours);
			return data.map(adaptLatencyDataPoint);
		},
		refetchInterval: 30000,
	});
}

export function useTokenUsageMetrics(hours: number = 24) {
	return useQuery<TokenUsageDataPoint[]>({
		queryKey: ['token-usage-metrics', hours],
		queryFn: async () => {
			const data = await apiClient.getTokenUsageMetrics(hours);
			return data.map(adaptTokenUsageDataPoint);
		},
		refetchInterval: 30000,
	});
}

export function useFailureRateMetrics(hours: number = 24) {
	return useQuery<FailureRateDataPoint[]>({
		queryKey: ['failure-rate-metrics', hours],
		queryFn: async () => {
			const data = await apiClient.getFailureRateMetrics(hours);
			return data.map(adaptFailureRateDataPoint);
		},
		refetchInterval: 30000,
	});
}

export function useRecentToolCalls(limit: number = 10) {
	return useQuery<ToolCall[]>({
		queryKey: ['recent-tool-calls', limit],
		queryFn: async () => {
			const data = await apiClient.getRecentToolCalls(limit);
			return data.map(adaptToolCall);
		},
		refetchInterval: 10000, // Refetch every 10 seconds for recent calls
	});
}

export function useMetricsOverview(hours: number = 24) {
	return useQuery<MetricsOverview>({
		queryKey: ['metrics-overview', hours],
		queryFn: () => apiClient.getMetricsOverview(hours),
		refetchInterval: 30000,
	});
}

export function useToolCallChain(requestId: string | null) {
	return useQuery<ToolCallChain | null>({
		queryKey: ['tool-call-chain', requestId],
		queryFn: async () => {
			if (!requestId) return null;
			const data = await apiClient.getToolCallChain(requestId);
			return adaptToolCallChain(data);
		},
		enabled: !!requestId,
		refetchInterval: 30000,
	});
}
