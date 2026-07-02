import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';

import { api } from '@/api/client.js';
import { RULE_TEMPLATE_CATEGORY_LABELS } from '@saintrocky/shared';
import { Button, EmptyState, useTheme } from '@saintrocky/ui-native';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader.jsx';
import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton.jsx';
import { createStyles } from '@/screens/RulesScreen/TemplatesScreen.styles.js';

export function TemplatesScreen({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [templates, setTemplates] = useState([]);
  const [activeRules, setActiveRules] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const ownerEmail = auth.user?.email || '';

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const [templateResponse, rulesResponse] = await Promise.all([
        api.rules.listTemplates(),
        ownerEmail ? api.rules.listRules(ownerEmail) : Promise.resolve({ rules: [] })
      ]);
      const nextTemplates = templateResponse.templates || [];
      setTemplates(nextTemplates);
      setActiveRules((rulesResponse.rules || []).filter((rule) => rule.status === 'active' && rule.templateId));
      setSelectedTemplate((currentTemplate) => {
        if (!currentTemplate) {
          return null;
        }

        return nextTemplates.find((template) => template.templateId === currentTemplate.templateId) || currentTemplate;
      });
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, [ownerEmail]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const matchingExistingRule = useMemo(() => {
    if (!selectedTemplate) {
      return null;
    }

    return activeRules.find((rule) => rule.templateId === selectedTemplate.templateId) || null;
  }, [activeRules, selectedTemplate]);

  const activeTemplateIds = useMemo(
    () => new Set(activeRules.map((rule) => rule.templateId).filter(Boolean)),
    [activeRules]
  );

  const handleSelectTemplate = useCallback((template) => {
    setSelectedTemplate(template);
  }, []);

  const handleConfigChange = useCallback((fieldKey, value) => {
    setConfig((current) => ({ ...current, [fieldKey]: value }));
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    if (matchingExistingRule) {
      setConfig(
        matchingExistingRule.pendingEdit?.config ||
        matchingExistingRule.config ||
        selectedTemplate.defaultConfig ||
        {}
      );
      return;
    }

    setConfig(selectedTemplate.defaultConfig || {});
  }, [matchingExistingRule, selectedTemplate]);

  const handleCreateRule = useCallback(async () => {
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      const response = await api.rules.createFromTemplate({
        ownerEmail,
        templateId: selectedTemplate.templateId,
        config,
        problemIndex: 50
      });
      const wasMerged = Boolean(response?.merged);
      Alert.alert(
        wasMerged ? 'Existing rule updated' : 'Rule created',
        wasMerged
          ? `"${selectedTemplate.title}" was updated with your latest protection changes.`
          : `"${selectedTemplate.title}" has been added to your rules.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to create rule from template.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedTemplate, config, navigation, ownerEmail]);

  if (selectedTemplate) {
    const submitLabel = submitting
      ? (matchingExistingRule ? 'Updating…' : 'Creating…')
      : (matchingExistingRule ? 'Update existing rule' : 'Add to my rules');

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ScreenHeader kicker="CONFIGURE" title={selectedTemplate.title} />

        <Text style={styles.templateSummary}>{selectedTemplate.summary}</Text>
        <Text style={styles.categoryBadge}>
          {RULE_TEMPLATE_CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
        </Text>

        <Text style={styles.sectionKicker}>CONFIGURATION</Text>
        {selectedTemplate.inputSchema?.fields?.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={styles.fieldInput}
              value={String(config[field.key] ?? '')}
              onChangeText={(text) => handleConfigChange(field.key, text)}
              placeholder={field.label}
              placeholderTextColor={theme.shell.textMuted}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            />
          </View>
        ))}
        {matchingExistingRule ? (
          <Text style={styles.mergeHint}>
            An active rule from this template already exists. Changes that expand protection apply immediately at no
            charge.
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleCreateRule}
            disabled={submitting}
            size="lg"
          >
            {submitLabel}
          </Button>
          <View style={styles.actionSpacer} />
          <Button variant="ghost" onPress={() => setSelectedTemplate(null)}>
            Back to templates
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader kicker="LIBRARY" title="Rule templates" />

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.templateId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={loadTemplates}
              tintColor={theme.colors.accent}
            />
          }
          renderItem={({ item }) => {
            const hasExistingRule = activeTemplateIds.has(item.templateId);

            return (
            <Pressable
              style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}
              onPress={() => handleSelectTemplate(item)}
            >
              <Text style={styles.templateCategory}>
                {RULE_TEMPLATE_CATEGORY_LABELS[item.category] || item.category}
              </Text>
              <Text style={styles.templateTitle}>{item.title}</Text>
              <Text style={styles.templateDescription} numberOfLines={2}>
                {item.summary}
              </Text>
              {hasExistingRule ? <Text style={styles.activeBadge}>Active</Text> : null}
            </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState iconName="tactics" title="No templates" message="Templates will appear here." />
          }
        />
      )}
    </View>
  );
}
