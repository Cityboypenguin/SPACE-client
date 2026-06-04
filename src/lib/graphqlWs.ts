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

type SubscriptionEntry = {
  query: string;
  variables: Record<string, unknown>;
  onData: (data: unknown) => void;
  onError?: (error: unknown) => void;
  onConnected?: () => void;
};

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000];

// Shared singleton connection state
let ws: WebSocket | null = null;
let isAcknowledged = false;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const subscriptions = new Map<string, SubscriptionEntry>();

function sendSubscribe(subId: string, entry: SubscriptionEntry) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'subscribe',
      id: subId,
      payload: { query: entry.query, variables: entry.variables },
    }));
  }
}

function connect() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  const token = localStorage.getItem(USER_TOKEN_KEY);
  ws = new WebSocket(getWsUrl(), 'graphql-transport-ws');
  isAcknowledged = false;

  ws.onopen = () => {
    const initPayload: Record<string, unknown> = {};
    if (token) {
      initPayload['Authorization'] = `Bearer ${token}`;
    }
    ws!.send(JSON.stringify({ type: 'connection_init', payload: initPayload }));
  };

  ws.onmessage = (event: MessageEvent) => {
    const msg = JSON.parse(event.data as string) as WsMessage;

    switch (msg.type) {
      case 'connection_ack':
        isAcknowledged = true;
        reconnectAttempt = 0;
        // Register all active subscriptions over the new connection
        for (const [subId, entry] of subscriptions) {
          entry.onConnected?.();
          sendSubscribe(subId, entry);
        }
        break;

      case 'ping':
        ws!.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'next':
        if (msg.id && msg.payload) {
          subscriptions.get(msg.id)?.onData((msg.payload as { data: unknown }).data);
        }
        break;

      case 'error':
        if (msg.id) {
          console.error('[GraphQL WS] subscription error:', msg.payload);
          subscriptions.get(msg.id)?.onError?.(msg.payload);
        }
        break;

      case 'complete':
        if (msg.id) {
          subscriptions.delete(msg.id);
        }
        break;
    }
  };

  ws.onerror = (event) => {
    console.error('[GraphQL WS] connection error:', event);
  };

  ws.onclose = (event) => {
    console.warn('[GraphQL WS] connection closed', event.code, event.reason);
    isAcknowledged = false;
    ws = null;

    for (const entry of subscriptions.values()) {
      entry.onError?.(new Error('disconnected'));
    }

    if (subscriptions.size > 0) {
      scheduleReconnect();
    }
  };
}

function scheduleReconnect() {
  if (reconnectTimer != null) return;
  const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
  reconnectAttempt++;
  console.log(`[GraphQL WS] reconnecting in ${delay}ms (attempt ${reconnectAttempt})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (subscriptions.size > 0) connect();
  }, delay);
}

export const subscribeToGraphQL = <T>(
  query: string,
  variables: Record<string, unknown>,
  onData: (data: T) => void,
  onError?: (error: unknown) => void,
  onConnected?: () => void,
): (() => void) => {
  const subId = Math.random().toString(36).slice(2) || 'sub';

  const entry: SubscriptionEntry = {
    query,
    variables,
    onData: onData as (data: unknown) => void,
    onError,
    onConnected,
  };
  subscriptions.set(subId, entry);

  if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
    connect();
  } else if (isAcknowledged) {
    // Connection already open — send subscribe immediately
    onConnected?.();
    sendSubscribe(subId, entry);
  }
  // If CONNECTING, subscription will be sent when connection_ack arrives

  return () => {
    subscriptions.delete(subId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'complete', id: subId }));
    }
    // Close shared connection when all subscriptions are gone
    if (subscriptions.size === 0) {
      if (reconnectTimer != null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws?.close();
        } else if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        ws = null;
      }
      isAcknowledged = false;
    }
  };
};
