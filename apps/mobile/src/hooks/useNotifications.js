import { useCallback, useEffect, useRef, useState } from 'react';
import { getMobileRealtimeClient } from '@/realtime/client.js';
import {
  buildRulesChannel,
  buildFriendsChannel,
  buildDirectMessagesChannel,
  buildCampaignsChannel,
  REALTIME_OUTBOUND_MESSAGE_TYPES
} from '@saintrocky/realtime';

const MAX_NOTIFICATIONS = 50;

function formatNotificationFromEvent(event, surface) {
  return {
    id: `${surface}-${event.eventType || 'event'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    surface,
    title: event.title || event.eventType || surface,
    body: event.message || event.summary || event.body || '',
    timestamp: event.timestamp || new Date().toISOString(),
    read: false,
    payload: event
  };
}

export function useNotifications(ownerEmail) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const cleanupRefs = useRef([]);

  const pushNotification = useCallback((notification) => {
    setNotifications((previous) => {
      const next = [notification, ...previous].slice(0, MAX_NOTIFICATIONS);
      return next;
    });
    setUnreadCount((previous) => previous + 1);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!ownerEmail) return;

    const client = getMobileRealtimeClient();
    if (!client) return;

    const rulesChannel = buildRulesChannel(ownerEmail);
    const friendsChannel = buildFriendsChannel(ownerEmail);
    const directMessagesChannel = buildDirectMessagesChannel(ownerEmail);
    const campaignsChannel = buildCampaignsChannel(ownerEmail);

    const subscribeToChannel = (channel, surface) => {
      return client.subscribe(channel, (message) => {
        if (message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.snapshot) return;
        if (message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.event) {
          const event = message.payload || message;
          if (event.eventType === 'chain_violation_detected') {
            pushNotification(formatNotificationFromEvent({
              ...event,
              title: 'Trade violation detected',
              body: event.ruleTitle
                ? `"${event.ruleTitle}" triggered on ${event.dex || 'unknown DEX'}`
                : `Violation detected on ${event.dex || 'chain'}`
            }, 'chain'));
          } else {
            pushNotification(formatNotificationFromEvent(event, surface));
          }
        }
      });
    };

    const cleanupRules = subscribeToChannel(rulesChannel, 'rules');
    const cleanupFriends = subscribeToChannel(friendsChannel, 'social');
    const cleanupMessages = subscribeToChannel(directMessagesChannel, 'messages');
    const cleanupCampaigns = subscribeToChannel(campaignsChannel, 'campaigns');

    cleanupRefs.current = [cleanupRules, cleanupFriends, cleanupMessages, cleanupCampaigns];

    return () => {
      cleanupRefs.current.forEach((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
      cleanupRefs.current = [];
    };
  }, [ownerEmail, pushNotification]);

  return {
    notifications,
    unreadCount,
    markAllRead,
    clearAll
  };
}
