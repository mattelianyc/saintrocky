import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import { buildDirectMessagesChannel } from '@saintrocky/realtime';
import {
  Avatar,
  Badge,
  EmptyState,
  ListItem,
  useTheme
} from '@saintrocky/ui-native';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { SocialScreenConfig } from '@/screens/SocialScreen/SocialScreen.config.js';
import { createStyles } from '@/screens/SocialScreen/SocialScreen.styles.js';

function formatThreadTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) return 'now';
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function MessagesTab({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [threads, setThreads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const ownerEmail = auth.user?.email;
  const messagesChannel = ownerEmail ? buildDirectMessagesChannel(ownerEmail) : null;

  useRealtimeChannel(messagesChannel, {
    onEvent() {
      loadThreads();
    }
  });

  const loadThreads = useCallback(async () => {
    try {
      const result = await api.messages.listThreads();
      setThreads(result.threads || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load messages.');
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  }, [loadThreads]);

  const openChat = useCallback((thread) => {
    navigation.navigate('ChatConversation', {
      counterpartyUserId: thread.counterparty?.id,
      counterpartyName: thread.counterparty?.displayName || thread.counterparty?.email,
      counterpartyEmail: thread.counterparty?.email
    });
  }, [navigation]);

  return (
    <FlatList
      data={threads}
      keyExtractor={(item) => item.conversationId}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      renderItem={({ item }) => (
        <ListItem
          title={item.counterparty?.displayName || item.counterparty?.email}
          subtitle={item.lastMessage?.body || 'No messages yet'}
          onPress={() => openChat(item)}
          showChevron
          leading={<Avatar name={item.counterparty?.displayName || item.counterparty?.email} size="md" />}
          trailing={
            <View style={styles.threadMeta}>
              <Text style={styles.threadTime}>
                {formatThreadTime(item.lastMessageAt)}
              </Text>
              {item.unreadCount > 0 ? (
                <Badge variant="primary" size="xs">{item.unreadCount}</Badge>
              ) : null}
            </View>
          }
        />
      )}
      ListEmptyComponent={
        <EmptyState
          iconName="chat"
          title={SocialScreenConfig.emptyMessagesTitle}
          message={SocialScreenConfig.emptyMessagesMessage}
        />
      }
    />
  );
}
