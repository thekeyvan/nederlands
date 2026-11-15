// Writes the public, indexable pages after `vite build`, in Dutch (/, the default) and Persian (/fa/): a landing page, one page
// per theme and per grammar pattern, an inburgering guide, plus sitemap.xml, robots.txt, llms.txt and llms-full.txt.
// Everything comes from the same lesson content as the app, so the pages stay in step with it.
import {copyFile, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {BRAND_FA, EMAIL, LANGS, SITE, at, cta, esc, fa, ghost, nl, num, page, tx} from './layout.mjs';
import {groups, kindFa, patterns, themes, totals} from './content.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const today = new Date().toISOString().slice(0, 10);
const organization = {'@type': 'Organization', '@id': `${SITE}/#org`, name: 'Nedfa', alternateName: BRAND_FA, url: SITE, logo: `${SITE}/img/logo.png`, email: EMAIL};
const appLink = (query = '') => `/leren.html${query}`;
const themePath = (theme) => `/woorden/${theme.id}/`;
const patternPath = (pattern) => `/grammatica/${pattern.slug}/`;
const themeImage = (theme) => `/img/themes/${theme.id}.jpg`;
const kindNl = {woord: 'woord', werkwoord: 'werkwoord', uitdrukking: 'uitdrukking'};
const groupNl = {dagelijks: 'Elke dag', werk: 'Werk', vrijetijd: 'Vrije tijd & uitgaan', taal: 'Taal, contact & gevoel'};

/** Language-neutral paths of every page, for the sitemap. */
const paths = [];
async function write(dist, lang, pagePath, html, priority) {
  const full = at(lang, pagePath);
  const file = path.join(dist, full, 'index.html');
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, html);
  if (lang === LANGS[0]) paths.push({path: pagePath, priority});
}

export async function buildSite(dist) {
  const manifest = JSON.parse(await readFile(path.join(dist, '.vite/manifest.json'), 'utf8'));
  const entry = manifest['src/site/site.ts'];
  const assets = {js: `/${entry.file}`, css: entry.css.map((file) => `/${file}`)};
  await copyImages(dist);
  for (const lang of LANGS) {
    await write(dist, lang, '/', home(lang, assets), '1.0');
    await write(dist, lang, '/woorden/', themeIndex(lang, assets), '0.9');
    for (const theme of themes) await write(dist, lang, themePath(theme), themePage(lang, theme, assets), '0.8');
    await write(dist, lang, '/grammatica/', grammarIndex(lang, assets), '0.9');
    for (const pattern of patterns) await write(dist, lang, patternPath(pattern), patternPage(lang, pattern, assets), '0.7');
    await write(dist, lang, '/inburgering/', inburgeringPage(lang, assets), '0.8');
  }
  await writeFile(path.join(dist, 'sitemap.xml'), sitemap());
  await writeFile(path.join(dist, 'robots.txt'), robots());
  await writeFile(path.join(dist, 'llms.txt'), llms());
  await writeFile(path.join(dist, 'llms-full.txt'), llmsFull());
  await rm(path.join(dist, '.vite'), {recursive: true, force: true});
  console.log(`Public site: ${paths.length * LANGS.length} pages in Dutch and Persian, sitemap, robots.txt and llms.txt.`);
}

/** Theme scenes from the app, plus the site illustrations and logo, under stable public URLs. */
async function copyImages(dist) {
  const from = path.join(ROOT, 'src/assets/illustrations/themes');
  await mkdir(path.join(dist, 'img/themes'), {recursive: true});
  for (const file of await readdir(from)) if (file.endsWith('.jpg')) await copyFile(path.join(from, file), path.join(dist, 'img/themes', file));
  const games = path.join(ROOT, 'src/assets/illustrations/games');
  await mkdir(path.join(dist, 'img/games'), {recursive: true});
  for (const file of await readdir(games)) if (file.endsWith('.jpg')) await copyFile(path.join(games, file), path.join(dist, 'img/games', file));
  for (const file of await readdir(path.join(ROOT, 'src/site/img'))) await copyFile(path.join(ROOT, 'src/site/img', file), path.join(dist, 'img', file));
}

/* ------------------------------------------------------------------ blocks */

const section = (inner, className = '') => `<section class="mx-auto max-w-6xl px-4 sm:px-6 ${className}">${inner}</section>`;
const h2 = (text, id = '') => `<h2${id ? ` id="${id}"` : ''} class="text-2xl font-extrabold tracking-tight sm:text-3xl">${text}</h2>`;
const words = (lang, count) => tx(lang, `${num(lang, count)} لغت`, `${count} woorden`);

function themeCard(lang, theme) {
  return `<li><a href="${at(lang, themePath(theme))}" class="group flex items-center gap-3 rounded-2xl border bg-card p-2.5 transition hover:border-primary/40 hover:bg-accent/40">
    <img src="${themeImage(theme)}" alt="" width="64" height="64" loading="lazy" class="size-16 shrink-0 rounded-xl object-cover">
    <span class="min-w-0">
      <span class="block font-bold">${lang === 'fa' ? esc(theme.fa) : nl(theme.title)}</span>
      <span class="block truncate text-xs text-muted-foreground">${lang === 'fa' ? nl(theme.title) : fa(theme.fa)} · ${words(lang, theme.words.length)}</span>
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

function home(lang, assets) {
  const L = (fa, nlText) => tx(lang, fa, nlText);
  const questions = faq(lang === 'fa' ? [
    ['آیا نِدفا رایگان است؟', `بله. نسخهٔ وب و اپ آیفون نِدفا رایگان هستند و تبلیغ ندارند. می‌توانید بدون حساب کاربری شروع کنید.`],
    ['نِدفا برای چه سطحی مناسب است؟', `برای کسانی که الفبای هلندی را می‌شناسند یا دورهٔ مقدماتی را گذرانده‌اند و می‌خواهند از سطح A2 به B1 برسند؛ مثلاً در کنار کلاس زبان یا برای آمادگی آزمون.`],
    ['آیا برای آزمون اینبورخرینگ (هم‌پذیری) کمک می‌کند؟', `نِدفا موضوعات زندگی روزمره را تمرین می‌کند که در آزمون‌های شنیدن، خواندن، نوشتن و صحبت کردن می‌آیند: پزشک، شهرداری، کار، خانه و خرید. <a class="text-primary underline" href="/fa/inburgering/">راهنمای آزمون اینبورخرینگ</a> را هم ببینید.`],
    ['ترجمه‌ها به فارسی است؟', `بله. همهٔ ${num(lang, totals.words)} لغت، جمله‌ها و نکته‌های گرامری ترجمه و توضیح فارسی دارند و هر جملهٔ هلندی را می‌توانید با صدای هلندی بشنوید.`],
    ['روی آیفون و کامپیوتر کار می‌کند؟', `بله. نسخهٔ وب روی هر مرورگری کار می‌کند و اپ آیفون به‌زودی در App Store است. با ورود از طریق اپل یا گوگل، پیشرفت شما بین گوشی و کامپیوتر همگام می‌شود.`],
    ['یادگیری زبان هلندی برای فارسی‌زبان‌ها سخت است؟', `هلندی الفبای لاتین و ترتیب کلمات متفاوتی دارد، اما با تمرین روزانهٔ کوتاه به‌خوبی یاد گرفته می‌شود. نکته‌های مهم مثل ${nl('de')} و ${nl('het')}، جای فعل در جمله و افعال جداشدنی را در <a class="text-primary underline" href="/fa/grammatica/">بخش گرامر</a> به فارسی توضیح داده‌ایم.`],
  ] : [
    ['Is Nedfa gratis?', 'Ja. De website en de iPhone-app zijn gratis en zonder advertenties. Je kunt beginnen zonder account.'],
    ['Voor wie is Nedfa?', 'Voor Perzisch sprekenden (Iraniërs en Afghanen die Farsi of Dari spreken) die al een beetje Nederlands kennen en van A2 naar B1 willen, bijvoorbeeld naast een taalcursus of voor het inburgeringsexamen.'],
    ['Helpt Nedfa bij het inburgeringsexamen?', `Nedfa oefent de onderwerpen van het dagelijks leven die in de examens luisteren, lezen, schrijven en spreken terugkomen: de huisarts, de gemeente, werk, wonen en boodschappen. Lees ook de <a class="text-primary underline" href="/inburgering/">uitleg over inburgering</a>.`],
    ['Zijn alle vertalingen in het Perzisch?', `Ja. Alle ${totals.words} woorden, de zinnen en de grammatica hebben een Perzische vertaling of uitleg, en elke Nederlandse zin hoor je met Nederlandse audio.`],
    ['Werkt het op de iPhone en de computer?', 'Ja. De website werkt in elke browser en de iPhone-app komt binnenkort in de App Store. Log in met Apple of Google, dan gaat je voortgang mee tussen telefoon en computer.'],
    ['Kan ik als Nederlander iemand helpen met Nedfa?', `Zeker. Gebruik de <a class="text-primary underline" href="/woorden/">woordenlijsten per thema</a> en de <a class="text-primary underline" href="/grammatica/">grammatica</a> samen met een taalmaatje: de Nederlandse tekst staat er steeds naast de Perzische.`],
  ]);
  const features = (lang === 'fa' ? [
    ['/img/themes/huisarts.jpg', 'لغت با تلفظ هلندی', `${num(lang, totals.words)} لغت و اصطلاح در ${num(lang, totals.themes)} موضوع روزمره، هر کدام با جملهٔ مثال، ترجمهٔ فارسی و صدای هلندی.`],
    ['/img/mascot-cheer.jpg', 'مرور هوشمند', 'کارت‌ها درست وقتی برمی‌گردند که در حال فراموش کردنشان هستید (روش SM-2). روزی پنج دقیقه کافی است.'],
    ['/img/themes/zinsbouw.jpg', 'گرامر به زبان ساده', `${num(lang, totals.patterns)} الگوی گرامری با توضیح فارسی و ${num(lang, totals.examples)} جملهٔ مثال، و برای هر الگو شش تمرین کوتاه.`],
    ['/img/games/lidwoord.jpg', 'هفت بازی آموزشی', `${nl('de')} یا ${nl('het')}، ساختن جمله، افعال گذشته، دیکته، مکالمه و مسابقهٔ زمان‌دار.`],
  ] : [
    ['/img/themes/huisarts.jpg', 'Woorden met audio', `${totals.words} woorden en uitdrukkingen in ${totals.themes} thema's uit het dagelijks leven, elk met een voorbeeldzin, Perzische vertaling en Nederlandse audio.`],
    ['/img/mascot-cheer.jpg', 'Slim herhalen', 'Kaartjes komen terug precies wanneer je ze bijna vergeet (SM-2). Vijf minuten per dag is genoeg.'],
    ['/img/themes/zinsbouw.jpg', 'Grammatica, eenvoudig uitgelegd', `${totals.patterns} patronen met Perzische uitleg en ${totals.examples} voorbeeldzinnen, en per patroon zes korte oefeningen.`],
    ['/img/games/lidwoord.jpg', 'Zeven spellen', 'De of het, zinnen bouwen, werkwoorden, dictee, gesprekken en een tijdrace.'],
  ]).map(([image, title, text]) => `<li class="flex gap-4 rounded-2xl border bg-card p-4"><img src="${image}" alt="" width="80" height="80" loading="lazy" class="size-20 shrink-0 rounded-xl"><div><h3 class="text-lg font-bold">${title}</h3><p class="mt-1 text-sm text-muted-foreground">${text}</p></div></li>`).join('');
  const featured = ['v2', 'perfectum', 'omdat', 'scheidbaar', 'dat', 'die-dat'].map((slug) => patterns.find((p) => p.slug === slug)).filter(Boolean);
  const steps = lang === 'fa'
    ? [['/img/mascot-wave.jpg', 'یک موضوع انتخاب کنید', 'مثلاً «پیش پزشک خانواده» یا «در سوپرمارکت»، و لغت‌ها را با صدای هلندی گوش کنید.'], ['/img/themes/week.jpg', 'هر روز یک دور کوتاه', 'پنج تا ده کارت: انتخاب، گوش دادن، تایپ کردن. جواب درست و غلط را بلافاصله می‌بینید.'], ['/img/themes/route.jpg', 'پیشرفت را ببینید', 'رکورد روزانه، امتیاز، ستاره برای هر موضوع و یک مسیر هشت‌مرحله‌ای از A2 تا B1.']]
    : [['/img/mascot-wave.jpg', 'Kies een thema', 'Bijvoorbeeld "Naar de huisarts" of "In de supermarkt", en luister naar de woorden.'], ['/img/themes/week.jpg', 'Elke dag een kort rondje', 'Vijf tot tien kaartjes: kiezen, luisteren, typen. Je ziet meteen wat goed en fout is.'], ['/img/themes/route.jpg', 'Zie je vooruitgang', 'Een dagreeks, XP, sterren per thema en een route van acht haltes van A2 naar B1.']];
  const body = `
${section(`<div class="grid items-center gap-8 py-10 md:grid-cols-[1.1fr_1fr] md:py-16">
  <div>
    <p class="text-sm font-bold text-primary">${L('رایگان · برای فارسی‌زبانان · سطح A2 تا B1', 'Gratis · voor Perzisch sprekenden · A2 → B1')}</p>
    <h1 class="mt-3 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">${L('آموزش زبان هلندی به فارسی، هر روز چند دقیقه', 'Nederlands leren met Perzische uitleg, elke dag een beetje')}</h1>
    <p class="mt-4 text-lg text-muted-foreground">${L(`${BRAND_FA} (${nl('Nedfa')}) اپ رایگان یادگیری زبان هلندی برای ایرانی‌ها و فارسی‌زبانان است: لغت با تلفظ هلندی، جمله‌های کاربردی برای زندگی در هلند، گرامر به زبان ساده و آمادگی برای آزمون اینبورخرینگ.`, `Nedfa (${fa(BRAND_FA)}) is een gratis app om Nederlands te leren voor Iraniërs en andere Perzisch sprekenden: woorden met Nederlandse audio, handige zinnen voor het leven in Nederland, grammatica in gewone taal en oefening voor het inburgeringsexamen.`)}</p>
    <div class="mt-6 flex flex-wrap gap-3">${cta(lang, appLink(), L('شروع رایگان در مرورگر', 'Gratis beginnen in je browser'))}${ghost(at(lang, '/woorden/'), L('دیدن لغات هلندی', 'Bekijk de woorden'))}</div>
    <p class="mt-3 text-sm text-muted-foreground">${L('بدون ثبت‌نام شروع کنید. اپ آیفون به‌زودی در App Store.', 'Zonder account beginnen. De iPhone-app komt binnenkort in de App Store.')}</p>
  </div>
  <img src="/img/hero.webp" alt="${L('مسکات نِدفا جلوی خانه‌های هلندی با دوچرخه، آسیاب بادی، گل لاله و یک استکان چای', 'De Nedfa-mascotte zwaait voor Nederlandse grachtenpanden met een fiets, een molen, tulpen en een Perzisch theeglas')}" width="1536" height="1024" fetchpriority="high" class="w-full rounded-3xl">
</div>`)}
${section(`<ul class="grid grid-cols-2 gap-3 rounded-2xl bg-secondary p-5 text-center text-secondary-foreground sm:grid-cols-4">
  ${[[totals.words, L('لغت و اصطلاح', 'woorden')], [totals.phrases, L('جملهٔ کاربردی', 'handige zinnen')], [totals.patterns, L('نکتهٔ گرامری', 'grammaticaregels')], [totals.themes, L('موضوع روزمره', "thema's")]].map(([value, label]) => `<li><span class="block text-3xl font-extrabold">${num(lang, value)}</span><span class="text-sm opacity-80">${label}</span></li>`).join('')}
</ul>`)}
${section(`${h2(L('چرا نِدفا برای یادگیری هلندی؟', 'Waarom Nedfa?'))}
<p class="mt-2 max-w-3xl text-muted-foreground">${L('بیشتر اپ‌های آموزش زبان هلندی به انگلیسی هستند. در نِدفا همه‌چیز به فارسی توضیح داده شده و موضوعات همان چیزهایی است که در هلند هر روز لازم دارید.', 'De meeste apps om Nederlands te leren zijn in het Engels. In Nedfa staat alle uitleg in het Perzisch, over de dingen die je in Nederland elke dag nodig hebt.')}</p>
<ul class="mt-6 grid gap-4 sm:grid-cols-2">${features}</ul>`, 'mt-16')}
${section(`<div class="flex flex-wrap items-end justify-between gap-3">${h2(L('لغات هلندی بر اساس موضوع', "Woorden per thema"))}<a href="${at(lang, '/woorden/')}" class="text-sm font-bold text-primary">${L(`همهٔ ${num(lang, totals.themes)} موضوع ←`, `Alle ${totals.themes} thema's →`)}</a></div>
<ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${themes.slice(0, 12).map((theme) => themeCard(lang, theme)).join('')}</ul>`, 'mt-16')}
${section(`<div class="grid gap-6 rounded-3xl border bg-card p-6 md:grid-cols-[auto_1fr_1fr] md:items-center md:p-8">
  <img src="/img/themes/zinsbouw.jpg" alt="" width="140" height="140" loading="lazy" class="size-28 rounded-2xl md:size-36">
  <div>
    ${h2(L('گرامر هلندی، به فارسی و با مثال', 'Grammatica met voorbeelden'))}
    <p class="mt-2 text-muted-foreground">${L(`جای فعل در جمله، ${nl('omdat')} و ${nl('want')}، زمان گذشته، افعال جداشدنی و ${num(lang, totals.patterns)} الگوی دیگر؛ هر کدام با چهار جملهٔ مثال و ترجمهٔ فارسی.`, `Het werkwoord op plek twee, omdat en want, de verleden tijd, scheidbare werkwoorden en nog ${totals.patterns - 4} patronen, elk met vier voorbeeldzinnen en een Perzische vertaling.`)}</p>
    <div class="mt-4">${ghost(at(lang, '/grammatica/'), L('همهٔ نکته‌های گرامری', 'Alle grammatica'))}</div>
  </div>
  <ul class="grid gap-2">${featured.map((p) => `<li><a href="${at(lang, patternPath(p))}" class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted"><span>${nl(p.title, 'font-semibold')}</span><span class="text-xs text-muted-foreground">${p.level}</span></a></li>`).join('')}</ul>
</div>`, 'mt-16')}
${section(`${h2(L('در سه قدم شروع کنید', 'Zo begin je'))}
<ol class="mt-6 grid gap-4 sm:grid-cols-3">
  ${steps.map(([image, title, text]) => `<li class="rounded-2xl border bg-card p-5"><img src="${image}" alt="" width="96" height="96" loading="lazy" class="size-24 rounded-xl"><h3 class="mt-3 font-bold">${title}</h3><p class="mt-1 text-sm text-muted-foreground">${text}</p></li>`).join('')}
</ol>`, 'mt-16')}
${section(`<div class="grid items-center gap-6 rounded-3xl bg-accent p-6 text-accent-foreground md:grid-cols-[auto_1fr_auto] md:p-8">
  <img src="/img/inburgering.webp" alt="" width="120" height="120" loading="lazy" class="size-24 rounded-2xl md:size-28">
  <div>${h2(L('آماده‌شدن برای آزمون اینبورخرینگ', 'Oefenen voor het inburgeringsexamen'))}<p class="mt-2">${L(`آزمون هم‌پذیری هلند (${nl('inburgeringsexamen')}) چه بخش‌هایی دارد، چه سطحی لازم است و چطور با تمرین روزانه آماده شوید.`, 'Welke onderdelen heeft het examen, welk niveau heb je nodig en hoe oefen je er elke dag voor?')}</p></div>
  ${ghost(at(lang, '/inburgering/'), L('خواندن راهنما', 'Lees de uitleg'))}
</div>`, 'mt-16')}
${section(`${h2(L('پرسش‌های رایج', 'Veelgestelde vragen'), 'faq')}<div class="mt-6">${questions.html}</div>`, 'mt-16')}
${section(`<div class="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-secondary px-6 py-10 text-center text-secondary-foreground">
  <img src="/img/mascot-wave.jpg" alt="" width="112" height="112" loading="lazy" class="size-28 rounded-3xl">
  <h2 class="text-2xl font-extrabold sm:text-3xl">${L('همین امروز اولین دور را شروع کنید', 'Begin vandaag met je eerste rondje')}</h2>
  <p class="opacity-80">${L('پنج کارت، کمتر از دو دقیقه. رایگان و بدون ثبت‌نام.', 'Vijf kaartjes, minder dan twee minuten. Gratis en zonder account.')}</p>
  ${cta(lang, appLink(), L('شروع یادگیری هلندی', 'Begin met Nederlands'))}
</div>`)}
`;
  return page({
    lang, path: '/', assets, body,
    title: L('آموزش زبان هلندی به فارسی | اپ رایگان نِدفا (A2 تا B1)', 'Nedfa: gratis Nederlands leren voor Perzisch sprekenden (A2–B1)'),
    description: L(`یادگیری زبان هلندی برای فارسی‌زبانان: ${num(lang, totals.words)} لغت با تلفظ و ترجمهٔ فارسی، جملات کاربردی، گرامر هلندی به زبان ساده، بازی و آمادگی آزمون اینبورخرینگ. رایگان در وب و آیفون.`, `Nederlands leren met Perzische uitleg: ${totals.words} woorden met audio en vertaling, handige zinnen, grammatica, spellen en oefening voor inburgering. Gratis op het web en de iPhone.`),
    jsonLd: [
      {'@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: 'Nedfa', alternateName: [BRAND_FA, 'نِدفا: آموزش زبان هلندی'], inLanguage: ['fa', 'nl'], publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', ...organization},
      {'@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Nedfa: Nederlands leren', alternateName: BRAND_FA, applicationCategory: 'EducationalApplication', operatingSystem: 'iOS, Web', url: SITE, image: `${SITE}/img/logo.png`, inLanguage: ['fa', 'nl'], offers: {'@type': 'Offer', price: 0, priceCurrency: 'EUR'}, publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', '@type': 'Course', name: L('آموزش زبان هلندی برای فارسی‌زبانان (A2 تا B1)', 'Nederlands voor Perzisch sprekenden (A2–B1)'), description: L('دورهٔ رایگان و خودآموز زبان هلندی با توضیح فارسی: لغات روزمره با تلفظ، جملات کاربردی، گرامر و مکالمه.', 'Gratis zelfstudiecursus Nederlands met Perzische uitleg: woorden met audio, handige zinnen, grammatica en gesprekken.'), inLanguage: lang, teaches: L('زبان هلندی (Nederlands)', 'Nederlands'), educationalLevel: 'A2–B1', isAccessibleForFree: true, provider: {'@id': `${SITE}/#org`}, offers: {'@type': 'Offer', price: 0, priceCurrency: 'EUR', category: 'Free'}, hasCourseInstance: {'@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT10M'}},
      questions.schema,
    ],
  });
}

/* ------------------------------------------------------------------ themes */

function themeIndex(lang, assets) {
  const L = (fa, nlText) => tx(lang, fa, nlText);
  const body = `
${section(`<div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
<img src="/img/themes/bronnen.jpg" alt="" width="144" height="144" class="size-28 shrink-0 rounded-2xl sm:size-36">
<div><h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">${L('لغات هلندی به فارسی، بر اساس موضوع', "Nederlandse woorden per thema, met Perzische vertaling")}</h1>
<p class="mt-3 max-w-3xl text-muted-foreground">${L(`${num(lang, totals.words)} لغت و اصطلاح پرکاربرد هلندی در ${num(lang, totals.themes)} موضوع زندگی روزمره، هر کدام با حرف تعریف (${nl('de')} یا ${nl('het')})، معنی فارسی، جملهٔ مثال و ترجمه. برای هر موضوع جمله‌های کاربردی و یک مکالمهٔ کوتاه هم هست.`, `${totals.words} veelgebruikte Nederlandse woorden en uitdrukkingen in ${totals.themes} thema's uit het dagelijks leven, elk met lidwoord (de of het), Perzische betekenis, voorbeeldzin en vertaling. Per thema ook handige zinnen en een kort gesprek.`)}</p></div></div>`)}
${groups.map((group) => section(`${h2(lang === 'fa' ? group.fa : groupNl[group.id])}<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${themes.filter((theme) => theme.group === group.id).map((theme) => themeCard(lang, theme)).join('')}</ul>`, 'mt-10')).join('\n')}
${section(`<div class="mt-12 flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center"><img src="/img/mascot-cheer.jpg" alt="" width="96" height="96" class="size-24 rounded-2xl"><div><h2 class="text-xl font-bold">${L('تمرین با تلفظ و مرور هوشمند', 'Oefenen met audio en slim herhalen')}</h2><p class="mt-1 text-muted-foreground">${L('در اپ نِدفا هر لغت را می‌شنوید، انتخاب یا تایپ می‌کنید و در زمان درست دوباره مرور می‌کنید.', 'In de app hoor je elk woord, kies of typ je het, en herhaal je het precies op tijd.')}</p><div class="mt-4">${cta(lang, appLink('#woorden'), L('تمرین لغات در اپ', 'Oefen de woorden'))}</div></div></div>`)}
`;
  return page({
    lang, path: '/woorden/', assets, body, image: '/img/themes/bronnen.jpg',
    title: L(`لغات هلندی به فارسی: ${num(lang, totals.words)} لغت پرکاربرد در ${num(lang, totals.themes)} موضوع | نِدفا`, `Nederlandse woorden met Perzische vertaling: ${totals.words} woorden in ${totals.themes} thema's | Nedfa`),
    description: L(`فهرست لغات پرکاربرد هلندی با معنی فارسی، حرف تعریف de/het، جملهٔ مثال و تلفظ: کار، خانه، خرید، پزشک، شهرداری، سفر و ${num(lang, totals.themes - 6)} موضوع دیگر.`, `Woordenlijsten Nederlands–Perzisch met lidwoord, voorbeeldzin en audio: werk, wonen, boodschappen, de huisarts, de gemeente, reizen en ${totals.themes - 6} andere thema's.`),
    breadcrumbs: [['Nedfa', '/'], [L('لغات هلندی', 'Woorden'), '/woorden/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'CollectionPage', name: L('لغات هلندی به فارسی بر اساس موضوع', "Nederlandse woorden per thema"), inLanguage: lang, isPartOf: {'@id': `${SITE}/#website`}, hasPart: themes.map((theme) => ({'@type': 'WebPage', name: lang === 'fa' ? `لغات هلندی: ${theme.fa}` : `Woorden: ${theme.title}`, url: SITE + at(lang, themePath(theme))}))}],
  });
}

function themePage(lang, theme, assets) {
  const L = (fa, nlText) => tx(lang, fa, nlText);
  const related = themes.filter((item) => item.group === theme.group && item.id !== theme.id).slice(0, 6);
  const kind = (word) => (lang === 'fa' ? kindFa[word.kind] : kindNl[word.kind]) ?? '';
  const rows = theme.words.map((word) => `<li class="grid gap-x-4 gap-y-1 border-t py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
    <div><span lang="nl" dir="ltr" class="font-semibold">${esc(word.nl)}</span><span class="block text-xs text-muted-foreground">${kind(word)}${word.forms ? ` · ${nl(`${word.forms[0]} – ${word.forms[1]}`)}` : ''}</span></div>
    <div class="font-medium">${fa(word.meaning ?? '')}</div>
    <div class="text-sm"><span lang="nl" dir="ltr" class="block text-start">${esc(word.example ?? '')}</span><span lang="fa" dir="rtl" class="block text-start text-muted-foreground">${esc(word.translation ?? '')}</span></div>
  </li>`).join('');
  const name = lang === 'fa' ? theme.fa : theme.title;
  const body = `
${section(`<div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
  <img src="${themeImage(theme)}" alt="" width="520" height="520" class="size-32 shrink-0 rounded-3xl border object-cover sm:size-40">
  <div>
    <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">${L(`لغات هلندی: ${esc(theme.fa)}`, `Nederlandse woorden: ${esc(theme.title)}`)}</h1>
    <p class="mt-1 text-lg">${lang === 'fa' ? nl(theme.title, 'font-semibold text-muted-foreground') : fa(theme.fa, 'font-semibold text-muted-foreground')}</p>
    <p class="mt-2 text-muted-foreground">${L(`${num(lang, theme.words.length)} لغت و اصطلاح، ${num(lang, theme.phrases.length)} جملهٔ کاربردی و یک مکالمهٔ کوتاه دربارهٔ «${esc(theme.fa)}»، با معنی فارسی و جملهٔ مثال.`, `${theme.words.length} woorden en uitdrukkingen, ${theme.phrases.length} handige zinnen en een kort gesprek over "${esc(theme.title)}", met Perzische vertaling en voorbeeldzinnen.`)}</p>
  </div>
</div>
<div class="mt-5">${cta(lang, appLink(`?thema=${theme.id}#woorden`), L('تمرین این لغات با تلفظ', 'Oefen deze woorden met audio'))}</div>`)}
${section(`${h2(L('لغات', 'Woorden'), 'woorden')}
<ul class="mt-4 rounded-2xl border bg-card px-4">${rows}</ul>`, 'mt-10')}
${theme.phrases.length ? section(`${h2(L('جمله‌های کاربردی', 'Handige zinnen'), 'zinnen')}
<ul class="mt-4 grid gap-3 md:grid-cols-2">${theme.phrases.map((phrase) => `<li class="rounded-xl border bg-card p-4"><p lang="nl" dir="ltr" class="text-start text-lg font-semibold">${esc(phrase.nl)}</p><p lang="fa" dir="rtl" class="mt-1 text-start text-muted-foreground">${esc(phrase.meaning ?? '')}</p></li>`).join('')}</ul>`, 'mt-10') : ''}
${theme.dialogue.length ? section(`${h2(L('مکالمهٔ کوتاه', 'Kort gesprek'), 'gesprek')}
<ol class="mt-4 flex max-w-2xl flex-col gap-3">${theme.dialogue.map((line) => `<li class="rounded-2xl border bg-card p-4${line.speaker === 'Jij' ? ' ms-8 bg-accent/40' : ' me-8'}"><span class="text-xs font-bold text-muted-foreground">${line.speaker === 'Jij' ? L('شما', 'Jij') : nl(line.speaker)}</span><p lang="nl" dir="ltr" class="text-start font-semibold">${esc(line.nl)}</p><p lang="fa" dir="rtl" class="text-start text-sm text-muted-foreground">${esc(line.translation)}</p></li>`).join('')}</ol>`, 'mt-10') : ''}
${section(`<div class="mt-12 flex flex-col gap-4 rounded-2xl bg-secondary p-6 text-secondary-foreground sm:flex-row sm:items-center"><img src="/img/mascot-cheer.jpg" alt="" width="96" height="96" class="size-24 rounded-2xl"><div><h2 class="text-xl font-bold">${L('این لغات را حفظ کنید، نه فقط بخوانید', 'Leer ze echt, niet alleen lezen')}</h2><p class="mt-1 opacity-80">${L(`در اپ نِدفا لغت‌های «${esc(theme.fa)}» را می‌شنوید، انتخاب و تایپ می‌کنید و با بازی ${nl('de')} یا ${nl('het')} تمرین می‌کنید.`, `In de app hoor je de woorden over "${esc(theme.title)}", kies en typ je ze, en speel je De of het?`)}</p><div class="mt-4">${cta(lang, appLink(`?thema=${theme.id}#woorden`), L('شروع تمرین', 'Begin met oefenen'))}</div></div></div>`)}
${related.length ? section(`${h2(L('موضوعات مرتبط', "Verwante thema's"))}<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${related.map((item) => themeCard(lang, item)).join('')}</ul>`, 'mt-12') : ''}
`;
  return page({
    lang, path: themePath(theme), assets, body, image: themeImage(theme),
    title: L(`لغات هلندی ${theme.fa}: ${num(lang, theme.words.length)} لغت با معنی فارسی | نِدفا`, `${theme.title}: ${theme.words.length} Nederlandse woorden met Perzische vertaling | Nedfa`),
    description: L(`${num(lang, theme.words.length)} لغت هلندی دربارهٔ ${theme.fa} (${theme.title}) با معنی فارسی، de یا het، جملهٔ مثال و ترجمه، به‌علاوهٔ جمله‌های کاربردی و مکالمه. تمرین رایگان با تلفظ هلندی.`, `${theme.words.length} Nederlandse woorden over ${theme.title.toLowerCase()} met lidwoord, Perzische betekenis (${theme.fa}), voorbeeldzin en vertaling, plus handige zinnen en een gesprek. Gratis oefenen met audio.`),
    breadcrumbs: [['Nedfa', '/'], [L('لغات هلندی', 'Woorden'), '/woorden/'], [name, themePath(theme)]],
    jsonLd: [
      {'@context': 'https://schema.org', '@type': 'LearningResource', name: L(`لغات هلندی: ${theme.fa}`, `Nederlandse woorden: ${theme.title}`), inLanguage: lang, learningResourceType: 'Vocabulary list', educationalLevel: 'A2–B1', teaches: `Nederlandse woorden: ${theme.title}`, isAccessibleForFree: true, image: SITE + themeImage(theme), publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', '@type': 'DefinedTermSet', name: `Nederlands–Perzisch: ${theme.title}`, inLanguage: ['nl', 'fa'], hasDefinedTerm: theme.words.map((word) => ({'@type': 'DefinedTerm', name: word.nl, description: word.meaning ?? '', inLanguage: 'nl'}))},
    ],
  });
}

/* ----------------------------------------------------------------- grammar */

function grammarIndex(lang, assets) {
  const L = (fa, nlText) => tx(lang, fa, nlText);
  const key = lang === 'fa'
    ? [['جای فعل', `در جملهٔ خبری هلندی فعل همیشه در جایگاه دوم است، حتی اگر جمله با زمان یا مکان شروع شود: ${nl('Morgen werk ik thuis.')}`], ['فعل در آخر جملهٔ وابسته', `بعد از ${nl('dat')}، ${nl('omdat')} و ${nl('als')} فعل به آخر جمله می‌رود؛ شبیه فارسی: ${nl('…omdat ik moe ben.')}`], [`${nl('de')} یا ${nl('het')}`, `هر اسم یکی از دو حرف تعریف را دارد و باید با خود اسم حفظ شود. اسم‌های جمع همیشه ${nl('de')} می‌گیرند.`], ['افعال جداشدنی', `در فعل‌هایی مثل ${nl('opbellen')}، بخش اول به آخر جمله می‌رود: ${nl('Ik bel je morgen op.')}`]]
    : [['Het werkwoord op plek twee', 'In een gewone zin staat de persoonsvorm altijd op plek twee, ook als de zin met tijd of plaats begint: Morgen werk ik thuis.'], ['Werkwoord achteraan in de bijzin', 'Na dat, omdat en als gaat het werkwoord naar het eind, net als in het Perzisch: …omdat ik moe ben.'], ['De of het', 'Elk zelfstandig naamwoord heeft de of het; leer het lidwoord samen met het woord. Meervoud is altijd de.'], ['Scheidbare werkwoorden', 'Bij werkwoorden als opbellen gaat het eerste deel naar het eind: Ik bel je morgen op.']];
  const body = `
${section(`<div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
<img src="/img/themes/zinsbouw.jpg" alt="" width="144" height="144" class="size-28 shrink-0 rounded-2xl sm:size-36">
<div><h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">${L('گرامر زبان هلندی به فارسی', 'Nederlandse grammatica met Perzische uitleg')}</h1>
<p class="mt-3 max-w-3xl text-muted-foreground">${L(`${num(lang, totals.patterns)} نکتهٔ مهم دستور زبان هلندی برای سطح A2 و B1، هر کدام با الگوی ساده، توضیح فارسی و چهار جملهٔ مثال. برای فارسی‌زبان‌ها این چهار نکته از همه مهم‌ترند:`, `${totals.patterns} belangrijke grammaticaregels voor A2 en B1, elk met een eenvoudig patroon, Perzische uitleg en vier voorbeeldzinnen. Voor Perzisch sprekenden zijn deze vier het belangrijkst:`)}</p></div></div>
<ul class="mt-5 grid gap-3 sm:grid-cols-2">${key.map(([title, text]) => `<li class="rounded-xl border bg-card p-4"><h2 class="font-bold">${title}</h2><p class="mt-1 text-sm text-muted-foreground">${text}</p></li>`).join('')}</ul>`)}
${['A2', 'B1'].map((level) => section(`${h2(L(`سطح ${level}`, `Niveau ${level}`))}<ul class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">${patterns.filter((p) => p.level === level).map((p) => `<li><a href="${at(lang, patternPath(p))}" class="block rounded-xl border bg-card p-3.5 hover:border-primary/40 hover:bg-accent/40">${nl(p.title, 'font-bold')}<span class="mt-1 line-clamp-2 block text-sm text-muted-foreground">${lang === 'fa' ? esc(p.rule) : nl(p.pattern)}</span></a></li>`).join('')}</ul>`, 'mt-10')).join('\n')}
`;
  return page({
    lang, path: '/grammatica/', assets, body, image: '/img/themes/zinsbouw.jpg',
    title: L(`گرامر زبان هلندی به فارسی: ${num(lang, totals.patterns)} نکته با مثال (A2 تا B1) | نِدفا`, `Nederlandse grammatica A2–B1: ${totals.patterns} regels met voorbeelden | Nedfa`),
    description: L('دستور زبان هلندی به زبان ساده برای فارسی‌زبانان: جای فعل، de و het، omdat و want، زمان گذشته (perfectum)، افعال جداشدنی و بیشتر، با مثال و ترجمهٔ فارسی.', 'Nederlandse grammatica eenvoudig uitgelegd voor Perzisch sprekenden: woordvolgorde, de of het, omdat of want, het perfectum, scheidbare werkwoorden en meer, met voorbeelden.'),
    breadcrumbs: [['Nedfa', '/'], [L('گرامر هلندی', 'Grammatica'), '/grammatica/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'CollectionPage', name: L('گرامر زبان هلندی به فارسی', 'Nederlandse grammatica'), inLanguage: lang, isPartOf: {'@id': `${SITE}/#website`}, hasPart: patterns.map((p) => ({'@type': 'WebPage', name: p.title, url: SITE + at(lang, patternPath(p))}))}],
  });
}

const highlight = (sentence, word) => {
  const safe = esc(sentence);
  if (!word) return safe;
  const pattern = new RegExp(`(^|[^\\p{L}])(${esc(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^\\p{L}]|$)`, 'u');
  return safe.replace(pattern, '$1<strong class="text-primary">$2</strong>');
};

function patternPage(lang, pattern, assets) {
  const L = (fa, nlText) => tx(lang, fa, nlText);
  const index = patterns.indexOf(pattern);
  const siblings = [patterns[index - 1], patterns[index + 1]].filter(Boolean);
  const body = `
${section(`<div class="mt-4 max-w-3xl">
  <span class="rounded-md border px-2 py-0.5 text-xs font-bold">${pattern.level}</span>
  <h1 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">${nl(pattern.title, 'block')}<span class="mt-1 block text-lg font-medium text-muted-foreground">${L('گرامر زبان هلندی به فارسی', 'Nederlandse grammatica')}</span></h1>
  ${lang === 'fa' ? `<p class="mt-5 text-lg">${esc(pattern.rule)}</p>` : ''}
  <p dir="ltr" lang="nl" class="mt-4 rounded-xl bg-muted px-4 py-3 text-start font-mono text-sm">${esc(pattern.pattern)}</p>
  ${lang === 'nl' ? `<p class="mt-4 text-sm text-muted-foreground">Uitleg in het Perzisch:</p><p class="mt-1 text-lg">${fa(pattern.rule)}</p>` : ''}
</div>`)}
${section(`<div class="max-w-3xl">${h2(L('مثال‌ها', 'Voorbeelden'))}
<ul class="mt-4 divide-y rounded-2xl border bg-card">${pattern.examples.map((example) => `<li class="p-4"><p lang="nl" dir="ltr" class="text-start text-lg font-semibold">${highlight(example.nl, example.gap)}</p><p lang="fa" dir="rtl" class="mt-1 text-start text-muted-foreground">${esc(example.translation)}</p></li>`).join('')}</ul>
${pattern.note ? `<div class="mt-6 rounded-2xl bg-xp-soft p-5 text-xp-foreground"><h2 class="font-bold">${L('نکته', 'Let op (in het Perzisch)')}</h2><p class="mt-1">${fa(pattern.note)}</p></div>` : ''}
</div>`, 'mt-10')}
${section(`<div class="mt-12 flex max-w-3xl flex-col gap-4 rounded-2xl bg-secondary p-6 text-secondary-foreground sm:flex-row sm:items-center"><img src="/img/themes/zinsbouw.jpg" alt="" width="96" height="96" class="size-24 rounded-2xl"><div><h2 class="text-xl font-bold">${L('این الگو را تمرین کنید', 'Oefen dit patroon')}</h2><p class="mt-1 opacity-80">${L('شش تمرین کوتاه در اپ نِدفا: جای خالی، مرتب کردن کلمات و انتخاب جملهٔ درست.', 'Zes korte oefeningen in de app: het gat invullen, woorden in de goede volgorde zetten en de goede zin kiezen.')}</p><div class="mt-4">${cta(lang, appLink(`?regel=${encodeURIComponent(pattern.id)}#zinnen`), L('شروع تمرین', 'Begin met oefenen'))}</div></div></div>`)}
${section(`<nav aria-label="${L('نکته‌های دیگر', 'Andere regels')}" class="mt-10 flex max-w-3xl flex-wrap justify-between gap-3">${siblings.map((p) => `<a href="${at(lang, patternPath(p))}" class="rounded-xl border bg-card px-4 py-3 hover:bg-muted">${nl(p.title, 'font-semibold')}</a>`).join('')}<a href="${at(lang, '/grammatica/')}" class="rounded-xl px-4 py-3 font-semibold text-primary">${L('همهٔ نکته‌ها', 'Alle regels')}</a></nav>`)}
`;
  return page({
    lang, path: patternPath(pattern), assets, body, image: '/img/themes/zinsbouw.jpg',
    title: L(`${pattern.title} — گرامر هلندی به فارسی (${pattern.level}) | نِدفا`, `${pattern.title} — Nederlandse grammatica (${pattern.level}) met voorbeelden | Nedfa`),
    description: L(`${pattern.rule} توضیح فارسی، الگو و ${num(lang, pattern.examples.length)} جملهٔ مثال هلندی با ترجمه، و تمرین رایگان.`, `${pattern.title}: het patroon ${pattern.pattern}, ${pattern.examples.length} voorbeeldzinnen met Perzische vertaling en gratis oefeningen.`).slice(0, 300),
    breadcrumbs: [['Nedfa', '/'], [L('گرامر هلندی', 'Grammatica'), '/grammatica/'], [pattern.title, patternPath(pattern)]],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'LearningResource', name: L(`${pattern.title} (گرامر هلندی)`, `${pattern.title} (Nederlandse grammatica)`), description: lang === 'fa' ? pattern.rule : pattern.pattern, inLanguage: lang, learningResourceType: 'Grammar explanation', educationalLevel: pattern.level, teaches: pattern.title, isAccessibleForFree: true, publisher: {'@id': `${SITE}/#org`}}],
  });
}

/* ------------------------------------------------------------- inburgering */

function inburgeringPage(lang, assets) {
  const L = (fa, nlText) => tx(lang, fa, nlText);
  const official = `<a class="text-primary underline" href="https://www.inburgeren.nl" rel="noopener" lang="nl">inburgeren.nl</a>`;
  const duo = `<a class="text-primary underline" href="https://duo.nl" rel="noopener" lang="nl">duo.nl</a>`;
  const questions = faq(lang === 'fa' ? [
    ['آزمون اینبورخرینگ چیست؟', `آزمون هم‌پذیری (${nl('inburgeringsexamen')}) آزمونی است که بسیاری از مهاجران در هلند باید بگذرانند. بخش زبان آن مهارت‌های شنیدن، خواندن، نوشتن و صحبت کردن به هلندی را می‌سنجد.`],
    ['چه سطحی از زبان هلندی لازم است؟', `برای کسانی که از ۱ ژانویهٔ ۲۰۲۲ به بعد مشمول قانون جدید (${nl('Wet inburgering 2021')}) شده‌اند، سطح استاندارد B1 است؛ برای برخی، طبق برنامهٔ شخصی (PIP)، مسیر دیگری تعیین می‌شود. کسانی که پیش از آن شروع کرده‌اند معمولاً تحت قانون قبلی با سطح A2 هستند. سطح دقیق خود را از شهرداری یا سایت رسمی بپرسید.`],
    ['آزمون را کجا و چطور می‌دهم؟', `آزمون‌ها را ${nl('DUO')} برگزار می‌کند. ثبت‌نام، هزینه‌ها و تاریخ‌ها را همیشه در سایت رسمی ${official} و ${duo} چک کنید؛ این اطلاعات گاهی تغییر می‌کند.`],
    ['نِدفا چطور به آمادگی آزمون کمک می‌کند؟', 'با تمرین روزانهٔ لغات و جمله‌های موقعیت‌های واقعی (پزشک، شهرداری، کار، خانه، مدرسه)، گوش دادن به صدای هلندی، دیکته، ساختن جمله و گرامر سطح A2 و B1. نِدفا جایگزین کلاس رسمی نیست، ولی تمرین هر روزه را ساده می‌کند.'],
  ] : [
    ['Wat is het inburgeringsexamen?', 'Een examen dat veel nieuwkomers in Nederland moeten halen. Het taaldeel toetst luisteren, lezen, schrijven en spreken in het Nederlands.'],
    ['Welk niveau Nederlands heb ik nodig?', 'Wie op of na 1 januari 2022 inburgeringsplichtig werd, valt onder de Wet inburgering 2021; daarbij is B1 het standaardniveau. Voor sommigen wordt in het persoonlijk plan (PIP) een andere route gekozen. Wie eerder begon, valt meestal onder de oude wet met niveau A2. Vraag je eigen niveau na bij de gemeente of op de officiële website.'],
    ['Waar en hoe doe ik het examen?', `DUO neemt de examens af. Kijk voor aanmelden, kosten en data altijd op ${official} en ${duo}; die informatie verandert soms.`],
    ['Hoe helpt Nedfa bij het examen?', 'Met dagelijkse oefening van woorden en zinnen uit echte situaties (huisarts, gemeente, werk, wonen, school), luisteren naar Nederlandse audio, dictee, zinnen bouwen en grammatica op A2- en B1-niveau. Nedfa vervangt geen officiële cursus, maar maakt elke dag oefenen makkelijk.'],
  ]);
  const skills = lang === 'fa'
    ? [['شنیدن', 'Luisteren', 'گفت‌وگوها و پیام‌های کوتاه روزمره را می‌شنوید و به سؤال‌ها جواب می‌دهید.', 'game-dictee'], ['خواندن', 'Lezen', 'متن‌های کاربردی مثل نامهٔ شهرداری، آگهی یا ایمیل را می‌خوانید.', 'bronnen'], ['نوشتن', 'Schrijven', 'فرم پر می‌کنید و پیام یا ایمیل کوتاه می‌نویسید.', 'gemeente'], ['صحبت کردن', 'Spreken', 'دربارهٔ موقعیت‌های روزمره حرف می‌زنید و نظرتان را می‌گویید.', 'spreken']]
    : [['Luisteren', 'Luisteren', 'Je hoort korte gesprekken en berichten uit het dagelijks leven en beantwoordt vragen.', 'game-dictee'], ['Lezen', 'Lezen', 'Je leest praktische teksten zoals een brief van de gemeente, een advertentie of een e-mail.', 'bronnen'], ['Schrijven', 'Schrijven', 'Je vult een formulier in en schrijft een kort bericht of een e-mail.', 'gemeente'], ['Spreken', 'Spreken', 'Je praat over situaties van elke dag en geeft je mening.', 'spreken']];
  const skillImage = (id) => (id === 'game-dictee' ? '/img/games/dictee.jpg' : `/img/themes/${id}.jpg`);
  const plan = lang === 'fa'
    ? ['هر روز ۵ تا ۱۰ دقیقه کارت‌های مرور را در اپ تمام کنید.', 'هفته‌ای یک موضوع جدید انتخاب کنید و جمله‌های کاربردی آن را بلند تکرار کنید.', 'با بازی «دیکته» گوش دادن و املا را تمرین کنید؛ با «ساختن جمله» ترتیب کلمات را.', 'نکته‌های گرامری سطح خود (A2 یا B1) را یکی‌یکی جلو بروید و برای هر کدام شش تمرین را انجام دهید.']
    : ['Maak elke dag in 5 tot 10 minuten je herhaalkaartjes af.', 'Kies elke week een nieuw thema en zeg de handige zinnen hardop na.', 'Oefen luisteren en spelling met het dictee, en woordvolgorde met Zinnen bouwen.', 'Werk de grammatica van jouw niveau (A2 of B1) één voor één door, met zes oefeningen per regel.'];
  const body = `
${section(`<div class="mt-4 grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
  <div>
    <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">${L('آزمون اینبورخرینگ: راهنمای فارسی برای آمادگی زبان هلندی', 'Inburgeringsexamen: zo oefen je je Nederlands (uitleg voor Perzisch sprekenden)')}</h1>
    <p class="mt-3 text-lg text-muted-foreground">${L(`آزمون هم‌پذیری هلند (${nl('inburgeringsexamen')}) برای بسیاری از ایرانی‌ها در هلند قدم مهمی است. اینجا به زبان ساده می‌خوانید بخش زبان آزمون چه چیزهایی را می‌سنجد و چطور هر روز برایش تمرین کنید.`, 'Voor veel Iraniërs in Nederland is het inburgeringsexamen een belangrijke stap. Hier lees je in gewone taal wat het taaldeel toetst en hoe je er elke dag voor oefent. Dezelfde uitleg staat ook in het Perzisch.')}</p>
    <div class="mt-5">${cta(lang, appLink(), L('شروع تمرین رایگان', 'Gratis oefenen'))}</div>
  </div>
  <img src="/img/inburgering.webp" alt="${L('مسکات نِدفا با یک گواهی‌نامه، کتاب و هدفون', 'De Nedfa-mascotte met een diploma, boeken en een koptelefoon')}" width="1024" height="1024" class="mx-auto w-full max-w-xs rounded-3xl">
</div>`)}
${section(`<div class="max-w-3xl">${h2(L('بخش‌های زبان در آزمون', 'De taalonderdelen'))}
<ul class="mt-4 grid gap-3 sm:grid-cols-2">${skills.map(([title, dutch, text, image]) => `<li class="flex gap-3 rounded-xl border bg-card p-4"><img src="${skillImage(image)}" alt="" width="64" height="64" loading="lazy" class="size-16 shrink-0 rounded-xl"><div><h3 class="font-bold">${esc(title)}${lang === 'fa' ? ` · ${nl(dutch)}` : ''}</h3><p class="mt-1 text-sm text-muted-foreground">${text}</p></div></li>`).join('')}</ul>
<p class="mt-4 text-sm text-muted-foreground">${L(`بسته به مسیر شما، بخش‌های دیگری مثل شناخت جامعهٔ هلند (${nl('KNM')}) هم ممکن است لازم باشد. جزئیات و هزینه‌ها را در سایت رسمی ببینید.`, 'Afhankelijk van je route kunnen ook andere onderdelen nodig zijn, zoals Kennis van de Nederlandse Maatschappij (KNM). Details en kosten staan op de officiële website.')}</p>
</div>`, 'mt-12')}
${section(`<div class="max-w-3xl">${h2(L('موضوعاتی که در آزمون زیاد می‌آیند', 'Onderwerpen die vaak terugkomen'))}
<ul class="mt-4 grid gap-3 sm:grid-cols-2">${['huisarts', 'gemeente', 'werk', 'wonen', 'boodschappen', 'school', 'solliciteren', 'digitaal'].map((id) => themes.find((t) => t.id === id)).filter(Boolean).map((theme) => themeCard(lang, theme)).join('')}</ul></div>`, 'mt-12')}
${section(`<div class="max-w-3xl">${h2(L('برنامهٔ تمرین روزانه', 'Een oefenplan voor elke dag'))}
<ol class="mt-4 list-decimal space-y-2 ps-6">${plan.map((line) => `<li>${line}</li>`).join('')}</ol></div>`, 'mt-12')}
${section(`${h2(L('پرسش‌های رایج دربارهٔ اینبورخرینگ', 'Vragen over inburgering'))}<div class="mt-6 max-w-3xl">${questions.html}</div>`, 'mt-12')}
`;
  return page({
    lang, path: '/inburgering/', assets, body, image: '/img/inburgering-og.jpg',
    title: L('آزمون اینبورخرینگ (هم‌پذیری هلند): راهنمای فارسی و تمرین زبان A2 و B1 | نِدفا', 'Inburgeringsexamen A2 en B1: uitleg en dagelijks oefenen | Nedfa'),
    description: L('آزمون اینبورخرینگ به زبان ساده: بخش‌های شنیدن، خواندن، نوشتن و صحبت کردن، سطح A2 یا B1 و برنامهٔ تمرین روزانه با لغات و جمله‌های موقعیت‌های واقعی. تمرین رایگان با نِدفا.', 'Het inburgeringsexamen in gewone taal: luisteren, lezen, schrijven en spreken, niveau A2 of B1, en een dagelijks oefenplan met woorden en zinnen uit echte situaties. Gratis oefenen met Nedfa.'),
    breadcrumbs: [['Nedfa', '/'], [L('آزمون اینبورخرینگ', 'Inburgering'), '/inburgering/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'Article', headline: L('آزمون اینبورخرینگ: راهنمای فارسی برای آمادگی زبان هلندی', 'Inburgeringsexamen: zo oefen je je Nederlands'), inLanguage: lang, dateModified: today, author: {'@id': `${SITE}/#org`}, publisher: {'@id': `${SITE}/#org`}, image: `${SITE}/img/inburgering-og.jpg`}, questions.schema],
  });
}

/* ------------------------------------------------------- crawlers and bots */

function sitemap() {
  const entry = (lang, item) => `  <url><loc>${SITE}${at(lang, item.path)}</loc><lastmod>${today}</lastmod><priority>${item.priority}</priority>${LANGS.map((alt) => `<xhtml:link rel="alternate" hreflang="${alt}" href="${SITE}${at(alt, item.path)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${at('nl', item.path)}"/></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.flatMap((lang) => paths.map((item) => entry(lang, item))).join('\n')}
  <url><loc>${SITE}/privacy.html</loc><lastmod>${today}</lastmod><priority>0.2</priority></url>
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

> Nedfa is a free app and website for learning Dutch (Nederlands) for Persian (Farsi/Dari) speakers, from level A2 to B1. It teaches ${totals.words} Dutch words and expressions in ${totals.themes} everyday themes, ${totals.phrases} practical sentences, ${totals.dialogues} short dialogues and ${totals.patterns} grammar patterns, all with Persian translations and Dutch audio, plus spaced repetition (SM-2) and seven study games. It also helps people prepare for the Dutch civic integration exam (inburgeringsexamen). The public pages exist in Dutch (${SITE}/, the default) and Persian (${SITE}/fa/). Web app: ${SITE}/leren.html (no account needed). iPhone app: coming to the App Store. Contact: ${EMAIL}.

نِدفا اپ و سایت رایگان آموزش زبان هلندی برای فارسی‌زبانان (ایرانی‌ها و افغان‌ها) از سطح A2 تا B1 است.

Nedfa is een gratis app om Nederlands te leren voor Perzisch sprekenden, van A2 naar B1.

## Main pages
- [Home (Dutch)](${SITE}/) · [Persian: آموزش زبان هلندی به فارسی](${SITE}/fa/)
- [Dutch vocabulary by theme](${SITE}/woorden/) · [Persian: لغات هلندی به فارسی](${SITE}/fa/woorden/): ${totals.themes} themes with Dutch word, de/het, Persian meaning and example sentence
- [Dutch grammar](${SITE}/grammatica/) · [Persian: گرامر زبان هلندی](${SITE}/fa/grammatica/): ${totals.patterns} patterns with Persian explanation and examples
- [Inburgering exam guide](${SITE}/inburgering/) · [Persian: آزمون اینبورخرینگ](${SITE}/fa/inburgering/): exam parts, A2/B1 level and a daily practice plan
- [The app (practice)](${SITE}/leren.html)
- [Full text of all lessons](${SITE}/llms-full.txt)

## Vocabulary themes
${themes.map((theme) => `- [${theme.title} (${theme.fa})](${SITE}${themePath(theme)}): ${theme.words.length} words, ${theme.phrases.length} phrases`).join('\n')}

## Grammar patterns
${patterns.map((p) => `- [${p.title} (${p.level})](${SITE}${patternPath(p)})`).join('\n')}

## Optional
- [Privacy](${SITE}/privacy.html)
`;
}

function llmsFull() {
  const themeText = themes.map((theme) => `## ${theme.title} — ${theme.fa}
Source: ${SITE}${themePath(theme)}

### Words (Dutch — Persian — example)
${theme.words.map((word) => `- ${word.nl} — ${word.meaning ?? ''} — ${word.example ?? ''} (${word.translation ?? ''})`).join('\n')}

### Phrases
${theme.phrases.map((phrase) => `- ${phrase.nl} — ${phrase.meaning ?? ''}`).join('\n')}

### Dialogue
${theme.dialogue.map((line) => `- ${line.speaker}: ${line.nl} — ${line.translation}`).join('\n')}
`).join('\n');
  const grammarText = patterns.map((p) => `## ${p.title} (${p.level})
Source: ${SITE}${patternPath(p)}
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
