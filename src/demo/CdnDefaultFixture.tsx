import { useState } from 'react';
import {
  EmojiPicker,
  createNativeAssetSource,
} from '../index';
import type { EmojiSelection } from '../index';

const NATIVE_SOURCE = createNativeAssetSource();
const CUSTOM_EMOJI = [
  {
    id: 'fixture:wave',
    name: 'Fixture wave',
    native: '👋',
    categoryId: 'custom',
    categoryLabel: 'Fixture',
  },
] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'unknown';
}

export function CdnDefaultFixture() {
  const [selection, setSelection] = useState<EmojiSelection | null>(null);
  const [dataError, setDataError] = useState('none');

  return (
    <main className="fixture-page" data-testid="cdn-fixture">
      <section className="fixture-panel">
        <div className="fixture-copy">
          <span className="badge">Fixture</span>
          <h1>MojiX CDN fixture</h1>
          <p>Validates the default async data load path.</p>
          <output
            className="fixture-output"
            aria-live="polite"
            data-testid="cdn-selection-output"
          >
            {selection
              ? `${selection.native ?? ''} ${selection.name}`.trim()
              : 'No emoji selected'}
          </output>
          <output
            className="fixture-output"
            aria-live="polite"
            data-testid="cdn-error-output"
          >
            {dataError}
          </output>
        </div>

        <EmojiPicker
          className="fixture-picker"
          assetSource={NATIVE_SOURCE}
          customEmojis={[...CUSTOM_EMOJI]}
          showPreview={false}
          onDataError={(error) => setDataError(getErrorMessage(error))}
          onEmojiSelect={setSelection}
        />
      </section>
    </main>
  );
}
