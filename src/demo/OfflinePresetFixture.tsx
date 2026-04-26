import { useRef, useState } from 'react';
import {
  EmojiPicker,
  createNativeAssetSource,
  preloadEmojiData,
  registerEmojiLocalePack,
} from '../index';
import type { EmojiSelection } from '../index';
import emojiData from '../entries/data';
import enLocale from '../entries/locales/en';

const NATIVE_SOURCE = createNativeAssetSource();

export function OfflinePresetFixture() {
  const initializedRef = useRef(false);
  const [selection, setSelection] = useState<EmojiSelection | null>(null);

  if (!initializedRef.current) {
    registerEmojiLocalePack('en', enLocale);
    preloadEmojiData(emojiData);
    initializedRef.current = true;
  }

  return (
    <main className="fixture-page" data-testid="offline-fixture">
      <section className="fixture-panel">
        <div className="fixture-copy">
          <span className="badge">Fixture</span>
          <h1>MojiX offline fixture</h1>
          <p>Bootstraps the picker from local preset modules only.</p>
          <output
            className="fixture-output"
            aria-live="polite"
            data-testid="offline-selection-output"
          >
            {selection
              ? `${selection.native ?? ''} ${selection.name}`.trim()
              : 'No emoji selected'}
          </output>
        </div>

        <EmojiPicker
          className="fixture-picker"
          assetSource={NATIVE_SOURCE}
          showPreview={false}
          onEmojiSelect={setSelection}
        />
      </section>
    </main>
  );
}
