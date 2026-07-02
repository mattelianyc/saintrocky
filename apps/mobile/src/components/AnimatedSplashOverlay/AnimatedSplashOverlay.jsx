import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { INLINE_WORDMARK_GLYPHS, useTheme } from '@saintrocky/ui-native';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

const VIEW_BOX = '0 0 2600 220';
const HOLD_DURATION_MS = 950;
const FLICKER_DURATION_MS = 1450;
const EXIT_STAGGER_MS = 50;
const EXIT_DURATION_MS = 360;
const OVERLAY_FADE_DURATION_MS = 260;
const EXIT_START_MS = HOLD_DURATION_MS + FLICKER_DURATION_MS;
const LAST_GLYPH_EXIT_START_MS = EXIT_START_MS + ((INLINE_WORDMARK_GLYPHS.length - 1) * EXIT_STAGGER_MS);
const OVERLAY_FADE_START_MS = LAST_GLYPH_EXIT_START_MS + EXIT_DURATION_MS;
const TOTAL_DURATION_MS = OVERLAY_FADE_START_MS + OVERLAY_FADE_DURATION_MS;

function clamp(value, min, max) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function normalizeWindow(elapsedMs, startMs, durationMs) {
  'worklet';
  return clamp((elapsedMs - startMs) / durationMs, 0, 1);
}

function resolveGlyphColor(glyph, colors) {
  if (glyph.fillRole === 'accentStrong') return colors.leadingAccentColor;
  if (glyph.fillRole === 'mint') return colors.trailingAccentColor;
  if (glyph.fillRole === 'divider') return colors.dividerColor;
  return colors.bodyColor;
}

function getFlickerOpacity(elapsedMs, offsetMs = 0) {
  'worklet';
  const flickerProgress = normalizeWindow(elapsedMs, HOLD_DURATION_MS + offsetMs, FLICKER_DURATION_MS);

  if (flickerProgress === 0 || flickerProgress === 1) {
    return 1;
  }

  if (flickerProgress < 0.08) return 0.3;
  if (flickerProgress < 0.16) return 1;
  if (flickerProgress < 0.22) return 0.55;
  if (flickerProgress < 0.3) return 1;
  if (flickerProgress < 0.42) return 0.42;
  if (flickerProgress < 0.5) return 1;
  if (flickerProgress < 0.62) return 0.7;
  if (flickerProgress < 0.72) return 0.48;
  if (flickerProgress < 0.84) return 1;
  if (flickerProgress < 0.92) return 0.82;
  return 1;
}

function AnimatedGlyph({ glyph, elapsedMs, fontFamily, colors }) {
  const glyphColor = resolveGlyphColor(glyph, colors);
  const isAccentGlyph = glyph.fillRole === 'accentStrong' || glyph.fillRole === 'mint';
  const flickerOffsetMs = glyph.fillRole === 'mint' ? 70 : 0;

  const animatedProps = useAnimatedProps(() => {
    const exitStartMs = EXIT_START_MS + (glyph.index * EXIT_STAGGER_MS);
    const exitProgress = normalizeWindow(elapsedMs.value, exitStartMs, EXIT_DURATION_MS);
    const baseOpacity = 1 - exitProgress;
    const flickerOpacity = isAccentGlyph ? getFlickerOpacity(elapsedMs.value, flickerOffsetMs) : 1;

    return {
      opacity: baseOpacity * flickerOpacity,
      y: glyph.y - (exitProgress * 76)
    };
  });

  const softGlowAnimatedProps = useAnimatedProps(() => {
    const exitStartMs = EXIT_START_MS + (glyph.index * EXIT_STAGGER_MS);
    const exitProgress = normalizeWindow(elapsedMs.value, exitStartMs, EXIT_DURATION_MS);
    const baseOpacity = 1 - exitProgress;
    const flickerOpacity = isAccentGlyph ? getFlickerOpacity(elapsedMs.value, flickerOffsetMs) : 1;

    return {
      opacity: isAccentGlyph ? baseOpacity * flickerOpacity * 0.16 : 0,
      y: glyph.y - (exitProgress * 76)
    };
  });

  const strongGlowAnimatedProps = useAnimatedProps(() => {
    const exitStartMs = EXIT_START_MS + (glyph.index * EXIT_STAGGER_MS);
    const exitProgress = normalizeWindow(elapsedMs.value, exitStartMs, EXIT_DURATION_MS);
    const baseOpacity = 1 - exitProgress;
    const flickerOpacity = isAccentGlyph ? getFlickerOpacity(elapsedMs.value, flickerOffsetMs) : 1;

    return {
      opacity: isAccentGlyph ? baseOpacity * flickerOpacity * 0.28 : 0,
      y: glyph.y - (exitProgress * 76)
    };
  });

  return (
    <>
      {isAccentGlyph ? (
        <AnimatedSvgText
          animatedProps={softGlowAnimatedProps}
          fill="none"
          fontFamily={fontFamily}
          fontSize={glyph.fontSize}
          fontWeight="400"
          letterSpacing={glyph.letterSpacing}
          stroke={glyphColor}
          strokeWidth={22}
          x={glyph.x}
          y={glyph.y}
        >
          {glyph.char}
        </AnimatedSvgText>
      ) : null}
      {isAccentGlyph ? (
        <AnimatedSvgText
          animatedProps={strongGlowAnimatedProps}
          fill="none"
          fontFamily={fontFamily}
          fontSize={glyph.fontSize}
          fontWeight="400"
          letterSpacing={glyph.letterSpacing}
          stroke={glyphColor}
          strokeWidth={10}
          x={glyph.x}
          y={glyph.y}
        >
          {glyph.char}
        </AnimatedSvgText>
      ) : null}
      <AnimatedSvgText
        animatedProps={animatedProps}
        fill={glyphColor}
        fontFamily={fontFamily}
        fontSize={glyph.fontSize}
        fontWeight="400"
        letterSpacing={glyph.letterSpacing}
        x={glyph.x}
        y={glyph.y}
      >
        {glyph.char}
      </AnimatedSvgText>
    </>
  );
}

export function AnimatedSplashOverlay({ onComplete }) {
  const { theme } = useTheme();
  const elapsedMs = useSharedValue(0);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fontFamily = theme.typography.fontFamilyMono || 'System';
  const colors = useMemo(() => ({
    bodyColor: '#f5faf7',
    dividerColor: theme.shell.brandDivider || '#d6c4a5',
    leadingAccentColor: '#e8b8c8',
    trailingAccentColor: '#63f5c8'
  }), [theme]);

  useEffect(() => {
    elapsedMs.value = 0;
    elapsedMs.value = withTiming(
      TOTAL_DURATION_MS,
      {
        duration: TOTAL_DURATION_MS,
        easing: Easing.linear
      },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );
  }, [elapsedMs, onComplete]);

  const overlayStyle = useAnimatedStyle(() => {
    const fadeProgress = normalizeWindow(elapsedMs.value, OVERLAY_FADE_START_MS, OVERLAY_FADE_DURATION_MS);

    return {
      opacity: 1 - fadeProgress
    };
  });

  return (
    <AnimatedView style={[styles.overlay, overlayStyle]}>
      <View style={styles.wordmarkFrame}>
        <Svg
          accessibilityLabel="$TANDARD / DEVIANT$ launch splash"
          accessible
          height="100%"
          style={styles.wordmark}
          viewBox={VIEW_BOX}
          width="100%"
        >
          {INLINE_WORDMARK_GLYPHS.map((glyph, index) => (
            <AnimatedGlyph
              key={glyph.id}
              colors={colors}
              elapsedMs={elapsedMs}
              fontFamily={fontFamily}
              glyph={{ ...glyph, index }}
            />
          ))}
        </Svg>
      </View>
    </AnimatedView>
  );
}

function createStyles(theme) {
  const { spacing } = theme;

  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    },
    wordmarkFrame: {
      width: '92%',
      maxWidth: 720,
      aspectRatio: 2600 / 220,
      paddingHorizontal: spacing.small,
      justifyContent: 'center'
    },
    wordmark: {
      overflow: 'visible'
    }
  });
}
