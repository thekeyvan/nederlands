import type {Route} from './+types/grammar';
import {patterns, totals} from '../../site/content.server';
import {SITE, at, langOf, num, patternPath, tx} from '../../site/lang';
import {seo} from '../../site/seo';
import {Crumbs, H2, Nl, Picture, Section} from '../../site/ui';
import {Link} from 'react-router';

export function loader({request}: Route.LoaderArgs) {
  const lang = langOf(new URL(request.url).pathname);
  return {lang, totals, patterns: patterns.map(({slug, title, level, rule, pattern}) => ({slug, title, level, line: lang === 'fa' ? rule : pattern}))};
}

export function meta({loaderData}: Route.MetaArgs) {
  if (!loaderData) return [];
  const {lang, totals: t, patterns: list} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  return seo({
    lang, path: '/grammatica/', image: '/img/themes/zinsbouw.jpg',
    title: L(`گرامر زبان هلندی به فارسی: ${num(lang, t.patterns)} نکته با مثال (از صفر تا B1) | نِدفا`, `Nederlandse grammatica met uitleg in het Farsi: ${t.patterns} regels (A0–B1) | Nedfa`),
    description: L('دستور زبان هلندی به زبان ساده برای فارسی‌زبانان: جای فعل، de و het، omdat و want، زمان گذشته (perfectum)، افعال جداشدنی و بیشتر، با مثال و ترجمهٔ فارسی.', 'Nederlandse grammatica eenvoudig uitgelegd in het Farsi (Perzisch): woordvolgorde, de of het, omdat of want, het perfectum, scheidbare werkwoorden en meer, met voorbeelden.'),
    breadcrumbs: [['Nedfa', '/'], [L('گرامر هلندی', 'Grammatica'), '/grammatica/']],
    jsonLd: [{'@context': 'https://schema.org', '@type': 'CollectionPage', name: L('گرامر زبان هلندی به فارسی', 'Nederlandse grammatica'), inLanguage: lang, isPartOf: {'@id': `${SITE}/#website`}, hasPart: list.map((p) => ({'@type': 'WebPage', name: p.title, url: SITE + at(lang, patternPath(p.slug))}))}],
  });
}

export default function Grammar({loaderData}: Route.ComponentProps) {
  const {lang, totals: t, patterns: list} = loaderData;
  const L = <T,>(fa: T, nl: T) => tx(lang, fa, nl);
  const key: [React.ReactNode, React.ReactNode][] = lang === 'fa'
    ? [
        ['جای فعل', <>در جملهٔ خبری هلندی فعل همیشه در جایگاه دوم است، حتی اگر جمله با زمان یا مکان شروع شود: <Nl>Morgen werk ik thuis.</Nl></>],
        ['فعل در آخر جملهٔ وابسته', <>بعد از <Nl>dat</Nl>، <Nl>omdat</Nl> و <Nl>als</Nl> فعل به آخر جمله می‌رود؛ شبیه فارسی: <Nl>…omdat ik moe ben.</Nl></>],
        [<><Nl>de</Nl> یا <Nl>het</Nl></>, <>هر اسم یکی از دو حرف تعریف را دارد و باید با خود اسم حفظ شود. اسم‌های جمع همیشه <Nl>de</Nl> می‌گیرند.</>],
        ['افعال جداشدنی', <>در فعل‌هایی مثل <Nl>opbellen</Nl>، بخش اول به آخر جمله می‌رود: <Nl>Ik bel je morgen op.</Nl></>],
      ]
    : [
        ['Het werkwoord op plek twee', 'In een gewone zin staat de persoonsvorm altijd op plek twee, ook als de zin met tijd of plaats begint: Morgen werk ik thuis.'],
        ['Werkwoord achteraan in de bijzin', 'Na dat, omdat en als gaat het werkwoord naar het eind, net als in het Perzisch: …omdat ik moe ben.'],
        ['De of het', 'Elk zelfstandig naamwoord heeft de of het; leer het lidwoord samen met het woord. Meervoud is altijd de.'],
        ['Scheidbare werkwoorden', 'Bij werkwoorden als opbellen gaat het eerste deel naar het eind: Ik bel je morgen op.'],
      ];
  return (
    <>
      <Crumbs lang={lang} items={[['Nedfa', '/'], [L('گرامر هلندی', 'Grammatica'), '/grammatica/']]} />
      <Section>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Picture src="/img/themes/zinsbouw.jpg" size={144} eager className="size-28 shrink-0 rounded-2xl sm:size-36" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{L('گرامر زبان هلندی به فارسی', 'Nederlandse grammatica met uitleg in het Farsi')}</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{L(`${num(lang, t.patterns)} نکتهٔ مهم دستور زبان هلندی برای سطح A2 و B1، هر کدام با الگوی ساده، توضیح فارسی و چهار جملهٔ مثال. برای فارسی‌زبان‌ها این چهار نکته از همه مهم‌ترند:`, `${t.patterns} belangrijke grammaticaregels voor A2 en B1, elk met een eenvoudig patroon, Perzische uitleg en vier voorbeeldzinnen. Voor Perzisch sprekenden zijn deze vier het belangrijkst:`)}</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">{key.map(([title, text], index) => <li key={index} className="rounded-xl border bg-card p-4"><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p></li>)}</ul>
      </Section>
      {['A2', 'B1'].map((level) => (
        <Section key={level} className="mt-10">
          <H2>{L(`سطح ${level}`, `Niveau ${level}`)}</H2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {list.filter((p) => p.level === level).map((p) => (
              <li key={p.slug}><Link to={at(lang, patternPath(p.slug))} className="block rounded-xl border bg-card p-3.5 hover:border-primary/40 hover:bg-accent/40"><Nl className="font-bold">{p.title}</Nl><span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{lang === 'fa' ? p.line : <Nl>{p.line}</Nl>}</span></Link></li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  );
}
