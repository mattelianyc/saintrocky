import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@saintrocky/ui-native';
import { ProfileScreen } from '@/screens/ProfileScreen/ProfileScreen.jsx';
import { CustomHeader } from '@/navigation/components/CustomHeader.jsx';

const Stack = createNativeStackNavigator();

export function ProfileStack({ auth }) {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        header: ({ navigation, options, back }) => (
          <CustomHeader
            centerTitle={options.headerCenterTitle}
            centerSubtitle={options.headerCenterSubtitle}
            canGoBack={!!back}
          />
        )
      }}
    >
      <Stack.Screen
        name="ProfileOverview"
        options={{
          title: '',
          headerCenterTitle: 'Profile',
          headerCenterSubtitle: 'Account'
        }}
      >
        {(props) => <ProfileScreen {...props} auth={auth} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
