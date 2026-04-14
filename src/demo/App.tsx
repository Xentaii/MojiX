import { useEffect, useMemo, useRef, useState } from 'react';
import {
  EmojiPicker,
  createNativeAssetSource,
  createEmojiSpriteSheet,
  warmEmojiSpriteSheet,
} from '../index';
import type { CustomEmoji, EmojiSelection } from '../index';
import orbitEmoji from './assets/mojix-orbit.svg';
import sparkEmoji from './assets/mojix-spark.svg';
import waveEmoji from './assets/mojix-wave.svg';

const CUSTOM_EMOJIS: CustomEmoji[] = [
  {
    id: 'mojix:orbit',
    name: 'MojiX Orbit',
    shortcodes: ['mojix_orbit'],
    keywords: ['brand', 'planet', 'satellite'],
    imageUrl: orbitEmoji,
  },
  {
    id: 'mojix:spark',
    name: 'MojiX Spark',
    shortcodes: ['mojix_spark'],
    keywords: ['energy', 'flash', 'brand'],
    imageUrl: sparkEmoji,
  },
  {
    id: 'mojix:wave',
    name: 'MojiX Wave',
    shortcodes: ['mojix_wave'],
    keywords: ['hello', 'brand', 'gesture'],
    imageUrl: waveEmoji,
  },
];

const NATIVE_FALLBACK_SOURCE = createNativeAssetSource();

// ── Code snippets shown in the API showcase section ──────────────────────────

const SNIPPET_DROPIN = `import { EmojiPicker } from 'mojix';
import 'mojix/style.css';

<EmojiPicker
  onEmojiSelect={(emoji) => {
    console.log(emoji.native); // 😄
  }}
/>`;

const SNIPPET_THEMED = `.my-picker {
  --mx-accent: #7c3aed;
  --mx-bg:     rgba(17, 12, 46, 0.94);
  --mx-text:   #e2e8f0;
  --mx-muted:  #94a3b8;
  --mx-border: rgba(255,255,255,0.08);
  --mx-radius: 16px;
}

<EmojiPicker
  className="my-picker"
  onEmojiSelect={handler}
/>`;

const SNIPPET_HEADLESS = `import { MojiX } from 'mojix';

function MyPicker({ onSelect }) {
  return (
    <MojiX.Root unstyled onEmojiSelect={onSelect}>
      <MojiX.Search>
        {({ searchQuery, setSearchQuery }) => (
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="my-search"
          />
        )}
      </MojiX.Search>
      <MojiX.Viewport className="my-viewport">
        <MojiX.Empty>Nothing found.</MojiX.Empty>
        <MojiX.List />
      </MojiX.Viewport>
      <MojiX.ActiveEmoji>
        {({ emoji }) =>
          emoji && <footer className="my-preview">{emoji.name}</footer>
        }
      </MojiX.ActiveEmoji>
    </MojiX.Root>
  );
}`;

// ─────────────────────────────────────────────────────────────────────────────

export function App() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [lastEmoji, setLastEmoji] = useState<EmojiSelection | null>(null);
  const [spriteWarmed, setSpriteWarmed] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);

  const spriteSheet = useMemo(
    () =>
      createEmojiSpriteSheet({
        source: 'cdn',
        vendor: 'twitter',
        sheetSize: 64,
        variant: 'indexed-256',
        cache: { enabled: true, preload: 'mount' },
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    warmEmojiSpriteSheet(spriteSheet)
      .then(() => {
        if (!cancelled) {
          setSpriteWarmed(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSpriteWarmed(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [spriteSheet]);

  // Close picker on outside click or Escape
  useEffect(() => {
    if (!pickerOpen) return;

    function handleDown(e: PointerEvent) {
      if (!composerRef.current?.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false);
    }

    document.addEventListener('pointerdown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [pickerOpen]);

  function handleEmojiSelect(emoji: EmojiSelection) {
    const token = emoji.native ?? `:${emoji.shortcodes[0]}:`;
    setLastEmoji(emoji);
    setMessage((m) => `${m}${m === '' || m.endsWith(' ') ? '' : ' '}${token} `);
    setPickerOpen(false);
  }

  return (
    <div className="page">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header className="hero">
        <div className="hero__inner">
          <span className="badge">MojiX</span>
          <h1 className="hero__title">
            Emoji picker<br />for serious apps.
          </h1>
          <p className="hero__sub">
            Drop-in ready like emoji-mart.{' '}
            Fully composable like Radix UI.
          </p>
          <code className="install-cmd">npm install mojix</code>
        </div>
      </header>

      {/* ── Live demo ─────────────────────────────────────────────────────── */}
      <section className="demo-section">
        <div className="chat-window">

          {/* Header */}
          <div className="chat-header">
            <div className="chat-avatar" aria-hidden="true">N</div>
            <div className="chat-header-info">
              <strong>Nora</strong>
              <span className="chat-status">
                <span className="chat-status__dot" aria-hidden="true" />
                online
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" role="log" aria-label="Chat messages">
            <div className="chat-msg chat-msg--in">
              <p>Hey! Give the new picker a spin. 👀</p>
            </div>
            <div className="chat-msg chat-msg--in">
              <p>Custom emoji, localized search, vendor sprites — all opt-in.</p>
            </div>
            {message && (
              <div className="chat-msg chat-msg--out">
                <p>{message.trim()}</p>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="chat-composer" ref={composerRef}>
            <div className="chat-composer__row">
              <div className="chat-picker-anchor">
                {pickerOpen && (
                  <div className="chat-picker-popover" id="demo-emoji-picker">
                    <EmojiPicker
                      customEmojis={CUSTOM_EMOJIS}
                      spriteSheet={spriteSheet}
                      assetSource={
                        spriteWarmed ? undefined : NATIVE_FALLBACK_SOURCE
                      }
                      emojiSize={22}
                      onEmojiSelect={handleEmojiSelect}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className={`chat-emoji-btn${pickerOpen ? ' is-open' : ''}`}
                  onClick={() => setPickerOpen((o) => !o)}
                  aria-label={pickerOpen ? 'Close emoji picker' : 'Open emoji picker'}
                  aria-expanded={pickerOpen}
                  aria-controls="demo-emoji-picker"
                  aria-haspopup="dialog"
                >
                  {lastEmoji?.native ?? '😊'}
                </button>
              </div>

              <textarea
                className="chat-input"
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                placeholder="Type a message…"
                rows={1}
                aria-label="Message input"
              />

              <button type="button" className="chat-send-btn">
                Send
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── API showcase ──────────────────────────────────────────────────── */}
      <section className="api-section">
        <div className="api-intro">
          <h2>One library, three strategies</h2>
          <p>Start simple and opt into complexity only when you need it.</p>
        </div>

        <div className="api-grid">
          <div className="api-card">
            <span className="api-label api-label--green">Drop-in</span>
            <h3>Zero config</h3>
            <p>One import, one component. Works immediately with native OS emoji.</p>
            <pre className="code-block">{SNIPPET_DROPIN}</pre>
          </div>

          <div className="api-card">
            <span className="api-label api-label--violet">Themed</span>
            <h3>CSS variables</h3>
            <p>Every visual token is a CSS variable. Dark mode in five lines.</p>
            <pre className="code-block">{SNIPPET_THEMED}</pre>
          </div>

          <div className="api-card">
            <span className="api-label api-label--orange">Headless</span>
            <h3>Full control</h3>
            <p>Compose from primitives. Bring your own styles, layout, and markup.</p>
            <pre className="code-block">{SNIPPET_HEADLESS}</pre>
          </div>
        </div>
      </section>

    </div>
  );
}
