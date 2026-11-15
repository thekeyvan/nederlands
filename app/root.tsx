import {useContext} from 'react';
import {Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useLocation} from 'react-router';
import type {Route} from './+types/root';
import '@fontsource-variable/geist';
import '@fontsource-variable/vazirmatn';
import '../src/index.css';
import {NonceContext} from './nonce';
import {langOf} from './site/lang';

// Same light/dark choice as the app (Ik › Instellingen › Weergave), else the device setting; set before the first paint.
const themeScript = `try{var t=localStorage.getItem('nederlands-theme');document.documentElement.classList.toggle('dark',t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))}catch(e){}`;

export function Layout({children}: {children: React.ReactNode}) {
  const {pathname} = useLocation();
  const nonce = useContext(NonceContext);
  const lang = langOf(pathname);
  // The app restores its own scroll positions (screens and layers live in the hash).
  const app = pathname === '/leren';
  return (
    <html lang={lang} dir={lang === 'fa' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{__html: themeScript}} />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        {!app && <ScrollRestoration />}
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
  const missing = isRouteErrorResponse(error) && error.status === 404;
  if (!missing) console.error(error);
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <img src="/img/mascot-wave.jpg" alt="" width={112} height={112} className="size-28 rounded-3xl" />
      <h1 className="text-3xl font-extrabold">{missing ? 'Deze pagina bestaat niet' : 'Er ging iets mis'}</h1>
      <p className="text-muted-foreground">{missing ? 'Misschien is de link oud. Kies hieronder waar je verder wilt.' : 'Probeer het zo nog eens.'}</p>
      <p lang="fa" dir="rtl" className="text-muted-foreground">{missing ? 'این صفحه پیدا نشد.' : 'مشکلی پیش آمد. لطفاً دوباره امتحان کنید.'}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <a href="/" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground">Naar de homepage</a>
        <a href="/leren" className="inline-flex h-11 items-center rounded-xl border px-5 font-semibold">Oefenen</a>
      </div>
    </main>
  );
}
