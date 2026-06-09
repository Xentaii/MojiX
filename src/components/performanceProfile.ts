import type {
  EmojiPerformanceMode,
  EmojiPickerVirtualization,
} from '../core/types';
import { DEFAULT_OVERSCAN_ROWS } from './gridVirtualization';

/**
 * Render-window overscan used by the `'high'` profile. Smaller than the
 * balanced default so fewer rows stay mounted outside the viewport, which is
 * the main lever for cutting DOM/memory cost on constrained devices.
 */
export const HIGH_PERFORMANCE_OVERSCAN_ROWS = 6;

/** Device is treated as constrained at or below these thresholds. */
const LOW_CORE_COUNT = 4;
const LOW_DEVICE_MEMORY_GB = 4;

interface NavigatorPerformanceHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/**
 * Inspects the runtime device hints to decide whether the lighter render
 * profile should apply. Returns `'balanced'` when no signal is available (for
 * example during SSR) so the default behavior is unchanged on capable devices.
 */
export function detectPreferredPerformanceMode(): 'high' | 'balanced' {
  if (typeof navigator === 'undefined') {
    return 'balanced';
  }

  const nav = navigator as Navigator & NavigatorPerformanceHints;
  const cores = nav.hardwareConcurrency;
  const memory = nav.deviceMemory;
  const lowCores =
    typeof cores === 'number' && cores > 0 && cores <= LOW_CORE_COUNT;
  const lowMemory =
    typeof memory === 'number' && memory > 0 && memory <= LOW_DEVICE_MEMORY_GB;
  const saveData = nav.connection?.saveData === true;

  return lowCores || lowMemory || saveData ? 'high' : 'balanced';
}

/**
 * Resolves a {@link EmojiPerformanceMode} to a concrete profile, running device
 * detection for `'auto'`.
 */
export function resolveEmojiPerformanceMode(
  mode: EmojiPerformanceMode = 'auto',
): 'high' | 'balanced' {
  if (mode === 'auto') {
    return detectPreferredPerformanceMode();
  }

  return mode;
}

/**
 * Folds the performance profile into the virtualization config. The resulting
 * object only fills fields the caller left unset — anything provided
 * explicitly via {@link EmojiPickerVirtualization} wins, and `false` (an
 * explicit opt-out of virtualization) passes through untouched.
 */
export function applyPerformanceModeToVirtualization(
  virtualization: boolean | EmojiPickerVirtualization | undefined,
  mode: EmojiPerformanceMode = 'auto',
): boolean | EmojiPickerVirtualization {
  if (virtualization === false) {
    return false;
  }

  const resolvedMode = resolveEmojiPerformanceMode(mode);
  const profileOverscanRows =
    resolvedMode === 'high'
      ? HIGH_PERFORMANCE_OVERSCAN_ROWS
      : DEFAULT_OVERSCAN_ROWS;
  const profileAdaptiveOverscan = resolvedMode !== 'high';
  const base =
    virtualization === true || virtualization === undefined
      ? undefined
      : virtualization;

  return {
    enabled: base?.enabled ?? true,
    overscanRows: base?.overscanRows ?? profileOverscanRows,
    adaptiveOverscan: base?.adaptiveOverscan ?? profileAdaptiveOverscan,
  } satisfies EmojiPickerVirtualization;
}
