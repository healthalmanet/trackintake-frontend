import { useEffect, useRef } from 'react';

// --- Singleton WebSocket Manager ---
class WebSocketManager {
  constructor() {
    this.sockets = {
      message: null,
      reminder: null,
    };
    this.reconnectTimers = {
      message: null,
      reminder: null,
    };
    this.reconnectAttempts = {
      message: 0,
      reminder: 0,
    };
    this.heartbeatTimers = {
      message: null,
      reminder: null,
    };
    this.listeners = {
      onMessage: new Set(),
      onReminder: new Set(),
      onSuggestion: new Set(),
    };
    this.wsUrl = import.meta.env.VITE_WS_URL;
    this.heartbeatInterval = 30000;
    this.maxReconnectDelay = 30000;
    this.baseReconnectDelay = 2000;

    // Handle page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.disconnectAll());
    }
  }

  getReconnectDelay(type) {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts[type]),
      this.maxReconnectDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  connect(type) {
    const token = localStorage.getItem('token');
    if (!token || !this.wsUrl) return;

    if (this.sockets[type] && (this.sockets[type].readyState === WebSocket.OPEN || this.sockets[type].readyState === WebSocket.CONNECTING)) {
      return;
    }

    const path = type === 'message' ? '/ws/messages/' : '/ws/reminders/';
    const url = `${this.wsUrl}${path}?token=${token}`;

    console.log(`📡 [WS] Connecting to ${type}...`);
    const socket = new WebSocket(url);
    this.sockets[type] = socket;

    socket.onopen = () => {
      console.log(`✅ [WS] ${type} connected.`);
      this.reconnectAttempts[type] = 0;
      clearTimeout(this.reconnectTimers[type]);
      this.startHeartbeat(type);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return;

        if (type === 'message') {
          this.listeners.onMessage.forEach(handler => handler(data));
        } else {
          if (data.type === 'food_suggestion') {
            this.listeners.onSuggestion.forEach(handler => handler(data));
          } else {
            this.listeners.onReminder.forEach(handler => handler(data));
          }
        }
      } catch (e) {
        console.error(`❌ [WS] Error parsing message on ${type}:`, e);
      }
    };

    socket.onclose = (event) => {
      console.log(`🔌 [WS] ${type} closed: ${event.code}`);
      this.stopHeartbeat(type);
      this.sockets[type] = null;
      
      if (!this.isExplicitDisconnect) {
        const delay = this.getReconnectDelay(type);
        this.reconnectAttempts[type]++;
        console.log(`🔄 [WS] Reconnecting ${type} in ${(delay/1000).toFixed(1)}s...`);
        clearTimeout(this.reconnectTimers[type]);
        this.reconnectTimers[type] = setTimeout(() => this.connect(type), delay);
      }
    };

    socket.onerror = (error) => {
      console.error(`❌ [WS] ${type} error:`, error);
    };
  }

  startHeartbeat(type) {
    this.stopHeartbeat(type);
    this.heartbeatTimers[type] = setInterval(() => {
      const socket = this.sockets[type];
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat(type) {
    if (this.heartbeatTimers[type]) {
      clearInterval(this.heartbeatTimers[type]);
      this.heartbeatTimers[type] = null;
    }
  }

  disconnectAll() {
    this.isExplicitDisconnect = true;
    Object.keys(this.sockets).forEach(type => {
      clearTimeout(this.reconnectTimers[type]);
      this.stopHeartbeat(type);
      if (this.sockets[type]) {
        this.sockets[type].close(1000, 'Cleaning up');
        this.sockets[type] = null;
      }
    });
  }

  addListener(type, handler) {
    if (handler && this.listeners[type]) {
      this.listeners[type].add(handler);
    }
  }

  removeListener(type, handler) {
    if (handler && this.listeners[type]) {
      this.listeners[type].delete(handler);
    }
  }
}

const manager = new WebSocketManager();

const useWebSockets = ({ onReminder, onMessage, onSuggestion } = {}) => {
  const onReminderRef = useRef(onReminder);
  const onMessageRef = useRef(onMessage);
  const onSuggestionRef = useRef(onSuggestion);

  useEffect(() => {
    onReminderRef.current = onReminder;
    onMessageRef.current = onMessage;
    onSuggestionRef.current = onSuggestion;
  });

  useEffect(() => {
    const handleMsg = (data) => onMessageRef.current?.(data);
    const handleRem = (data) => onReminderRef.current?.(data);
    const handleSug = (data) => onSuggestionRef.current?.(data);

    manager.addListener('onMessage', handleMsg);
    manager.addListener('onReminder', handleRem);
    manager.addListener('onSuggestion', handleSug);

    manager.connect('message');
    manager.connect('reminder');

    return () => {
      manager.removeListener('onMessage', handleMsg);
      manager.removeListener('onReminder', handleRem);
      manager.removeListener('onSuggestion', handleSug);
    };
  }, []);
};

export default useWebSockets;