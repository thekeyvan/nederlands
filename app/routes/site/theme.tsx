import type {Route} from './+types/theme';
import {card, kindFa, notFound, themeById, themes} from '../../site/content.server';
import {SITE, appLink, kindNl, langOf, num, themeImage, themePath, tx} from '../../site/lang';
import {seo} from '../../site/seo';
import {Crumbs, Cta, Fa, H2, Nl, Picture, Section, ThemeCard} from '../../site/ui';

export function loader({request, params}: Route.LoaderArgs) {
  const theme = themeById(params.theme);
  if (!theme) throw notFound();
  const lang = langOf(new URL(request.url).pathname);
  const kinds = lang === 'fa' ? kindFa : kindNl;
  return {
    lang,
    theme: {
      id: theme.id, title: theme.title, fa: theme.fa,
      words: theme.words.map((word) => ({id: word.id, nl: word.nl, kind: kinds[word.kind ?? ''] ?? '', forms: word.forms ?? null, meaning: word.meaning ?? '', example: word.example ?? '', translation: word.translation ?? ''})),
      phrases: theme.phrases.map((phrase) => ({id: phrase.id, nl: phrase.nl, meaning: phrase.meaning ?? ''})),
      dialogue: theme.dialogue,
    },
    related: themes.filter((item) => item.group === theme.group && item.id !== theme.id).slice(0, 6).map(card),
  };
}

export function meta({loaderData}: Route.MetaArgs) {
  if (!loaderData) return [];
  const {lang, theme} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  const count = theme.words.length;
  return seo({
    lang, path: themePath(theme.id), image: themeImage(theme.id),
    title: L(`لغات هلندی ${theme.fa}: ${num(lang, count)} لغت با معنی فارسی | نِدفا`, `${theme.title}: ${count} Nederlandse woorden met Perzische vertaling | Nedfa`),
    description: L(`${num(lang, count)} لغت هلندی دربارهٔ ${theme.fa} (${theme.title}) با معنی فارسی، de یا het، جملهٔ مثال و ترجمه، به‌علاوهٔ جمله‌های کاربردی و مکالمه. تمرین رایگان با تلفظ هلندی.`, `${count} Nederlandse woorden over ${theme.title.toLowerCase()} met lidwoord, Perzische betekenis (${theme.fa}), voorbeeldzin en vertaling, plus handige zinnen en een gesprek. Gratis oefenen met audio.`),
    breadcrumbs: [['Nedfa', '/'], [L('لغات هلندی', 'Woorden'), '/woorden/'], [L(theme.fa, theme.title), themePath(theme.id)]],
    jsonLd: [
      {'@context': 'https://schema.org', '@type': 'LearningResource', name: L(`لغات هلندی: ${theme.fa}`, `Nederlandse woorden: ${theme.title}`), inLanguage: lang, learningResourceType: 'Vocabulary list', educationalLevel: 'A2–B1', teaches: `Nederlandse woorden: ${theme.title}`, isAccessibleForFree: true, image: SITE + themeImage(theme.id), publisher: {'@id': `${SITE}/#org`}},
      {'@context': 'https://schema.org', '@type': 'DefinedTermSet', name: `Nederlands–Perzisch: ${theme.title}`, inLanguage: ['nl', 'fa'], hasDefinedTerm: theme.words.map((word) => ({'@type': 'DefinedTerm', name: word.nl, description: word.meaning, inLanguage: 'nl'}))},
    ],
  });
}

export default function ThemePage({loaderData}: Route.ComponentProps) {
  const {lang, theme, related} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  const practice = appLink(`?thema=${theme.id}#woorden`);
  return (
    <>
      <Crumbs lang={lang} items={[['Nedfa', '/'], [L('لغات هلندی', 'Woorden'), '/woorden/'], [L(theme.fa, theme.title), themePath(theme.id)]]} />
      <Section>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Picture src={themeImage(theme.id)} size={520} eager className="size-32 shrink-0 rounded-3xl border object-cover sm:size-40" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{L(`لغات هلندی: ${theme.fa}`, `Nederlandse woorden: ${theme.title}`)}</h1>
            <p className="mt-1 text-lg">{lang === 'fa' ? <Nl className="font-semibold text-muted-foreground">{theme.title}</Nl> : <Fa className="font-semibold text-muted-foreground">{theme.fa}</Fa>}</p>
            <p className="mt-2 text-muted-foreground">{L(`${num(lang, theme.words.length)} لغت و اصطلاح، ${num(lang, theme.phrases.length)} جملهٔ کاربردی و یک مکالمهٔ کوتاه دربارهٔ «${theme.fa}»، با معنی فارسی و جملهٔ مثال.`, `${theme.words.length} woorden en uitdrukkingen, ${theme.phrases.length} handige zinnen en een kort gesprek over "${theme.title}", met Perzische vertaling en voorbeeldzinnen.`)}</p>
          </div>
        </div>
        <div className="mt-5"><Cta lang={lang} href={practice}>{L('تمرین این لغات با تلفظ', 'Oefen deze woorden met audio')}</Cta></div>
      </Section>
      <Section className="mt-10">
        <H2 id="woorden">{L('لغات', 'Woorden')}</H2>
        <ul className="mt-4 rounded-2xl border bg-card px-4">
          {theme.words.map((word) => (
            <li key={word.id} className="grid gap-x-4 gap-y-1 border-t py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <div><Nl className="font-semibold">{word.nl}</Nl><span className="block text-xs text-muted-foreground">{word.kind}{word.forms ? <> · <Nl>{`${word.forms[0]} – ${word.forms[1]}`}</Nl></> : null}</span></div>
              <div className="font-medium"><Fa>{word.meaning}</Fa></div>
              <div className="text-sm"><span lang="nl" dir="ltr" className="block text-start">{word.example}</span><span lang="fa" dir="rtl" className="block text-start text-muted-foreground">{word.translation}</span></div>
            </li>
          ))}
        </ul>
      </Section>
      {theme.phrases.length > 0 && (
        <Section className="mt-10">
          <H2 id="zinnen">{L('جمله‌های کاربردی', 'Handige zinnen')}</H2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">{theme.phrases.map((phrase) => <li key={phrase.id} className="rounded-xl border bg-card p-4"><p lang="nl" dir="ltr" className="text-start text-lg font-semibold">{phrase.nl}</p><p lang="fa" dir="rtl" className="mt-1 text-start text-muted-foreground">{phrase.meaning}</p></li>)}</ul>
        </Section>
      )}
      {theme.dialogue.length > 0 && (
        <Section className="mt-10">
          <H2 id="gesprek">{L('مکالمهٔ کوتاه', 'Kort gesprek')}</H2>
          <ol className="mt-4 flex max-w-2xl flex-col gap-3">
            {theme.dialogue.map((line) => (
              <li key={line.id} className={`rounded-2xl border bg-card p-4${line.speaker === 'Jij' ? ' ms-8 bg-accent/40' : ' me-8'}`}>
                <span className="text-xs font-bold text-muted-foreground">{line.speaker === 'Jij' ? L('شما', 'Jij') : <Nl>{line.speaker}</Nl>}</span>
                <p lang="nl" dir="ltr" className="text-start font-semibold">{line.nl}</p>
                <p lang="fa" dir="rtl" className="text-start text-sm text-muted-foreground">{line.translation}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}
      <Section>
        <div className="mt-12 flex flex-col gap-4 rounded-2xl bg-secondary p-6 text-secondary-foreground sm:flex-row sm:items-center">
          <Picture src="/img/mascot-cheer.jpg" size={96} className="size-24 rounded-2xl" />
          <div>
            <h2 className="text-xl font-bold">{L('این لغات را حفظ کنید، نه فقط بخوانید', 'Leer ze echt, niet alleen lezen')}</h2>
            <p className="mt-1 opacity-80">{lang === 'fa' ? <>در اپ نِدفا لغت‌های «{theme.fa}» را می‌شنوید، انتخاب و تایپ می‌کنید و با بازی <Nl>de</Nl> یا <Nl>het</Nl> تمرین می‌کنید.</> : `In de app hoor je de woorden over "${theme.title}", kies en typ je ze, en speel je De of het?`}</p>
            <div className="mt-4"><Cta lang={lang} href={practice}>{L('شروع تمرین', 'Begin met oefenen')}</Cta></div>
          </div>
        </div>
      </Section>
      {related.length > 0 && (
        <Section className="mt-12">
          <H2>{L('موضوعات مرتبط', "Verwante thema's")}</H2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ThemeCard key={item.id} lang={lang} theme={item} />)}</ul>
        </Section>
      )}
    </>
  );
}
