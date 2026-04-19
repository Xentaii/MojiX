import {
  DEFAULT_RECENT_LIMIT,
  DEFAULT_RECENT_STORAGE_KEY,
  DEFAULT_SKIN_TONE_STORAGE_KEY,
} from './constants';
import {
  createLocalStorageRecentStore,
  pushRecentEmoji,
  readRecentEmoji,
  readStoredSkinTone,
  writeRecentEmoji,
  writeStoredSkinTone,
} from './storage';
import type {
  EmojiRecentStore,
  EmojiSkinTone,
  RecentEmojiRecord,
} from './types';

export interface EmojiRecentStoreAdapter {
  read: () => RecentEmojiRecord[];
  write: (entries: RecentEmojiRecord[]) => void;
}

export interface CreateRecentEmojiStoreOptions {
  adapter?: EmojiRecentStoreAdapter;
  storageKey?: string;
  limit?: number;
}

function sortByUsedAt(records: RecentEmojiRecord[]) {
  return [...records].sort((left, right) => right.usedAt - left.usedAt);
}

function createMemoryAdapter(
  initial: RecentEmojiRecord[] = [],
): EmojiRecentStoreAdapter {
  let state = [...initial];

  return {
    read() {
      return [...state];
    },
    write(entries) {
      state = [...entries];
    },
  };
}

function createLocalStorageAdapter(
  storageKey: string,
): EmojiRecentStoreAdapter {
  return {
    read() {
      return readRecentEmoji(storageKey);
    },
    write(entries) {
      writeRecentEmoji(storageKey, entries);
    },
  };
}

export function createRecentEmojiStore(
  options: CreateRecentEmojiStoreOptions = {},
): EmojiRecentStore {
  const storageKey = options.storageKey ?? DEFAULT_RECENT_STORAGE_KEY;
  const defaultLimit = options.limit ?? DEFAULT_RECENT_LIMIT;
  const adapter =
    options.adapter ??
    (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
      ? createLocalStorageAdapter(storageKey)
      : createMemoryAdapter());

  return {
    read() {
      return sortByUsedAt(adapter.read());
    },
    push(entry, limit = defaultLimit) {
      const existing = adapter.read();
      const next = [...existing];
      const existingIndex = next.findIndex(
        (record) =>
          record.id === entry.id &&
          record.custom === entry.custom &&
          record.skinTone === entry.skinTone,
      );

      if (existingIndex >= 0) {
        const current = next[existingIndex];

        if (current) {
          next[existingIndex] = {
            ...current,
            count: current.count + 1,
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

      const deduped = sortByUsedAt(next).slice(0, limit);

      adapter.write(deduped);
      return deduped;
    },
  };
}

export interface EmojiSkinToneStore {
  read: () => EmojiSkinTone;
  write: (tone: EmojiSkinTone) => void;
  subscribe: (listener: (tone: EmojiSkinTone) => void) => () => void;
}

export interface CreateSkinToneStoreOptions {
  storageKey?: string;
  defaultSkinTone?: EmojiSkinTone;
  persist?: boolean;
}

export function createSkinToneStore(
  options: CreateSkinToneStoreOptions = {},
): EmojiSkinToneStore {
  const storageKey = options.storageKey ?? DEFAULT_SKIN_TONE_STORAGE_KEY;
  const defaultSkinTone = options.defaultSkinTone ?? 'default';
  const persist = options.persist ?? true;
  const listeners = new Set<(tone: EmojiSkinTone) => void>();
  let current: EmojiSkinTone = persist
    ? readStoredSkinTone(storageKey, defaultSkinTone)
    : defaultSkinTone;

  return {
    read() {
      return current;
    },
    write(tone) {
      if (current === tone) {
        return;
      }

      current = tone;

      if (persist) {
        writeStoredSkinTone(storageKey, tone);
      }

      for (const listener of listeners) {
        listener(tone);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// Re-export for discoverability alongside the new factory.
export { createLocalStorageRecentStore, pushRecentEmoji, readRecentEmoji };
