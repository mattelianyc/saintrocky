import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@saintrocky/ui-native';

import { FriendsTab } from '@/screens/SocialScreen/FriendsTab.jsx';
import { MessagesTab } from '@/screens/SocialScreen/MessagesTab.jsx';
import { CampaignsTab } from '@/screens/SocialScreen/CampaignsTab.jsx';

const TABS = [
  { key: 'friends', label: 'Friends' },
  { key: 'messages', label: 'Messages' },
  { key: 'campaigns', label: 'Campaigns' }
];

export function SocialScreen({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState('friends');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'friends' ? (
        <FriendsTab auth={auth} />
      ) : null}

      {activeTab === 'messages' ? (
        <MessagesTab auth={auth} navigation={navigation} />
      ) : null}

      {activeTab === 'campaigns' ? (
        <CampaignsTab auth={auth} />
      ) : null}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent'
    },
    tabActive: {
      borderBottomColor: theme.colors.accent
    },
    tabLabel: {
      color: theme.colors.muted,
      fontSize: 14,
      fontWeight: '600'
    },
    tabLabelActive: {
      color: theme.colors.accent
    }
  });
}
