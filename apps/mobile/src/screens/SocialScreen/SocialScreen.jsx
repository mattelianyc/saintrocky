import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@saintrocky/ui-native';

import { FriendsTab } from '@/screens/SocialScreen/FriendsTab.jsx';
import { MessagesTab } from '@/screens/SocialScreen/MessagesTab.jsx';
import { CampaignsTab } from '@/screens/SocialScreen/CampaignsTab.jsx';
import { createStyles } from '@/screens/SocialScreen/SocialScreen.styles.js';

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
      <View style={styles.segmentedControl}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.segment, isActive && styles.segmentActive]}
            >
              <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                {tab.label.toUpperCase()}
              </Text>
              {isActive && <View style={styles.segmentIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'friends' && <FriendsTab auth={auth} />}
      {activeTab === 'messages' && <MessagesTab auth={auth} navigation={navigation} />}
      {activeTab === 'campaigns' && <CampaignsTab auth={auth} navigation={navigation} />}
    </View>
  );
}
