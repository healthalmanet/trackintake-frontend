// FILE: src/api/useWebSockets.js (REPLACE ENTIRE FILE)

import { useEffect, useCallback } from 'react';

// --- This block acts as our global WebSocket manager ---
let messageSocket = null;
let reminderSocket = null;
let messageReconnectTimer = null;
let reminderReconnectTimer = null;
let messageHeartbeatTimer = null;
let reminderHeartbeatTimer = null;

let onMessageHandler = () => {};
let onReminderHandler = () => {};

// +++ THE KILL SWITCH: Set this to true to disable all WebSockets for testing +++
const WEBSOCKETS_DISABLED = false;


const WEBSOCKET_URL =
  import.meta.env.VITE_WS_URL;

const RECONNECT_DELAY = 5000;
const HEARTBEAT_INTERVAL = 30000;

const connectMessages = () => {
  if (WEBSOCKETS_DISABLED) return; // Abort if disabled
  const token = localStorage.getItem("token");
  if (!token) return;
  if (messageSocket && messageSocket.readyState !== WebSocket.CLOSED) return;

  messageSocket = new WebSocket(`${WEBSOCKET_URL}/ws/messages/?token=${token}`);
  console.log("Attempting to connect Message WebSocket...");

  messageSocket.onopen = () => {
    console.log("✅ Message WebSocket connected.");
    clearTimeout(messageReconnectTimer);
    startHeartbeat('message');
  };

  messageSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'pong') return;
    onMessageHandler(data);
  };

  messageSocket.onerror = (error) => console.error("❌ Message WebSocket error:", error);

  messageSocket.onclose = (event) => {
    console.log(`🔌 Message WebSocket closed: ${event.code}`);
    stopHeartbeat('message');
    if (event.code !== 1000) {
      clearTimeout(messageReconnectTimer);
      messageReconnectTimer = setTimeout(connectMessages, RECONNECT_DELAY);
    }
  };
};

const connectReminders = () => {
  if (WEBSOCKETS_DISABLED) return; // Abort if disabled
  const token = localStorage.getItem("token");
  if (!token) return;
  if (reminderSocket && reminderSocket.readyState !== WebSocket.CLOSED) return;
  
  reminderSocket = new WebSocket(`${WEBSOCKET_URL}/ws/reminders/?token=${token}`);
  console.log("Attempting to connect Reminder WebSocket...");
  
  reminderSocket.onopen = () => {
    console.log("✅ Reminder WebSocket connected.");
    clearTimeout(reminderReconnectTimer);
    startHeartbeat('reminder');
  };

  reminderSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'pong') return;
    onReminderHandler(data);
  };
  
  reminderSocket.onerror = (error) => console.error("❌ Reminder WebSocket error:", error);
  
  reminderSocket.onclose = (event) => {
    console.log(`🔌 Reminder WebSocket closed: ${event.code}`);
    stopHeartbeat('reminder');
    if (event.code !== 1000) {
      clearTimeout(reminderReconnectTimer);
      reminderReconnectTimer = setTimeout(connectReminders, RECONNECT_DELAY);
    }
  };
};

const startHeartbeat = (type) => {
  const socket = type === 'message' ? messageSocket : reminderSocket;
  let timerRef = type === 'message' ? messageHeartbeatTimer : reminderHeartbeatTimer;
  
  clearInterval(timerRef);
  const newTimer = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));
    }
  }, HEARTBEAT_INTERVAL);

  if (type === 'message') messageHeartbeatTimer = newTimer;
  else reminderHeartbeatTimer = newTimer;
};

const stopHeartbeat = (type) => {
  let timerRef = type === 'message' ? messageHeartbeatTimer : reminderHeartbeatTimer;
  clearInterval(timerRef);
};

const disconnectAll = () => {
  clearTimeout(messageReconnectTimer);
  clearTimeout(reminderReconnectTimer);
  stopHeartbeat('message');
  stopHeartbeat('reminder');
  if (messageSocket) messageSocket.close(1000, "User left page");
  if (reminderSocket) reminderSocket.close(1000, "User left page");
  console.log("WebSockets cleanly disconnected.");
};

window.addEventListener("beforeunload", disconnectAll);


// --- The Actual React Hook ---
const useWebSockets = ({ onReminder, onMessage }) => {
  
  const stableOnMessage = useCallback(onMessage || (() => {}), [onMessage]);
  const stableOnReminder = useCallback(onReminder || (() => {}), [onReminder]);

  useEffect(() => {
    // --- THIS IS THE KILL SWITCH CHECK ---
    if (WEBSOCKETS_DISABLED) {
      console.warn("WebSockets are currently disabled via the kill switch in useWebSockets.js");
      return; // Do nothing else
    }
    // --- END OF KILL SWITCH CHECK ---

    onMessageHandler = stableOnMessage;
    onReminderHandler = stableOnReminder;

    connectMessages();
    connectReminders();

    return () => {
      onMessageHandler = () => {};
      onReminderHandler = () => {};
    };
  }, [stableOnMessage, stableOnReminder]);
};

export default useWebSockets;