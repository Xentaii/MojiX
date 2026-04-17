import type { CSSProperties } from 'react';

export interface DemoThemePalette {
  mode: 'light' | 'dark';
  accent: string;
  bg: string;
  panel: string;
  text: string;
  muted: string;
  radius: number;
  accentMix: number;
  scrollbar: string;
}

export interface DemoThemeDefinition {
  id: string;
  name: string;
  builtin?: boolean;
  palette: DemoThemePalette;
}

export const DEMO_THEME_STORAGE_KEY = 'mojix:demo-themes';

export const BUILTIN_DEMO_THEMES: DemoThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    builtin: true,
    palette: {
      mode: 'light',
      accent: '#ee7848',
      bg: '#fffaf4',
      panel: '#fffafc',
      text: '#201813',
      muted: '#7b6e66',
      radius: 24,
      accentMix: 14,
      scrollbar: '#7b6e66',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    builtin: true,
    palette: {
      mode: 'dark',
      accent: '#ff9c66',
      bg: '#171311',
      panel: '#241d19',
      text: '#f5ede6',
      muted: '#b8a79c',
      radius: 24,
      accentMix: 22,
      scrollbar: '#5a4d44',
    },
  },
];

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const safe =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  const red = Number.parseInt(safe.slice(0, 2), 16);
  const green = Number.parseInt(safe.slice(2, 4), 16);
  const blue = Number.parseInt(safe.slice(4, 6), 16);

  return { red, green, blue };
}

function withAlpha(hex: string, alpha: number) {
  const { red, green, blue } = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function cloneDemoThemePalette(
  palette: DemoThemePalette,
): DemoThemePalette {
  return { ...palette };
}

export function isCustomDemoTheme(themeId: string) {
  return themeId.startsWith('custom:');
}

export function createCustomDemoThemeId(name: string) {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'theme';

  return `custom:${slug}-${Date.now().toString(36)}`;
}

export function createPickerThemeStyle(
  palette: DemoThemePalette,
): CSSProperties {
  const isDark = palette.mode === 'dark';
  const mix = palette.accentMix ?? (isDark ? 22 : 14);
  const border = withAlpha(palette.text, isDark ? 0.26 : 0.08);
  const accentSoft = withAlpha(palette.accent, mix / 100);
  const hover = withAlpha(palette.text, isDark ? 0.1 : 0.05);
  const toolbarBg = withAlpha(palette.panel, isDark ? 0.72 : 0.54);
  const searchBg = withAlpha(palette.panel, isDark ? 0.88 : 0.8);
  const previewBg = withAlpha(palette.panel, isDark ? 0.32 : 0.5);
  const shadowColor = isDark ? '#000000' : palette.text;
  const floatingShadow = `0 18px 34px ${withAlpha(
    shadowColor,
    isDark ? 0.5 : 0.16,
  )}`;
  const rootShadow = `0 18px 44px ${withAlpha(
    shadowColor,
    isDark ? 0.4 : 0.12,
  )}`;

  return {
    colorScheme: palette.mode,
    '--mx-bg': withAlpha(palette.bg, isDark ? 0.94 : 0.92),
    '--mx-panel': withAlpha(palette.panel, isDark ? 0.94 : 0.94),
    '--mx-border': border,
    '--mx-text': palette.text,
    '--mx-muted': palette.muted,
    '--mx-accent': palette.accent,
    '--mx-accent-soft': `color-mix(in srgb, ${palette.accent} ${mix}%, transparent)`,
    '--mx-hover': hover,
    '--mx-shadow': rootShadow,
    '--mx-shadow-floating': floatingShadow,
    '--mx-radius': `${palette.radius}px`,
    '--mx-placeholder': withAlpha(palette.muted, isDark ? 0.92 : 0.88),
    '--mx-root-bg': withAlpha(palette.bg, isDark ? 0.96 : 0.92),
    '--mx-sidebar-bg': withAlpha(palette.panel, isDark ? 0.92 : 0.95),
    '--mx-toolbar-bg': toolbarBg,
    '--mx-search-bg': searchBg,
    '--mx-tone-button-bg': withAlpha(palette.panel, isDark ? 0.92 : 0.82),
    '--mx-tone-menu-bg': withAlpha(palette.panel, isDark ? 0.98 : 0.98),
    '--mx-section-header-bg': isDark
      ? `color-mix(in srgb, ${palette.panel} 80%, ${palette.text} 6%)`
      : withAlpha(palette.panel, 0.94),
    '--mx-preview-bg': previewBg,
    '--mx-emoji-hover': `color-mix(in srgb, ${palette.accent} ${Math.round(mix * 0.5)}%, transparent)`,
    '--mx-category-hover': `color-mix(in srgb, ${palette.accent} ${mix}%, transparent)`,
    '--mx-category-active-bg': `color-mix(in srgb, ${palette.accent} ${mix}%, transparent)`,
    '--mx-chip-bg': withAlpha(palette.accent, Math.max(mix * 0.6, 6) / 100),
    '--mx-chip-border': withAlpha(palette.accent, Math.max(mix * 1.1, 12) / 100),
    '--mx-chip-muted-bg': withAlpha(palette.text, isDark ? 0.14 : 0.04),
    '--mx-scrollbar-thumb': palette.scrollbar,
    '--mx-scrollbar-thumb-hover': `color-mix(in srgb, ${palette.scrollbar} 82%, ${palette.text} 18%)`,
  } as CSSProperties;
}
