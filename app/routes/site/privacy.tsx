import type {Route} from './+types/privacy';
import {SITE} from '../../site/lang';

export const meta: Route.MetaFunction = () => [
  {title: 'Privacy — Nedfa'},
  {name: 'description', content: 'Welke gegevens Nedfa gebruikt, waarom en hoe lang.'},
  {tagName: 'link', rel: 'canonical', href: `${SITE}/privacy`},
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <article className="flex flex-col gap-3 leading-relaxed [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_p]:text-muted-foreground">
    <p className="text-xs font-semibold tracking-wider !text-primary uppercase">Je gegevens</p>
    <h1 className="text-4xl font-extrabold tracking-tight">Privacy, in het kort.</h1>
    <p>Laatst aangepast: 15 november 2026. Dit geldt voor de website en de iPhone-app Nedfa.</p>
    <h2>Zonder account</h2>
    <p>Je oefeningen, bewaarde bronnen, weekplan, dagdoel en spelrecords blijven op je apparaat (in de browser of in de app). We gebruiken lokale opslag om dit te onthouden, net als je gekozen weergave (licht of donker). Je wist dit met <strong>Ik → Instellingen → Wis mijn voortgang</strong>.</p>
    <p>Installeer je de app, dan bewaart je browser de website en de audio die je hebt beluisterd of gedownload, zodat de app ook zonder internet werkt. Dat staat alleen op je eigen apparaat.</p>
    <h2>Met een account (Apple of Google)</h2>
    <p>Log je in met Google, dan geeft Google je naam, e-mailadres, profielfoto en een accountnummer door. We vragen geen toegang tot je Gmail, Drive of andere Google-bestanden. Log je in met Apple, dan geeft Apple een accountnummer, een e-mailadres (dat je kunt verbergen) en de eerste keer je naam door. Je wachtwoord komt nooit bij ons terecht.</p>
    <p>Supabase bewaart je account en leergegevens: welke kaartjes je hebt geoefend, je antwoorden (moeilijk of makkelijk), de volgende herhaaldatum, bewaarde bronnen, je weekplan en je dagdoel. Zo kun je op een ander apparaat verdergaan. Je reeks, punten (XP), sterren en stempels worden uit die oefeningen berekend en niet apart opgeslagen. De database staat in Londen. Je leergegevens zijn gekoppeld aan je eigen account; andere bezoekers kunnen ze niet bekijken.</p>
    <h2>Waarom en hoe lang?</h2>
    <p>We gebruiken deze gegevens om je voortgang te bewaren en oefeningen te plannen. We verkopen je leergegevens niet en gebruiken ze niet voor advertenties. De site heeft geen eigen advertentie- of analysetrackers. Je gegevens blijven bewaard totdat je je account verwijdert. Uitloggen wist je online voortgang niet.</p>
    <h2>Luisteren</h2>
    <p>De Nederlandse audio staat op deze website. We sturen geen woorden of zinnen naar een spraakdienst. We nemen je stem niet op. Je gekozen stem en snelheid blijven in deze browser.</p>
    <h2>Andere diensten</h2>
    <p>Railway levert de website en de content-API, Apple en Google verzorgen het inloggen en Supabase bewaart je account en voortgang. Kies je een dagelijkse herinnering in de app, dan plant je iPhone die zelf in; daar is geen server bij nodig. De lettertypen en illustraties staan op deze website zelf. Deze diensten ontvangen technische gegevens, zoals je IP-adres, bij het leveren van hun dienst. Links naar andere leersites openen websites met hun eigen privacyregels.</p>
    <h2>Inzien of verwijderen</h2>
    <p>Je voortgang zie je onder ‘Ik’; het tandwiel rechtsboven opent Instellingen. Met <strong>Ik → Instellingen → Account verwijderen</strong> verwijder je je account en alles wat erbij is opgeslagen, online én op je apparaat. Dat gebeurt meteen en kan niet ongedaan worden gemaakt. Voor vragen of een kopie van je gegevens mail je naar <a href="mailto:hallo@nedfa.nl">hallo@nedfa.nl</a>. Zet je wachtwoord nooit in je bericht. Je kunt de koppeling ook intrekken via je Apple- of Google-account.</p>
    <p className="mt-4"><a className="font-semibold !text-primary underline-offset-4 hover:underline" href="/leren">Terug naar leren →</a></p>
      </article>
    </div>
  );
}
