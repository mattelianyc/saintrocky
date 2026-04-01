import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@saintrocky/ui-native';
import { SocialScreen } from '@/screens/SocialScreen/SocialScreen.jsx';
import { ChatScreen } from '@/screens/SocialScreen/ChatScreen.jsx';
import { CreateCampaignScreen } from '@/screens/SocialScreen/CreateCampaignScreen.jsx';
import { CustomHeader } from '@/navigation/components/CustomHeader.jsx';

const Stack = createNativeStackNavigator();

export function SocialStack({ auth }) {
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
      <Stack.Screen name="SocialOverview" options={{ title: '' }}>
        {(props) => <SocialScreen {...props} auth={auth} />}
      </Stack.Screen>
      <Stack.Screen
        name="ChatConversation"
        options={({ route }) => ({
          title: route.params?.counterpartyName?.toUpperCase() || 'CHAT'
        })}
      >
        {(props) => <ChatScreen {...props} auth={auth} />}
      </Stack.Screen>
      <Stack.Screen name="CreateCampaign" options={{ title: 'NEW CAMPAIGN' }}>
        {(props) => <CreateCampaignScreen {...props} auth={auth} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
