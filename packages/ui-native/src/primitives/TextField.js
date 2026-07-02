import { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme.js';

export const TextField = forwardRef(function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  error,
  ...props
}, ref) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.shell?.textMuted || theme.colors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    field: {
      marginTop: spacing?.xsmall || 8
    },
    label: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeXsmall || 12,
      fontWeight: typography?.weightMedium || '500',
      letterSpacing: typography?.letterSpacingWide || 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing?.xxsmall || 4
    },
    input: {
      borderBottomWidth: 1,
      borderBottomColor: theme.shell?.border || theme.colors.border,
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: spacing?.xsmall || 10,
      color: theme.colors.foreground,
      fontSize: typography?.sizeBase || 15
    },
    inputError: {
      borderBottomColor: theme.colors.error
    },
    error: {
      marginTop: spacing?.xxsmall || 4,
      color: theme.colors.error,
      fontSize: typography?.sizeXsmall || 12
    }
  });
}
