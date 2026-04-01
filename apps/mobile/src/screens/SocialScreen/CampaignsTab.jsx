import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import { buildCampaignsChannel } from '@saintrocky/realtime';
import { Badge, Button, EmptyState, useTheme } from '@saintrocky/ui-native';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { SocialScreenConfig } from '@/screens/SocialScreen/SocialScreen.config.js';
import { createStyles } from '@/screens/SocialScreen/SocialScreen.styles.js';

const STATUS_VARIANT = {
  active: 'success',
  upcoming: 'primary',
  completed: 'muted',
  pending: 'warning'
};

function formatCampaignDates(startDate, endDate) {
  const start = startDate ? new Date(startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
  const end = endDate ? new Date(endDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
  if (start && end) return `${start} — ${end}`;
  return start || end || '';
}

export function CampaignsTab({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [campaigns, setCampaigns] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const ownerEmail = auth.user?.email;
  const campaignsChannel = ownerEmail ? buildCampaignsChannel(ownerEmail) : null;

  useRealtimeChannel(campaignsChannel, {
    onEvent() {
      loadCampaigns();
    }
  });

  const loadCampaigns = useCallback(async () => {
    try {
      const result = await api.campaigns.list();
      setCampaigns(result.campaigns || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load campaigns.');
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  }, [loadCampaigns]);

  const respondToCampaign = useCallback(async (campaignId, action) => {
    try {
      await api.campaigns.respond(campaignId, action);
      await loadCampaigns();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to respond.');
    }
  }, [loadCampaigns]);

  return (
    <FlatList
      data={campaigns}
      keyExtractor={(item) => item.campaignId}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      renderItem={({ item }) => (
        <View style={styles.campaignRow}>
          <View style={styles.campaignHeader}>
            <Text style={styles.campaignTitle}>{item.title || 'Campaign'}</Text>
            <Badge variant={STATUS_VARIANT[item.status] || 'default'} size="xs">
              {item.status}
            </Badge>
          </View>

          {item.description && (
            <Text style={styles.campaignDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.campaignMeta}>
            <Text style={styles.campaignMetaText}>
              {formatCampaignDates(item.startDate, item.endDate)}
            </Text>
            {item.memberCount != null && (
              <Text style={styles.campaignMetaText}>
                {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {item.membershipStatus === 'invited' && (
            <View style={styles.campaignActions}>
              <Button
                size="sm"
                variant="primary"
                onPress={() => respondToCampaign(item.campaignId, 'join')}
              >
                Join
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => respondToCampaign(item.campaignId, 'decline')}
              >
                Decline
              </Button>
            </View>
          )}
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.campaignActions}>
          <Button
            variant="primary"
            size="sm"
            leadingIconName="add"
            onPress={() => navigation?.navigate('CreateCampaign')}
          >
            New campaign
          </Button>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          iconName="calendar"
          title={SocialScreenConfig.emptyCampaignsTitle}
          message={SocialScreenConfig.emptyCampaignsMessage}
        />
      }
    />
  );
}
