import { useEffect, useMemo, useState } from 'react';
import {
  EmojiPicker,
  createEmojiLocalSpriteSheet,
  createEmojiSpriteSheet,
  warmEmojiSpriteSheet,
} from '../index';
import type {
  CustomEmoji,
  EmojiLocaleCode,
  EmojiSelection,
  EmojiSpriteSheetVariant,
  EmojiVendor,
} from '../index';
import orbitEmoji from './assets/mojix-orbit.svg';
import sparkEmoji from './assets/mojix-spark.svg';
import waveEmoji from './assets/mojix-wave.svg';

type DemoVendor = Extract<EmojiVendor, 'twitter' | 'google'>;
type DemoVariant = Extract<
  EmojiSpriteSheetVariant,
  'default' | 'indexed-256' | 'clean'
>;

const customEmojis: CustomEmoji[] = [
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

const LOCAL_SHEETS: Record<DemoVendor, Record<DemoVariant, string>> = {
  twitter: {
    default: '/sprites/twitter/sheets/64.png',
    'indexed-256': '/sprites/twitter/sheets-256/64.png',
    clean: '/sprites/twitter/sheets-clean/64.png',
  },
  google: {
    default: '/sprites/google/sheets/64.png',
    'indexed-256': '/sprites/google/sheets-256/64.png',
    clean: '/sprites/google/sheets-clean/64.png',
  },
};

const VARIANT_LABELS: Record<DemoVariant, string> = {
  default: 'Full',
  'indexed-256': 'Indexed 256',
  clean: 'Clean',
};

const CACHE_STATUS_LABELS = {
  idle: 'Off',
  warming: 'Downloading',
  ready: 'Cached',
  error: 'Failed',
} as const;

export function App() {
  const [pickerOpen, setPickerOpen] = useState(true);
  const [spriteSource, setSpriteSource] = useState<'cdn' | 'local'>('cdn');
  const [vendor, setVendor] = useState<DemoVendor>('twitter');
  const [variant, setVariant] = useState<DemoVariant>('indexed-256');
  const [locale, setLocale] = useState<EmojiLocaleCode>('en');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<
    keyof typeof CACHE_STATUS_LABELS
  >('idle');
  const [message, setMessage] = useState(
    'CDN first. Warm the sprite sheet once and keep the picker compact.',
  );
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiSelection | null>(null);

  const spriteSheet = useMemo(() => {
    if (spriteSource === 'local') {
      return createEmojiLocalSpriteSheet(LOCAL_SHEETS[vendor][variant], {
        vendor,
        sheetSize: 64,
        variant,
      });
    }

    return createEmojiSpriteSheet({
      source: 'cdn',
      vendor,
      sheetSize: 64,
      variant,
      cache:
        cacheEnabled
          ? {
              enabled: true,
              preload: 'mount',
            }
          : {
              enabled: false,
            },
    });
  }, [cacheEnabled, spriteSource, vendor, variant]);

  useEffect(() => {
    let cancelled = false;

    if (spriteSource !== 'cdn' || !cacheEnabled) {
      setCacheStatus('idle');
      return;
    }

    setCacheStatus('warming');

    warmEmojiSpriteSheet(spriteSheet)
      .then((asset) => {
        asset.release?.();

        if (!cancelled) {
          setCacheStatus(asset.cached ? 'ready' : 'error');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCacheStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheEnabled, spriteSheet, spriteSource]);

  function handleEmojiSelect(emoji: EmojiSelection) {
    const shortcode = emoji.shortcodes[0]?.trim();
    const token = emoji.native ?? (shortcode ? `:${shortcode}:` : emoji.name);

    setSelectedEmoji(emoji);
    setMessage((current) => `${current}${current.endsWith(' ') ? '' : ' '}${token}`);
  }

  return (
    <main className="demo-shell">
      <section className="demo-intro">
        <span className="demo-badge">MojiX / CDN-first</span>
        <h1>Compact emoji popover with vendor presets and optional sprite caching.</h1>
        <p>
          The picker now defaults to jsDelivr and can optionally warm the active
          sheet into managed browser storage. Local files still work, but they are
          just one delivery mode rather than the whole strategy.
        </p>
      </section>

      <section className="demo-stage">
        <div className="demo-chat">
          <header className="demo-chat__header">
            <div>
              <strong>Project Composer</strong>
              <span>CDN first, compact modal, localized search, optional cache warmup</span>
            </div>
            <button
              type="button"
              className="demo-ghost-button"
              onClick={() => setPickerOpen((open) => !open)}
            >
              {pickerOpen ? 'Hide picker' : 'Open picker'}
            </button>
          </header>

          <div className="demo-chat__messages">
            <article className="demo-message">
              <strong>Nora</strong>
              <p>Let&apos;s keep delivery flexible: CDN by default, cache when we want control.</p>
            </article>
            <article className="demo-message demo-message--accent">
              <strong>You</strong>
              <p>{message}</p>
            </article>
          </div>

          <div className="demo-composer">
            {pickerOpen && (
              <div className="demo-picker-popover">
                <EmojiPicker
                  value={selectedEmoji?.id}
                  customEmojis={customEmojis}
                  locale={locale}
                  spriteSheet={spriteSheet}
                  emojiSize={22}
                  onEmojiSelect={handleEmojiSelect}
                />
              </div>
            )}

            <textarea
              className="demo-composer__input"
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
              rows={4}
            />

            <div className="demo-composer__actions">
              <button
                type="button"
                className="demo-primary-button"
                onClick={() => setPickerOpen((open) => !open)}
              >
                Pick emoji
              </button>
              <span className="demo-composer__meta">
                {selectedEmoji
                  ? `Selected: ${selectedEmoji.native ?? `:${selectedEmoji.shortcodes[0]}:`}`
                  : 'Pick an emoji to append it into the message'}
              </span>
              <button type="button" className="demo-send-button">
                Send
              </button>
            </div>
          </div>
        </div>

        <aside className="demo-sidebar">
          <div className="demo-card">
            <span className="demo-card__label">Locale</span>
            <div className="demo-segmented">
              <button
                type="button"
                className={locale === 'en' ? 'is-active' : undefined}
                onClick={() => setLocale('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={locale === 'ru' ? 'is-active' : undefined}
                onClick={() => setLocale('ru')}
              >
                RU
              </button>
            </div>
            <small>
              English stays primary for ranking, while the active locale also feeds
              names and keywords into search.
            </small>
          </div>

          <div className="demo-card">
            <span className="demo-card__label">Delivery</span>
            <div className="demo-segmented">
              <button
                type="button"
                className={spriteSource === 'cdn' ? 'is-active' : undefined}
                onClick={() => setSpriteSource('cdn')}
              >
                CDN
              </button>
              <button
                type="button"
                className={spriteSource === 'local' ? 'is-active' : undefined}
                onClick={() => setSpriteSource('local')}
              >
                Local
              </button>
            </div>
            <small>
              CDN mode is the default path. Local mode uses downloaded demo presets
              from <code>/public/sprites</code>.
            </small>
          </div>

          <div className="demo-card">
            <span className="demo-card__label">Vendor</span>
            <div className="demo-segmented">
              <button
                type="button"
                className={vendor === 'twitter' ? 'is-active' : undefined}
                onClick={() => setVendor('twitter')}
              >
                Twitter
              </button>
              <button
                type="button"
                className={vendor === 'google' ? 'is-active' : undefined}
                onClick={() => setVendor('google')}
              >
                Google
              </button>
            </div>
            <small>Each preset resolves the matching package family automatically.</small>
          </div>

          <div className="demo-card">
            <span className="demo-card__label">Variant</span>
            <div className="demo-segmented">
              {(['default', 'indexed-256', 'clean'] as DemoVariant[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={variant === item ? 'is-active' : undefined}
                  onClick={() => setVariant(item)}
                >
                  {VARIANT_LABELS[item]}
                </button>
              ))}
            </div>
            <small>
              Full fidelity, quantized grid delivery, or clean sheets without
              fallback imagery.
            </small>
          </div>

          <div className="demo-card">
            <span className="demo-card__label">Cache</span>
            <div className="demo-segmented">
              <button
                type="button"
                className={!cacheEnabled ? 'is-active' : undefined}
                onClick={() => setCacheEnabled(false)}
                disabled={spriteSource === 'local'}
              >
                Off
              </button>
              <button
                type="button"
                className={cacheEnabled ? 'is-active' : undefined}
                onClick={() => setCacheEnabled(true)}
                disabled={spriteSource === 'local'}
              >
                Browser
              </button>
            </div>
            <small>
              {spriteSource === 'local'
                ? 'Caching is only meaningful for remote CDN sheets.'
                : `Current status: ${CACHE_STATUS_LABELS[cacheStatus]}.`}
            </small>
          </div>

          <div className="demo-card">
            <span className="demo-card__label">Current setup</span>
            <pre>{`const spriteSheet = ${
              spriteSource === 'cdn'
                ? `createEmojiSpriteSheet({
  source: "cdn",
  vendor: "${vendor}",
  sheetSize: 64,
  variant: "${variant}",
  cache: { enabled: ${cacheEnabled} }
})`
                : `createEmojiLocalSpriteSheet("${LOCAL_SHEETS[vendor][variant]}", {
  vendor: "${vendor}",
  sheetSize: 64,
  variant: "${variant}"
})`
            };

<EmojiPicker locale="${locale}" spriteSheet={spriteSheet} />`}</pre>
          </div>
        </aside>
      </section>
    </main>
  );
}
