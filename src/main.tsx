import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './demo/App';
import './components/EmojiPicker.css'; // default styled picker; not auto-imported from the package root
import './demo/demo.css';
import './entries/locales/de';
import './entries/locales/en';
import './entries/locales/es';
import './entries/locales/fr';
import './entries/locales/ja';
import './entries/locales/pt';
import './entries/locales/ru';
import './entries/locales/uk';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
