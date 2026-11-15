import type {Route} from './+types/pattern';
import {notFound, patternBySlug, patterns} from '../../site/content.server';
import {SITE, appLink, at, langOf, num, patternPath, tx} from '../../site/lang';
import {seo} from '../../site/seo';
import {Crumbs, Cta, Fa, H2, Nl, Picture, Section} from '../../site/ui';
import {Link} from 'react-router';

export function loader({request, params}: Route.LoaderArgs) {
  const pattern = patternBySlug(params.slug);
  if (!pattern) throw notFound();
  const index = patterns.indexOf(pattern);
  return {
    lang: langOf(new URL(request.url).pathname),
    pattern,
    siblings: [patterns[index - 1], patterns[index + 1]].filter((p) => p !== undefined).map(({slug, title}) => ({slug, title})),
  };
}

export function meta({loaderData}: Route.MetaArgs) {
  if (!loaderData) return [];
  const {lang, pattern} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  return seo({
    lang, path: patternPath(pattern.slug), image: '/img/themes/zinsbouw.jpg',
    title: L(`${pattern.title} — گرامر هلندی به فارسی (${pattern.level}) | نِدفا`, `${pattern.title} — Nederlandse grammatica (${pattern.level}) met voorbeelden | Nedfa`),
    description: L(`${pattern.rule} توضیح فارسی، الگو و ${num(lang, pattern.examples.length)} جملهٔ مثال هلندی با ترجمه، و تمرین رایگان.`, `${pattern.title}: het patroon ${pattern.pattern}, ${pattern.examples.length} voorbeeldzinnen met Perzische vertaling en gratis oefeningen.`).slice(0, 300),
    breadcrumbs: [['Nedfa', '/'], [L('گرامر هلندی', 'Grammatica'), '/grammatica/'], [pattern.title, patternPath(pattern.slug)]],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'LearningResource', name: L(`${pattern.title} (گرامر هلندی)`, `${pattern.title} (Nederlandse grammatica)`), description: lang === 'fa' ? pattern.rule : pattern.pattern, inLanguage: lang, learningResourceType: 'Grammar explanation', educationalLevel: pattern.level, teaches: pattern.title, isAccessibleForFree: true, publisher: {'@id': `${SITE}/#org`}}],
  });
}

/** The sentence with the practised word in bold. */
function Highlight({sentence, word}: {sentence: string; word?: string}) {
  if (!word) return <>{sentence}</>;
  const match = new RegExp(`(^|[^\\p{L}])(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^\\p{L}]|$)`, 'u').exec(sentence);
  if (!match) return <>{sentence}</>;
  const start = match.index + match[1].length;
  return <>{sentence.slice(0, start)}<strong className="text-primary">{match[2]}</strong>{sentence.slice(start + match[2].length)}</>;
}

export default function PatternPage({loaderData}: Route.ComponentProps) {
  const {lang, pattern, siblings} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  return (
    <>
      <Crumbs lang={lang} items={[['Nedfa', '/'], [L('گرامر هلندی', 'Grammatica'), '/grammatica/'], [pattern.title, patternPath(pattern.slug)]]} />
      <Section>
        <div className="mt-4 max-w-3xl">
          <span className="rounded-md border px-2 py-0.5 text-xs font-bold">{pattern.level}</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"><Nl className="block">{pattern.title}</Nl><span className="mt-1 block text-lg font-medium text-muted-foreground">{L('گرامر زبان هلندی به فارسی', 'Nederlandse grammatica')}</span></h1>
          {lang === 'fa' && <p className="mt-5 text-lg">{pattern.rule}</p>}
          <p dir="ltr" lang="nl" className="mt-4 rounded-xl bg-muted px-4 py-3 text-start font-mono text-sm">{pattern.pattern}</p>
          {lang === 'nl' && <><p className="mt-4 text-sm text-muted-foreground">Uitleg in het Perzisch:</p><p className="mt-1 text-lg"><Fa>{pattern.rule}</Fa></p></>}
        </div>
      </Section>
      <Section className="mt-10">
        <div className="max-w-3xl">
          <H2>{L('مثال‌ها', 'Voorbeelden')}</H2>
          <ul className="mt-4 divide-y rounded-2xl border bg-card">
            {pattern.examples.map((example) => <li key={example.nl} className="p-4"><p lang="nl" dir="ltr" className="text-start text-lg font-semibold"><Highlight sentence={example.nl} word={example.gap} /></p><p lang="fa" dir="rtl" className="mt-1 text-start text-muted-foreground">{example.translation}</p></li>)}
          </ul>
          {pattern.note && <div className="mt-6 rounded-2xl bg-xp-soft p-5 text-xp-foreground"><h2 className="font-bold">{L('نکته', 'Let op (in het Perzisch)')}</h2><p className="mt-1"><Fa>{pattern.note}</Fa></p></div>}
        </div>
      </Section>
      <Section>
        <div className="mt-12 flex max-w-3xl flex-col gap-4 rounded-2xl bg-secondary p-6 text-secondary-foreground sm:flex-row sm:items-center">
          <Picture src="/img/themes/zinsbouw.jpg" size={96} className="size-24 rounded-2xl" />
          <div>
            <h2 className="text-xl font-bold">{L('این الگو را تمرین کنید', 'Oefen dit patroon')}</h2>
            <p className="mt-1 opacity-80">{L('شش تمرین کوتاه در اپ نِدفا: جای خالی، مرتب کردن کلمات و انتخاب جملهٔ درست.', 'Zes korte oefeningen in de app: het gat invullen, woorden in de goede volgorde zetten en de goede zin kiezen.')}</p>
            <div className="mt-4"><Cta lang={lang} href={appLink(`?regel=${encodeURIComponent(pattern.id)}#zinnen`)}>{L('شروع تمرین', 'Begin met oefenen')}</Cta></div>
          </div>
        </div>
      </Section>
      <Section>
        <nav aria-label={L('نکته‌های دیگر', 'Andere regels')} className="mt-10 flex max-w-3xl flex-wrap justify-between gap-3">
          {siblings.map((p) => <Link key={p.slug} to={at(lang, patternPath(p.slug))} className="rounded-xl border bg-card px-4 py-3 hover:bg-muted"><Nl className="font-semibold">{p.title}</Nl></Link>)}
          <Link to={at(lang, '/grammatica/')} className="rounded-xl px-4 py-3 font-semibold text-primary">{L('همهٔ نکته‌ها', 'Alle regels')}</Link>
        </nav>
      </Section>
    </>
  );
}
