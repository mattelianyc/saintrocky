import { useEffect, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DateTime } from 'luxon';

import { analytics } from '@/analytics/client.js';
import { HomeScreenConfig } from '@/screens/HomeScreen/HomeScreen.config.js';
import { createStyles } from '@/screens/HomeScreen/HomeScreen.styles.js';
import { AnalyticsEvents, trackEvent } from '@saintrocky/analytics';
import { alertFeed } from '@saintrocky/alerts';
import { saintRockyBranding } from '@saintrocky/branding';
import { networkPolicies } from '@saintrocky/network-policies';
import { Button, Card, useTheme } from '@saintrocky/ui-native';
import { workflowTemplates } from '@saintrocky/workflows';

export function HomeScreen({ auth }) {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const now = DateTime.now().toLocaleString(DateTime.DATETIME_MED);

  useEffect(() => {
    trackEvent(analytics, AnalyticsEvents.PageViewed, { page: 'home', platform: 'mobile' });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{HomeScreenConfig.heading}</Text>
      <Text style={styles.muted}>{saintRockyBranding.mobile.summary}</Text>
      <Text style={styles.timestamp}>It’s {now}.</Text>

      <Card>
        <Text style={styles.statusHeading}>Signed in</Text>
        <Text style={styles.statusMeta}>
          {auth.user?.email || '—'} ({auth.user?.role || 'unknown'})
        </Text>

        <Button onPress={auth.logout} leadingIconName="logout">
          Logout
        </Button>

        <View style={styles.themeToggleRow}>
          <Text style={styles.themeToggleLabel}>Theme</Text>
          <TouchableOpacity
            style={styles.themeToggleButton}
            onPress={toggleTheme}
            accessibilityRole="button"
          >
            <Text style={styles.themeToggleButtonText}>
              {theme.mode === 'dark' ? 'Light mode' : 'Dark mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionHeading}>Recent alert</Text>
        <Text style={styles.sectionTitle}>{alertFeed[0].title}</Text>
        <Text style={styles.sectionSummary}>{alertFeed[0].summary}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionHeading}>Workflow</Text>
        <Text style={styles.sectionTitle}>{workflowTemplates[0].title}</Text>
        <Text style={styles.sectionSummary}>{workflowTemplates[0].summary}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionHeading}>Policy</Text>
        <Text style={styles.sectionTitle}>{networkPolicies[0].title}</Text>
        <Text style={styles.sectionSummary}>{networkPolicies[0].summary}</Text>
      </Card>
    </View>
  );
}


