import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INPUT_PATH = resolve('node_modules/emoji-datasource/emoji.json');
const OUTPUT_PATH = resolve('src/lib/generated/emoji-data.json');
const LOCALE_OUTPUT_PATH = resolve('src/lib/generated/emoji-locales.json');
const META_OUTPUT_PATH = resolve('src/lib/generated/emoji-meta.json');
const CLDR_BASE_PATH = resolve('node_modules/cldr-annotations-full/annotations');
const PACKAGE_PATH = resolve('node_modules/emoji-datasource/package.json');
const SUPPORTED_LOCALES = ['en', 'ru'];

const CATEGORY_IDS = {
  'Smileys & Emotion': 'smileys',
  'People & Body': 'people',
  'Animals & Nature': 'animals',
  'Food & Drink': 'food',
  Activities: 'activities',
  'Travel & Places': 'travel',
  Objects: 'objects',
  Symbols: 'symbols',
  Flags: 'flags',
};

const SKIN_TONES = {
  '1F3FB': 'light',
  '1F3FC': 'medium-light',
  '1F3FD': 'medium',
  '1F3FE': 'medium-dark',
  '1F3FF': 'dark',
};

function unicodeToNative(unified) {
  return unified
    .split('-')
    .map((segment) => Number.parseInt(segment, 16))
    .filter((codePoint) => Number.isFinite(codePoint))
    .map((codePoint) => String.fromCodePoint(codePoint))
    .join('');
}

function toSentenceCase(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  const lower = value.toLocaleLowerCase();
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
}

function normalizeKeywords(keywords) {
  const seen = new Set();
  const result = [];

  for (const raw of keywords) {
    if (typeof raw !== 'string') {
      continue;
    }

    const normalized = toSentenceCase(raw.trim());

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

const FLAG_LABEL_BY_LOCALE = {
  en: 'Flag',
  ru: 'Флаг',
};

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const REGIONAL_INDICATOR_LAST = 0x1f1ff;

function parseRegionalIndicatorCode(unified) {
  const parts = unified.split('-').map((segment) => Number.parseInt(segment, 16));

  if (parts.length !== 2) {
    return null;
  }

  const [first, second] = parts;

  if (
    first < REGIONAL_INDICATOR_BASE ||
    first > REGIONAL_INDICATOR_LAST ||
    second < REGIONAL_INDICATOR_BASE ||
    second > REGIONAL_INDICATOR_LAST
  ) {
    return null;
  }

  return (
    String.fromCharCode('A'.charCodeAt(0) + (first - REGIONAL_INDICATOR_BASE)) +
    String.fromCharCode('A'.charCodeAt(0) + (second - REGIONAL_INDICATOR_BASE))
  );
}

function buildFlagNameResolver(locale) {
  const regionNames = new Intl.DisplayNames([locale, 'en'], {
    type: 'region',
    fallback: 'none',
  });
  const flagLabel = FLAG_LABEL_BY_LOCALE[locale] ?? FLAG_LABEL_BY_LOCALE.en;

  return (emoji) => {
    if (emoji.categoryId !== 'flags') {
      return null;
    }

    const regionCode = parseRegionalIndicatorCode(emoji.unified);

    if (!regionCode) {
      return null;
    }

    const regionName = regionNames.of(regionCode);

    if (!regionName) {
      return null;
    }

    return `${flagLabel}: ${regionName}`;
  };
}

const rawData = JSON.parse(await readFile(INPUT_PATH, 'utf8'));
const packageJson = JSON.parse(await readFile(PACKAGE_PATH, 'utf8'));

const emojiData = rawData
  .filter((entry) => CATEGORY_IDS[entry.category])
  .sort((left, right) => left.sort_order - right.sort_order)
  .map((entry) => {
    const aliases = Array.from(
      new Set([entry.short_name, ...(entry.short_names ?? [])].filter(Boolean)),
    );
    const emoticons = Array.from(
      new Set([entry.text, ...(entry.texts ?? [])].filter(Boolean)),
    );

    const skins = Object.entries(entry.skin_variations ?? {})
      .map(([toneHex, variation]) => {
        const tone = SKIN_TONES[toneHex];

        if (!tone) {
          return null;
        }

        return {
          tone,
          unified: variation.unified,
          native: unicodeToNative(variation.unified),
          sheetX: variation.sheet_x,
          sheetY: variation.sheet_y,
        };
      })
      .filter(Boolean);

    return {
      id: entry.unified.toLowerCase(),
      unified: entry.unified,
      native: unicodeToNative(entry.unified),
      name: toSentenceCase(entry.name),
      aliases,
      emoticons,
      categoryId: CATEGORY_IDS[entry.category],
      subcategory: entry.subcategory,
      sheetX: entry.sheet_x,
      sheetY: entry.sheet_y,
      availability: {
        apple: entry.has_img_apple,
        google: entry.has_img_google,
        twitter: entry.has_img_twitter,
        facebook: entry.has_img_facebook,
      },
      skins,
    };
  });

const sheetCoordinates = emojiData.flatMap((emoji) => [
  [emoji.sheetX, emoji.sheetY],
  ...emoji.skins.map((skin) => [skin.sheetX, skin.sheetY]),
]);

const gridSize =
  Math.max(...sheetCoordinates.flat().filter((value) => Number.isFinite(value))) + 1;

const emojiMeta = {
  version: packageJson.version,
  gridSize,
};

function lookupAnnotation(annotations, native) {
  return (
    annotations[native] ??
    annotations[native.replace(/\uFE0F/g, '')] ??
    null
  );
}

const localeData = Object.fromEntries(
  await Promise.all(
    SUPPORTED_LOCALES.map(async (locale) => {
      const annotationPath = resolve(CLDR_BASE_PATH, locale, 'annotations.json');
      const annotationJson = JSON.parse(await readFile(annotationPath, 'utf8'));
      const annotations = annotationJson.annotations.annotations;
      const resolveFlagName = buildFlagNameResolver(locale);

      const translations = Object.fromEntries(
        emojiData.map((emoji) => {
          const annotation = lookupAnnotation(annotations, emoji.native);
          const ttsName = annotation?.tts?.[0];
          const flagName = resolveFlagName(emoji);
          const resolvedName = ttsName ?? flagName ?? emoji.name;

          return [
            emoji.id,
            {
              name: toSentenceCase(resolvedName),
              keywords: normalizeKeywords(annotation?.default ?? []),
            },
          ];
        }),
      );

      return [locale, translations];
    }),
  ),
);

await mkdir(resolve('src/lib/generated'), { recursive: true });
await writeFile(OUTPUT_PATH, JSON.stringify(emojiData));
await writeFile(LOCALE_OUTPUT_PATH, JSON.stringify(localeData));
await writeFile(META_OUTPUT_PATH, JSON.stringify(emojiMeta));

console.log(`Generated ${emojiData.length} emoji records to ${OUTPUT_PATH}`);
console.log(`Generated locale packs to ${LOCALE_OUTPUT_PATH}`);
console.log(`Generated emoji metadata to ${META_OUTPUT_PATH}`);
