import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INPUT_PATH = resolve('node_modules/emoji-datasource/emoji.json');
const OUTPUT_PATH = resolve('src/core/generated/emoji-data.json');
const LOCALE_OUTPUT_PATH = resolve('src/core/generated/emoji-locales.json');
const META_OUTPUT_PATH = resolve('src/core/generated/emoji-meta.json');
const CLDR_BASE_PATH = resolve('node_modules/cldr-annotations-full/annotations');
const PACKAGE_PATH = resolve('node_modules/emoji-datasource/package.json');
const SUPPORTED_LOCALES = ['de', 'en', 'es', 'fr', 'ja', 'pt', 'ru', 'uk'];

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

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const REGIONAL_INDICATOR_LAST = 0x1f1ff;
const AVAILABILITY_BITS = {
  apple: 1,
  google: 2,
  twitter: 4,
  facebook: 8,
};
const CATEGORY_ID_ORDER = Object.values(CATEGORY_IDS);
const SKIN_TONE_ORDER = [
  'light',
  'medium-light',
  'medium',
  'medium-dark',
  'dark',
];
const EMOJI_DATA_FIELDS = [
  'id',
  'native',
  'name',
  'aliases',
  'emoticons',
  'categoryId',
  'subcategory',
  'sheetX',
  'sheetY',
  'availability',
  'skins',
];

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

function isRegionalFlagEmoji(emoji) {
  return (
    emoji.categoryId === 'flags' &&
    parseRegionalIndicatorCode(emoji.id) !== null
  );
}

function encodeAvailability(entry) {
  return (
    (entry.has_img_apple ? AVAILABILITY_BITS.apple : 0) |
    (entry.has_img_google ? AVAILABILITY_BITS.google : 0) |
    (entry.has_img_twitter ? AVAILABILITY_BITS.twitter : 0) |
    (entry.has_img_facebook ? AVAILABILITY_BITS.facebook : 0)
  );
}

function compactStringArray(values) {
  return values.length > 0 ? values : null;
}

function compactSkins(skins) {
  if (skins.length === 0) {
    return null;
  }

  return skins.map((skin) => [
    SKIN_TONE_ORDER.indexOf(skin.tone),
    skin.unified,
    skin.native,
    skin.sheetX,
    skin.sheetY,
  ]);
}

function toColumnEmojiData(records) {
  const categoryIndexes = new Map(
    CATEGORY_ID_ORDER.map((categoryId, index) => [categoryId, index]),
  );
  const subcategories = Array.from(
    new Set(records.map((emoji) => emoji.subcategory ?? '')),
  );
  const subcategoryIndexes = new Map(
    subcategories.map((subcategory, index) => [subcategory, index]),
  );

  return {
    version: 1,
    fields: EMOJI_DATA_FIELDS,
    categories: CATEGORY_ID_ORDER,
    subcategories,
    skinTones: SKIN_TONE_ORDER,
    rows: records.map((emoji) => [
      emoji.id,
      emoji.native,
      emoji.name,
      compactStringArray(emoji.aliases),
      compactStringArray(emoji.emoticons),
      categoryIndexes.get(emoji.categoryId),
      subcategoryIndexes.get(emoji.subcategory ?? ''),
      emoji.sheetX,
      emoji.sheetY,
      emoji.availability,
      compactSkins(emoji.skins),
    ]),
  };
}

function lookupAnnotation(annotations, native) {
  return (
    annotations[native] ??
    annotations[native.replace(/\uFE0F/g, '')] ??
    null
  );
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
      native: unicodeToNative(entry.unified),
      name: toSentenceCase(entry.name),
      aliases,
      emoticons,
      categoryId: CATEGORY_IDS[entry.category],
      subcategory: entry.subcategory,
      sheetX: entry.sheet_x,
      sheetY: entry.sheet_y,
      availability: encodeAvailability(entry),
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

const localeData = Object.fromEntries(
  await Promise.all(
    SUPPORTED_LOCALES.map(async (locale) => {
      const annotationPath = resolve(CLDR_BASE_PATH, locale, 'annotations.json');
      const annotationJson = JSON.parse(await readFile(annotationPath, 'utf8'));
      const annotations = annotationJson.annotations.annotations;

      const namesEntries = [];
      const keywordsEntries = [];

      for (const emoji of emojiData) {
        const annotation = lookupAnnotation(annotations, emoji.native);
        const ttsName = annotation?.tts?.[0];
        const keywords = normalizeKeywords(annotation?.default ?? []);

        if (!isRegionalFlagEmoji(emoji)) {
          namesEntries.push([
            emoji.id,
            { name: toSentenceCase(ttsName ?? emoji.name) },
          ]);
        }

        if (keywords.length > 0) {
          keywordsEntries.push([emoji.id, keywords]);
        }
      }

      return [
        locale,
        {
          names: Object.fromEntries(namesEntries),
          keywords: Object.fromEntries(keywordsEntries),
        },
      ];
    }),
  ),
);

await mkdir(resolve('src/core/generated'), { recursive: true });
await writeFile(OUTPUT_PATH, JSON.stringify(toColumnEmojiData(emojiData)));
await writeFile(
  LOCALE_OUTPUT_PATH,
  JSON.stringify(
    Object.fromEntries(
      Object.entries(localeData).map(([code, pack]) => [code, pack.names]),
    ),
  ),
);
await writeFile(META_OUTPUT_PATH, JSON.stringify(emojiMeta));

for (const [locale, pack] of Object.entries(localeData)) {
  const perLocalePath = resolve(`src/core/generated/emoji-locale.${locale}.json`);
  const perLocaleSearchPath = resolve(
    `src/core/generated/emoji-locale.${locale}.search.json`,
  );

  await writeFile(perLocalePath, JSON.stringify(pack.names));
  await writeFile(perLocaleSearchPath, JSON.stringify(pack.keywords));
  console.log(`Generated '${locale}' locale pack to ${perLocalePath}`);
  console.log(
    `Generated '${locale}' search index to ${perLocaleSearchPath}`,
  );
}

console.log(`Generated ${emojiData.length} emoji records to ${OUTPUT_PATH}`);
console.log(`Generated combined locale packs to ${LOCALE_OUTPUT_PATH}`);
console.log(`Generated emoji metadata to ${META_OUTPUT_PATH}`);
