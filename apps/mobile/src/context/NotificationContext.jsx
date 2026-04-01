import { createContext, useCallback, useContext, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications.js';
import { NotificationSheet } from '@/components/NotificationSheet/NotificationSheet.jsx';

const NotificationContext = createContext(null);

export function NotificationProvider({ ownerEmail, children }) {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications(ownerEmail);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);

  const toggleSheet = useCallback(() => {
    setSheetVisible((previous) => !previous);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, openSheet, closeSheet, toggleSheet }}
    >
      {children}
      <NotificationSheet
        visible={sheetVisible}
        onClose={closeSheet}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onClearAll={clearAll}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    return { notifications: [], unreadCount: 0, openSheet: () => {}, closeSheet: () => {}, toggleSheet: () => {} };
  }
  return context;
}
