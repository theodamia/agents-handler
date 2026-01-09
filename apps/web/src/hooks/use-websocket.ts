import { useEffect, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export interface WebSocketMessage {
	type: string;
	data: unknown;
	timestamp: number;
}

export function useWebSocket<T = unknown>(
	onMessage?: (message: WebSocketMessage & { data: T }) => void,
) {
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<number | null>(null);
	const reconnectAttempts = useRef(0);
	const maxReconnectAttempts = 5;
	const reconnectDelay = 1000; // Start with 1 second

	useEffect(() => {
		let mounted = true;

		const connect = () => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				return;
			}

			try {
				const ws = new WebSocket(WS_URL);

				ws.onopen = () => {
					if (!mounted) return;
					setIsConnected(true);
					setError(null);
					reconnectAttempts.current = 0;
					console.log('WebSocket connected');
				};

				ws.onmessage = (event) => {
					if (!mounted) return;
					try {
						const message: WebSocketMessage = JSON.parse(event.data);
						if (onMessage) {
							onMessage(message as WebSocketMessage & { data: T });
						}
					} catch (err) {
						console.error('Error parsing WebSocket message:', err);
					}
				};

				ws.onerror = (event) => {
					if (!mounted) return;
					console.error('WebSocket error:', event);
					setError(new Error('WebSocket connection error'));
				};

				ws.onclose = () => {
					if (!mounted) return;
					setIsConnected(false);
					wsRef.current = null;

					// Attempt to reconnect
					if (reconnectAttempts.current < maxReconnectAttempts && mounted) {
						reconnectAttempts.current += 1;
						const delay = reconnectDelay * 2 ** (reconnectAttempts.current - 1);
						console.log(
							`WebSocket closed. Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`,
						);
						reconnectTimeoutRef.current = window.setTimeout(() => {
							if (mounted) {
								connect();
							}
						}, delay);
					} else if (mounted) {
						setError(
							new Error(
								'WebSocket connection failed after maximum reconnect attempts',
							),
						);
					}
				};

				wsRef.current = ws;
			} catch (err) {
				if (mounted) {
					setError(err instanceof Error ? err : new Error('Failed to connect'));
				}
			}
		};

		connect();

		return () => {
			mounted = false;
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [onMessage]);

	return { isConnected, error };
}
