import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';

export function IconButton({
  name,
  size = 22,
  color,
  onPress,
  disabled = false,
  accessibilityLabel,
  style
}) {
  const { theme } = useTheme();
  const resolvedColor = color || theme.colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <Icon name={name} size={size} color={resolvedColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.6
  },
  disabled: {
    opacity: 0.4
  }
});
