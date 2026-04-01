import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    segmentedControl: {
      flexDirection: 'row',
      marginHorizontal: spacing.medium,
      marginBottom: spacing.small
    },
    segment: {
      flex: 1,
      paddingVertical: spacing.xsmall,
      alignItems: 'center'
    },
    segmentActive: {},
    segmentLabel: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightMedium,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase'
    },
    segmentLabelActive: {
      color: theme.colors.accent,
      fontWeight: typography.weightBold
    },
    segmentIndicator: {
      width: 20,
      height: 2,
      backgroundColor: theme.colors.accent,
      marginTop: 6
    },
    listContent: {
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.xxlarge
    },
    addSection: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    addLabel: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.xsmall
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xsmall
    },
    addInput: {
      flex: 1
    },
    pendingActions: {
      flexDirection: 'row',
      gap: spacing.xxsmall
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
    threadMeta: {
      alignItems: 'flex-end',
      gap: 4
    },
    threadTime: {
      fontFamily: typography.fontFamilyMono,
      color: theme.shell.textMuted,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingWide
    },
    campaignRow: {
      paddingVertical: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    campaignHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xxsmall
    },
    campaignTitle: {
      color: theme.colors.foreground,
      fontSize: typography.sizeBase,
      fontWeight: typography.weightSemibold,
      flex: 1,
      marginRight: spacing.xsmall
    },
    campaignDescription: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeSmall,
      lineHeight: 18,
      marginBottom: spacing.xsmall
    },
    campaignMeta: {
      flexDirection: 'row',
      gap: spacing.medium
    },
    campaignMetaText: {
      fontFamily: typography.fontFamilyMono,
      color: theme.shell.textMuted,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingWide,
      textTransform: 'uppercase'
    },
    campaignActions: {
      flexDirection: 'row',
      gap: spacing.xsmall,
      marginTop: spacing.small
    }
  });
}
