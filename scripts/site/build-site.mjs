// Writes the public, indexable pages after `vite build`: a Persian landing page, one page per theme and per
// grammar pattern, an inburgering guide, plus sitemap.xml, robots.txt, llms.txt and llms-full.txt.
// Everything comes from the same lesson content as the app, so the pages stay in step with it.
import {copyFile, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {BRAND_FA, EMAIL, SITE, cta, esc, ghost, n, nl, page} from './layout.mjs';
import {groups, kindFa, patterns, themes, totals} from './content.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const today = new Date().toISOString().slice(0, 10);
const organization = {'@type': 'Organization', '@id': `${SITE}/#org`, name: 'Nedfa', alternateName: BRAND_FA, url: SITE, logo: `${SITE}/icon-512.png`, email: EMAIL};
const appLink = (query = '') => `/leren.html${query}`;
const themeUrl = (theme) => `/woorden/${theme.id}/`;
const patternUrl = (pattern) => `/grammatica/${pattern.slug}/`;
const themeImage = (theme) => `/img/themes/${theme.id}.jpg`;

/** Where each page and file goes, for the sitemap. */
const urls = [];
async function write(dist, pagePath, html, priority = '0.7') {
  const file = path.join(dist, pagePath, pagePath.endsWith('/') ? 'index.html' : '');
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, html);
  urls.push({path: pagePath, priority});
}

export async function buildSite(dist) {
  const manifest = JSON.parse(await readFile(path.join(dist, '.vite/manifest.json'), 'utf8'));
  const entry = manifest['src/site/site.ts'];
  const assets = {js: `/${entry.file}`, css: entry.css.map((file) => `/${file}`)};
  await copyImages(dist);
  await write(dist, '/', home(assets), '1.0');
  await write(dist, '/woorden/', themeIndex(assets), '0.9');
  for (const theme of themes) await write(dist, themeUrl(theme), themePage(theme, assets), '0.8');
  await write(dist, '/grammatica/', grammarIndex(assets), '0.9');
  for (const pattern of patterns) await write(dist, patternUrl(pattern), patternPage(pattern, assets), '0.7');
  await write(dist, '/inburgering/', inburgeringPage(assets), '0.8');
  urls.push({path: '/privacy.html', priority: '0.2'});
  await writeFile(path.join(dist, 'sitemap.xml'), sitemap());
  await writeFile(path.join(dist, 'robots.txt'), robots());
  await writeFile(path.join(dist, 'llms.txt'), llms());
  await writeFile(path.join(dist, 'llms-full.txt'), llmsFull());
  await rm(path.join(dist, '.vite'), {recursive: true, force: true});
  console.log(`Public site: ${urls.length} pages, sitemap, robots.txt and llms.txt.`);
}

/** Theme scenes from the app, plus the landing illustrations, under stable public URLs. */
async function copyImages(dist) {
  const from = path.join(ROOT, 'src/assets/illustrations/themes');
  await mkdir(path.join(dist, 'img/themes'), {recursive: true});
  for (const file of await readdir(from)) if (file.endsWith('.jpg')) await copyFile(path.join(from, file), path.join(dist, 'img/themes', file));
  for (const file of await readdir(path.join(ROOT, 'src/site/img'))) await copyFile(path.join(ROOT, 'src/site/img', file), path.join(dist, 'img', file));
}

/* ------------------------------------------------------------------ blocks */

const section = (inner, className = '') => `<section class="mx-auto max-w-6xl px-4 sm:px-6 ${className}">${inner}</section>`;
const h2 = (text, id = '') => `<h2${id ? ` id="${id}"` : ''} class="text-2xl font-extrabold tracking-tight sm:text-3xl">${text}</h2>`;

function themeCard(theme) {
  return `<li><a href="${themeUrl(theme)}" class="group flex items-center gap-3 rounded-xl border bg-card p-2.5 transition hover:border-primary/40 hover:bg-accent/40">
    <img src="${themeImage(theme)}" alt="" width="56" height="56" loading="lazy" class="size-14 shrink-0 rounded-lg object-cover">
    <span class="min-w-0">
      <span class="block font-bold">${esc(theme.fa)}</span>
      <span class="block truncate text-xs text-muted-foreground">${nl(theme.title)} · ${n(theme.words.length)} لغت</span>
    </span>
  </a></li>`;
}

function faq(items) {
  return {
    html: `<div class="divide-y rounded-2xl border bg-card">${items.map(([q, a]) => `<details class="group p-4 sm:p-5"><summary class="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">${esc(q)}<span aria-hidden="true" class="text-muted-foreground transition group-open:rotate-45">+</span></summary><p class="mt-2 text-muted-foreground">${a}</p></details>`).join('')}</div>`,
    schema: {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a.replace(/<[^>]+>/g, '')}}))},
  };
}

/* -------------------------------------------------------------------- home */

function home(assets) {
  const questions = faq([
    ['آیا نِدفا رایگان است؟', `بله. نسخهٔ وب و اپ آیفون نِدفا رایگان هستند و تبلیغ ندارند. می‌توانید بدون حساب کاربری شروع کنید.`],
    ['نِدفا برای چه سطحی مناسب است؟', `برای کسانی که الفبای هلندی را می‌شناسند یا دورهٔ مقدماتی را گذرانده‌اند و می‌خواهند از سطح A2 به B1 برسند؛ مثلاً در کنار کلاس زبان یا برای آمادگی آزمون.`],
    ['آیا برای آزمون اینبورخرینگ (هم‌پذیری) کمک می‌کند؟', `نِدفا موضوعات زندگی روزمره را تمرین می‌کند که در آزمون‌های شنیدن، خواندن، نوشتن و صحبت کردن می‌آیند: پزشک، شهرداری، کار، خانه و خرید. <a class="text-primary underline" href="/inburgering/">راهنمای آزمون اینبورخرینگ</a> را هم ببینید.`],
    ['ترجمه‌ها به فارسی است؟', `بله. همهٔ ${n(totals.words)} لغت، جمله‌ها و نکته‌های گرامری ترجمه و توضیح فارسی دارند و هر جملهٔ هلندی را می‌توانید با صدای هلندی بشنوید.`],
    ['روی آیفون و کامپیوتر کار می‌کند؟', `بله. نسخهٔ وب روی هر مرورگری کار می‌کند و اپ آیفون به‌زودی در App Store است. با ورود از طریق اپل یا گوگل، پیشرفت شما بین گوشی و کامپیوتر همگام می‌شود.`],
    ['یادگیری زبان هلندی برای فارسی‌زبان‌ها سخت است؟', `هلندی الفبای لاتین و ترتیب کلمات متفاوتی دارد، اما با تمرین روزانهٔ کوتاه به‌خوبی یاد گرفته می‌شود. نکته‌های مهم مثل ${nl('de')} و ${nl('het')}، جای فعل در جمله و افعال جداشدنی را در <a class="text-primary underline" href="/grammatica/">بخش گرامر</a> به فارسی توضیح داده‌ایم.`],
  ]);
  const features = [
    ['🎧', 'لغت با تلفظ هلندی', `${n(totals.words)} لغت و اصطلاح در ${n(totals.themes)} موضوع روزمره، هر کدام با جملهٔ مثال، ترجمهٔ فارسی و صدای هلندی.`],
    ['🔁', 'مرور هوشمند', 'کارت‌ها درست وقتی برمی‌گردند که در حال فراموش کردنشان هستید (روش SM-2). روزی پنج دقیقه کافی است.'],
    ['🧩', 'گرامر به زبان ساده', `${n(totals.patterns)} الگوی گرامری با توضیح فارسی و ${n(totals.examples)} جملهٔ مثال، و برای هر الگو شش تمرین کوتاه.`],
    ['🎮', 'هفت بازی آموزشی', `${nl('de')} یا ${nl('het')}، ساختن جمله، افعال گذشته، دیکته، مکالمه و مسابقهٔ زمان‌دار.`],
  ].map(([icon, title, text]) => `<li class="rounded-2xl border bg-card p-5"><span aria-hidden="true" class="text-2xl">${icon}</span><h3 class="mt-2 text-lg font-bold">${title}</h3><p class="mt-1 text-sm text-muted-foreground">${text}</p></li>`).join('');
  const featured = ['de-of-het', 'v2', 'perfectum', 'omdat', 'scheidbaar', 'dat'].map((slug) => patterns.find((p) => p.slug === slug)).filter(Boolean);
  const body = `
${section(`<div class="grid items-center gap-8 py-10 md:grid-cols-[1.1fr_1fr] md:py-16">
  <div>
    <p class="text-sm font-bold text-primary">رایگان · برای فارسی‌زبانان · سطح A2 تا B1</p>
    <h1 class="mt-3 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">آموزش زبان هلندی به فارسی، هر روز چند دقیقه</h1>
    <p class="mt-4 text-lg text-muted-foreground">${BRAND_FA} (${nl('Nedfa')}) اپ رایگان یادگیری زبان هلندی برای ایرانی‌ها و فارسی‌زبانان است: لغت با تلفظ هلندی، جمله‌های کاربردی برای زندگی در هلند، گرامر به زبان ساده و آمادگی برای آزمون اینبورخرینگ.</p>
    <div class="mt-6 flex flex-wrap gap-3">${cta(appLink(), 'شروع رایگان در مرورگر')}${ghost('/woorden/', 'دیدن لغات هلندی')}</div>
    <p class="mt-3 text-sm text-muted-foreground">بدون ثبت‌نام شروع کنید. اپ آیفون به‌زودی در App Store.</p>
  </div>
  <img src="/img/hero.webp" alt="مسکات نِدفا جلوی خانه‌های هلندی با دوچرخه، آسیاب بادی، گل لاله و یک استکان چای" width="1536" height="1024" fetchpriority="high" class="w-full rounded-3xl">
</div>`)}
${section(`<ul class="grid grid-cols-2 gap-3 rounded-2xl bg-secondary p-5 text-center text-secondary-foreground sm:grid-cols-4">
  ${[[totals.words, 'لغت و اصطلاح'], [totals.phrases, 'جملهٔ کاربردی'], [totals.patterns, 'نکتهٔ گرامری'], [totals.themes, 'موضوع روزمره']].map(([value, label]) => `<li><span class="block text-3xl font-extrabold">${n(value)}</span><span class="text-sm opacity-80">${label}</span></li>`).join('')}
</ul>`)}
${section(`${h2('چرا نِدفا برای یادگیری هلندی؟')}
<p class="mt-2 max-w-3xl text-muted-foreground">بیشتر اپ‌های آموزش زبان هلندی به انگلیسی هستند. در نِدفا همه‌چیز به فارسی توضیح داده شده و موضوعات همان چیزهایی است که در هلند هر روز لازم دارید.</p>
<ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${features}</ul>`, 'mt-16')}
${section(`<div class="flex flex-wrap items-end justify-between gap-3">${h2('لغات هلندی بر اساس موضوع')}<a href="/woorden/" class="text-sm font-bold text-primary">همهٔ ${n(totals.themes)} موضوع ←</a></div>
<ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${themes.slice(0, 12).map(themeCard).join('')}</ul>`, 'mt-16')}
${section(`<div class="grid gap-6 rounded-3xl border bg-card p-6 md:grid-cols-2 md:p-8">
  <div>
    ${h2('گرامر هلندی، به فارسی و با مثال')}
    <p class="mt-2 text-muted-foreground">جای فعل در جمله، ${nl('omdat')} و ${nl('want')}، زمان گذشته، افعال جداشدنی و ${n(totals.patterns)} الگوی دیگر؛ هر کدام با چهار جملهٔ مثال و ترجمهٔ فارسی.</p>
    <div class="mt-4">${ghost('/grammatica/', 'همهٔ نکته‌های گرامری')}</div>
  </div>
  <ul class="grid gap-2">${featured.map((p) => `<li><a href="${patternUrl(p)}" class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted"><span>${nl(p.title, 'font-semibold')}</span><span class="text-xs text-muted-foreground">${p.level}</span></a></li>`).join('')}</ul>
</div>`, 'mt-16')}
${section(`${h2('در سه قدم شروع کنید')}
<ol class="mt-6 grid gap-4 sm:grid-cols-3">
  ${[['یک موضوع انتخاب کنید', 'مثلاً «پیش پزشک خانواده» یا «در سوپرمارکت»، و لغت‌ها را با صدای هلندی گوش کنید.'], ['هر روز یک دور کوتاه', 'پنج تا ده کارت: انتخاب، گوش دادن، تایپ کردن. جواب درست و غلط را بلافاصله می‌بینید.'], ['پیشرفت را ببینید', 'رکورد روزانه، امتیاز، ستاره برای هر موضوع و یک مسیر هشت‌مرحله‌ای از A2 تا B1.']].map(([title, text], index) => `<li class="rounded-2xl border bg-card p-5"><span class="grid size-9 place-items-center rounded-full bg-primary font-bold text-primary-foreground">${n(index + 1)}</span><h3 class="mt-3 font-bold">${title}</h3><p class="mt-1 text-sm text-muted-foreground">${text}</p></li>`).join('')}
</ol>`, 'mt-16')}
${section(`<div class="grid items-center gap-6 rounded-3xl bg-accent p-6 text-accent-foreground md:grid-cols-[1fr_auto] md:p-8">
  <div>${h2('آماده‌شدن برای آزمون اینبورخرینگ')}<p class="mt-2">آزمون هم‌پذیری هلند (${nl('inburgeringsexamen')}) چه بخش‌هایی دارد، چه سطحی لازم است و چطور با تمرین روزانه آماده شوید.</p></div>
  ${ghost('/inburgering/', 'خواندن راهنما')}
</div>`, 'mt-16')}
${section(`${h2('پرسش‌های رایج', 'faq')}<div class="mt-6">${questions.html}</div>`, 'mt-16')}
${section(`<div lang="nl" dir="ltr" class="rounded-2xl border p-5 text-start text-sm text-muted-foreground"><p><strong class="text-foreground">Nedfa</strong> is een gratis app om Nederlands te leren voor Perzisch sprekenden (Iraniërs en Afghanen die Farsi of Dari spreken), van A2 naar B1: woorden met audio, zinnen, grammatica en spellen, met Perzische vertalingen.</p></div>`, 'mt-10')}
${section(`<div class="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-secondary px-6 py-10 text-center text-secondary-foreground">
  <h2 class="text-2xl font-extrabold sm:text-3xl">همین امروز اولین دور را شروع کنید</h2>
  <p class="opacity-80">پنج کارت، کمتر از دو دقیقه. رایگان و بدون ثبت‌نام.</p>
  ${cta(appLink(), 'شروع یادگیری هلندی')}
</div>`)}
`;
  return page({
    path: '/', assets, body,
    title: 'آموزش زبان هلندی به فارسی | اپ رایگان نِدفا (A2 تا B1)',
    description: `یادگیری زبان هلندی برای فارسی‌زبانان: ${n(totals.words)} لغت با تلفظ و ترجمهٔ فارسی، جملات کاربردی، گرامر هلندی به زبان ساده، بازی و آمادگی آزمون اینبورخرینگ. رایگان در وب و آیفون.`,
    jsonLd: [
      {'@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: 'Nedfa', alternateName: [BRAND_FA, 'نِدفا: آموزش زبان هلندی'], inLanguage: 'fa', publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', ...organization},
      {'@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Nedfa: Nederlands leren', alternateName: BRAND_FA, applicationCategory: 'EducationalApplication', operatingSystem: 'iOS, Web', url: SITE, inLanguage: ['fa', 'nl'], offers: {'@type': 'Offer', price: 0, priceCurrency: 'EUR'}, publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', '@type': 'Course', name: 'آموزش زبان هلندی برای فارسی‌زبانان (A2 تا B1)', description: 'دورهٔ رایگان و خودآموز زبان هلندی با توضیح فارسی: لغات روزمره با تلفظ، جملات کاربردی، گرامر و مکالمه.', inLanguage: 'fa', teaches: 'زبان هلندی (Nederlands)', educationalLevel: 'A2–B1', isAccessibleForFree: true, provider: {'@id': `${SITE}/#org`}, offers: {'@type': 'Offer', price: 0, priceCurrency: 'EUR', category: 'Free'}, hasCourseInstance: {'@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT10M'}},
      questions.schema,
    ],
  });
}

/* ------------------------------------------------------------------ themes */

function themeIndex(assets) {
  const body = `
${section(`<h1 class="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">لغات هلندی به فارسی، بر اساس موضوع</h1>
<p class="mt-3 max-w-3xl text-muted-foreground">${n(totals.words)} لغت و اصطلاح پرکاربرد هلندی در ${n(totals.themes)} موضوع زندگی روزمره، هر کدام با حرف تعریف (${nl('de')} یا ${nl('het')})، معنی فارسی، جملهٔ مثال و ترجمه. برای هر موضوع جمله‌های کاربردی و یک مکالمهٔ کوتاه هم هست.</p>`)}
${groups.map((group) => section(`${h2(group.fa)}<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${themes.filter((theme) => theme.group === group.id).map(themeCard).join('')}</ul>`, 'mt-10')).join('\n')}
${section(`<div class="mt-12 rounded-2xl border bg-card p-6"><h2 class="text-xl font-bold">تمرین با تلفظ و مرور هوشمند</h2><p class="mt-1 text-muted-foreground">در اپ نِدفا هر لغت را می‌شنوید، انتخاب یا تایپ می‌کنید و در زمان درست دوباره مرور می‌کنید.</p><div class="mt-4">${cta(appLink('#woorden'), 'تمرین لغات در اپ')}</div></div>`)}
`;
  return page({
    path: '/woorden/', assets, body,
    title: `لغات هلندی به فارسی: ${n(totals.words)} لغت پرکاربرد در ${n(totals.themes)} موضوع | نِدفا`,
    description: `فهرست لغات پرکاربرد هلندی با معنی فارسی، حرف تعریف de/het، جملهٔ مثال و تلفظ: کار، خانه، خرید، پزشک، شهرداری، سفر و ${n(totals.themes - 6)} موضوع دیگر.`,
    breadcrumbs: [['نِدفا', '/'], ['لغات هلندی', '/woorden/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'CollectionPage', name: 'لغات هلندی به فارسی بر اساس موضوع', inLanguage: 'fa', isPartOf: {'@id': `${SITE}/#website`}, hasPart: themes.map((theme) => ({'@type': 'WebPage', name: `لغات هلندی: ${theme.fa}`, url: SITE + themeUrl(theme)}))}],
  });
}

function themePage(theme, assets) {
  const related = themes.filter((item) => item.group === theme.group && item.id !== theme.id).slice(0, 6);
  const rows = theme.words.map((word) => `<li class="grid gap-x-4 gap-y-1 border-t py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
    <div><span lang="nl" dir="ltr" class="font-semibold">${esc(word.nl)}</span><span class="block text-xs text-muted-foreground">${kindFa[word.kind] ?? ''}${word.forms ? ` · ${nl(`${word.forms[0]} – ${word.forms[1]}`)}` : ''}</span></div>
    <div class="font-medium">${esc(word.meaning ?? '')}</div>
    <div class="text-sm"><span lang="nl" dir="ltr" class="block text-start">${esc(word.example ?? '')}</span><span class="block text-muted-foreground">${esc(word.translation ?? '')}</span></div>
  </li>`).join('');
  const body = `
${section(`<div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
  <img src="${themeImage(theme)}" alt="" width="520" height="520" class="size-28 shrink-0 rounded-2xl border object-cover sm:size-36">
  <div>
    <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">لغات هلندی: ${esc(theme.fa)}</h1>
    <p class="mt-1 text-lg">${nl(theme.title, 'font-semibold text-muted-foreground')}</p>
    <p class="mt-2 text-muted-foreground">${n(theme.words.length)} لغت و اصطلاح، ${n(theme.phrases.length)} جملهٔ کاربردی و یک مکالمهٔ کوتاه دربارهٔ «${esc(theme.fa)}»، با معنی فارسی و جملهٔ مثال.</p>
  </div>
</div>
<div class="mt-5">${cta(appLink(`?thema=${theme.id}#woorden`), 'تمرین این لغات با تلفظ')}</div>`)}
${section(`${h2('لغات', 'woorden')}
<ul class="mt-4 rounded-2xl border bg-card px-4">${rows}</ul>`, 'mt-10')}
${theme.phrases.length ? section(`${h2('جمله‌های کاربردی', 'zinnen')}
<ul class="mt-4 grid gap-3 md:grid-cols-2">${theme.phrases.map((phrase) => `<li class="rounded-xl border bg-card p-4"><p lang="nl" dir="ltr" class="text-start text-lg font-semibold">${esc(phrase.nl)}</p><p class="mt-1 text-muted-foreground">${esc(phrase.meaning ?? '')}</p></li>`).join('')}</ul>`, 'mt-10') : ''}
${theme.dialogue.length ? section(`${h2('مکالمهٔ کوتاه', 'gesprek')}
<ol class="mt-4 flex max-w-2xl flex-col gap-3">${theme.dialogue.map((line) => `<li class="rounded-2xl border bg-card p-4${line.speaker === 'Jij' ? ' ms-8 bg-accent/40' : ' me-8'}"><span class="text-xs font-bold text-muted-foreground">${line.speaker === 'Jij' ? 'شما' : nl(line.speaker)}</span><p lang="nl" dir="ltr" class="text-start font-semibold">${esc(line.nl)}</p><p class="text-sm text-muted-foreground">${esc(line.translation)}</p></li>`).join('')}</ol>`, 'mt-10') : ''}
${section(`<div class="mt-12 rounded-2xl bg-secondary p-6 text-secondary-foreground"><h2 class="text-xl font-bold">این لغات را حفظ کنید، نه فقط بخوانید</h2><p class="mt-1 opacity-80">در اپ نِدفا لغت‌های «${esc(theme.fa)}» را می‌شنوید، انتخاب و تایپ می‌کنید و با بازی ${nl('de')} یا ${nl('het')} تمرین می‌کنید.</p><div class="mt-4">${cta(appLink(`?thema=${theme.id}#woorden`), 'شروع تمرین')}</div></div>`)}
${related.length ? section(`${h2('موضوعات مرتبط')}<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${related.map(themeCard).join('')}</ul>`, 'mt-12') : ''}
`;
  return page({
    path: themeUrl(theme), assets, body, image: themeImage(theme),
    title: `لغات هلندی ${theme.fa}: ${n(theme.words.length)} لغت با معنی فارسی | نِدفا`,
    description: `${n(theme.words.length)} لغت هلندی دربارهٔ ${theme.fa} (${theme.title}) با معنی فارسی، de یا het، جملهٔ مثال و ترجمه، به‌علاوهٔ جمله‌های کاربردی و مکالمه. تمرین رایگان با تلفظ هلندی.`,
    breadcrumbs: [['نِدفا', '/'], ['لغات هلندی', '/woorden/'], [theme.fa, themeUrl(theme)]],
    jsonLd: [
      {'@context': 'https://schema.org', '@type': 'LearningResource', name: `لغات هلندی: ${theme.fa}`, inLanguage: 'fa', learningResourceType: 'Vocabulary list', educationalLevel: 'A2–B1', teaches: `Nederlandse woorden: ${theme.title}`, isAccessibleForFree: true, image: SITE + themeImage(theme), publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', '@type': 'DefinedTermSet', name: `Nederlands–Perzisch: ${theme.title}`, inLanguage: ['nl', 'fa'], hasDefinedTerm: theme.words.map((word) => ({'@type': 'DefinedTerm', name: word.nl, description: word.meaning ?? '', inLanguage: 'nl'}))},
    ],
  });
}

/* ----------------------------------------------------------------- grammar */

function grammarIndex(assets) {
  const levels = ['A2', 'B1'];
  const body = `
${section(`<h1 class="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">گرامر زبان هلندی به فارسی</h1>
<p class="mt-3 max-w-3xl text-muted-foreground">${n(totals.patterns)} نکتهٔ مهم دستور زبان هلندی برای سطح A2 و B1، هر کدام با الگوی ساده، توضیح فارسی و چهار جملهٔ مثال. برای فارسی‌زبان‌ها این چهار نکته از همه مهم‌ترند:</p>
<ul class="mt-5 grid gap-3 sm:grid-cols-2">
  ${[['جای فعل', `در جملهٔ خبری هلندی فعل همیشه در جایگاه دوم است، حتی اگر جمله با زمان یا مکان شروع شود: ${nl('Morgen werk ik thuis.')}`], ['فعل در آخر جملهٔ وابسته', `بعد از ${nl('dat')}، ${nl('omdat')} و ${nl('als')} فعل به آخر جمله می‌رود؛ شبیه فارسی: ${nl('…omdat ik moe ben.')}`], [`${nl('de')} یا ${nl('het')}`, `هر اسم یکی از دو حرف تعریف را دارد و باید با خود اسم حفظ شود. اسم‌های جمع همیشه ${nl('de')} می‌گیرند.`], ['افعال جداشدنی', `در فعل‌هایی مثل ${nl('opbellen')}، بخش اول به آخر جمله می‌رود: ${nl('Ik bel je morgen op.')}`]].map(([title, text]) => `<li class="rounded-xl border bg-card p-4"><h2 class="font-bold">${title}</h2><p class="mt-1 text-sm text-muted-foreground">${text}</p></li>`).join('')}
</ul>`)}
${levels.map((level) => section(`${h2(`سطح ${level}`)}<ul class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">${patterns.filter((p) => p.level === level).map((p) => `<li><a href="${patternUrl(p)}" class="block rounded-xl border bg-card p-3.5 hover:border-primary/40 hover:bg-accent/40">${nl(p.title, 'font-bold')}<span class="mt-1 line-clamp-2 block text-sm text-muted-foreground">${esc(p.rule)}</span></a></li>`).join('')}</ul>`, 'mt-10')).join('\n')}
`;
  return page({
    path: '/grammatica/', assets, body,
    title: `گرامر زبان هلندی به فارسی: ${n(totals.patterns)} نکته با مثال (A2 تا B1) | نِدفا`,
    description: 'دستور زبان هلندی به زبان ساده برای فارسی‌زبانان: جای فعل، de و het، omdat و want، زمان گذشته (perfectum)، افعال جداشدنی و بیشتر، با مثال و ترجمهٔ فارسی.',
    breadcrumbs: [['نِدفا', '/'], ['گرامر هلندی', '/grammatica/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'CollectionPage', name: 'گرامر زبان هلندی به فارسی', inLanguage: 'fa', isPartOf: {'@id': `${SITE}/#website`}, hasPart: patterns.map((p) => ({'@type': 'WebPage', name: p.title, url: SITE + patternUrl(p)}))}],
  });
}

const highlight = (sentence, word) => {
  const safe = esc(sentence);
  if (!word) return safe;
  const pattern = new RegExp(`(^|[^\\p{L}])(${esc(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^\\p{L}]|$)`, 'u');
  return safe.replace(pattern, '$1<strong class="text-primary">$2</strong>');
};

function patternPage(pattern, assets) {
  const index = patterns.indexOf(pattern);
  const siblings = [patterns[index - 1], patterns[index + 1]].filter(Boolean);
  const body = `
${section(`<div class="mt-4 max-w-3xl">
  <span class="rounded-md border px-2 py-0.5 text-xs font-bold">${pattern.level}</span>
  <h1 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">${nl(pattern.title, 'block')}<span class="mt-1 block text-lg font-medium text-muted-foreground">گرامر زبان هلندی به فارسی</span></h1>
  <p class="mt-5 text-lg">${esc(pattern.rule)}</p>
  <p dir="ltr" lang="nl" class="mt-4 rounded-xl bg-muted px-4 py-3 text-start font-mono text-sm">${esc(pattern.pattern)}</p>
</div>`)}
${section(`<div class="max-w-3xl">${h2('مثال‌ها')}
<ul class="mt-4 divide-y rounded-2xl border bg-card">${pattern.examples.map((example) => `<li class="p-4"><p lang="nl" dir="ltr" class="text-start text-lg font-semibold">${highlight(example.nl, example.gap)}</p><p class="mt-1 text-muted-foreground">${esc(example.translation)}</p></li>`).join('')}</ul>
${pattern.note ? `<div class="mt-6 rounded-2xl bg-xp-soft p-5 text-xp-foreground"><h2 class="font-bold">نکته</h2><p class="mt-1">${esc(pattern.note)}</p></div>` : ''}
</div>`, 'mt-10')}
${section(`<div class="mt-12 max-w-3xl rounded-2xl bg-secondary p-6 text-secondary-foreground"><h2 class="text-xl font-bold">این الگو را تمرین کنید</h2><p class="mt-1 opacity-80">شش تمرین کوتاه در اپ نِدفا: جای خالی، مرتب کردن کلمات و انتخاب جملهٔ درست.</p><div class="mt-4">${cta(appLink(`?regel=${encodeURIComponent(pattern.id)}#zinnen`), 'شروع تمرین')}</div></div>`)}
${section(`<nav aria-label="نکته‌های دیگر" class="mt-10 flex max-w-3xl flex-wrap justify-between gap-3">${siblings.map((p) => `<a href="${patternUrl(p)}" class="rounded-xl border bg-card px-4 py-3 hover:bg-muted">${nl(p.title, 'font-semibold')}</a>`).join('')}<a href="/grammatica/" class="rounded-xl px-4 py-3 font-semibold text-primary">همهٔ نکته‌ها</a></nav>`)}
`;
  return page({
    path: patternUrl(pattern), assets, body,
    title: `${pattern.title} — گرامر هلندی به فارسی (${pattern.level}) | نِدفا`,
    description: `${pattern.rule} توضیح فارسی، الگو و ${n(pattern.examples.length)} جملهٔ مثال هلندی با ترجمه، و تمرین رایگان.`.slice(0, 300),
    breadcrumbs: [['نِدفا', '/'], ['گرامر هلندی', '/grammatica/'], [pattern.title, patternUrl(pattern)]],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'LearningResource', name: `${pattern.title} (گرامر هلندی)`, description: pattern.rule, inLanguage: 'fa', learningResourceType: 'Grammar explanation', educationalLevel: pattern.level, teaches: pattern.title, isAccessibleForFree: true, publisher: {'@id': `${SITE}/#org`}}],
  });
}

/* ------------------------------------------------------------- inburgering */

function inburgeringPage(assets) {
  const questions = faq([
    ['آزمون اینبورخرینگ چیست؟', `آزمون هم‌پذیری (${nl('inburgeringsexamen')}) آزمونی است که بسیاری از مهاجران در هلند باید بگذرانند. بخش زبان آن مهارت‌های شنیدن، خواندن، نوشتن و صحبت کردن به هلندی را می‌سنجد.`],
    ['چه سطحی از زبان هلندی لازم است؟', `برای کسانی که از ۱ ژانویهٔ ۲۰۲۲ به بعد مشمول قانون جدید (${nl('Wet inburgering 2021')}) شده‌اند، سطح استاندارد B1 است؛ برای برخی، طبق برنامهٔ شخصی (PIP)، مسیر دیگری تعیین می‌شود. کسانی که پیش از آن شروع کرده‌اند معمولاً تحت قانون قبلی با سطح A2 هستند. سطح دقیق خود را از شهرداری یا سایت رسمی بپرسید.`],
    ['آزمون را کجا و چطور می‌دهم؟', `آزمون‌ها را ${nl('DUO')} برگزار می‌کند. ثبت‌نام، هزینه‌ها و تاریخ‌ها را همیشه در سایت رسمی <a class="text-primary underline" href="https://www.inburgeren.nl" rel="noopener" lang="nl">inburgeren.nl</a> و <a class="text-primary underline" href="https://duo.nl" rel="noopener" lang="nl">duo.nl</a> چک کنید؛ این اطلاعات گاهی تغییر می‌کند.`],
    ['نِدفا چطور به آمادگی آزمون کمک می‌کند؟', `با تمرین روزانهٔ لغات و جمله‌های موقعیت‌های واقعی (پزشک، شهرداری، کار، خانه، مدرسه)، گوش دادن به صدای هلندی، دیکته، ساختن جمله و گرامر سطح A2 و B1. نِدفا جایگزین کلاس رسمی نیست، ولی تمرین هر روزه را ساده می‌کند.`],
  ]);
  const body = `
${section(`<div class="mt-4 grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
  <div>
    <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">آزمون اینبورخرینگ: راهنمای فارسی برای آمادگی زبان هلندی</h1>
    <p class="mt-3 text-lg text-muted-foreground">آزمون هم‌پذیری هلند (${nl('inburgeringsexamen')}) برای بسیاری از ایرانی‌ها در هلند قدم مهمی است. اینجا به زبان ساده می‌خوانید بخش زبان آزمون چه چیزهایی را می‌سنجد و چطور هر روز برایش تمرین کنید.</p>
    <div class="mt-5">${cta(appLink(), 'شروع تمرین رایگان')}</div>
  </div>
  <img src="/img/inburgering.webp" alt="مسکات نِدفا با یک گواهی‌نامه، کتاب و هدفون" width="1024" height="1024" class="mx-auto w-full max-w-xs rounded-3xl">
</div>`)}
${section(`<div class="site-prose max-w-3xl">${h2('بخش‌های زبان در آزمون')}
<ul class="mt-4 grid gap-3 sm:grid-cols-2">${[['شنیدن', nl('Luisteren'), 'گفت‌وگوها و پیام‌های کوتاه روزمره را می‌شنوید و به سؤال‌ها جواب می‌دهید.', 'luisteren'], ['خواندن', nl('Lezen'), 'متن‌های کاربردی مثل نامهٔ شهرداری، آگهی یا ایمیل را می‌خوانید.', 'lezen'], ['نوشتن', nl('Schrijven'), 'فرم پر می‌کنید و پیام یا ایمیل کوتاه می‌نویسید.', 'schrijven'], ['صحبت کردن', nl('Spreken'), 'دربارهٔ موقعیت‌های روزمره حرف می‌زنید و نظرتان را می‌گویید.', 'spreken']].map(([fa, dutch, text]) => `<li class="rounded-xl border bg-card p-4"><h3 class="font-bold">${fa} · ${dutch}</h3><p class="mt-1 text-sm text-muted-foreground">${text}</p></li>`).join('')}</ul>
<p class="mt-4 text-sm text-muted-foreground">بسته به مسیر شما، بخش‌های دیگری مثل شناخت جامعهٔ هلند (${nl('KNM')}) هم ممکن است لازم باشد. جزئیات و هزینه‌ها را در سایت رسمی ببینید.</p>
</div>`, 'mt-12')}
${section(`<div class="max-w-3xl">${h2('موضوعاتی که در آزمون زیاد می‌آیند')}
<p class="mt-2 text-muted-foreground">این موضوعات در نِدفا لغت، جملهٔ کاربردی و مکالمه دارند:</p>
<ul class="mt-4 grid gap-3 sm:grid-cols-2">${['huisarts', 'gemeente', 'werk', 'wonen', 'boodschappen', 'school', 'solliciteren', 'digitaal'].map((id) => themes.find((t) => t.id === id)).filter(Boolean).map(themeCard).join('')}</ul></div>`, 'mt-12')}
${section(`<div class="site-prose max-w-3xl">${h2('برنامهٔ تمرین روزانه')}
<ol class="mt-4 list-decimal space-y-2 ps-6">
  <li>هر روز ۵ تا ۱۰ دقیقه کارت‌های مرور را در اپ تمام کنید.</li>
  <li>هفته‌ای یک موضوع جدید انتخاب کنید و جمله‌های کاربردی آن را بلند تکرار کنید.</li>
  <li>با بازی «دیکته» گوش دادن و املا را تمرین کنید؛ با «ساختن جمله» ترتیب کلمات را.</li>
  <li>نکته‌های گرامری سطح خود (A2 یا B1) را یکی‌یکی جلو بروید و برای هر کدام شش تمرین را انجام دهید.</li>
</ol></div>`, 'mt-12')}
${section(`${h2('پرسش‌های رایج دربارهٔ اینبورخرینگ')}<div class="mt-6 max-w-3xl">${questions.html}</div>`, 'mt-12')}
`;
  return page({
    path: '/inburgering/', assets, body, image: '/img/inburgering-og.jpg',
    title: 'آزمون اینبورخرینگ (هم‌پذیری هلند): راهنمای فارسی و تمرین زبان A2 و B1 | نِدفا',
    description: 'آزمون اینبورخرینگ به زبان ساده: بخش‌های شنیدن، خواندن، نوشتن و صحبت کردن، سطح A2 یا B1 و برنامهٔ تمرین روزانه با لغات و جمله‌های موقعیت‌های واقعی. تمرین رایگان با نِدفا.',
    breadcrumbs: [['نِدفا', '/'], ['آزمون اینبورخرینگ', '/inburgering/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'Article', headline: 'آزمون اینبورخرینگ: راهنمای فارسی برای آمادگی زبان هلندی', inLanguage: 'fa', dateModified: today, author: {'@id': `${SITE}/#org`}, publisher: {'@id': `${SITE}/#org`}, image: `${SITE}/img/inburgering-og.jpg`}, questions.schema],
  });
}

/* ------------------------------------------------------- crawlers and bots */

function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${SITE}${url.path}</loc><lastmod>${today}</lastmod><priority>${url.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

function robots() {
  // Search engines and AI assistants are welcome: the pages exist to be found and quoted.
  const bots = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'CCBot', 'meta-externalagent', 'DuckDuckBot', 'YandexBot'];
  return `# Nedfa (nedfa.nl): free Dutch lessons for Persian speakers. Crawlers and AI assistants are welcome.
${bots.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join('\n')}
User-agent: *
Allow: /
Disallow: /deployment-config.json

Sitemap: ${SITE}/sitemap.xml
`;
}

function llms() {
  return `# Nedfa (نِدفا)

> Nedfa is a free app and website for learning Dutch (Nederlands) for Persian (Farsi/Dari) speakers, from level A2 to B1. It teaches ${totals.words} Dutch words and expressions in ${totals.themes} everyday themes, ${totals.phrases} practical sentences, ${totals.dialogues} short dialogues and ${totals.patterns} grammar patterns, all with Persian translations and Dutch audio, plus spaced repetition (SM-2) and seven study games. It also helps people prepare for the Dutch civic integration exam (inburgeringsexamen). Web: ${SITE}/leren.html (no account needed). iPhone app: coming to the App Store. Contact: ${EMAIL}.

نِدفا اپ و سایت رایگان آموزش زبان هلندی برای فارسی‌زبانان (ایرانی‌ها و افغان‌ها) از سطح A2 تا B1 است.

## Main pages
- [Home (Persian): آموزش زبان هلندی به فارسی](${SITE}/): what Nedfa is, features, FAQ
- [Dutch vocabulary by theme: لغات هلندی به فارسی](${SITE}/woorden/): ${totals.themes} themes with Dutch word, de/het, Persian meaning and example sentence
- [Dutch grammar in Persian: گرامر زبان هلندی](${SITE}/grammatica/): ${totals.patterns} patterns with Persian explanation and examples
- [Inburgering exam guide: آزمون اینبورخرینگ](${SITE}/inburgering/): exam parts, A2/B1 level and a daily practice plan
- [The app (practice)](${SITE}/leren.html)
- [Full text of all lessons](${SITE}/llms-full.txt)

## Vocabulary themes
${themes.map((theme) => `- [${theme.title} (${theme.fa})](${SITE}${themeUrl(theme)}): ${theme.words.length} words, ${theme.phrases.length} phrases`).join('\n')}

## Grammar patterns
${patterns.map((p) => `- [${p.title} (${p.level})](${SITE}${patternUrl(p)})`).join('\n')}

## Optional
- [Privacy](${SITE}/privacy.html)
`;
}

function llmsFull() {
  const themeText = themes.map((theme) => `## ${theme.title} — ${theme.fa}
Source: ${SITE}${themeUrl(theme)}

### Words (Dutch — Persian — example)
${theme.words.map((word) => `- ${word.nl} — ${word.meaning ?? ''} — ${word.example ?? ''} (${word.translation ?? ''})`).join('\n')}

### Phrases
${theme.phrases.map((phrase) => `- ${phrase.nl} — ${phrase.meaning ?? ''}`).join('\n')}

### Dialogue
${theme.dialogue.map((line) => `- ${line.speaker}: ${line.nl} — ${line.translation}`).join('\n')}
`).join('\n');
  const grammarText = patterns.map((p) => `## ${p.title} (${p.level})
Source: ${SITE}${patternUrl(p)}
Pattern: ${p.pattern}
Rule (Persian): ${p.rule}
${p.note ? `Note (Persian): ${p.note}\n` : ''}Examples:
${p.examples.map((example) => `- ${example.nl} — ${example.translation}`).join('\n')}
`).join('\n');
  return `# Nedfa — all lessons (Dutch for Persian speakers, A2–B1)

Free to read and quote with a link to ${SITE}. Practise with audio and spaced repetition at ${SITE}/leren.html.

# Vocabulary
${themeText}
# Grammar
${grammarText}`;
}
