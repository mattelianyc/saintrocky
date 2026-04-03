import silkaMonoFontUrl from '../../../web/app/fonts/silkamono-regular.ttf?url';

const BRAND_FONT_STYLE_ID = 'saintrocky-desktop-brand-font';

export function registerDesktopBrandFont() {
  if (typeof document === 'undefined' || document.getElementById(BRAND_FONT_STYLE_ID)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = BRAND_FONT_STYLE_ID;
  styleElement.textContent = `
    @font-face {
      font-family: "SilkaMonoElectron";
      src: url("${silkaMonoFontUrl}") format("truetype");
      font-display: swap;
    }

    body.sr-DesktopBody {
      --font-silka-mono: "SilkaMonoElectron";
    }
  `;

  document.head.append(styleElement);
}
