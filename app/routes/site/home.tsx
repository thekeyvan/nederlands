import type {Route} from './+types/home';
import {card, patterns, themes, totals} from '../../site/content.server';
import {APP_STORE, BRAND_FA, SITE, appLink, at, langOf, num, organization, patternPath, tx, type Lang} from '../../site/lang';
import {faqSchema, seo} from '../../site/seo';
import {Fa, Faq, Ghost, StoreBadges, H2, Nl, Picture, Section, ThemeCard, nlh} from '../../site/ui';
import {Link} from 'react-router';

export function loader({request}: Route.LoaderArgs) {
  const lang = langOf(new URL(request.url).pathname);
  const featured = ['v2', 'perfectum', 'omdat', 'scheidbaar', 'dat', 'die-dat'].map((slug) => patterns.find((p) => p.slug === slug)).filter((p) => p !== undefined);
  return {lang, totals, themes: themes.slice(0, 12).map(card), featured: featured.map(({slug, title, level}) => ({slug, title, level})), faq: questions(lang)};
}

const questions = (lang: Lang): [string, string][] =>
  lang === 'fa'
    ? [
        ['آیا نِدفا رایگان است؟', 'بله. اپ و نسخهٔ وب نِدفا رایگان هستند و تبلیغ ندارند. می‌توانید بدون حساب کاربری شروع کنید.'],
        ['نِدفا برای چه سطحی مناسب است؟', 'از صفر تا B1. اگر تازه شروع کرده‌اید، با بخش «شروع از صفر» (سلام و آشنایی، اعداد، رنگ‌ها، غذا و روزمره) شروع کنید. یک آزمون تعیین سطح کوتاه هم دارد که نقطهٔ شروع مناسب را برایتان پیدا می‌کند و تمرین‌ها را با سطح شما تنظیم می‌کند.'],
        ['آیا برای آزمون اینبورخرینگ (هم‌پذیری) کمک می‌کند؟', 'نِدفا موضوعات زندگی روزمره را تمرین می‌کند که در آزمون‌های شنیدن، خواندن، نوشتن و صحبت کردن می‌آیند: پزشک، شهرداری، کار، خانه و خرید. <a class="text-primary underline" href="/fa/inburgering/">راهنمای آزمون اینبورخرینگ</a> را هم ببینید.'],
        ['ترجمه‌ها به فارسی است؟', `بله. همهٔ ${num(lang, totals.words)} لغت، جمله‌ها و نکته‌های گرامری ترجمه و توضیح فارسی دارند و هر جملهٔ هلندی را می‌توانید با صدای هلندی بشنوید.`],
        ['روی آیفون و کامپیوتر کار می‌کند؟', `بله. <a class="text-primary underline" href="${APP_STORE}">اپ آیفون نِدفا</a> رایگان در App Store است، اپ اندروید به‌زودی می‌آید و نسخهٔ وب روی هر مرورگری کار می‌کند. با ورود از طریق اپل یا گوگل، پیشرفت شما بین گوشی و کامپیوتر همگام می‌شود. اپل و گوگل با یک ایمیل به یک حساب می‌رسند و در تنظیمات می‌توانید هر دو را به حساب خود وصل کنید.`],
        ['چطور نظر یا مشکلی را گزارش کنم؟', 'در اپ آیفون، گوشی را تکان دهید یا به «تنظیمات ← Feedback geven» بروید؛ در وب‌سایت هم همین گزینه در تنظیمات است. هر مشکل، ایده یا تعریفی به بهتر شدن نِدفا کمک می‌کند.'],
        ['یادگیری زبان هلندی برای فارسی‌زبان‌ها سخت است؟', `هلندی الفبای لاتین و ترتیب کلمات متفاوتی دارد، اما با تمرین روزانهٔ کوتاه به‌خوبی یاد گرفته می‌شود. نکته‌های مهم مثل ${nlh('de')} و ${nlh('het')}، جای فعل در جمله و افعال جداشدنی را در <a class="text-primary underline" href="/fa/grammatica/">بخش گرامر</a> به فارسی توضیح داده‌ایم.`],
      ]
    : [
        ['Is Nedfa gratis?', 'Ja. De app en de website zijn gratis en zonder advertenties. Je kunt beginnen zonder account.'],
        ['Voor wie is Nedfa?', 'Voor Perzisch sprekenden (Iraniërs en Afghanen die Farsi of Dari spreken), van beginner tot B1: naast een taalcursus of voor het inburgeringsexamen. Een korte niveautest kiest waar je begint en past de oefeningen aan je niveau aan.'],
        ['Helpt Nedfa bij het inburgeringsexamen?', 'Nedfa oefent de onderwerpen van het dagelijks leven die in de examens luisteren, lezen, schrijven en spreken terugkomen: de huisarts, de gemeente, werk, wonen en boodschappen. Lees ook de <a class="text-primary underline" href="/inburgering/">uitleg over inburgering</a>.'],
        ['Zijn alle vertalingen in het Farsi (Perzisch)?', `Ja. Alle ${totals.words} woorden, de zinnen en de grammatica hebben een Perzische vertaling of uitleg, en elke Nederlandse zin hoor je met Nederlandse audio.`],
        ['Werkt het op de iPhone en de computer?', `Ja. <a class="text-primary underline" href="${APP_STORE}">De iPhone-app</a> staat gratis in de App Store, de Android-app komt binnenkort en de website werkt in elke browser. Log in met Apple of Google, dan gaat je voortgang mee tussen telefoon en computer. Apple en Google met hetzelfde e-mailadres komen in hetzelfde account, en bij Instellingen koppel je ze ook zelf.`],
        ['Hoe geef ik feedback?', 'Schud je iPhone in de app, of kies Instellingen → Feedback geven (ook op de website). Een probleem, een idee of een compliment: alles helpt om Nedfa beter te maken.'],
        ['Kan ik als Nederlander iemand helpen met Nedfa?', 'Zeker. Gebruik de <a class="text-primary underline" href="/woorden/">woordenlijsten per thema</a> en de <a class="text-primary underline" href="/grammatica/">grammatica</a> samen met een taalmaatje: de Nederlandse tekst staat er steeds naast de Perzische.'],
      ];

export function meta({loaderData}: Route.MetaArgs) {
  if (!loaderData) return [];
  const {lang, totals: t, faq} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  return seo({
    lang,
    path: '/',
    title: L('آموزش زبان هلندی به فارسی | اپ رایگان نِدفا (از صفر تا B1)', 'Nederlands leren in het Farsi (Perzisch) | gratis app Nedfa'),
    description: L(`یادگیری زبان هلندی برای فارسی‌زبانان (ایرانی و افغان): ${num(lang, t.words)} لغت با تلفظ و ترجمهٔ فارسی، جملات کاربردی، گرامر هلندی به زبان ساده، بازی و آمادگی آزمون اینبورخرینگ. اپ رایگان آیفون (اندروید به‌زودی) و نسخهٔ وب.`, `Nederlands leren met uitleg in het Farsi (Perzisch): ${t.words} woorden met audio en vertaling, handige zinnen, grammatica, spellen en oefening voor inburgering. Gratis app voor iPhone (Android binnenkort) en op het web.`),
    jsonLd: [
      {'@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: 'Nedfa', alternateName: [BRAND_FA, 'نِدفا: آموزش زبان هلندی'], inLanguage: ['fa', 'nl'], publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', ...organization},
      {'@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Nedfa: Nederlands leren', alternateName: BRAND_FA, applicationCategory: 'EducationalApplication', operatingSystem: 'iOS, Web', url: SITE, image: `${SITE}/img/logo.png`, inLanguage: ['fa', 'nl'], offers: {'@type': 'Offer', price: 0, priceCurrency: 'EUR'}, publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', '@type': 'Course', name: L('آموزش زبان هلندی برای فارسی‌زبانان (از صفر تا B1)', 'Nederlands voor Farsi- en Perzisch sprekenden (A0–B1)'), description: L('دورهٔ رایگان و خودآموز زبان هلندی با توضیح فارسی: لغات روزمره با تلفظ، جملات کاربردی، گرامر و مکالمه.', 'Gratis zelfstudiecursus Nederlands met uitleg in het Farsi (Perzisch): woorden met audio, handige zinnen, grammatica en gesprekken.'), inLanguage: lang, teaches: L('زبان هلندی (Nederlands)', 'Nederlands'), educationalLevel: 'A2–B1', isAccessibleForFree: true, provider: {'@id': `${SITE}/#org`}, offers: {'@type': 'Offer', price: 0, priceCurrency: 'EUR', category: 'Free'}, hasCourseInstance: {'@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT10M'}},
      faqSchema(faq),
    ],
  });
}

export default function Home({loaderData}: Route.ComponentProps) {
  const {lang, totals: t, themes: cards, featured, faq} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  const features: [string, string, React.ReactNode][] = lang === 'fa'
    ? [
        ['/img/themes/huisarts.jpg', 'لغت با تلفظ هلندی', `${num(lang, t.words)} لغت و اصطلاح در ${num(lang, t.themes)} موضوع روزمره، هر کدام با جملهٔ مثال، ترجمهٔ فارسی و صدای هلندی.`],
        ['/img/mascot-cheer.jpg', 'مرور هوشمند', 'کارت‌ها درست وقتی برمی‌گردند که در حال فراموش کردنشان هستید (روش SM-2). روزی پنج دقیقه کافی است.'],
        ['/img/themes/zinsbouw.jpg', 'گرامر به زبان ساده', `${num(lang, t.patterns)} الگوی گرامری با توضیح فارسی و ${num(lang, t.examples)} جملهٔ مثال، و برای هر الگو شش تمرین کوتاه.`],
        ['/img/games/lidwoord.jpg', 'هفت بازی آموزشی', <><Nl>de</Nl> یا <Nl>het</Nl>، ساختن جمله، افعال گذشته، دیکته، مکالمه و مسابقهٔ زمان‌دار.</>],
      ]
    : [
        ['/img/themes/huisarts.jpg', 'Woorden met audio', `${t.words} woorden en uitdrukkingen in ${t.themes} thema's uit het dagelijks leven, elk met een voorbeeldzin, Perzische vertaling en Nederlandse audio.`],
        ['/img/mascot-cheer.jpg', 'Slim herhalen', 'Kaartjes komen terug precies wanneer je ze bijna vergeet (SM-2). Vijf minuten per dag is genoeg.'],
        ['/img/themes/zinsbouw.jpg', 'Grammatica, eenvoudig uitgelegd', `${t.patterns} patronen met Perzische uitleg en ${t.examples} voorbeeldzinnen, en per patroon zes korte oefeningen.`],
        ['/img/games/lidwoord.jpg', 'Zeven spellen', 'De of het, zinnen bouwen, werkwoorden, dictee, gesprekken en een tijdrace.'],
      ];
  const steps: [string, string, string][] = lang === 'fa'
    ? [['/img/mascot-wave.jpg', 'یک موضوع انتخاب کنید', 'مثلاً «پیش پزشک خانواده» یا «در سوپرمارکت»، و لغت‌ها را با صدای هلندی گوش کنید.'], ['/img/themes/week.jpg', 'هر روز یک دور کوتاه', 'پنج تا ده کارت: انتخاب، گوش دادن، تایپ کردن. جواب درست و غلط را بلافاصله می‌بینید.'], ['/img/themes/route.jpg', 'پیشرفت را ببینید', 'رکورد روزانه، امتیاز، ستاره برای هر موضوع و یک مسیر هشت‌مرحله‌ای از A2 تا B1.']]
    : [['/img/mascot-wave.jpg', 'Kies een thema', 'Bijvoorbeeld "Naar de huisarts" of "In de supermarkt", en luister naar de woorden.'], ['/img/themes/week.jpg', 'Elke dag een kort rondje', 'Vijf tot tien kaartjes: kiezen, luisteren, typen. Je ziet meteen wat goed en fout is.'], ['/img/themes/route.jpg', 'Zie je vooruitgang', 'Een dagreeks, XP, sterren per thema en een route van acht haltes van A2 naar B1.']];
  return (
    <>
      <Section>
        <div className="grid items-center gap-8 py-10 md:grid-cols-[1.1fr_1fr] md:py-16">
          <div>
            <p className="text-sm font-bold text-primary">{L('رایگان · برای فارسی‌زبانان · از صفر تا B1', 'Gratis · voor Farsi-sprekenden · van nul tot B1')}</p>
            <h1 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">{L('آموزش زبان هلندی به فارسی، هر روز چند دقیقه', 'Nederlands leren met uitleg in het Farsi, elke dag een beetje')}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {lang === 'fa'
                ? <>{BRAND_FA} (<Nl>Nedfa</Nl>) اپ رایگان یادگیری زبان هلندی برای ایرانی‌ها، افغان‌ها و همهٔ فارسی‌زبانان است: لغت با تلفظ هلندی، جمله‌های کاربردی برای زندگی در هلند، گرامر به زبان ساده و آمادگی برای آزمون اینبورخرینگ.</>
                : <>Nedfa (<Fa>{BRAND_FA}</Fa>) is een gratis app om Nederlands te leren voor Iraniërs, Afghanen en andere Perzisch sprekenden (Farsi en Dari): woorden met Nederlandse audio, handige zinnen voor het leven in Nederland, grammatica in gewone taal en oefening voor het inburgeringsexamen.</>}
            </p>
            <div id="download" className="mt-6 scroll-mt-28"><StoreBadges lang={lang} className="text-muted-foreground" /></div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Ghost href={appLink()}>{L('تمرین در مرورگر', 'Oefenen in je browser')}</Ghost>
              <Ghost to={at(lang, '/woorden/')}>{L('دیدن لغات هلندی', 'Bekijk de woorden')}</Ghost>
            </div>
          </div>
          <img src="/img/hero.webp" alt={L('مسکات نِدفا جلوی خانه‌های هلندی با دوچرخه، آسیاب بادی، گل لاله و یک استکان چای', 'De Nedfa-mascotte zwaait voor Nederlandse grachtenpanden met een fiets, een molen, tulpen en een Perzisch theeglas')} width={1536} height={1024} fetchPriority="high" className="w-full rounded-3xl" />
        </div>
      </Section>
      <Section>
        <ul className="grid grid-cols-2 gap-3 rounded-2xl bg-secondary p-5 text-center text-secondary-foreground sm:grid-cols-4">
          {([[t.words, L('لغت و اصطلاح', 'woorden')], [t.phrases, L('جملهٔ کاربردی', 'handige zinnen')], [t.patterns, L('نکتهٔ گرامری', 'grammaticaregels')], [t.themes, L('موضوع روزمره', "thema's")]] as const).map(([value, label]) => (
            <li key={label}><span className="block text-3xl font-extrabold">{num(lang, value)}</span><span className="text-sm opacity-80">{label}</span></li>
          ))}
        </ul>
      </Section>
      <Section className="mt-16">
        <H2>{L('چرا نِدفا برای یادگیری هلندی؟', 'Waarom Nedfa?')}</H2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{L('بیشتر اپ‌های آموزش زبان هلندی به انگلیسی هستند. در نِدفا همه‌چیز به فارسی توضیح داده شده و موضوعات همان چیزهایی است که در هلند هر روز لازم دارید.', 'De meeste apps om Nederlands te leren zijn in het Engels. In Nedfa staat alle uitleg in het Perzisch (Farsi), over de dingen die je in Nederland elke dag nodig hebt.')}</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map(([image, title, text]) => (
            <li key={title} className="flex gap-4 rounded-2xl border bg-card p-4"><Picture src={image} size={80} className="size-20 shrink-0 rounded-xl" /><div><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div></li>
          ))}
        </ul>
      </Section>
      <Section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><H2>{L('لغات هلندی بر اساس موضوع', 'Woorden per thema')}</H2><Link to={at(lang, '/woorden/')} className="text-sm font-bold text-primary">{L(`همهٔ ${num(lang, t.themes)} موضوع ←`, `Alle ${t.themes} thema's →`)}</Link></div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map((theme) => <ThemeCard key={theme.id} lang={lang} theme={theme} />)}</ul>
      </Section>
      <Section className="mt-16">
        <div className="grid gap-6 rounded-3xl border bg-card p-6 md:grid-cols-[auto_1fr_1fr] md:items-center md:p-8">
          <Picture src="/img/themes/zinsbouw.jpg" size={140} className="size-28 rounded-2xl md:size-36" />
          <div>
            <H2>{L('گرامر هلندی، به فارسی و با مثال', 'Grammatica met voorbeelden')}</H2>
            <p className="mt-2 text-muted-foreground">{lang === 'fa' ? <>جای فعل در جمله، <Nl>omdat</Nl> و <Nl>want</Nl>، زمان گذشته، افعال جداشدنی و {num(lang, t.patterns)} الگوی دیگر؛ هر کدام با چهار جملهٔ مثال و ترجمهٔ فارسی.</> : `Het werkwoord op plek twee, omdat en want, de verleden tijd, scheidbare werkwoorden en nog ${t.patterns - 4} patronen, elk met vier voorbeeldzinnen en een Perzische vertaling.`}</p>
            <div className="mt-4"><Ghost to={at(lang, '/grammatica/')}>{L('همهٔ نکته‌های گرامری', 'Alle grammatica')}</Ghost></div>
          </div>
          <ul className="grid gap-2">{featured.map((p) => <li key={p.slug}><Link to={at(lang, patternPath(p.slug))} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted"><Nl className="font-semibold">{p.title}</Nl><span className="text-xs text-muted-foreground">{p.level}</span></Link></li>)}</ul>
        </div>
      </Section>
      <Section className="mt-16">
        <H2>{L('در سه قدم شروع کنید', 'Zo begin je')}</H2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">{steps.map(([image, title, text]) => <li key={title} className="rounded-2xl border bg-card p-5"><Picture src={image} size={96} className="size-24 rounded-xl" /><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></li>)}</ol>
      </Section>
      <Section className="mt-16">
        <div className="grid items-center gap-6 rounded-3xl bg-accent p-6 text-accent-foreground md:grid-cols-[auto_1fr_auto] md:p-8">
          <Picture src="/img/inburgering.webp" size={120} className="size-24 rounded-2xl md:size-28" />
          <div><H2>{L('آماده‌شدن برای آزمون اینبورخرینگ', 'Oefenen voor het inburgeringsexamen')}</H2><p className="mt-2">{lang === 'fa' ? <>آزمون هم‌پذیری هلند (<Nl>inburgeringsexamen</Nl>) چه بخش‌هایی دارد، چه سطحی لازم است و چطور با تمرین روزانه آماده شوید.</> : 'Welke onderdelen heeft het examen, welk niveau heb je nodig en hoe oefen je er elke dag voor?'}</p></div>
          <Ghost to={at(lang, '/inburgering/')}>{L('خواندن راهنما', 'Lees de uitleg')}</Ghost>
        </div>
      </Section>
      <Section className="mt-16"><H2 id="faq">{L('پرسش‌های رایج', 'Veelgestelde vragen')}</H2><div className="mt-6"><Faq items={faq} /></div></Section>
      <Section>
        <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-secondary px-6 py-10 text-center text-secondary-foreground">
          <Picture src="/img/mascot-wave.jpg" size={112} className="size-28 rounded-3xl" />
          <h2 className="text-2xl font-extrabold sm:text-3xl">{L('همین امروز اولین دور را شروع کنید', 'Begin vandaag met je eerste rondje')}</h2>
          <p className="opacity-80">{L('پنج کارت، کمتر از دو دقیقه. رایگان و بدون تبلیغ.', 'Vijf kaartjes, minder dan twee minuten. Gratis en zonder advertenties.')}</p>
          <StoreBadges lang={lang} web={appLink()} center />
        </div>
      </Section>
    </>
  );
}
