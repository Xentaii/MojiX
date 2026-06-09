import type { EmojiPerformanceMode } from '../index';
import { EmojiPicker } from '../index';

const PERFORMANCE_MODES: EmojiPerformanceMode[] = ['auto', 'high', 'balanced'];

function readPerformanceMode(): EmojiPerformanceMode | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const value = new URLSearchParams(window.location.search).get('mode');

  return PERFORMANCE_MODES.includes(value as EmojiPerformanceMode)
    ? (value as EmojiPerformanceMode)
    : undefined;
}

export function PerformanceFixture() {
  const performanceMode = readPerformanceMode();

  return (
    <main className="fixture-page" data-testid="performance-fixture">
      <section className="fixture-panel">
        <div className="fixture-copy">
          <span className="badge">Fixture</span>
          <h1>MojiX performance fixture</h1>
          <p>
            Stable harness for scroll-performance traces and `performanceMode`
            checks. Append <code>&amp;mode=high</code> or
            <code>&amp;mode=balanced</code> to force a mode.
          </p>
          <output
            className="fixture-output"
            data-testid="performance-mode-output"
          >
            {performanceMode ?? 'auto (default)'}
          </output>
        </div>

        <EmojiPicker
          className="fixture-picker"
          performanceMode={performanceMode}
        />
      </section>
    </main>
  );
}
