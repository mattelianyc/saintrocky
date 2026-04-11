import Svg, { Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme.js';

const INLINE_DIMENSIONS = {
  viewBox: '0 0 2600 220',
  defaultHeight: 28
};

const STACKED_DIMENSIONS = {
  viewBox: '0 0 1600 500',
  defaultHeight: 56
};

export const INLINE_WORDMARK_GLYPHS = [
  { id: 'leadingDollar', char: '$', x: 40, y: 155, fontSize: 150, letterSpacing: 7.5, fillRole: 'accentStrong' },
  { id: 'letterT', char: 'T', x: 150, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterA1', char: 'A', x: 295, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterN1', char: 'N', x: 440, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterD1', char: 'D', x: 585, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterA2', char: 'A', x: 730, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterR', char: 'R', x: 875, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterD2', char: 'D', x: 1020, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'dividerSlash', char: '/', x: 1180, y: 155, fontSize: 136, letterSpacing: 4.1, fillRole: 'divider' },
  { id: 'letterD3', char: 'D', x: 1340, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterE', char: 'E', x: 1485, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterV', char: 'V', x: 1630, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterI', char: 'I', x: 1775, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterA3', char: 'A', x: 1920, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterN2', char: 'N', x: 2065, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'letterT2', char: 'T', x: 2210, y: 155, fontSize: 136, letterSpacing: 6.8, fillRole: 'body' },
  { id: 'trailingDollar', char: '$', x: 2360, y: 155, fontSize: 150, letterSpacing: 7.5, fillRole: 'mint' }
];

function resolveGlyphFill(fillRole, colors) {
  if (fillRole === 'accentStrong') return colors.leadingAccentColor;
  if (fillRole === 'mint') return colors.trailingAccentColor;
  if (fillRole === 'divider') return colors.dividerColor;
  return colors.bodyColor;
}

export function BrandWordmarkLogo({
  variant = 'inline',
  width = '100%',
  height,
  color,
  style
}) {
  const { theme } = useTheme();
  const isInlineVariant = variant === 'inline';
  const dimensions = isInlineVariant ? INLINE_DIMENSIONS : STACKED_DIMENSIONS;
  const bodyColor = color || theme.colors.foreground;
  const leadingAccentColor = theme.shell.accentStrong || '#e8b8c8';
  const trailingAccentColor = theme.colors.mint || '#63f5c8';
  const dividerColor = theme.shell.brandDivider || '#b8a27d';
  const fontFamily = theme.typography.fontFamilyMono || 'System';

  return (
    <Svg
      accessibilityLabel="Standard Deviants"
      accessible
      accessibilityRole="image"
      height={height || dimensions.defaultHeight}
      style={style}
      viewBox={dimensions.viewBox}
      width={width}
    >
      {isInlineVariant ? (
        INLINE_WORDMARK_GLYPHS.map((glyph) => (
          <SvgText
            key={glyph.id}
            fill={resolveGlyphFill(glyph.fillRole, {
              bodyColor,
              dividerColor,
              leadingAccentColor,
              trailingAccentColor
            })}
            fontFamily={fontFamily}
            fontSize={glyph.fontSize}
            fontWeight="400"
            letterSpacing={glyph.letterSpacing}
            x={glyph.x}
            y={glyph.y}
          >
            {glyph.char}
          </SvgText>
        ))
      ) : (
        <>
          <SvgText
            fill={leadingAccentColor}
            fontFamily={fontFamily}
            fontSize={160}
            fontWeight="400"
            letterSpacing={8}
            x={80}
            y={170}
          >
            $
          </SvgText>
          <SvgText
            fill={bodyColor}
            fontFamily={fontFamily}
            fontSize={140}
            fontWeight="400"
            letterSpacing={7}
            x={200}
            y={170}
          >
            TANDARD
          </SvgText>
          <SvgText
            fill={bodyColor}
            fontFamily={fontFamily}
            fontSize={140}
            fontWeight="400"
            letterSpacing={7}
            x={200}
            y={340}
          >
            DEVIANT
          </SvgText>
          <SvgText
            fill={trailingAccentColor}
            fontFamily={fontFamily}
            fontSize={160}
            fontWeight="400"
            letterSpacing={8}
            x={1400}
            y={340}
          >
            $
          </SvgText>
        </>
      )}
    </Svg>
  );
}
