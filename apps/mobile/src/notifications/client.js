import { Alert } from 'react-native';
import { createNotifications } from '@saintrocky/notifications';
import { createNativeNotifications } from '@saintrocky/notifications/native';

const nativeAdapter = createNativeNotifications({
  notify({ title, message }) {
    const resolvedTitle = title || 'Notice';
    const resolvedMessage = message || 'Something went wrong.';
    Alert.alert(resolvedTitle, resolvedMessage);
  }
});

export const notifications = createNotifications(nativeAdapter);
