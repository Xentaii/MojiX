import { DEFAULT_RECENT_LIMIT } from './constants';
import type {
  EmojiRecentStore,
  EmojiSkinTone,
  RecentEmojiRecord,
} from './types';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readRecentEmoji(storageKey: string) {
  if (!canUseStorage()) {
    return [] as RecentEmojiRecord[];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecentEmojiRecord[];

    return parsed
      .filter((entry) => entry && typeof entry.id === 'string')
      .sort((left, right) => right.usedAt - left.usedAt);
  } catch {
    return [];
  }
}

export function writeRecentEmoji(storageKey: string, entries: RecentEmojiRecord[]) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    return;
  }
}

export function pushRecentEmoji(
  storageKey: string,
  entry: Pick<RecentEmojiRecord, 'id' | 'custom' | 'skinTone'>,
  limit: number = DEFAULT_RECENT_LIMIT,
) {
  const next = [...readRecentEmoji(storageKey)];
  const existingIndex = next.findIndex(
    (recent) =>
      recent.id === entry.id &&
      recent.custom === entry.custom &&
      recent.skinTone === entry.skinTone,
  );

  if (existingIndex >= 0) {
    const existing = next[existingIndex];

    if (existing) {
      next[existingIndex] = {
        id: existing.id,
        custom: existing.custom,
        skinTone: existing.skinTone,
        count: existing.count + 1,
        usedAt: Date.now(),
      };
    }
  } else {
    next.unshift({
      id: entry.id,
      custom: entry.custom,
      skinTone: entry.skinTone,
      count: 1,
      usedAt: Date.now(),
    });
  }

  const deduped = next
    .sort((left, right) => right.usedAt - left.usedAt)
    .slice(0, limit);

  writeRecentEmoji(storageKey, deduped);
  return deduped;
}

export function createLocalStorageRecentStore(
  storageKey: string,
): EmojiRecentStore {
  return {
    read() {
      return readRecentEmoji(storageKey);
    },
    push(entry, limit) {
      return pushRecentEmoji(storageKey, entry, limit);
    },
  };
}

export function readStoredSkinTone(
  storageKey: string,
  fallback: EmojiSkinTone,
) {
  if (!canUseStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(storageKey);

  switch (raw) {
    case 'default':
    case 'light':
    case 'medium-light':
    case 'medium':
    case 'medium-dark':
    case 'dark':
      return raw;
    default:
      return fallback;
  }
}

export function writeStoredSkinTone(
  storageKey: string,
  tone: EmojiSkinTone,
) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, tone);
}
