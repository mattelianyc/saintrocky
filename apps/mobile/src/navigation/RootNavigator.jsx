import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@saintrocky/icons';

import { useTheme } from '@saintrocky/ui-native';
import { saintRockyBranding } from '@saintrocky/branding';

import { LoginScreen } from '@/screens/LoginScreen/LoginScreen.jsx';
import { HomeScreen } from '@/screens/HomeScreen/HomeScreen.jsx';
import { RulesScreen } from '@/screens/RulesScreen/RulesScreen.jsx';
import { RuleDetailScreen } from '@/screens/RulesScreen/RuleDetailScreen.jsx';
import { SocialScreen } from '@/screens/SocialScreen/SocialScreen.jsx';
import { ChatScreen } from '@/screens/SocialScreen/ChatScreen.jsx';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen/LeaderboardScreen.jsx';
import { ProfileScreen } from '@/screens/ProfileScreen/ProfileScreen.jsx';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home',
  Rules: 'tactics',
  Social: 'users',
  Leaderboard: 'trophy',
  Profile: 'user'
};

function AuthenticatedTabs({ auth }) {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.foreground,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'home';
          return <Icon name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ title: saintRockyBranding.shortProductName }}
      >
        {(props) => <HomeScreen {...props} auth={auth} />}
      </Tab.Screen>

      <Tab.Screen name="Rules" options={{ title: 'Rules' }}>
        {(props) => <RulesScreen {...props} auth={auth} />}
      </Tab.Screen>

      <Tab.Screen name="Social" options={{ title: 'Social' }}>
        {(props) => <SocialScreen {...props} auth={auth} />}
      </Tab.Screen>

      <Tab.Screen name="Leaderboard" options={{ title: 'Leaderboard' }}>
        {(props) => <LeaderboardScreen {...props} auth={auth} />}
      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {(props) => <ProfileScreen {...props} auth={auth} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function RootNavigator({ auth, navigationRef }) {
  const isAuthed = Boolean(auth.user);
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.foreground
      }}
    >
      {isAuthed ? (
        <>
          <Stack.Screen name="Main">
            {() => <AuthenticatedTabs auth={auth} />}
          </Stack.Screen>

          <Stack.Screen
            name="RuleDetail"
            options={{
              headerShown: true,
              title: 'Rule Details',
              presentation: 'card'
            }}
            component={RuleDetailScreen}
          />

          <Stack.Screen
            name="ChatConversation"
            options={({ route }) => ({
              headerShown: true,
              title: route.params?.counterpartyName || 'Chat',
              presentation: 'card'
            })}
          >
            {(props) => <ChatScreen {...props} auth={auth} />}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen
          name="Login"
          options={{ headerShown: true, title: 'Sign in' }}
        >
          {(props) => <LoginScreen {...props} auth={auth} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
