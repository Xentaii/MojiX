import { useState } from 'react';
import { EmojiPicker } from '../index';
import type { EmojiSelection } from '../index';

const SEEDED_RECENTS = ['1f44b', '1f642', '1f680', '2728'];

export function AccessibilityFixture() {
  const [selection, setSelection] = useState<EmojiSelection | null>(null);

  return (
    <main className="fixture-page" data-testid="a11y-fixture">
      <section className="fixture-panel">
        <div className="fixture-copy">
          <span className="badge">Fixture</span>
          <h1>MojiX accessibility fixture</h1>
          <p>
            Stable browser harness for keyboard navigation, labels, and
            selection flows.
          </p>
          <output
            className="fixture-output"
            aria-live="polite"
            data-testid="selection-output"
          >
            {selection
              ? `${selection.native ?? ''} ${selection.name}`.trim()
              : 'No emoji selected'}
          </output>
        </div>

        <EmojiPicker
          className="fixture-picker"
          recent={{
            enabled: true,
            showWhenEmpty: true,
            emptyEmojiIds: SEEDED_RECENTS,
            defaultActive: true,
          }}
          onEmojiSelect={setSelection}
        />
      </section>
    </main>
  );
}
