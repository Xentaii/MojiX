export type CancelIdleTask = () => void;

export interface IdleTaskOptions {
  timeout?: number;
}

type IdleCallbackHandle = number;

interface IdleScheduler {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
}

export function scheduleIdleTask(
  callback: () => void,
  options: IdleTaskOptions = {},
): CancelIdleTask {
  if (typeof window === 'undefined') {
    const timeoutId = setTimeout(callback, 0);
    return () => clearTimeout(timeoutId);
  }

  const scheduler = window as typeof window & IdleScheduler;

  if (scheduler.requestIdleCallback) {
    const handle = scheduler.requestIdleCallback(callback, {
      timeout: options.timeout ?? 1500,
    });

    return () => scheduler.cancelIdleCallback?.(handle);
  }

  const timeoutId = window.setTimeout(callback, 0);
  return () => window.clearTimeout(timeoutId);
}
