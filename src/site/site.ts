// Stylesheet and fonts for the public pages (/, /woorden/, /grammatica/ …). No framework: these pages are plain HTML.
import '@fontsource-variable/geist';
import '@fontsource-variable/vazirmatn';
import '../index.css';
import './site.css';

// Same light/dark choice as the app (Ik › Instellingen › Weergave), else the device setting.
let saved: string | null = null;
try {
  saved = localStorage.getItem('nederlands-theme');
} catch { /* Private mode: follow the device. */ }
const dark = saved === 'dark' || (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark', dark);
