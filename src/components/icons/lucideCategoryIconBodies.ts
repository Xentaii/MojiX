import type { EmojiCategoryIconGlyph } from '../../lib/types';

export interface LucideCategoryIconDefinition {
  lucideName: string;
  body: string;
}

// Derived from official lucide-static SVG files (ISC license).
export const LUCIDE_CATEGORY_ICON_BODIES: Record<
  EmojiCategoryIconGlyph,
  LucideCategoryIconDefinition
> = {
  recent: {
    lucideName: 'history',
    body: `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
<path d="M3 3v5h5" />
<path d="M12 7v5l4 2" />`,
  },
  smileys: {
    lucideName: 'smile',
    body: `<circle cx="12" cy="12" r="10" />
<path d="M8 14s1.5 2 4 2 4-2 4-2" />
<line x1="9" x2="9.01" y1="9" y2="9" />
<line x1="15" x2="15.01" y1="9" y2="9" />`,
  },
  people: {
    lucideName: 'users',
    body: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
<path d="M16 3.128a4 4 0 0 1 0 7.744" />
<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
<circle cx="9" cy="7" r="4" />`,
  },
  animals: {
    lucideName: 'paw-print',
    body: `<circle cx="11" cy="4" r="2" />
<circle cx="18" cy="8" r="2" />
<circle cx="20" cy="16" r="2" />
<path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />`,
  },
  food: {
    lucideName: 'utensils-crossed',
    body: `<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
<path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
<path d="m2.1 21.8 6.4-6.3" />
<path d="m19 5-7 7" />`,
  },
  activities: {
    lucideName: 'dumbbell',
    body: `<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />
<path d="m2.5 21.5 1.4-1.4" />
<path d="m20.1 3.9 1.4-1.4" />
<path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />
<path d="m9.6 14.4 4.8-4.8" />`,
  },
  travel: {
    lucideName: 'plane',
    body: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />`,
  },
  objects: {
    lucideName: 'lightbulb',
    body: `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
<path d="M9 18h6" />
<path d="M10 22h4" />`,
  },
  symbols: {
    lucideName: 'shapes',
    body: `<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
<rect x="3" y="14" width="7" height="7" rx="1" />
<circle cx="17.5" cy="17.5" r="3.5" />`,
  },
  flags: {
    lucideName: 'flag',
    body: `<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />`,
  },
  custom: {
    lucideName: 'sparkles',
    body: `<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
<path d="M20 2v4" />
<path d="M22 4h-4" />
<circle cx="4" cy="20" r="2" />`,
  },
  sparkles: {
    lucideName: 'sparkles',
    body: `<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
<path d="M20 2v4" />
<path d="M22 4h-4" />
<circle cx="4" cy="20" r="2" />`,
  },
  star: {
    lucideName: 'star',
    body: `<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />`,
  },
  heart: {
    lucideName: 'heart',
    body: `<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />`,
  },
  bolt: {
    lucideName: 'zap',
    body: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />`,
  },
  music: {
    lucideName: 'music-2',
    body: `<circle cx="8" cy="18" r="4" />
<path d="M12 18V2l7 4" />`,
  },
  gamepad: {
    lucideName: 'gamepad-2',
    body: `<line x1="6" x2="10" y1="11" y2="11" />
<line x1="8" x2="8" y1="9" y2="13" />
<line x1="15" x2="15.01" y1="12" y2="12" />
<line x1="18" x2="18.01" y1="10" y2="10" />
<path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />`,
  },
  palette: {
    lucideName: 'palette',
    body: `<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />`,
  },
  code: {
    lucideName: 'code-xml',
    body: `<path d="m18 16 4-4-4-4" />
<path d="m6 8-4 4 4 4" />
<path d="m14.5 4-5 16" />`,
  },
  leaf: {
    lucideName: 'leaf',
    body: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />`,
  },
  gift: {
    lucideName: 'gift',
    body: `<path d="M12 7v14" />
<path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
<path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
<rect x="3" y="7" width="18" height="4" rx="1" />`,
  },
  rocket: {
    lucideName: 'rocket',
    body: `<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
<path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />`,
  },
};
