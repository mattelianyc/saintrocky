import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@saintrocky/ui-native';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen/LeaderboardScreen.jsx';
import { CustomHeader } from '@/navigation/components/CustomHeader.jsx';

const Stack = createNativeStackNavigator();

export function LeaderboardStack({ auth }) {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        header: ({ navigation, options, back }) => (
          <CustomHeader
            title={options.title}
            canGoBack={!!back}
          />
        )
      }}
    >
      <Stack.Screen name="LeaderboardOverview" options={{ title: '' }}>
        {(props) => <LeaderboardScreen {...props} auth={auth} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
