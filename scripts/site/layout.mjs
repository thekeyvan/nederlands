// Shared HTML for the public pages in Persian (/) and Dutch (/nl/): head with SEO tags, header, footer, blocks.
export const SITE = 'https://nedfa.nl';
export const BRAND_FA = 'نِدفا';
export const EMAIL = 'hallo@nedfa.nl';
export const LANGS = ['fa', 'nl'];

const entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
export const esc = (text = '') => String(text).replace(/[&<>"']/g, (char) => entities[char]);
/** Pick the Persian or Dutch text. */
export const tx = (lang, fa, nlText) => (lang === 'fa' ? fa : nlText);
/** A path in the given language: Persian pages live at the root, Dutch ones under /nl/. */
export const at = (lang, path) => (lang === 'fa' ? path : `/nl${path}`);
/** Numbers in Persian digits on Persian pages. */
export const num = (lang, value) => Number(value).toLocaleString(lang === 'fa' ? 'fa-IR' : 'nl-NL');
/** A Dutch fragment: left-to-right, Dutch font, read as Dutch by screen readers. */
export const nl = (text, className = '') => `<span lang="nl" dir="ltr" class="${className}">${esc(text)}</span>`;
/** A Persian fragment inside a Dutch page. */
export const fa = (text, className = '') => `<span lang="fa" dir="rtl" class="${className}">${esc(text)}</span>`;

const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * A full page in one language. `path` is the language-neutral path ("/", "/woorden/werk/"); the page is written
 * at at(lang, path) and links to its other-language twin. `jsonLd` is an array of schema.org objects.
 */
export function page({lang, path, title, description, image = '/img/og.jpg', jsonLd = [], body, assets, breadcrumbs}) {
  const url = SITE + at(lang, path);
  const other = lang === 'fa' ? 'nl' : 'fa';
  const crumbs = breadcrumbs ? [{'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map(([name, href], index) => ({'@type': 'ListItem', position: index + 1, name, item: SITE + at(lang, href)}))}] : [];
  return `<!doctype html>
<html lang="${lang}" dir="${lang === 'fa' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fa" href="${SITE}${at('fa', path)}">
<link rel="alternate" hreflang="nl" href="${SITE}${at('nl', path)}">
<link rel="alternate" hreflang="x-default" href="${SITE}${at('fa', path)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="#fcfaf6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111a28" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nedfa">
<meta property="og:locale" content="${lang === 'fa' ? 'fa_IR' : 'nl_NL'}">
<meta property="og:locale:alternate" content="${lang === 'fa' ? 'nl_NL' : 'fa_IR'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}${image}">
<meta name="apple-itunes-app" content="app-id=6834940847">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt">
${assets.css.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n')}
<script type="module" src="${assets.js}"></script>
${[...jsonLd, ...crumbs].map((data) => `<script type="application/ld+json">${json(data)}</script>`).join('\n')}
</head>
<body class="bg-background text-foreground antialiased">
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">${tx(lang, 'رفتن به محتوا', 'Naar de inhoud')}</a>
${header(lang, path, other)}
<main id="main">
${breadcrumbs ? crumbNav(lang, breadcrumbs) : ''}${body}
</main>
${footer(lang)}
</body>
</html>
`;
}

/** The mascot logo, as used in the app. */
export const logo = (className = 'size-9') => `<img src="/img/logo.png" alt="" width="72" height="72" class="${className} rounded-xl">`;

function header(lang, path, other) {
  const links = [['/woorden/', tx(lang, 'لغات هلندی', 'Woorden')], ['/grammatica/', tx(lang, 'گرامر', 'Grammatica')], ['/inburgering/', tx(lang, 'آزمون اینبورخرینگ', 'Inburgering')]];
  const current = (href) => path.startsWith(href);
  const navLink = (href, label, mobile) => `<a href="${at(lang, href)}" class="${mobile ? 'shrink-0 rounded-md px-3 py-1 text-sm font-medium' : 'rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted'}${current(href) ? ' bg-muted' : ''}"${current(href) ? ' aria-current="page"' : ''}>${label}</a>`;
  const switcher = `<a href="${at(other, path)}" hreflang="${other}" lang="${other}" class="rounded-md border px-2.5 py-1.5 text-sm font-semibold hover:bg-muted" aria-label="${other === 'nl' ? 'Nederlands' : 'فارسی'}">${other === 'nl' ? 'NL' : 'فا'}</a>`;
  return `<header class="sticky top-0 z-30 border-b bg-background/90 backdrop-blur" style="padding-top:env(safe-area-inset-top)">
  <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
    <a href="${at(lang, '/')}" class="flex items-center gap-2.5 font-bold" aria-label="${tx(lang, 'Nedfa، صفحهٔ اصلی', 'Nedfa, home')}">${logo()}<span class="text-lg" lang="nl">nedfa</span></a>
    <nav aria-label="${tx(lang, 'منوی اصلی', 'Hoofdmenu')}" class="hidden items-center gap-1 md:flex">${links.map(([href, label]) => navLink(href, label, false)).join('')}</nav>
    <div class="flex items-center gap-2">${switcher}<a href="/leren.html" class="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_3px_0_var(--primary-edge)] transition active:translate-y-0.5 active:shadow-none">${tx(lang, 'شروع رایگان', 'Gratis beginnen')}</a></div>
  </div>
  <nav aria-label="${tx(lang, 'منوی اصلی', 'Hoofdmenu')}" class="no-scrollbar flex gap-1 overflow-x-auto border-t px-3 py-1.5 md:hidden">${links.map(([href, label]) => navLink(href, label, true)).join('')}</nav>
</header>`;
}

function crumbNav(lang, breadcrumbs) {
  return `<nav aria-label="${tx(lang, 'مسیر صفحه', 'Kruimelpad')}" class="mx-auto max-w-6xl px-4 pt-5 text-sm text-muted-foreground sm:px-6">
  <ol class="flex flex-wrap items-center gap-1.5">
    ${breadcrumbs.map(([name, href], index) => index === breadcrumbs.length - 1 ? `<li aria-current="page" class="font-medium text-foreground"><bdi>${esc(name)}</bdi></li>` : `<li><a href="${at(lang, href)}" class="hover:text-foreground hover:underline"><bdi>${esc(name)}</bdi></a></li><li aria-hidden="true">${tx(lang, '‹', '›')}</li>`).join('')}
  </ol>
</nav>
`;
}

function footer(lang) {
  const item = (href, label) => `<li><a class="hover:text-foreground" href="${href}">${label}</a></li>`;
  return `<footer class="mt-20 border-t bg-sidebar">
  <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
    <div>
      <p class="flex items-center gap-2 font-bold">${logo('size-8')}<span lang="nl">nedfa</span></p>
      <p class="mt-3 text-sm text-muted-foreground">${tx(lang, `${BRAND_FA}: آموزش رایگان زبان هلندی برای فارسی‌زبانان، از سطح A2 تا B1. هر روز چند دقیقه، با تلفظ هلندی و ترجمهٔ فارسی.`, 'Nedfa: gratis Nederlands leren voor Perzisch sprekenden, van A2 naar B1. Elke dag een paar minuten, met Nederlandse audio en Perzische vertaling.')}</p>
    </div>
    <div>
      <p class="text-sm font-bold">${tx(lang, 'یادگیری', 'Leren')}</p>
      <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
        ${item(at(lang, '/woorden/'), tx(lang, 'لغات هلندی به فارسی', 'Nederlandse woorden'))}
        ${item(at(lang, '/grammatica/'), tx(lang, 'گرامر زبان هلندی', 'Nederlandse grammatica'))}
        ${item(at(lang, '/inburgering/'), tx(lang, 'آزمون اینبورخرینگ', 'Inburgeringsexamen'))}
        ${item('/leren.html', tx(lang, 'تمرین در اپ', 'Oefenen in de app'))}
      </ul>
    </div>
    <div>
      <p class="text-sm font-bold">${tx(lang, 'اپ نِدفا', 'De app')}</p>
      <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
        ${item('/leren.html', tx(lang, 'نسخهٔ وب (رایگان)', 'Webversie (gratis)'))}
        <li>${tx(lang, 'اپ آیفون: به‌زودی در App Store', 'iPhone-app: binnenkort in de App Store')}</li>
        ${item('/privacy.html', '<span lang="nl">Privacy</span>')}
        ${item(at(lang === 'fa' ? 'nl' : 'fa', '/'), lang === 'fa' ? '<span lang="nl">Nederlands</span>' : '<span lang="fa">فارسی</span>')}
      </ul>
    </div>
    <div>
      <p class="text-sm font-bold">${tx(lang, 'تماس', 'Contact')}</p>
      <p class="mt-3 text-sm text-muted-foreground">${tx(lang, 'سؤال یا پیشنهاد دارید؟ برای ما بنویسید:', 'Een vraag of idee? Mail ons:')}</p>
      <p class="mt-1 text-sm font-medium" dir="ltr" lang="nl">${EMAIL}</p>
    </div>
  </div>
  <p class="border-t py-4 text-center text-xs text-muted-foreground"><span lang="nl">© ${new Date().getFullYear()} Nedfa</span> · ${tx(lang, 'ساخته‌شده در هلند برای فارسی‌زبانان', 'Gemaakt in Nederland voor Perzisch sprekenden')}</p>
</footer>`;
}

/** A primary call to action that opens the app. */
export const cta = (lang, href, label, className = '') => `<a href="${href}" class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-[0_4px_0_var(--primary-edge)] transition active:translate-y-1 active:shadow-none ${className}">${label}<span aria-hidden="true">${tx(lang, '←', '→')}</span></a>`;
export const ghost = (href, label, className = '') => `<a href="${href}" class="inline-flex h-12 items-center justify-center rounded-xl border bg-card px-6 text-base font-semibold shadow-[0_4px_0_var(--border)] transition active:translate-y-1 active:shadow-none ${className}">${label}</a>`;
