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
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await api.rules.listTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load templates.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSelectTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    setConfig(template.defaultConfig || {});
  }, []);

  const handleConfigChange = useCallback((fieldKey, value) => {
    setConfig((current) => ({ ...current, [fieldKey]: value }));
  }, []);

  const handleCreateRule = useCallback(async () => {
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      await api.rules.createFromTemplate({
        ownerEmail: auth.user?.email,
        templateId: selectedTemplate.templateId,
        config,
        problemIndex: 50
      });
      Alert.alert('Rule created', `"${selectedTemplate.title}" has been added to your rules.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to create rule from template.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedTemplate, config, auth, navigation]);

  if (selectedTemplate) {
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

        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleCreateRule}
            disabled={submitting}
            size="lg"
          >
            {submitting ? 'Creating…' : 'Add to my rules'}
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
          renderItem={({ item }) => (
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
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState iconName="tactics" title="No templates" message="Templates will appear here." />
          }
        />
      )}
    </View>
  );
}
