import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useTheme } from '@saintrocky/ui-native';
import { saintRockyBranding } from '@saintrocky/branding';

import { LoginScreen } from '@/screens/LoginScreen/LoginScreen.jsx';
import { HomeScreen } from '@/screens/HomeScreen/HomeScreen.jsx';
import { RulesScreen } from '@/screens/RulesScreen/RulesScreen.jsx';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen/LeaderboardScreen.jsx';
import { WalletScreen } from '@/screens/WalletScreen/WalletScreen.jsx';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthenticatedTabs({ auth }) {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.foreground,
        tabBarStyle: { backgroundColor: theme.colors.card },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.mutedForeground
      }}
    >
      <Tab.Screen name="Home" options={{ title: saintRockyBranding.shortProductName }}>
        {(props) => <HomeScreen {...props} auth={auth} />}
      </Tab.Screen>
      <Tab.Screen name="Rules" options={{ title: 'Rules' }}>
        {(props) => <RulesScreen {...props} auth={auth} />}
      </Tab.Screen>
      <Tab.Screen name="Wallet" options={{ title: 'Escrow' }}>
        {() => <WalletScreen />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard" options={{ title: 'Leaderboard' }}>
        {() => <LeaderboardScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function RootNavigator({ auth }) {
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
        <Stack.Screen name="Main">
          {() => <AuthenticatedTabs auth={auth} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login" options={{ headerShown: true, title: 'Sign in' }}>
          {(props) => <LoginScreen {...props} auth={auth} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
