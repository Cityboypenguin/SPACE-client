import { USER_TOKEN_KEY } from '../features/user/api/auth';

const fallbackApiUrl = '/query';

const getWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || fallbackApiUrl;
  if (apiUrl.startsWith('/')) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}${apiUrl}`;
  }
  return apiUrl.replace(/^http/, 'ws');
};

type WsMessage = {
  type: string;
  id?: string;
  payload?: unknown;
};

type SubscribeOptions<T> = {
  query: string;
  variables: Record<string, unknown>;
  onData: (data: T) => void;
  onError?: (error: unknown) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
};

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000];

function createConnection<T>(
  options: SubscribeOptions<T>,
  subId: string,
  stopped: { current: boolean },
  attempt: { current: number },
  scheduleReconnect: () => void,
): WebSocket {
  const { query, variables, onData, onError, onConnected, onDisconnected } = options;
  const token = localStorage.getItem(USER_TOKEN_KEY);
  const ws = new WebSocket(getWsUrl(), 'graphql-transport-ws');

  ws.onopen = () => {
    if (stopped.current) {
      ws.close();
      return;
    }
    const initPayload: Record<string, unknown> = {};
    if (token) {
      initPayload['Authorization'] = `Bearer ${token}`;
    }
    ws.send(JSON.stringify({ type: 'connection_init', payload: initPayload }));
  };

  ws.onmessage = (event: MessageEvent) => {
    if (stopped.current) return;
    const msg = JSON.parse(event.data as string) as WsMessage;

    switch (msg.type) {
      case 'connection_ack':
        attempt.current = 0;
        onConnected?.();
        ws.send(JSON.stringify({
          type: 'subscribe',
          id: subId,
          payload: { query, variables },
        }));
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'next':
        if (msg.id === subId && msg.payload) {
          onData((msg.payload as { data: T }).data);
        }
        break;

      case 'error':
        if (msg.id === subId) {
          console.error('[GraphQL WS] subscription error:', msg.payload);
          onError?.(msg.payload);
        }
        break;

      case 'complete':
        if (msg.id === subId) {
          ws.close();
        }
        break;
    }
  };

  ws.onerror = (event) => {
    console.error('[GraphQL WS] connection error:', event);
    onError?.(event);
  };

  ws.onclose = (event) => {
    if (stopped.current) return;
    console.warn('[GraphQL WS] connection closed', event.code, event.reason);
    onDisconnected?.();
    scheduleReconnect();
  };

  return ws;
}

export const subscribeToGraphQL = <T>(
  query: string,
  variables: Record<string, unknown>,
  onData: (data: T) => void,
  onError?: (error: unknown) => void,
  onConnected?: () => void,
): (() => void) => {
  const subId = Math.random().toString(36).slice(2) || 'sub';
  const stopped = { current: false };
  const attempt = { current: 0 };
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const options: SubscribeOptions<T> = {
    query,
    variables,
    onData,
    onError,
    onConnected,
    onDisconnected: () => onError?.(new Error('disconnected')),
  };

  const scheduleReconnect = () => {
    if (stopped.current) return;
    const delay = RECONNECT_DELAYS[Math.min(attempt.current, RECONNECT_DELAYS.length - 1)];
    attempt.current++;
    console.log(`[GraphQL WS] reconnecting in ${delay}ms (attempt ${attempt.current})`);
    reconnectTimer = setTimeout(() => {
      if (!stopped.current) {
        ws = createConnection(options, subId, stopped, attempt, scheduleReconnect);
      }
    }, delay);
  };

  ws = createConnection(options, subId, stopped, attempt, scheduleReconnect);

  return () => {
    stopped.current = true;
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws?.close();
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'complete', id: subId }));
        ws.close();
      }
      ws = null;
    }
  };
};
