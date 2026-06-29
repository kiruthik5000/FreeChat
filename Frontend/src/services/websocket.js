import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

/**
 * Connect to a group's chat topic via STOMP-over-SockJS.
 *
 * @param {string}   groupId        UUID of the group
 * @param {function} onMessage      called with each incoming ChatDto
 * @param {function} onStatusChange called with 'connecting' | 'connected' | 'disconnected' | 'error'
 */
export function connectToGroup(groupId, onMessage, onStatusChange) {
  disconnect();                       // tear down any previous connection

  stompClient = new Client({
    webSocketFactory: () => new SockJS('/websocket'),
    reconnectDelay: 5000,
    debug: (msg) => console.debug('[STOMP]', msg),

    onConnect: () => {
      console.log('[WS] ✅ Connected');
      onStatusChange?.('connected');

      stompClient.subscribe(`/topic/group${groupId}`, (frame) => {
        try {
          onMessage(JSON.parse(frame.body));
        } catch (err) {
          console.error('[WS] Failed to parse incoming message:', err);
        }
      });
    },

    onStompError: (frame) => {
      console.error('[WS] ❌ STOMP error:', frame.headers?.message, frame.body);
      onStatusChange?.('error');
    },

    onDisconnect: () => {
      console.log('[WS] Disconnected');
      onStatusChange?.('disconnected');
    },

    onWebSocketClose: (evt) => {
      console.warn('[WS] Socket closed', evt?.reason || '');
      onStatusChange?.('disconnected');
    },

    onWebSocketError: (evt) => {
      console.error('[WS] Socket error', evt);
      onStatusChange?.('error');
    },
  });

  onStatusChange?.('connecting');
  stompClient.activate();
}

/**
 * Publish a chat message to /app/chat.send
 * @param {{ groupId: string, senderName: string, message: string }} chatDto
 * @returns {boolean} true if sent
 */
export function sendMessage(chatDto) {
  if (!stompClient?.connected) {
    console.error('[WS] Cannot send — client not connected');
    return false;
  }
  stompClient.publish({
    destination: '/app/chat.send',
    body: JSON.stringify(chatDto),
  });
  return true;
}

/** Cleanly deactivate the STOMP client. */
export function disconnect() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    console.log('[WS] Client deactivated');
  }
}
