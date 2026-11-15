// Shared HTML for the public pages: head with SEO tags, header, footer and small building blocks.
export const SITE = 'https://nedfa.nl';
export const BRAND_FA = 'نِدفا';
export const EMAIL = 'hallo@nedfa.nl';

const entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
export const esc = (text = '') => String(text).replace(/[&<>"']/g, (char) => entities[char]);
/** Numbers in Persian digits for Persian sentences. */
export const n = (value) => Number(value).toLocaleString('fa-IR');
/** A Dutch fragment inside Persian text: left-to-right, Dutch font, read as Dutch by screen readers. */
export const nl = (text, className = '') => `<span lang="nl" dir="ltr" class="${className}">${esc(text)}</span>`;

const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * A full page. `path` is the canonical path ("/", "/woorden/werk/"), `jsonLd` an array of schema.org objects.
 * `assets` holds the hashed stylesheet and script from the Vite build.
 */
export function page({path, title, description, image = '/img/og.jpg', jsonLd = [], body, assets, breadcrumbs}) {
  const url = SITE + path;
  const crumbs = breadcrumbs ? [{'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map(([name, href], index) => ({'@type': 'ListItem', position: index + 1, name, item: SITE + href}))}] : [];
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="fa" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="#fcfaf6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111a28" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nedfa · ${BRAND_FA}">
<meta property="og:locale" content="fa_IR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}${image}">
<meta name="apple-itunes-app" content="app-id=6834940847">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt">
${assets.css.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n')}
<script type="module" src="${assets.js}"></script>
${[...jsonLd, ...crumbs].map((data) => `<script type="application/ld+json">${json(data)}</script>`).join('\n')}
</head>
<body class="bg-background text-foreground antialiased">
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">رفتن به محتوا</a>
${header(path)}
<main id="main">
${breadcrumbs ? crumbNav(breadcrumbs) : ''}${body}
</main>
${footer()}
</body>
</html>
`;
}

function header(path) {
  const links = [['/woorden/', 'لغات هلندی'], ['/grammatica/', 'گرامر'], ['/inburgering/', 'آزمون اینبورخرینگ']];
  return `<header class="sticky top-0 z-30 border-b bg-background/90 backdrop-blur" style="padding-top:env(safe-area-inset-top)">
  <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
    <a href="/" class="flex items-center gap-2.5 font-bold" aria-label="Nedfa، صفحهٔ اصلی">
      <span class="grid size-9 place-items-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground shadow-[0_3px_0_var(--primary-edge)]" lang="nl">n.</span>
      <span class="text-lg" lang="nl">nedfa</span>
    </a>
    <nav aria-label="منوی اصلی" class="hidden items-center gap-1 md:flex">
      ${links.map(([href, label]) => `<a href="${href}" class="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted${path.startsWith(href) ? ' bg-muted' : ''}"${path.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
    <a href="/leren.html" class="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_3px_0_var(--primary-edge)] transition active:translate-y-0.5 active:shadow-none">شروع رایگان</a>
  </div>
  <nav aria-label="منوی اصلی" class="no-scrollbar flex gap-1 overflow-x-auto border-t px-3 py-1.5 md:hidden">
    ${links.map(([href, label]) => `<a href="${href}" class="shrink-0 rounded-md px-3 py-1 text-sm font-medium${path.startsWith(href) ? ' bg-muted' : ''}">${label}</a>`).join('')}
  </nav>
</header>`;
}

function crumbNav(breadcrumbs) {
  return `<nav aria-label="مسیر صفحه" class="mx-auto max-w-6xl px-4 pt-5 text-sm text-muted-foreground sm:px-6">
  <ol class="flex flex-wrap items-center gap-1.5">
    ${breadcrumbs.map(([name, href], index) => index === breadcrumbs.length - 1 ? `<li aria-current="page" class="font-medium text-foreground"><bdi>${esc(name)}</bdi></li>` : `<li><a href="${href}" class="hover:text-foreground hover:underline"><bdi>${esc(name)}</bdi></a></li><li aria-hidden="true">‹</li>`).join('')}
  </ol>
</nav>
`;
}

function footer() {
  return `<footer class="mt-20 border-t bg-sidebar">
  <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
    <div>
      <p class="flex items-center gap-2 font-bold"><span class="grid size-8 place-items-center rounded-full bg-primary font-extrabold text-primary-foreground" lang="nl">n.</span><span lang="nl">nedfa</span></p>
      <p class="mt-3 text-sm text-muted-foreground">${BRAND_FA}: آموزش رایگان زبان هلندی برای فارسی‌زبانان، از سطح A2 تا B1. هر روز چند دقیقه، با تلفظ هلندی و ترجمهٔ فارسی.</p>
    </div>
    <div>
      <p class="text-sm font-bold">یادگیری</p>
      <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
        <li><a class="hover:text-foreground" href="/woorden/">لغات هلندی به فارسی</a></li>
        <li><a class="hover:text-foreground" href="/grammatica/">گرامر زبان هلندی</a></li>
        <li><a class="hover:text-foreground" href="/inburgering/">آزمون اینبورخرینگ</a></li>
        <li><a class="hover:text-foreground" href="/leren.html">تمرین در اپ</a></li>
      </ul>
    </div>
    <div>
      <p class="text-sm font-bold">اپ نِدفا</p>
      <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
        <li><a class="hover:text-foreground" href="/leren.html">نسخهٔ وب (رایگان)</a></li>
        <li>اپ آیفون: به‌زودی در App Store</li>
        <li><a class="hover:text-foreground" href="/privacy.html" lang="nl">Privacy</a></li>
      </ul>
    </div>
    <div>
      <p class="text-sm font-bold">تماس</p>
      <p class="mt-3 text-sm text-muted-foreground">سؤال یا پیشنهاد دارید؟ برای ما بنویسید:</p>
      <p class="mt-1 text-sm font-medium" dir="ltr" lang="nl">${EMAIL}</p>
    </div>
  </div>
  <p class="border-t py-4 text-center text-xs text-muted-foreground"><span lang="nl">© ${new Date().getFullYear()} Nedfa</span> · ساخته‌شده در هلند برای فارسی‌زبانان</p>
</footer>`;
}

/** A primary call to action that opens the app. */
export const cta = (href, label, className = '') => `<a href="${href}" class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-[0_4px_0_var(--primary-edge)] transition active:translate-y-1 active:shadow-none ${className}">${label}<span aria-hidden="true">←</span></a>`;
export const ghost = (href, label, className = '') => `<a href="${href}" class="inline-flex h-12 items-center justify-center rounded-xl border bg-card px-6 text-base font-semibold shadow-[0_4px_0_var(--border)] transition active:translate-y-1 active:shadow-none ${className}">${label}</a>`;
