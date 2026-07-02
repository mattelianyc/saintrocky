import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@saintrocky/ui-native';
import { HomeScreen } from '@/screens/HomeScreen/HomeScreen.jsx';
import { TradesScreen } from '@/screens/TradesScreen/TradesScreen.jsx';
import { CustomHeader } from '@/navigation/components/CustomHeader.jsx';

const Stack = createNativeStackNavigator();

export function HomeStack({ auth }) {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        header: ({ navigation, route, options, back }) => (
          <CustomHeader
            centerTitle={options.headerCenterTitle}
            centerSubtitle={options.headerCenterSubtitle}
            canGoBack={!!back}
          />
        )
      }}
    >
      <Stack.Screen name="HomeOverview" options={{ title: '' }}>
        {(props) => <HomeScreen {...props} auth={auth} />}
      </Stack.Screen>
      <Stack.Screen
        name="Trades"
        options={{
          title: 'TRADE HISTORY',
          headerCenterTitle: 'Trade history',
          headerCenterSubtitle: 'On-chain'
        }}
      >
        {(props) => <TradesScreen {...props} auth={auth} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
