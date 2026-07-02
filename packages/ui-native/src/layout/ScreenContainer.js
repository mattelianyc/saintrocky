import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme.js';

export function ScreenContainer({ children, style, edges = ['top'] }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const edgePadding = {};
  if (edges.includes('top')) edgePadding.paddingTop = insets.top;
  if (edges.includes('bottom')) edgePadding.paddingBottom = insets.bottom;

  return (
    <View style={[styles.container, edgePadding, style]}>
      {children}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    }
  });
}
