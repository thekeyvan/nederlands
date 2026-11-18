// Building blocks of the public pages: header, footer, breadcrumbs, sections, buttons and theme cards.
import type {ReactNode} from 'react';
import {Link, useLocation} from 'react-router';
import {APP_STORE, BRAND_FA, EMAIL, PLAY_STORE, at, langOf, num, themeImage, themePath, tx, type Lang} from './lang';

export type SiteTheme = {id: string; title: string; fa: string; words: number};

/** Dutch text: left to right, Dutch font, read as Dutch by screen readers. */
export const Nl = ({children, className}: {children: ReactNode; className?: string}) => <span lang="nl" dir="ltr" className={className}>{children}</span>;
/** Persian text inside a Dutch page. */
export const Fa = ({children, className}: {children: ReactNode; className?: string}) => <span lang="fa" dir="rtl" className={className}>{children}</span>;

const entities: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
export const esc = (text = '') => String(text).replace(/[&<>"']/g, (char) => entities[char]);
/** A Dutch word inside a trusted HTML string (FAQ answers). */
export const nlh = (text: string) => `<span lang="nl" dir="ltr">${esc(text)}</span>`;
/** Trusted, hand-written markup from this file's page texts; never user input. */
export const Html = ({html, as: Tag = 'span', className}: {html: string; as?: 'span' | 'p' | 'div'; className?: string}) => <Tag className={className} dangerouslySetInnerHTML={{__html: html}} />;

export const Section = ({children, className = ''}: {children: ReactNode; className?: string}) => <section className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</section>;
export const H2 = ({children, id}: {children: ReactNode; id?: string}) => <h2 id={id} className="text-2xl font-extrabold tracking-tight sm:text-3xl">{children}</h2>;

/** The primary call to action that opens the app. */
export function Cta({lang, href, children, className = ''}: {lang: Lang; href: string; children: ReactNode; className?: string}) {
  return <a href={href} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-[0_4px_0_var(--primary-edge)] transition active:translate-y-1 active:shadow-none ${className}`}>{children}<span aria-hidden="true">{tx(lang, '←', '→')}</span></a>;
}
/** A secondary button: a page of this site (`to`) or the web app (`href`). */
export function Ghost({to, href, children}: {to?: string; href?: string; children: ReactNode}) {
  const className = 'inline-flex h-12 items-center justify-center rounded-xl border bg-card px-6 text-base font-semibold shadow-[0_4px_0_var(--border)] transition active:translate-y-1 active:shadow-none';
  return href ? <a href={href} className={className}>{children}</a> : <Link to={to!} className={className}>{children}</Link>;
}

/**
 * The official App Store and Google Play badges: the native apps come first, the web app second.
 * Google Play shows once PLAY_STORE is set; Persian pages use the English badges (there are no Persian ones).
 */
export function StoreBadges({lang, web, small, center, className = ''}: {lang: Lang; web?: string; small?: boolean; center?: boolean; className?: string}) {
  const badge = lang === 'fa' ? 'en' : 'nl';
  const height = small ? 40 : 54;
  return (
    <div className={className}>
      <div className={`flex flex-wrap items-center gap-3${center ? ' justify-center' : ''}`}>
        <a href={APP_STORE} className="rounded-[10px] transition hover:opacity-85">
          <img src={`/img/app-store-${badge}.svg`} alt={tx(lang, 'دانلود نِدفا از App Store', 'Download Nedfa in de App Store')} width={Math.round(height * 2.99)} height={height} style={{height}} className="w-auto" />
        </a>
        {PLAY_STORE && (
          <a href={PLAY_STORE} className="rounded-[10px] transition hover:opacity-85">
            <img src={`/img/google-play-${badge}.png`} alt={tx(lang, 'دانلود نِدفا از Google Play', 'Download Nedfa in Google Play')} width={Math.round(height * 1.04 * 2.96)} height={Math.round(height * 1.04)} style={{height: Math.round(height * 1.04)}} className="w-auto" />
          </a>
        )}
      </div>
      {(web || !PLAY_STORE) && (
        <p className={`mt-2.5 text-sm opacity-75${center ? ' text-center' : ''}`}>
          {!PLAY_STORE && tx(lang, 'اپ اندروید به‌زودی. ', 'Android-app binnenkort. ')}
          {web && <a href={web} className="font-semibold underline underline-offset-2 hover:opacity-80">{tx(lang, 'یا همین حالا در مرورگر تمرین کنید ←', 'Of oefen nu in je browser →')}</a>}
        </p>
      )}
    </div>
  );
}

export const Logo = ({className = 'size-9'}: {className?: string}) => <img src="/img/logo.png" alt="" width={72} height={72} className={`${className} rounded-xl`} />;
export const Picture = ({src, size, className, alt = '', eager}: {src: string; size: number; className: string; alt?: string; eager?: boolean}) => <img src={src} alt={alt} width={size} height={size} loading={eager ? undefined : 'lazy'} className={className} />;

export function ThemeCard({lang, theme}: {lang: Lang; theme: SiteTheme}) {
  const words = tx(lang, `${num(lang, theme.words)} لغت`, `${theme.words} woorden`);
  return (
    <li>
      <Link to={at(lang, themePath(theme.id))} className="group flex items-center gap-3 rounded-2xl border bg-card p-2.5 transition hover:border-primary/40 hover:bg-accent/40">
        <Picture src={themeImage(theme.id)} size={64} className="size-16 shrink-0 rounded-xl object-cover" />
        <span className="min-w-0">
          <span className="block font-bold">{lang === 'fa' ? theme.fa : <Nl>{theme.title}</Nl>}</span>
          <span className="block truncate text-xs text-muted-foreground">{lang === 'fa' ? <Nl>{theme.title}</Nl> : <Fa>{theme.fa}</Fa>} · {words}</span>
        </span>
      </Link>
    </li>
  );
}

export function Faq({items}: {items: [string, string][]}) {
  return (
    <div className="divide-y rounded-2xl border bg-card">
      {items.map(([q, a]) => (
        <details key={q} className="group p-4 sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<span aria-hidden="true" className="text-muted-foreground transition group-open:rotate-45">+</span></summary>
          <Html as="p" className="mt-2 text-muted-foreground" html={a} />
        </details>
      ))}
    </div>
  );
}

export function Crumbs({lang, items}: {lang: Lang; items: [string, string][]}) {
  return (
    <nav aria-label={tx(lang, 'مسیر صفحه', 'Kruimelpad')} className="mx-auto max-w-6xl px-4 pt-5 text-sm text-muted-foreground sm:px-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map(([name, href], index) =>
          index === items.length - 1 ? (
            <li key={href} aria-current="page" className="font-medium text-foreground"><bdi>{name}</bdi></li>
          ) : (
            <li key={href} className="flex items-center gap-1.5"><Link to={at(lang, href)} className="hover:text-foreground hover:underline"><bdi>{name}</bdi></Link><span aria-hidden="true">{tx(lang, '‹', '›')}</span></li>
          ),
        )}
      </ol>
    </nav>
  );
}

/** Header, main and footer around every public page. */
export function SiteFrame({children}: {children: ReactNode}) {
  const {pathname} = useLocation();
  const lang = langOf(pathname);
  const path = lang === 'fa' ? pathname.replace(/^\/fa/, '') || '/' : pathname;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">{tx(lang, 'رفتن به محتوا', 'Naar de inhoud')}</a>
      <Header lang={lang} path={path} />
      <main id="main">{children}</main>
      <Footer lang={lang} />
    </>
  );
}

function Header({lang, path}: {lang: Lang; path: string}) {
  const other: Lang = lang === 'fa' ? 'nl' : 'fa';
  const links: [string, string][] = [['/woorden/', tx(lang, 'لغات هلندی', 'Woorden')], ['/grammatica/', tx(lang, 'گرامر', 'Grammatica')], ['/inburgering/', tx(lang, 'آزمون اینبورخرینگ', 'Inburgering')]];
  const nav = (mobile: boolean) =>
    links.map(([href, label]) => {
      const current = path.startsWith(href);
      return <Link key={href} to={at(lang, href)} aria-current={current ? 'page' : undefined} className={`${mobile ? 'shrink-0 rounded-md px-3 py-1 text-sm font-medium' : 'rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted'}${current ? ' bg-muted' : ''}`}>{label}</Link>;
    });
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur" style={{paddingTop: 'env(safe-area-inset-top)'}}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to={at(lang, '/')} className="flex items-center gap-2.5 font-bold" aria-label={tx(lang, 'Nedfa، صفحهٔ اصلی', 'Nedfa, home')}><Logo /><span className="text-lg" lang="nl">nedfa</span></Link>
        <nav aria-label={tx(lang, 'منوی اصلی', 'Hoofdmenu')} className="hidden items-center gap-1 md:flex">{nav(false)}</nav>
        <div className="flex items-center gap-2">
          <Link to={at(other, path)} hrefLang={other} lang={other} className="rounded-md border px-2.5 py-1.5 text-sm font-semibold hover:bg-muted" aria-label={other === 'nl' ? 'Nederlands' : 'فارسی'}>{other === 'nl' ? 'NL' : 'فا'}</Link>
          <a href={`${at(lang, '/')}#download`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_3px_0_var(--primary-edge)] transition active:translate-y-0.5 active:shadow-none">{tx(lang, 'دانلود اپ', 'Download de app')}</a>
        </div>
      </div>
      <nav aria-label={tx(lang, 'منوی اصلی', 'Hoofdmenu')} className="no-scrollbar flex gap-1 overflow-x-auto border-t px-3 py-1.5 md:hidden">{nav(true)}</nav>
    </header>
  );
}

function Footer({lang}: {lang: Lang}) {
  const item = (href: string, label: ReactNode, internal = true) => <li>{internal ? <Link className="hover:text-foreground" to={href}>{label}</Link> : <a className="hover:text-foreground" href={href}>{label}</a>}</li>;
  return (
    <footer className="mt-20 border-t bg-sidebar">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-bold"><Logo className="size-8" /><span lang="nl">nedfa</span></p>
          <p className="mt-3 text-sm text-muted-foreground">{tx(lang, `${BRAND_FA}: آموزش رایگان زبان هلندی برای فارسی‌زبانان، از سطح A2 تا B1. هر روز چند دقیقه، با تلفظ هلندی و ترجمهٔ فارسی.`, 'Nedfa: gratis Nederlands leren voor Farsi- en Perzisch sprekenden, van nul tot B1. Elke dag een paar minuten, met Nederlandse audio en Perzische vertaling.')}</p>
        </div>
        <div>
          <p className="text-sm font-bold">{tx(lang, 'یادگیری', 'Leren')}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {item(at(lang, '/woorden/'), tx(lang, 'لغات هلندی به فارسی', 'Nederlandse woorden'))}
            {item(at(lang, '/grammatica/'), tx(lang, 'گرامر زبان هلندی', 'Nederlandse grammatica'))}
            {item(at(lang, '/inburgering/'), tx(lang, 'آزمون اینبورخرینگ', 'Inburgeringsexamen'))}          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">{tx(lang, 'اپ نِدفا', 'De app')}</p>
          <StoreBadges lang={lang} small className="mt-3 text-muted-foreground" />
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {item('/leren', tx(lang, 'نسخهٔ وب (رایگان)', 'Webversie (gratis)'), false)}
            {item('/privacy', <span lang="nl">Privacy</span>)}
            {item(at(lang === 'fa' ? 'nl' : 'fa', '/'), lang === 'fa' ? <span lang="nl">Nederlands</span> : <span lang="fa">فارسی</span>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">{tx(lang, 'تماس', 'Contact')}</p>
          <p className="mt-3 text-sm text-muted-foreground">{tx(lang, 'سؤال یا پیشنهاد دارید؟ برای ما بنویسید:', 'Een vraag of idee? Mail ons:')}</p>
          <p className="mt-1 text-sm font-medium" dir="ltr" lang="nl">{EMAIL}</p>
        </div>
      </div>
      <p className="border-t py-4 text-center text-xs text-muted-foreground"><span lang="nl">© {new Date().getFullYear()} Nedfa</span> · {tx(lang, 'ساخته‌شده در هلند برای فارسی‌زبانان', 'Gemaakt in Nederland voor Farsi-sprekenden')}</p>
    </footer>
  );
}
