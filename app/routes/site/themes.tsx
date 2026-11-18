import type {Route} from './+types/themes';
import {card, groups, themes, totals} from '../../site/content.server';
import {SITE, appLink, at, groupNl, langOf, num, themePath, tx} from '../../site/lang';
import {seo} from '../../site/seo';
import {Crumbs, H2, Nl, Picture, Section, StoreBadges, ThemeCard} from '../../site/ui';

export function loader({request}: Route.LoaderArgs) {
  const lang = langOf(new URL(request.url).pathname);
  return {
    lang,
    totals,
    groups: groups.map((group) => ({id: group.id, name: lang === 'fa' ? group.fa : groupNl[group.id], themes: themes.filter((theme) => theme.group === group.id).map(card)})),
    all: themes.map((theme) => ({id: theme.id, title: theme.title, fa: theme.fa})),
  };
}

export function meta({loaderData}: Route.MetaArgs) {
  if (!loaderData) return [];
  const {lang, totals: t, all} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  return seo({
    lang, path: '/woorden/', image: '/img/themes/bronnen.jpg',
    title: L(`لغات هلندی به فارسی: ${num(lang, t.words)} لغت پرکاربرد در ${num(lang, t.themes)} موضوع | نِدفا`, `Woordenlijst Nederlands–Farsi: ${t.words} woorden met Perzische vertaling | Nedfa`),
    description: L(`فهرست لغات پرکاربرد هلندی با معنی فارسی، حرف تعریف de/het، جملهٔ مثال و تلفظ: کار، خانه، خرید، پزشک، شهرداری، سفر و ${num(lang, t.themes - 6)} موضوع دیگر.`, `Woordenlijsten Nederlands–Farsi (Perzisch) met lidwoord, voorbeeldzin en audio: werk, wonen, boodschappen, de huisarts, de gemeente, reizen en ${t.themes - 6} andere thema's.`),
    breadcrumbs: [['Nedfa', '/'], [L('لغات هلندی', 'Woorden'), '/woorden/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'CollectionPage', name: L('لغات هلندی به فارسی بر اساس موضوع', 'Nederlandse woorden per thema'), inLanguage: lang, isPartOf: {'@id': `${SITE}/#website`}, hasPart: all.map((theme) => ({'@type': 'WebPage', name: lang === 'fa' ? `لغات هلندی: ${theme.fa}` : `Woorden: ${theme.title}`, url: SITE + at(lang, themePath(theme.id))}))}],
  });
}

export default function Themes({loaderData}: Route.ComponentProps) {
  const {lang, totals: t, groups: list} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  return (
    <>
      <Crumbs lang={lang} items={[['Nedfa', '/'], [L('لغات هلندی', 'Woorden'), '/woorden/']]} />
      <Section>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Picture src="/img/themes/bronnen.jpg" size={144} eager className="size-28 shrink-0 rounded-2xl sm:size-36" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{L('لغات هلندی به فارسی، بر اساس موضوع', 'Nederlandse woorden per thema, met vertaling in het Farsi')}</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{lang === 'fa' ? <>{num(lang, t.words)} لغت و اصطلاح پرکاربرد هلندی در {num(lang, t.themes)} موضوع زندگی روزمره، هر کدام با حرف تعریف (<Nl>de</Nl> یا <Nl>het</Nl>)، معنی فارسی، جملهٔ مثال و ترجمه. برای هر موضوع جمله‌های کاربردی و یک مکالمهٔ کوتاه هم هست.</> : `${t.words} veelgebruikte Nederlandse woorden en uitdrukkingen in ${t.themes} thema's uit het dagelijks leven, elk met lidwoord (de of het), Perzische betekenis, voorbeeldzin en vertaling. Per thema ook handige zinnen en een kort gesprek.`}</p>
          </div>
        </div>
      </Section>
      {list.map((group) => (
        <Section key={group.id} className="mt-10">
          <H2>{group.name}</H2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.themes.map((theme) => <ThemeCard key={theme.id} lang={lang} theme={theme} />)}</ul>
        </Section>
      ))}
      <Section>
        <div className="mt-12 flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
          <Picture src="/img/mascot-cheer.jpg" size={96} className="size-24 rounded-2xl" />
          <div>
            <h2 className="text-xl font-bold">{L('تمرین با تلفظ و مرور هوشمند', 'Oefenen met audio en slim herhalen')}</h2>
            <p className="mt-1 text-muted-foreground">{L('در اپ نِدفا هر لغت را می‌شنوید، انتخاب یا تایپ می‌کنید و در زمان درست دوباره مرور می‌کنید.', 'In de app hoor je elk woord, kies of typ je het, en herhaal je het precies op tijd.')}</p>
            <StoreBadges lang={lang} web={appLink('#woorden')} className="mt-4" />
          </div>
        </div>
      </Section>
    </>
  );
}
