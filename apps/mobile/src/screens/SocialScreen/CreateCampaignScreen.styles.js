import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      paddingBottom: spacing.jumbo || 64
    },
    formSection: {
      paddingHorizontal: spacing.medium,
      marginBottom: spacing.medium
    },
    fieldLabel: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.xxsmall
    },
    fieldInput: {
      borderBottomWidth: 1,
      borderBottomColor: theme.shell.border,
      paddingVertical: spacing.xsmall,
      fontSize: typography.sizeBase,
      color: theme.colors.foreground
    },
    multilineInput: {
      minHeight: 72,
      textAlignVertical: 'top'
    },
    dateRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.medium,
      gap: spacing.medium,
      marginBottom: spacing.medium
    },
    dateField: {
      flex: 1
    },
    sectionKicker: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.medium,
      paddingTop: spacing.large,
      paddingBottom: spacing.xsmall
    },
    selectableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    selectableRowActive: {
      backgroundColor: theme.colors.accent + '08'
    },
    selectableName: {
      flex: 1,
      fontSize: typography.sizeBase,
      color: theme.colors.foreground,
      fontWeight: typography.weightMedium
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 2,
      borderWidth: 1.5,
      borderColor: theme.shell.border,
      marginLeft: spacing.small
    },
    checkboxActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent
    },
    submitSection: {
      paddingHorizontal: spacing.medium,
      marginTop: spacing.xlarge
    }
  });
}
