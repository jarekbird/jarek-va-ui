export interface WsConnectionOptions<TMessage = unknown> {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage: (message: TMessage) => void;
  /**
   * Auto-reconnect on unexpected close.
   * Defaults to true.
   */
  reconnect?: boolean;
  /**
   * Maximum reconnect delay in ms (exponential backoff with jitter).
   * Defaults to 5000ms.
   */
  maxReconnectDelayMs?: number;
}

export function buildWsUrl(pathWithQuery: string): string {
  // Optional override for deployments where WS is on a different host
  const wsBase = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  if (wsBase && wsBase.length > 0) {
    const url = new URL(pathWithQuery, wsBase);
    return url.toString();
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const path = pathWithQuery.startsWith('/')
    ? pathWithQuery
    : `/${pathWithQuery}`;
  return `${protocol}//${window.location.host}${path}`;
}

export function connectWs<TMessage = unknown>(
  pathWithQuery: string,
  options: WsConnectionOptions<TMessage>
): { close: () => void } {
  if (typeof WebSocket === 'undefined') {
    // Non-browser / test environments without WebSocket. Caller can fallback.
    options.onError?.(new Event('error'));
    return { close: () => {} };
  }

  const reconnect = options.reconnect ?? true;
  const maxReconnectDelayMs = options.maxReconnectDelayMs ?? 5000;

  let ws: WebSocket | null = null;
  let closedByUser = false;
  let attempt = 0;
  let reconnectTimer: number | null = null;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (!reconnect || closedByUser) return;
    clearReconnectTimer();

    attempt += 1;
    const baseDelay = Math.min(250 * Math.pow(2, attempt), maxReconnectDelayMs);
    const jitter = Math.round(Math.random() * 200);
    const delay = Math.min(baseDelay + jitter, maxReconnectDelayMs);

    reconnectTimer = window.setTimeout(() => {
      connect();
    }, delay);
  };

  const connect = () => {
    clearReconnectTimer();
    const url = buildWsUrl(pathWithQuery);
    console.log('[WS] Attempting connection', { url, pathWithQuery, attempt });
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[WS] Connection opened', { url, attempt });
      attempt = 0;
      options.onOpen?.();
    };

    ws.onclose = (event) => {
      console.log('[WS] Connection closed', {
        url,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        attempt,
      });
      options.onClose?.(event);
      scheduleReconnect();
    };

    ws.onerror = (event) => {
      console.error('[WS] Connection error', { url, attempt, event });
      options.onError?.(event);
      // Some browsers only fire onclose after onerror; we reconnect from onclose.
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as TMessage;
        options.onMessage(parsed);
      } catch {
        // Ignore malformed messages
      }
    };
  };

  connect();

  return {
    close: () => {
      closedByUser = true;
      clearReconnectTimer();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Client closing');
      } else if (ws) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
      ws = null;
    },
  };
}
