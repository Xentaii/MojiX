import '@testing-library/jest-dom/vitest';
import emojiData from '../src/entries/data';
import { preloadEmojiData } from '../src/index';

preloadEmojiData(emojiData);
