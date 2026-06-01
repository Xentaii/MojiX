import { scheduleIdleTask } from '../core/idle';

let virtualizedEmojiGridModulePromise: Promise<
  typeof import('./VirtualizedEmojiGrid')
> | null = null;

export function loadVirtualizedEmojiGridModule() {
  virtualizedEmojiGridModulePromise ??= import('./VirtualizedEmojiGrid');
  return virtualizedEmojiGridModulePromise;
}

export function preloadVirtualizedEmojiGrid(options: { idle?: boolean } = {}) {
  if (!options.idle) {
    void loadVirtualizedEmojiGridModule();
    return;
  }

  return scheduleIdleTask(() => {
    void loadVirtualizedEmojiGridModule();
  });
}
