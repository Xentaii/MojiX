import type { CSSProperties } from 'react';

export interface DemoThemePalette {
  mode: 'light' | 'dark';
  accent: string;
  bg: string;
  panel: string;
  text: string;
  muted: string;
  radius: number;
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
  const border = withAlpha(palette.text, isDark ? 0.26 : 0.08);
  const accentSoft = withAlpha(palette.accent, isDark ? 0.22 : 0.14);
  const hover = withAlpha(palette.text, isDark ? 0.1 : 0.05);
  const rootGlow = withAlpha(palette.accent, isDark ? 0.2 : 0.22);
  const toolbarBg = withAlpha(palette.panel, isDark ? 0.72 : 0.42);
  const searchBg = withAlpha(palette.panel, isDark ? 0.88 : 0.8);
  const previewBg = withAlpha(palette.panel, isDark ? 0.32 : 0.38);
  const floatingShadow = `0 18px 34px ${withAlpha(
    palette.text,
    isDark ? 0.34 : 0.16,
  )}`;
  const rootShadow = `0 18px 44px ${withAlpha(
    palette.text,
    isDark ? 0.28 : 0.12,
  )}`;

  return {
    colorScheme: palette.mode,
    '--mx-bg': withAlpha(palette.bg, isDark ? 0.94 : 0.92),
    '--mx-panel': withAlpha(palette.panel, isDark ? 0.94 : 0.94),
    '--mx-border': border,
    '--mx-text': palette.text,
    '--mx-muted': palette.muted,
    '--mx-accent': palette.accent,
    '--mx-accent-soft': accentSoft,
    '--mx-hover': hover,
    '--mx-shadow': rootShadow,
    '--mx-shadow-floating': floatingShadow,
    '--mx-radius': `${palette.radius}px`,
    '--mx-placeholder': withAlpha(palette.muted, isDark ? 0.92 : 0.88),
    '--mx-root-bg': `radial-gradient(circle at top right, ${rootGlow}, transparent 28%), linear-gradient(180deg, ${withAlpha(
      palette.panel,
      isDark ? 0.94 : 0.92,
    )}, ${withAlpha(
      palette.bg,
      isDark ? 0.98 : 0.96,
    )}), ${withAlpha(palette.bg, isDark ? 0.96 : 0.92)}`,
    '--mx-sidebar-bg': `linear-gradient(180deg, ${withAlpha(
      palette.panel,
      isDark ? 0.92 : 0.92,
    )}, ${withAlpha(palette.bg, isDark ? 0.98 : 0.98)})`,
    '--mx-toolbar-bg': toolbarBg,
    '--mx-search-bg': searchBg,
    '--mx-tone-button-bg': withAlpha(palette.panel, isDark ? 0.92 : 0.82),
    '--mx-tone-menu-bg': withAlpha(palette.panel, isDark ? 0.98 : 0.98),
    '--mx-section-header-bg': `linear-gradient(180deg, ${withAlpha(
      palette.panel,
      isDark ? 0.98 : 0.97,
    )}, ${withAlpha(palette.bg, isDark ? 0.94 : 0.88)})`,
    '--mx-preview-bg': previewBg,
    '--mx-chip-bg': withAlpha(palette.accent, isDark ? 0.16 : 0.08),
    '--mx-chip-border': withAlpha(palette.accent, isDark ? 0.3 : 0.16),
    '--mx-chip-muted-bg': withAlpha(palette.text, isDark ? 0.14 : 0.04),
  } as CSSProperties;
}
