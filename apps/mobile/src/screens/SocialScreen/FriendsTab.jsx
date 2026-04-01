import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import { buildFriendsChannel } from '@saintrocky/realtime';
import { FRIENDSHIP_STATUSES } from '@saintrocky/shared';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ListItem,
  TextField,
  useTheme
} from '@saintrocky/ui-native';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { SocialScreenConfig } from '@/screens/SocialScreen/SocialScreen.config.js';
import { createStyles } from '@/screens/SocialScreen/SocialScreen.styles.js';

export function FriendsTab({ auth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [friends, setFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const ownerEmail = auth.user?.email;
  const friendsChannel = ownerEmail ? buildFriendsChannel(ownerEmail) : null;

  useRealtimeChannel(friendsChannel, {
    onEvent() {
      loadFriends();
    }
  });

  const loadFriends = useCallback(async () => {
    try {
      const result = await api.friends.list();
      setFriends(result.friendships || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load friends.');
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  }, [loadFriends]);

  const sendRequest = useCallback(async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      await api.friends.request({ targetEmail: addEmail.trim() });
      setAddEmail('');
      await loadFriends();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not send request.');
    } finally {
      setAdding(false);
    }
  }, [addEmail, loadFriends]);

  const respondToRequest = useCallback(async (friendshipId, action) => {
    try {
      await api.friends.respond(friendshipId, action);
      await loadFriends();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not respond to request.');
    }
  }, [loadFriends]);

  const accepted = friends.filter((f) => f.status === 'accepted');
  const pending = friends.filter((f) => f.status === 'pending');

  return (
    <FlatList
      data={accepted}
      keyExtractor={(item) => item.friendshipId}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      ListHeaderComponent={
        <View>
          <View style={styles.addSection}>
            <Text style={styles.addLabel}>ADD A FRIEND</Text>
            <View style={styles.addRow}>
              <View style={styles.addInput}>
                <TextField
                  placeholder="Email address"
                  value={addEmail}
                  onChangeText={setAddEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <Button
                variant="primary"
                size="sm"
                onPress={sendRequest}
                disabled={adding || !addEmail.trim()}
              >
                {adding ? '…' : 'Send'}
              </Button>
            </View>
          </View>

          {pending.length > 0 && (
            <>
              <Text style={styles.sectionKicker}>PENDING ({pending.length})</Text>
              {pending.map((friendship) => (
                <ListItem
                  key={friendship.friendshipId}
                  title={friendship.counterpartyDisplayName || friendship.counterpartyEmail}
                  subtitle="Pending request"
                  leading={<Avatar name={friendship.counterpartyDisplayName} size="sm" />}
                  trailing={
                    friendship.isIncoming ? (
                      <View style={styles.pendingActions}>
                        <Button
                          size="sm"
                          variant="primary"
                          onPress={() => respondToRequest(friendship.friendshipId, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => respondToRequest(friendship.friendshipId, 'decline')}
                        >
                          Decline
                        </Button>
                      </View>
                    ) : (
                      <Badge variant="muted">Sent</Badge>
                    )
                  }
                />
              ))}
            </>
          )}

          <Text style={styles.sectionKicker}>FRIENDS ({accepted.length})</Text>
        </View>
      }
      renderItem={({ item }) => (
        <ListItem
          title={item.counterpartyDisplayName || item.counterpartyEmail}
          subtitle={item.counterpartyEmail}
          leading={<Avatar name={item.counterpartyDisplayName} size="sm" />}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          iconName="users"
          title={SocialScreenConfig.emptyFriendsTitle}
          message={SocialScreenConfig.emptyFriendsMessage}
        />
      }
    />
  );
}
