import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@saintrocky/ui-native';

function PulsingBlock({ width, height, style, theme }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: theme.shell?.backgroundSoft || theme.colors.inputBackground,
          borderRadius: 2,
          opacity
        },
        style
      ]}
    />
  );
}

export function LoadingSkeleton({ rows = 4 }) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.row}>
          <PulsingBlock width={8} height={8} theme={theme} style={styles.dot} />
          <View style={styles.textArea}>
            <PulsingBlock
              width={`${60 + Math.random() * 30}%`}
              height={14}
              theme={theme}
            />
            <PulsingBlock
              width={`${40 + Math.random() * 20}%`}
              height={10}
              theme={theme}
              style={styles.subline}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  dot: {
    borderRadius: 4,
    marginRight: 12
  },
  textArea: {
    flex: 1,
    gap: 6
  },
  subline: {
    marginTop: 4
  }
});
