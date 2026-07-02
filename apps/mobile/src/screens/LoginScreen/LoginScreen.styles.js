import { Dimensions, StyleSheet } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#060a09'
    },
    videoHalf: {
      position: 'relative',
      height: SCREEN_HEIGHT * 0.5,
      width: '100%',
      justifyContent: 'flex-start',
      backgroundColor: '#000',
      overflow: 'hidden'
    },
    backgroundImage: {
      position: 'absolute',
      width: '100%',
      height: SCREEN_HEIGHT * 0.5,
      top: 0,
      left: 0,
      backgroundColor: '#000'
    },
    backgroundOverlay: {
      position: 'absolute',
      width: '100%',
      height: SCREEN_HEIGHT * 0.5,
      backgroundColor: 'rgba(6,10,9,0.4)'
    },
    brandOverlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.large
    },
    keyboardView: {
      flex: 1
    },
    formSheetFrame: {
      flex: 1,
      zIndex: 2
    },
    formSheet: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden'
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.large,
      paddingTop: spacing.large,
      paddingBottom: spacing.large,
      justifyContent: 'space-between'
    },
    formArea: {
      gap: spacing.small
    },
    submitArea: {
      marginTop: spacing.medium
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xlarge,
      gap: spacing.xsmall
    },
    themeToggle: {
      paddingVertical: spacing.xxsmall,
      paddingHorizontal: spacing.xsmall
    },
    themeToggleText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: 'rgba(245, 250, 247, 0.35)'
    },
    footerDivider: {
      color: 'rgba(245, 250, 247, 0.2)',
      fontSize: typography.sizeXsmall
    },
    footerVersion: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingUltraWide,
      color: 'rgba(245, 250, 247, 0.2)'
    }
  });
}
