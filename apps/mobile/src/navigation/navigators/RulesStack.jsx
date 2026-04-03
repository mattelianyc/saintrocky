import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@saintrocky/ui-native';
import { RulesScreen } from '@/screens/RulesScreen/RulesScreen.jsx';
import { RuleDetailScreen } from '@/screens/RulesScreen/RuleDetailScreen.jsx';
import { TemplatesScreen } from '@/screens/RulesScreen/TemplatesScreen.jsx';
import { CustomHeader } from '@/navigation/components/CustomHeader.jsx';

const Stack = createNativeStackNavigator();

export function RulesStack({ auth }) {
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
        name="RulesList"
        options={{
          title: '',
          headerCenterTitle: 'Rules',
          headerCenterSubtitle: 'Strategy'
        }}
      >
        {(props) => <RulesScreen {...props} auth={auth} />}
      </Stack.Screen>
      <Stack.Screen
        name="RuleDetail"
        options={{ title: 'RULE DETAILS' }}
        component={RuleDetailScreen}
      />
      <Stack.Screen name="Templates" options={{ title: 'TEMPLATES' }}>
        {(props) => <TemplatesScreen {...props} auth={auth} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
