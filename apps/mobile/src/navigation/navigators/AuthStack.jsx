import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@saintrocky/ui-native';
import { LoginScreen } from '@/screens/LoginScreen/LoginScreen.jsx';
import { RegisterScreen } from '@/screens/RegisterScreen/RegisterScreen.jsx';

const Stack = createNativeStackNavigator();

export function AuthStack({ auth }) {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} auth={auth} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => <RegisterScreen {...props} auth={auth} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
