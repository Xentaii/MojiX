import { DEFAULT_SPRITE_CACHE_NAME } from './constants';
import {
  createSpriteSheetCacheKey,
  resolveSpriteSheetConfig,
  resolveSpriteSheetUrl,
} from './sprites';
import type {
  EmojiSpriteSheetCacheAdapter,
  EmojiSpriteSheetCachedAsset,
  EmojiSpriteSheetCacheRequest,
  EmojiSpriteSheetConfig,
} from './types';

function canUseBrowserSpriteCache() {
  return (
    typeof window !== 'undefined' &&
    typeof window.caches !== 'undefined' &&
    typeof window.fetch !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  );
}

function createBrowserCacheRequest(key: string) {
  return new Request(`https://cache.mojix.invalid/${encodeURIComponent(key)}`);
}

async function createCachedAssetFromResponse(
  response: Response,
): Promise<EmojiSpriteSheetCachedAsset> {
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  return {
    url: objectUrl,
    cached: true,
    release: () => URL.revokeObjectURL(objectUrl),
  };
}

function isRemoteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function createBrowserSpriteSheetCacheAdapter(options: {
  cacheName?: string;
} = {}): EmojiSpriteSheetCacheAdapter {
  const cacheName = options.cacheName ?? DEFAULT_SPRITE_CACHE_NAME;

  return {
    async load(request) {
      if (!canUseBrowserSpriteCache()) {
        return null;
      }

      const cache = await window.caches.open(cacheName);
      const cached = await cache.match(createBrowserCacheRequest(request.key));

      if (!cached) {
        return null;
      }

      return createCachedAssetFromResponse(cached);
    },
    async save(request, response) {
      if (!canUseBrowserSpriteCache()) {
        return {
          url: request.url,
          cached: false,
        };
      }

      const cache = await window.caches.open(cacheName);
      await cache.put(createBrowserCacheRequest(request.key), response.clone());

      return createCachedAssetFromResponse(response);
    },
  };
}

export function createSpriteSheetCacheRequest(
  spriteSheet?: EmojiSpriteSheetConfig,
): EmojiSpriteSheetCacheRequest {
  const resolved = resolveSpriteSheetConfig(spriteSheet);
  const url = resolveSpriteSheetUrl(resolved);

  return {
    key: createSpriteSheetCacheKey(resolved),
    url,
    vendor: resolved.vendor,
    sheetSize: resolved.sheetSize,
    variant: resolved.variant,
    source: resolved.source,
    version: resolved.version,
    packageName: resolved.packageName,
  };
}

function getSpriteSheetCacheAdapter(spriteSheet?: EmojiSpriteSheetConfig) {
  const resolved = resolveSpriteSheetConfig(spriteSheet);

  if (!resolved.cache.enabled) {
    return null;
  }

  if (resolved.cache.mode === 'custom') {
    return resolved.cache.adapter ?? null;
  }

  if (resolved.cache.mode === 'browser') {
    return createBrowserSpriteSheetCacheAdapter();
  }

  return null;
}

export async function warmEmojiSpriteSheet(
  spriteSheet?: EmojiSpriteSheetConfig,
): Promise<EmojiSpriteSheetCachedAsset> {
  const resolved = resolveSpriteSheetConfig(spriteSheet);
  const request = createSpriteSheetCacheRequest(resolved);
  const adapter = getSpriteSheetCacheAdapter(resolved);

  if (!adapter || !isRemoteUrl(request.url)) {
    return {
      url: request.url,
      cached: false,
    };
  }

  const cached = await adapter.load(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request.url, {
    credentials: 'omit',
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch emoji sprite sheet: ${response.status} ${response.statusText}`,
    );
  }

  return adapter.save(request, response);
}
