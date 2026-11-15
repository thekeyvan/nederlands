import type {Route} from './+types/inburgering';
import {card, themes} from '../../site/content.server';
import {SITE, appLink, langOf, tx, type Lang} from '../../site/lang';
import {faqSchema, seo} from '../../site/seo';
import {Crumbs, Cta, Faq, H2, Nl, Picture, Section, ThemeCard, nlh} from '../../site/ui';

const official = '<a class="text-primary underline" href="https://www.inburgeren.nl" rel="noopener" lang="nl">inburgeren.nl</a>';
const duo = '<a class="text-primary underline" href="https://duo.nl" rel="noopener" lang="nl">duo.nl</a>';
const questions = (lang: Lang): [string, string][] =>
  lang === 'fa'
    ? [
        ['آزمون اینبورخرینگ چیست؟', `آزمون هم‌پذیری (${nlh('inburgeringsexamen')}) آزمونی است که بسیاری از مهاجران در هلند باید بگذرانند. بخش زبان آن مهارت‌های شنیدن، خواندن، نوشتن و صحبت کردن به هلندی را می‌سنجد.`],
        ['چه سطحی از زبان هلندی لازم است؟', `برای کسانی که از ۱ ژانویهٔ ۲۰۲۲ به بعد مشمول قانون جدید (${nlh('Wet inburgering 2021')}) شده‌اند، سطح استاندارد B1 است؛ برای برخی، طبق برنامهٔ شخصی (PIP)، مسیر دیگری تعیین می‌شود. کسانی که پیش از آن شروع کرده‌اند معمولاً تحت قانون قبلی با سطح A2 هستند. سطح دقیق خود را از شهرداری یا سایت رسمی بپرسید.`],
        ['آزمون را کجا و چطور می‌دهم؟', `آزمون‌ها را ${nlh('DUO')} برگزار می‌کند. ثبت‌نام، هزینه‌ها و تاریخ‌ها را همیشه در سایت رسمی ${official} و ${duo} چک کنید؛ این اطلاعات گاهی تغییر می‌کند.`],
        ['نِدفا چطور به آمادگی آزمون کمک می‌کند؟', 'با تمرین روزانهٔ لغات و جمله‌های موقعیت‌های واقعی (پزشک، شهرداری، کار، خانه، مدرسه)، گوش دادن به صدای هلندی، دیکته، ساختن جمله و گرامر سطح A2 و B1. نِدفا جایگزین کلاس رسمی نیست، ولی تمرین هر روزه را ساده می‌کند.'],
      ]
    : [
        ['Wat is het inburgeringsexamen?', 'Een examen dat veel nieuwkomers in Nederland moeten halen. Het taaldeel toetst luisteren, lezen, schrijven en spreken in het Nederlands.'],
        ['Welk niveau Nederlands heb ik nodig?', 'Wie op of na 1 januari 2022 inburgeringsplichtig werd, valt onder de Wet inburgering 2021; daarbij is B1 het standaardniveau. Voor sommigen wordt in het persoonlijk plan (PIP) een andere route gekozen. Wie eerder begon, valt meestal onder de oude wet met niveau A2. Vraag je eigen niveau na bij de gemeente of op de officiële website.'],
        ['Waar en hoe doe ik het examen?', `DUO neemt de examens af. Kijk voor aanmelden, kosten en data altijd op ${official} en ${duo}; die informatie verandert soms.`],
        ['Hoe helpt Nedfa bij het examen?', 'Met dagelijkse oefening van woorden en zinnen uit echte situaties (huisarts, gemeente, werk, wonen, school), luisteren naar Nederlandse audio, dictee, zinnen bouwen en grammatica op A2- en B1-niveau. Nedfa vervangt geen officiële cursus, maar maakt elke dag oefenen makkelijk.'],
      ];

export function loader({request}: Route.LoaderArgs) {
  const lang = langOf(new URL(request.url).pathname);
  const topics = ['huisarts', 'gemeente', 'werk', 'wonen', 'boodschappen', 'school', 'solliciteren', 'digitaal'].map((id) => themes.find((theme) => theme.id === id)).filter((theme) => theme !== undefined).map(card);
  return {lang, topics, faq: questions(lang), today: new Date().toISOString().slice(0, 10)};
}

export function meta({loaderData}: Route.MetaArgs) {
  if (!loaderData) return [];
  const {lang, faq, today} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  return seo({
    lang, path: '/inburgering/', image: '/img/inburgering-og.jpg',
    title: L('آزمون اینبورخرینگ (هم‌پذیری هلند): راهنمای فارسی و تمرین زبان A2 و B1 | نِدفا', 'Inburgeringsexamen A2 en B1: uitleg en dagelijks oefenen | Nedfa'),
    description: L('آزمون اینبورخرینگ به زبان ساده: بخش‌های شنیدن، خواندن، نوشتن و صحبت کردن، سطح A2 یا B1 و برنامهٔ تمرین روزانه با لغات و جمله‌های موقعیت‌های واقعی. تمرین رایگان با نِدفا.', 'Het inburgeringsexamen in gewone taal: luisteren, lezen, schrijven en spreken, niveau A2 of B1, en een dagelijks oefenplan met woorden en zinnen uit echte situaties. Gratis oefenen met Nedfa.'),
    breadcrumbs: [['Nedfa', '/'], [L('آزمون اینبورخرینگ', 'Inburgering'), '/inburgering/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'Article', headline: L('آزمون اینبورخرینگ: راهنمای فارسی برای آمادگی زبان هلندی', 'Inburgeringsexamen: zo oefen je je Nederlands'), inLanguage: lang, dateModified: today, author: {'@id': `${SITE}/#org`}, publisher: {'@id': `${SITE}/#org`}, image: `${SITE}/img/inburgering-og.jpg`}, faqSchema(faq)],
  });
}

export default function Inburgering({loaderData}: Route.ComponentProps) {
  const {lang, topics, faq} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  const skills: [string, string, string, string][] = lang === 'fa'
    ? [['شنیدن', 'Luisteren', 'گفت‌وگوها و پیام‌های کوتاه روزمره را می‌شنوید و به سؤال‌ها جواب می‌دهید.', '/img/games/dictee.jpg'], ['خواندن', 'Lezen', 'متن‌های کاربردی مثل نامهٔ شهرداری، آگهی یا ایمیل را می‌خوانید.', '/img/themes/bronnen.jpg'], ['نوشتن', 'Schrijven', 'فرم پر می‌کنید و پیام یا ایمیل کوتاه می‌نویسید.', '/img/themes/gemeente.jpg'], ['صحبت کردن', 'Spreken', 'دربارهٔ موقعیت‌های روزمره حرف می‌زنید و نظرتان را می‌گویید.', '/img/themes/spreken.jpg']]
    : [['Luisteren', 'Luisteren', 'Je hoort korte gesprekken en berichten uit het dagelijks leven en beantwoordt vragen.', '/img/games/dictee.jpg'], ['Lezen', 'Lezen', 'Je leest praktische teksten zoals een brief van de gemeente, een advertentie of een e-mail.', '/img/themes/bronnen.jpg'], ['Schrijven', 'Schrijven', 'Je vult een formulier in en schrijft een kort bericht of een e-mail.', '/img/themes/gemeente.jpg'], ['Spreken', 'Spreken', 'Je praat over situaties van elke dag en geeft je mening.', '/img/themes/spreken.jpg']];
  const plan = lang === 'fa'
    ? ['هر روز ۵ تا ۱۰ دقیقه کارت‌های مرور را در اپ تمام کنید.', 'هفته‌ای یک موضوع جدید انتخاب کنید و جمله‌های کاربردی آن را بلند تکرار کنید.', 'با بازی «دیکته» گوش دادن و املا را تمرین کنید؛ با «ساختن جمله» ترتیب کلمات را.', 'نکته‌های گرامری سطح خود (A2 یا B1) را یکی‌یکی جلو بروید و برای هر کدام شش تمرین را انجام دهید.']
    : ['Maak elke dag in 5 tot 10 minuten je herhaalkaartjes af.', 'Kies elke week een nieuw thema en zeg de handige zinnen hardop na.', 'Oefen luisteren en spelling met het dictee, en woordvolgorde met Zinnen bouwen.', 'Werk de grammatica van jouw niveau (A2 of B1) één voor één door, met zes oefeningen per regel.'];
  return (
    <>
      <Crumbs lang={lang} items={[['Nedfa', '/'], [L('آزمون اینبورخرینگ', 'Inburgering'), '/inburgering/']]} />
      <Section>
        <div className="mt-4 grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{L('آزمون اینبورخرینگ: راهنمای فارسی برای آمادگی زبان هلندی', 'Inburgeringsexamen: zo oefen je je Nederlands (uitleg voor Perzisch sprekenden)')}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{lang === 'fa' ? <>آزمون هم‌پذیری هلند (<Nl>inburgeringsexamen</Nl>) برای بسیاری از ایرانی‌ها در هلند قدم مهمی است. اینجا به زبان ساده می‌خوانید بخش زبان آزمون چه چیزهایی را می‌سنجد و چطور هر روز برایش تمرین کنید.</> : 'Voor veel Iraniërs in Nederland is het inburgeringsexamen een belangrijke stap. Hier lees je in gewone taal wat het taaldeel toetst en hoe je er elke dag voor oefent. Dezelfde uitleg staat ook in het Perzisch.'}</p>
            <div className="mt-5"><Cta lang={lang} href={appLink()}>{L('شروع تمرین رایگان', 'Gratis oefenen')}</Cta></div>
          </div>
          <img src="/img/inburgering.webp" alt={L('مسکات نِدفا با یک گواهی‌نامه، کتاب و هدفون', 'De Nedfa-mascotte met een diploma, boeken en een koptelefoon')} width={1024} height={1024} className="mx-auto w-full max-w-xs rounded-3xl" />
        </div>
      </Section>
      <Section className="mt-12">
        <div className="max-w-3xl">
          <H2>{L('بخش‌های زبان در آزمون', 'De taalonderdelen')}</H2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">{skills.map(([title, dutch, text, image]) => <li key={dutch} className="flex gap-3 rounded-xl border bg-card p-4"><Picture src={image} size={64} className="size-16 shrink-0 rounded-xl" /><div><h3 className="font-bold">{title}{lang === 'fa' && <> · <Nl>{dutch}</Nl></>}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div></li>)}</ul>
          <p className="mt-4 text-sm text-muted-foreground">{lang === 'fa' ? <>بسته به مسیر شما، بخش‌های دیگری مثل شناخت جامعهٔ هلند (<Nl>KNM</Nl>) هم ممکن است لازم باشد. جزئیات و هزینه‌ها را در سایت رسمی ببینید.</> : 'Afhankelijk van je route kunnen ook andere onderdelen nodig zijn, zoals Kennis van de Nederlandse Maatschappij (KNM). Details en kosten staan op de officiële website.'}</p>
        </div>
      </Section>
      <Section className="mt-12">
        <div className="max-w-3xl">
          <H2>{L('موضوعاتی که در آزمون زیاد می‌آیند', 'Onderwerpen die vaak terugkomen')}</H2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">{topics.map((theme) => <ThemeCard key={theme.id} lang={lang} theme={theme} />)}</ul>
        </div>
      </Section>
      <Section className="mt-12">
        <div className="max-w-3xl">
          <H2>{L('برنامهٔ تمرین روزانه', 'Een oefenplan voor elke dag')}</H2>
          <ol className="mt-4 list-decimal space-y-2 ps-6">{plan.map((line) => <li key={line}>{line}</li>)}</ol>
        </div>
      </Section>
      <Section className="mt-12"><H2>{L('پرسش‌های رایج دربارهٔ اینبورخرینگ', 'Vragen over inburgering')}</H2><div className="mt-6 max-w-3xl"><Faq items={faq} /></div></Section>
    </>
  );
}
