import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './demo/App';
import './components/EmojiPicker.css'; // default styled picker — not auto-imported from index
import './demo/demo.css';
import './entries/locales/en';
import './entries/locales/ru';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
