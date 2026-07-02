import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '@/navigation/components/CustomTabBar.jsx';
import { HomeStack } from '@/navigation/navigators/HomeStack.jsx';
import { RulesStack } from '@/navigation/navigators/RulesStack.jsx';
import { LeaderboardStack } from '@/navigation/navigators/LeaderboardStack.jsx';

const Tab = createBottomTabNavigator();

export function MainTabs({ auth }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }
      }}
    >
      <Tab.Screen name="Home">
        {() => <HomeStack auth={auth} />}
      </Tab.Screen>

      <Tab.Screen name="Rules">
        {() => <RulesStack auth={auth} />}
      </Tab.Screen>

      <Tab.Screen name="Leaderboard">
        {() => <LeaderboardStack auth={auth} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
