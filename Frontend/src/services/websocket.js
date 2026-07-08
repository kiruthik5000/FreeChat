import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

/**
 * Connect to a group's chat topic via STOMP-over-SockJS.
 *
 * @param {string}   groupId          UUID of the group
 * @param {function} onMessage        called with each incoming ChatDto
 * @param {function} onStatusChange   called with 'connecting' | 'connected' | 'disconnected' | 'error'
 * @param {object}   [callbacks]      optional event callbacks
 * @param {function} [callbacks.onGroupDeleted] called with the groupId when a GROUP_DELETED event arrives
 * @param {function} [callbacks.onGroupCreated] called with the new group object when a GROUP_CREATED event arrives
 */
export function connectToGroup(groupId, onMessage, onStatusChange, callbacks = {}) {
  const { onGroupDeleted, onGroupCreated } = callbacks;
  disconnect();                       // tear down any previous connection

  stompClient = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/websocket'),
    reconnectDelay: 5000,
    debug: (msg) => console.debug('[STOMP]', msg),

    onConnect: () => {
      console.log('[WS] ✅ Connected');
      onStatusChange?.('connected');

      // ── Per-group message subscription ──────────
      stompClient.subscribe(`/topic/group${groupId}`, (frame) => {
        try {
          const payload = JSON.parse(frame.body);

          // Check if the incoming message is a GROUP_DELETED event
          if (payload.type === 'GROUP_DELETED') {
            console.log('[WS] ⚠ GROUP_DELETED event received for', payload.groupId || groupId);
            onGroupDeleted?.(payload.groupId || groupId);
            return;
          }

          onMessage(payload);
        } catch (err) {
          console.error('[WS] Failed to parse incoming message:', err);
        }
      });

      // ── Global group-deleted subscription ──────
      stompClient.subscribe('/topic/group-deleted', (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          console.log('[WS] ⚠ Global GROUP_DELETED event:', payload.groupId);
          onGroupDeleted?.(payload.groupId);
        } catch (err) {
          console.error('[WS] Failed to parse group-deleted event:', err);
        }
      });

      // ── Global group-created subscription ──────
      stompClient.subscribe('/topic/group-created', (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          console.log('[WS] ✅ Global GROUP_CREATED event:', payload.groupId);
          onGroupCreated?.(payload);
        } catch (err) {
          console.error('[WS] Failed to parse group-created event:', err);
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
 * Subscribe to global group lifecycle topics (created & deleted).
 * Used on the GroupsPage where no specific group is open.
 *
 * @param {object}   callbacks
 * @param {function} [callbacks.onGroupDeleted] called with the deleted groupId
 * @param {function} [callbacks.onGroupCreated] called with the new group object
 * @returns {function} cleanup function that deactivates the client
 */
export function subscribeToGroupEvents({ onGroupDeleted, onGroupCreated } = {}) {
  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/websocket'),
    reconnectDelay: 5000,
    debug: () => {},          // silent for the background listener

    onConnect: () => {
      client.subscribe('/topic/group-deleted', (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          onGroupDeleted?.(payload.groupId);
        } catch (err) {
          console.error('[WS] Failed to parse group-deleted event:', err);
        }
      });

      client.subscribe('/topic/group-created', (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          onGroupCreated?.(payload);
        } catch (err) {
          console.error('[WS] Failed to parse group-created event:', err);
        }
      });
    },
  });

  client.activate();

  return () => {
    client.deactivate();
  };
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
