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
      right: 0,
      paddingHorizontal: spacing.large
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
