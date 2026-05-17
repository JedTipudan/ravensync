let ws = null;
const listeners = new Map();

export function initWebSocket(token) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const url = `${protocol}//${host}/ws?token=${token}`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('🔗 WebSocket connected');
    emit('connected', {});
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      emit(data.type, data);
      emit('*', data);
    } catch (e) { /* ignore */ }
  };

  ws.onclose = () => {
    console.log('🔌 WebSocket disconnected, reconnecting...');
    setTimeout(() => initWebSocket(token), 3000);
  };

  ws.onerror = () => {};

  // Ping
  setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'PING' }));
    }
  }, 25000);
}

export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(callback);
  return () => off(event, callback);
}

export function off(event, callback) {
  const cbs = listeners.get(event) || [];
  listeners.set(event, cbs.filter(cb => cb !== callback));
}

function emit(event, data) {
  (listeners.get(event) || []).forEach(cb => cb(data));
}

export function sendRaw(payload) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function subscribeChannel(channelId) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'SUBSCRIBE_CHANNEL', channelId }));
  }
}

export function getWsStatus() {
  if (!ws) return 'disconnected';
  return ['connecting', 'open', 'closing', 'closed'][ws.readyState] || 'unknown';
}
