import '@testing-library/jest-dom/vitest';
import emojiData from '../src/entries/data';
import enLocale from '../src/entries/locales/en';
import {
  preloadEmojiData,
  registerEmojiLocalePack,
} from '../src/index';

registerEmojiLocalePack('en', enLocale);
preloadEmojiData(emojiData);
