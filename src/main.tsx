import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './demo/App';
import {
  preloadEmojiData,
  registerEmojiLocalePack,
} from './index';
import emojiData from './entries/data';
import deLocale from './entries/locales/de';
import enLocale from './entries/locales/en';
import esLocale from './entries/locales/es';
import frLocale from './entries/locales/fr';
import jaLocale from './entries/locales/ja';
import ptLocale from './entries/locales/pt';
import ruLocale from './entries/locales/ru';
import ukLocale from './entries/locales/uk';
import './components/EmojiPicker.css'; // default styled picker; not auto-imported from the package root
import './demo/demo.css';

const activeFixture =
  typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get('fixture');

if (!activeFixture?.startsWith('cdn-')) {
  registerEmojiLocalePack('de', deLocale);
  registerEmojiLocalePack('en', enLocale);
  registerEmojiLocalePack('es', esLocale);
  registerEmojiLocalePack('fr', frLocale);
  registerEmojiLocalePack('ja', jaLocale);
  registerEmojiLocalePack('pt', ptLocale);
  registerEmojiLocalePack('ru', ruLocale);
  registerEmojiLocalePack('uk', ukLocale);
  preloadEmojiData(emojiData);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
