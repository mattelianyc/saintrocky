import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      paddingBottom: spacing.xxlarge
    },
    listContent: {
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.xxlarge
    },
    templateCard: {
      paddingVertical: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    pressed: {
      opacity: 0.7
    },
    templateCategory: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      marginBottom: 4
    },
    templateTitle: {
      fontSize: typography.sizeMedium,
      fontWeight: typography.weightBold,
      color: theme.colors.foreground,
      marginBottom: 4
    },
    templateDescription: {
      fontSize: typography.sizeSmall,
      color: theme.shell.textMuted,
      lineHeight: 20
    },
    activeBadge: {
      alignSelf: 'flex-start',
      marginTop: spacing.small,
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.xxsmall,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      borderRadius: 999,
      color: theme.colors.accent,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingWide,
      textTransform: 'uppercase'
    },
    templateSummary: {
      fontSize: typography.sizeBase,
      color: theme.shell.textMuted,
      lineHeight: 22,
      paddingHorizontal: spacing.medium,
      marginBottom: spacing.small
    },
    categoryBadge: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.medium,
      marginBottom: spacing.medium
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
      paddingBottom: spacing.small
    },
    fieldGroup: {
      paddingHorizontal: spacing.medium,
      marginBottom: spacing.medium
    },
    fieldLabel: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.xxsmall
    },
    fieldInput: {
      borderBottomWidth: 1,
      borderBottomColor: theme.shell.border,
      paddingVertical: spacing.xsmall,
      fontSize: typography.sizeBase,
      color: theme.colors.foreground,
      fontFamily: typography.fontFamilyMono
    },
    mergeHint: {
      paddingHorizontal: spacing.medium,
      marginTop: spacing.small,
      color: theme.shell.textMuted,
      fontSize: typography.sizeSmall,
      lineHeight: 20
    },
    actions: {
      paddingHorizontal: spacing.medium,
      marginTop: spacing.xlarge
    },
    actionSpacer: {
      height: spacing.xsmall
    }
  });
}
