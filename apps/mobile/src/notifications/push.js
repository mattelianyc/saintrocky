import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250]
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenData.data;
  } catch {
    return null;
  }
}

export function addNotificationResponseListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function addNotificationReceivedListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function parseNotificationNavigation(notification) {
  const data = notification?.request?.content?.data;
  if (!data) return null;

  if (data.type === 'violation' && data.ruleId) {
    return {
      screen: 'Main',
      params: {
        screen: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'HomeOverview' } }
      }
    };
  }

  if (data.type === 'message' && data.counterpartyUserId) {
    return {
      screen: 'Main',
      params: {
        screen: 'MainTabs',
        params: {
          screen: 'Social',
          params: {
            screen: 'ChatConversation',
            params: {
              counterpartyUserId: data.counterpartyUserId,
              counterpartyName: data.counterpartyName
            }
          }
        }
      }
    };
  }

  if (data.type === 'friend_request') {
    return {
      screen: 'Main',
      params: {
        screen: 'MainTabs',
        params: { screen: 'Social' }
      }
    };
  }

  if (data.type === 'campaign') {
    return {
      screen: 'Main',
      params: {
        screen: 'MainTabs',
        params: { screen: 'Social' }
      }
    };
  }

  if (data.type === 'leaderboard') {
    return {
      screen: 'Main',
      params: {
        screen: 'MainTabs',
        params: { screen: 'Leaderboard' }
      }
    };
  }

  return null;
}
