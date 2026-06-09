import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OVERSCAN_ROWS } from '../src/components/gridVirtualization';
import {
  applyPerformanceModeToVirtualization,
  detectPreferredPerformanceMode,
  HIGH_PERFORMANCE_OVERSCAN_ROWS,
  resolveEmojiPerformanceMode,
} from '../src/components/performanceProfile';

function stubNavigator(hints: Record<string, unknown> | undefined) {
  vi.stubGlobal('navigator', hints);
}

describe('detectPreferredPerformanceMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns balanced on a capable device', () => {
    stubNavigator({ hardwareConcurrency: 8, deviceMemory: 8 });
    expect(detectPreferredPerformanceMode()).toBe('balanced');
  });

  it('returns high when the CPU reports few cores', () => {
    stubNavigator({ hardwareConcurrency: 2, deviceMemory: 8 });
    expect(detectPreferredPerformanceMode()).toBe('high');
  });

  it('returns high when device memory is low', () => {
    stubNavigator({ hardwareConcurrency: 8, deviceMemory: 2 });
    expect(detectPreferredPerformanceMode()).toBe('high');
  });

  it('returns high when Save-Data is enabled', () => {
    stubNavigator({
      hardwareConcurrency: 8,
      deviceMemory: 8,
      connection: { saveData: true },
    });
    expect(detectPreferredPerformanceMode()).toBe('high');
  });

  it('falls back to balanced when no navigator is available', () => {
    stubNavigator(undefined);
    expect(detectPreferredPerformanceMode()).toBe('balanced');
  });
});

describe('resolveEmojiPerformanceMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes explicit modes through without detection', () => {
    expect(resolveEmojiPerformanceMode('high')).toBe('high');
    expect(resolveEmojiPerformanceMode('balanced')).toBe('balanced');
  });

  it('runs detection for auto', () => {
    stubNavigator({ hardwareConcurrency: 2 });
    expect(resolveEmojiPerformanceMode('auto')).toBe('high');
  });
});

describe('applyPerformanceModeToVirtualization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the balanced default unchanged', () => {
    expect(applyPerformanceModeToVirtualization(undefined, 'balanced')).toEqual(
      {
        enabled: true,
        overscanRows: DEFAULT_OVERSCAN_ROWS,
        adaptiveOverscan: true,
      },
    );
  });

  it('shrinks the window and disables adaptive overscan in high mode', () => {
    expect(applyPerformanceModeToVirtualization(true, 'high')).toEqual({
      enabled: true,
      overscanRows: HIGH_PERFORMANCE_OVERSCAN_ROWS,
      adaptiveOverscan: false,
    });
  });

  it('passes an explicit virtualization opt-out through untouched', () => {
    expect(applyPerformanceModeToVirtualization(false, 'high')).toBe(false);
  });

  it('lets explicit virtualization fields win over the profile', () => {
    expect(
      applyPerformanceModeToVirtualization(
        { overscanRows: 30, enabled: true },
        'high',
      ),
    ).toEqual({
      enabled: true,
      overscanRows: 30,
      adaptiveOverscan: false,
    });
  });

  it('resolves auto from the device when no fields are set', () => {
    stubNavigator({ hardwareConcurrency: 2 });
    expect(applyPerformanceModeToVirtualization(undefined, 'auto')).toEqual({
      enabled: true,
      overscanRows: HIGH_PERFORMANCE_OVERSCAN_ROWS,
      adaptiveOverscan: false,
    });
  });
});
