import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';

import { api } from '@/api/client.js';
import { MAX_CAMPAIGN_RULES } from '@saintrocky/shared';
import { Button, EmptyState, useTheme } from '@saintrocky/ui-native';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader.jsx';
import { createStyles } from '@/screens/SocialScreen/CreateCampaignScreen.styles.js';

export function CreateCampaignScreen({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [rules, setRules] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [friendsResult, rulesResult] = await Promise.all([
          api.friends.list(),
          api.rules.listRules(auth.user?.email)
        ]);
        const acceptedFriends = (friendsResult.friendships || [])
          .filter((f) => f.status === 'accepted');
        setFriends(acceptedFriends);
        setRules((rulesResult.rules || []).filter((r) => r.status === 'active'));
      } catch (error) {
        Alert.alert('Error', error?.message || 'Failed to load data.');
      }
    }
    loadData();
  }, [auth.user?.email]);

  const toggleFriend = useCallback((friendshipId) => {
    setSelectedFriends((current) =>
      current.includes(friendshipId)
        ? current.filter((id) => id !== friendshipId)
        : [...current, friendshipId]
    );
  }, []);

  const toggleRule = useCallback((ruleId) => {
    setSelectedRules((current) => {
      if (current.includes(ruleId)) {
        return current.filter((id) => id !== ruleId);
      }
      if (current.length >= MAX_CAMPAIGN_RULES) {
        Alert.alert('Limit reached', `You can attach up to ${MAX_CAMPAIGN_RULES} rules.`);
        return current;
      }
      return [...current, ruleId];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a campaign title.');
      return;
    }
    setSubmitting(true);
    try {
      await api.campaigns.create({
        title: title.trim(),
        description: description.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        inviteFriendshipIds: selectedFriends,
        ruleIds: selectedRules
      });
      Alert.alert('Campaign created', 'Your campaign has been created.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  }, [title, description, startDate, endDate, selectedFriends, selectedRules, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader kicker="NEW" title="Create campaign" />

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.fieldInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Campaign name"
            placeholderTextColor={theme.shell.textMuted}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            style={[styles.fieldInput, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this campaign about?"
            placeholderTextColor={theme.shell.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.fieldLabel}>START (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2025-01-01"
              placeholderTextColor={theme.shell.textMuted}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.fieldLabel}>END (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2025-12-31"
              placeholderTextColor={theme.shell.textMuted}
            />
          </View>
        </View>

        {friends.length > 0 && (
          <>
            <Text style={styles.sectionKicker}>
              INVITE FRIENDS ({selectedFriends.length})
            </Text>
            {friends.map((friend) => {
              const isSelected = selectedFriends.includes(friend.friendshipId);
              return (
                <Pressable
                  key={friend.friendshipId}
                  style={[styles.selectableRow, isSelected && styles.selectableRowActive]}
                  onPress={() => toggleFriend(friend.friendshipId)}
                >
                  <Text style={styles.selectableName}>
                    {friend.counterpartyDisplayName || friend.counterpartyEmail}
                  </Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]} />
                </Pressable>
              );
            })}
          </>
        )}

        {rules.length > 0 && (
          <>
            <Text style={styles.sectionKicker}>
              ATTACH RULES ({selectedRules.length}/{MAX_CAMPAIGN_RULES})
            </Text>
            {rules.map((rule) => {
              const isSelected = selectedRules.includes(rule.ruleId);
              return (
                <Pressable
                  key={rule.ruleId}
                  style={[styles.selectableRow, isSelected && styles.selectableRowActive]}
                  onPress={() => toggleRule(rule.ruleId)}
                >
                  <Text style={styles.selectableName}>
                    {rule.title || rule.summary || 'Rule'}
                  </Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]} />
                </Pressable>
              );
            })}
          </>
        )}

        <View style={styles.submitSection}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={submitting || !title.trim()}
          >
            {submitting ? 'Creating…' : 'Create campaign'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
