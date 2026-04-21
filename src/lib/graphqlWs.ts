import { USER_TOKEN_KEY } from '../features/user/api/auth';

const getWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/query';
  return apiUrl.replace(/^http/, 'ws');
};

type WsMessage = {
  type: string;
  id?: string;
  payload?: unknown;
};

export const subscribeToGraphQL = <T>(
  query: string,
  variables: Record<string, unknown>,
  onData: (data: T) => void,
  onError?: (error: unknown) => void,
  onConnected?: () => void,
): (() => void) => {
  const subId = Math.random().toString(36).slice(2);
  const token = localStorage.getItem(USER_TOKEN_KEY);
  let ws: WebSocket | null = new WebSocket(getWsUrl(), 'graphql-transport-ws');
  let unsubscribed = false;

  ws.onopen = () => {
    if (!ws || unsubscribed) return;
    const initPayload: Record<string, unknown> = {};
    if (token) {
      initPayload['Authorization'] = `Bearer ${token}`;
    }
    ws.send(JSON.stringify({ type: 'connection_init', payload: initPayload }));
  };

  ws.onmessage = (event: MessageEvent) => {
    if (!ws || unsubscribed) return;
    const msg = JSON.parse(event.data as string) as WsMessage;
    switch (msg.type) {
      case 'connection_ack':
        onConnected?.();
        ws.send(JSON.stringify({
          type: 'subscribe',
          id: subId,
          payload: { query, variables },
        }));
        break;
      case 'next':
        if (msg.id === subId && msg.payload) {
          onData((msg.payload as { data: T }).data);
        }
        break;
      case 'error':
        if (msg.id === subId) {
          onError?.(msg.payload);
        }
        break;
      case 'complete':
        if (msg.id === subId) {
          ws?.close();
          ws = null;
        }
        break;
    }
  };

  ws.onerror = (event) => {
    onError?.(event);
  };

  return () => {
    if (unsubscribed) return;
    unsubscribed = true;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'complete', id: subId }));
      }
      ws.close();
    }
    ws = null;
  };
};
