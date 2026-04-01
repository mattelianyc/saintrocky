import { Dimensions, StyleSheet } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#060a09'
    },
    backgroundImage: {
      position: 'absolute',
      width: '100%',
      height: SCREEN_HEIGHT * 0.5,
      top: 0,
      opacity: 0.25
    },
    backgroundOverlay: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(6,10,9,0.5)'
    },
    keyboardView: {
      flex: 1
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.large
    },
    topSection: {
      position: 'absolute',
      top: 0,
      left: 0,
      paddingLeft: spacing.large,
      paddingTop: spacing.large
    },
    navLogo: {
      width: 28,
      height: 28,
      opacity: 0.6
    },
    brandArea: {
      alignItems: 'center',
      marginBottom: spacing.xlarge
    },
    heading: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXlarge,
      fontWeight: typography.weightBlack,
      color: '#f5faf7',
      letterSpacing: typography.letterSpacingTight,
      textAlign: 'center'
    },
    summary: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      letterSpacing: typography.letterSpacingWide,
      color: 'rgba(245, 250, 247, 0.45)',
      textAlign: 'center',
      marginTop: spacing.xsmall,
      textTransform: 'uppercase'
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
      marginTop: spacing.xlarge
    },
    switchLink: {
      paddingVertical: spacing.xsmall,
      paddingHorizontal: spacing.small
    },
    switchLinkText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingWide,
      color: theme.colors.accent
    }
  });
}
