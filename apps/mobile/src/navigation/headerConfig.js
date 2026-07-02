export function createStackHeaderOptions(theme) {
  return {
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: {
      backgroundColor: theme.colors.background
    },
    headerTintColor: theme.colors.foreground,
    headerTitleStyle: {
      fontFamily: theme.typography.fontFamilyMono,
      fontSize: theme.typography.sizeXsmall,
      fontWeight: theme.typography.weightSemibold,
      letterSpacing: theme.typography.letterSpacingUltraWide
    },
    headerBackTitleVisible: false
  };
}
