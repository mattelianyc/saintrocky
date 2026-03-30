import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { buildCampaignsChannel } from '@saintrocky/realtime';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  useTheme
} from '@saintrocky/ui-native';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
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

export function CampaignsTab({ auth }) {
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
    } catch {}
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Card style={styles.campaignCard}>
          <View style={styles.campaignHeader}>
            <Text style={styles.campaignTitle}>{item.title || 'Campaign'}</Text>
            <Badge variant={STATUS_VARIANT[item.status] || 'default'} size="xs">
              {item.status}
            </Badge>
          </View>

          {item.description ? (
            <Text style={styles.campaignDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.campaignMeta}>
            <Text style={styles.campaignMetaText}>
              {formatCampaignDates(item.startDate, item.endDate)}
            </Text>
            {item.memberCount != null ? (
              <Text style={styles.campaignMetaText}>
                {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>

          {item.membershipStatus === 'invited' ? (
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
          ) : null}
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState
          iconName="calendar"
          title="No campaigns"
          message="Campaigns are shared rule challenges with friends over a fixed time window."
        />
      }
    />
  );
}
