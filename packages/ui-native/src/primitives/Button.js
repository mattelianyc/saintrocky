import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';

const sizeTokens = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, iconSize: 14 },
  md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 15, iconSize: 16 },
  lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16, iconSize: 18 }
};

const variants = ['primary', 'secondary', 'outline', 'ghost', 'subtle', 'danger', 'link'];

function resolveIconColor({ variant, disabled, theme }) {
  if (disabled) return theme.colors.muted;
  if (variant === 'primary' || variant === 'danger') return theme.colors.primaryText;
  return theme.colors.foreground;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIconName,
  trailingIconName,
  disabled = false,
  children,
  ...props
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedVariant = variants.includes(variant) ? variant : 'primary';
  const resolvedSize = sizeTokens[size] ? size : 'md';
  const iconColor = resolveIconColor({ variant: resolvedVariant, disabled, theme });
  const iconSize = sizeTokens[resolvedSize].iconSize;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[resolvedVariant],
        styles[resolvedSize],
        pressed && !disabled ? styles[`${resolvedVariant}Pressed`] : null,
        disabled ? styles.disabled : null
      ]}
      {...props}
    >
      <View style={styles.content}>
        {leadingIconName ? (
          <View style={styles.iconLeading}>
            <Icon name={leadingIconName} size={iconSize} color={iconColor} />
          </View>
        ) : null}
        <Text style={[
          styles.label,
          styles[`${resolvedSize}Label`],
          styles[`${resolvedVariant}Label`]
        ]}>
          {children}
        </Text>
        {trailingIconName ? (
          <View style={styles.iconTrailing}>
            <Icon name={trailingIconName} size={iconSize} color={iconColor} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(theme) {
  const mono = theme.typography?.fontFamilyMono || 'System';

  return StyleSheet.create({
    base: {
      borderRadius: 2,
      borderWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row'
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    label: {
      fontFamily: mono,
      fontWeight: '600',
      letterSpacing: 0.6
    },
    iconLeading: {
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center'
    },
    iconTrailing: {
      marginLeft: 8,
      alignItems: 'center',
      justifyContent: 'center'
    },
    smLabel: { fontSize: sizeTokens.sm.fontSize },
    mdLabel: { fontSize: sizeTokens.md.fontSize },
    lgLabel: { fontSize: sizeTokens.lg.fontSize },
    sm: { paddingVertical: sizeTokens.sm.paddingVertical, paddingHorizontal: sizeTokens.sm.paddingHorizontal },
    md: { paddingVertical: sizeTokens.md.paddingVertical, paddingHorizontal: sizeTokens.md.paddingHorizontal },
    lg: { paddingVertical: sizeTokens.lg.paddingVertical, paddingHorizontal: sizeTokens.lg.paddingHorizontal },
    primary: { backgroundColor: theme.colors.primary },
    primaryPressed: { opacity: 0.88 },
    primaryLabel: { color: theme.colors.primaryText },
    secondary: { backgroundColor: theme.shell?.backgroundSoft || theme.colors.inputBackground },
    secondaryPressed: { opacity: 0.88 },
    secondaryLabel: { color: theme.colors.foreground },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.shell?.border || theme.colors.borderStrong },
    outlinePressed: { backgroundColor: theme.colors.inputBackground },
    outlineLabel: { color: theme.colors.foreground },
    ghost: { backgroundColor: 'transparent' },
    ghostPressed: { backgroundColor: theme.colors.inputBackground },
    ghostLabel: { color: theme.colors.foreground },
    subtle: { backgroundColor: theme.colors.inputBackground },
    subtlePressed: { opacity: 0.88 },
    subtleLabel: { color: theme.colors.foreground },
    danger: { backgroundColor: theme.colors.error },
    dangerPressed: { opacity: 0.88 },
    dangerLabel: { color: '#fff' },
    link: { backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0 },
    linkPressed: { opacity: 0.7 },
    linkLabel: { color: theme.colors.foreground, textDecorationLine: 'underline' },
    disabled: { opacity: 0.5 }
  });
}
