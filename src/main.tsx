import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './demo/App';
import './components/EmojiPicker.css'; // default styled picker — not auto-imported from index
import './demo/demo.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
