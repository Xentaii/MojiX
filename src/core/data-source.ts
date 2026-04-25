import { DEFAULT_DATA_CACHE_NAME } from './constants';
import { createBrowserAssetCacheAdapter } from './sprite-cache';
import type {
  EmojiLocaleEmojiTranslation,
  EmojiLocaleSearchIndex,
} from './types';
import type { EmojiDataPayload } from './data';

function createPackageDataUrl(path: string) {
  return `https://cdn.jsdelivr.net/npm/mojix-picker@${__MOJIX_VERSION__}/data/${path.replace(/^\//, '')}`;
}

async function fetchJsonAsset<T>(options: {
  key: string;
  path: string;
}) {
  const url = createPackageDataUrl(options.path);
  const assetCache = createBrowserAssetCacheAdapter({
    cacheName: DEFAULT_DATA_CACHE_NAME,
  });
  const cached = await assetCache.load({ key: options.key });

  if (cached) {
    return (await cached.json()) as T;
  }

  const response = await fetch(url, {
    credentials: 'omit',
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch MojiX asset: ${response.status} ${response.statusText}`,
    );
  }

  const cachedResponse = await assetCache.save(
    { key: options.key },
    response,
  );

  return (await cachedResponse.json()) as T;
}

export function loadEmojiDataFromCdn() {
  return fetchJsonAsset<EmojiDataPayload>({
    key: 'emoji-data',
    path: 'emoji-data.json',
  });
}

export function loadEmojiLocalePackFromCdn(locale: string) {
  return fetchJsonAsset<Record<string, EmojiLocaleEmojiTranslation>>({
    key: `locale:${locale}`,
    path: `locales/${locale}.json`,
  });
}

export function loadEmojiLocaleSearchFromCdn(locale: string) {
  return fetchJsonAsset<EmojiLocaleSearchIndex>({
    key: `locale-search:${locale}`,
    path: `locales/${locale}.search.json`,
  });
}
