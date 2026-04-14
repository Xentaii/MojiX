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

const sharedSpriteSheetAssets = new Map<
  string,
  Pick<EmojiSpriteSheetCachedAsset, 'url'>
>();
const pendingSpriteSheetWarmups = new Map<
  string,
  Promise<EmojiSpriteSheetCachedAsset>
>();

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

function getSharedSpriteSheetAsset(key: string) {
  const asset = sharedSpriteSheetAssets.get(key);

  if (!asset) {
    return null;
  }

  return {
    url: asset.url,
    cached: true,
  } satisfies EmojiSpriteSheetCachedAsset;
}

function storeSharedSpriteSheetAsset(
  key: string,
  asset: EmojiSpriteSheetCachedAsset,
) {
  if (!asset.cached) {
    return asset;
  }

  const existingAsset = getSharedSpriteSheetAsset(key);

  if (existingAsset) {
    if (existingAsset.url !== asset.url) {
      asset.release?.();
    }

    return existingAsset;
  }

  sharedSpriteSheetAssets.set(key, {
    url: asset.url,
  });

  return {
    url: asset.url,
    cached: true,
  } satisfies EmojiSpriteSheetCachedAsset;
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

export function peekWarmedEmojiSpriteSheetUrl(
  spriteSheet?: EmojiSpriteSheetConfig,
) {
  const request = createSpriteSheetCacheRequest(spriteSheet);

  return sharedSpriteSheetAssets.get(request.key)?.url ?? null;
}

export async function warmEmojiSpriteSheet(
  spriteSheet?: EmojiSpriteSheetConfig,
): Promise<EmojiSpriteSheetCachedAsset> {
  const resolved = resolveSpriteSheetConfig(spriteSheet);
  const request = createSpriteSheetCacheRequest(resolved);
  const adapter = getSpriteSheetCacheAdapter(resolved);
  const sharedAsset = getSharedSpriteSheetAsset(request.key);

  if (sharedAsset) {
    return sharedAsset;
  }

  if (!adapter || !isRemoteUrl(request.url)) {
    return {
      url: request.url,
      cached: false,
    };
  }

  const pendingWarmup = pendingSpriteSheetWarmups.get(request.key);

  if (pendingWarmup) {
    return pendingWarmup;
  }

  const warmupPromise = (async () => {
    const cached = await adapter.load(request);

    if (cached) {
      return storeSharedSpriteSheetAsset(request.key, cached);
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

    return storeSharedSpriteSheetAsset(
      request.key,
      await adapter.save(request, response),
    );
  })();

  pendingSpriteSheetWarmups.set(request.key, warmupPromise);

  try {
    return await warmupPromise;
  } finally {
    pendingSpriteSheetWarmups.delete(request.key);
  }

}
