import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '@saintrocky/ui-native';
import { AuthStack } from '@/navigation/navigators/AuthStack.jsx';
import { MainTabs } from '@/navigation/navigators/MainTabs.jsx';
import { DrawerContent } from '@/navigation/components/DrawerContent.jsx';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function AuthenticatedDrawer({ auth }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: 280
        },
        overlayColor: 'rgba(0,0,0,0.5)',
        swipeEdgeWidth: 60
      }}
      drawerContent={(props) => (
        <DrawerContent {...props} auth={auth} toggleTheme={toggleTheme} />
      )}
    >
      <Drawer.Screen name="MainTabs">
        {() => <MainTabs auth={auth} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

export function RootNavigator({ auth }) {
  const isAuthed = Boolean(auth.user);
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      {isAuthed ? (
        <Stack.Screen name="Main">
          {() => <AuthenticatedDrawer auth={auth} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Auth">
          {() => <AuthStack auth={auth} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
