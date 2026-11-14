import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/vazirmatn';
import './index.css';
import {applyInitialTheme} from '@/hooks/use-theme';
import {App} from '@/App';

applyInitialTheme();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
