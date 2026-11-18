// The whole course in one place. Every theme and grammar rule is one JSON file with the Dutch and the Persian side by side.
// To add one: create the file (copy a neighbour), import it below, add it to its list (and a theme to a group),
// then run `npm run content:check`. See docs/CONTENT.md.
import themeWerk from './themes/werk.json' with {type: 'json'};
import themeOverleg from './themes/overleg.json' with {type: 'json'};
import themeLoopbaan from './themes/loopbaan.json' with {type: 'json'};
import themeBeroepen from './themes/beroepen.json' with {type: 'json'};
import themeWonen from './themes/wonen.json' with {type: 'json'};
import themeHuisKopen from './themes/huis-kopen.json' with {type: 'json'};
import themeVrijetijd from './themes/vrijetijd.json' with {type: 'json'};
import themeCultuur from './themes/cultuur.json' with {type: 'json'};
import themeReizen from './themes/reizen.json' with {type: 'json'};
import themeNatuur from './themes/natuur.json' with {type: 'json'};
import themeUitgaan from './themes/uitgaan.json' with {type: 'json'};
import themeContact from './themes/contact.json' with {type: 'json'};
import themeMening from './themes/mening.json' with {type: 'json'};
import themeTijd from './themes/tijd.json' with {type: 'json'};
import themeGezondheid from './themes/gezondheid.json' with {type: 'json'};
import themeGeld from './themes/geld.json' with {type: 'json'};
import themeModalen from './themes/modalen.json' with {type: 'json'};
import themeHuisarts from './themes/huisarts.json' with {type: 'json'};
import themeApotheek from './themes/apotheek.json' with {type: 'json'};
import themeGemeente from './themes/gemeente.json' with {type: 'json'};
import themeBoodschappen from './themes/boodschappen.json' with {type: 'json'};
import themeSchool from './themes/school.json' with {type: 'json'};
import themeWeer from './themes/weer.json' with {type: 'json'};
import themeKleding from './themes/kleding.json' with {type: 'json'};
import themeVerkeer from './themes/verkeer.json' with {type: 'json'};
import themeFeest from './themes/feest.json' with {type: 'json'};
import themeDigitaal from './themes/digitaal.json' with {type: 'json'};
import themeSolliciteren from './themes/solliciteren.json' with {type: 'json'};
import themeHuishouden from './themes/huishouden.json' with {type: 'json'};
import themeNoodgeval from './themes/noodgeval.json' with {type: 'json'};
import themeFamilie from './themes/familie.json' with {type: 'json'};
import themeInburgering from './themes/inburgering.json' with {type: 'json'};
import ruleV2 from './grammar/v2.json' with {type: 'json'};
import ruleDat from './grammar/dat.json' with {type: 'json'};
import ruleOmdat from './grammar/omdat.json' with {type: 'json'};
import ruleAls from './grammar/als.json' with {type: 'json'};
import ruleAdvies from './grammar/advies.json' with {type: 'json'};
import ruleKunnen from './grammar/kunnen.json' with {type: 'json'};
import ruleHoeven from './grammar/hoeven.json' with {type: 'json'};
import ruleGeen from './grammar/geen.json' with {type: 'json'};
import ruleScheidbaar from './grammar/scheidbaar.json' with {type: 'json'};
import ruleZalIk from './grammar/zal-ik.json' with {type: 'json'};
import ruleZullenWe from './grammar/zullen-we.json' with {type: 'json'};
import ruleZouKunnen from './grammar/zou-kunnen.json' with {type: 'json'};
import ruleZouWillen from './grammar/zou-willen.json' with {type: 'json'};
import ruleOmTe from './grammar/om-te.json' with {type: 'json'};
import rulePerfectum from './grammar/perfectum.json' with {type: 'json'};
import ruleHebbenZijn from './grammar/hebben-zijn.json' with {type: 'json'};
import ruleVeranderen from './grammar/veranderen.json' with {type: 'json'};
import ruleVerleden from './grammar/verleden.json' with {type: 'json'};
import ruleDubbel from './grammar/dubbel.json' with {type: 'json'};
import ruleModalenVerleden from './grammar/modalen-verleden.json' with {type: 'json'};
import ruleDieDat from './grammar/die-dat.json' with {type: 'json'};
import ruleDaarmee from './grammar/daarmee.json' with {type: 'json'};
import ruleLiever from './grammar/liever.json' with {type: 'json'};
import ruleZoDat from './grammar/zo-dat.json' with {type: 'json'};
import ruleWederkerend from './grammar/wederkerend.json' with {type: 'json'};
import ruleIedereen from './grammar/iedereen.json' with {type: 'json'};
import ruleSamenstelling from './grammar/samenstelling.json' with {type: 'json'};
import ruleTijdAl from './grammar/tijd-al.json' with {type: 'json'};
import ruleVraag from './grammar/vraag.json' with {type: 'json'};
import rulePlusquamperfectum from './grammar/plusquamperfectum.json' with {type: 'json'};
import ruleTijdManierPlaats from './grammar/tijd-manier-plaats.json' with {type: 'json'};
import ruleHebbenVervoegen from './grammar/hebben-vervoegen.json' with {type: 'json'};
import ruleVerledenTD from './grammar/verleden-t-d.json' with {type: 'json'};
import ruleDeelwoordTD from './grammar/deelwoord-t-d.json' with {type: 'json'};
import ruleDeelwoordZonderGe from './grammar/deelwoord-zonder-ge.json' with {type: 'json'};
import ruleDeelwoordScheidbaar from './grammar/deelwoord-scheidbaar.json' with {type: 'json'};
import ruleOnregelmatigDeelwoord from './grammar/onregelmatig-deelwoord.json' with {type: 'json'};
import ruleAanwijzen from './grammar/aanwijzen.json' with {type: 'json'};
import ruleVerkleinwoord from './grammar/verkleinwoord.json' with {type: 'json'};
import ruleAnderhalf from './grammar/anderhalf.json' with {type: 'json'};
import ruleVoorbereiden from './grammar/voorbereiden.json' with {type: 'json'};
import ruleVoornaamwoordDingen from './grammar/voornaamwoord-dingen.json' with {type: 'json'};
import ruleErVoorzetsel from './grammar/er-voorzetsel.json' with {type: 'json'};
import ruleZouMogen from './grammar/zou-mogen.json' with {type: 'json'};
import ruleNogGeenMeer from './grammar/nog-geen-meer.json' with {type: 'json'};
import ruleToenAls from './grammar/toen-als.json' with {type: 'json'};
import ruleIndirecteVraag from './grammar/indirecte-vraag.json' with {type: 'json'};
import ruleHypothese from './grammar/hypothese.json' with {type: 'json'};
import ruleKlaarOpUit from './grammar/klaar-op-uit.json' with {type: 'json'};

import themeKennismaken from './themes/kennismaken.json' with {type: 'json'};
import themeGetallen from './themes/getallen.json' with {type: 'json'};
import themeKleuren from './themes/kleuren.json' with {type: 'json'};
import themeEtenDrinken from './themes/eten-drinken.json' with {type: 'json'};
import themeMijnDag from './themes/mijn-dag.json' with {type: 'json'};
import themeDeWeg from './themes/de-weg.json' with {type: 'json'};
import ruleZijn from './grammar/zijn.json' with {type: 'json'};
import ruleLidwoord from './grammar/lidwoord.json' with {type: 'json'};
import ruleMeervoud from './grammar/meervoud.json' with {type: 'json'};
import rulePresens from './grammar/presens.json' with {type: 'json'};
import ruleBezittelijk from './grammar/bezittelijk.json' with {type: 'json'};
import ruleNiet from './grammar/niet.json' with {type: 'json'};
import ruleErIs from './grammar/er-is.json' with {type: 'json'};

/** Themes in course order. */
export const themeFiles = [
  themeWerk,
  themeOverleg,
  themeLoopbaan,
  themeBeroepen,
  themeWonen,
  themeHuisKopen,
  themeVrijetijd,
  themeCultuur,
  themeReizen,
  themeNatuur,
  themeUitgaan,
  themeContact,
  themeMening,
  themeTijd,
  themeGezondheid,
  themeGeld,
  themeModalen,
  themeHuisarts,
  themeApotheek,
  themeGemeente,
  themeBoodschappen,
  themeSchool,
  themeWeer,
  themeKleding,
  themeVerkeer,
  themeFeest,
  themeDigitaal,
  themeSolliciteren,
  themeHuishouden,
  themeNoodgeval,
  themeFamilie,
  themeInburgering,
  // Beginners (A0): appended so existing ids and order stay the same.
  themeKennismaken,
  themeGetallen,
  themeKleuren,
  themeEtenDrinken,
  themeMijnDag,
  themeDeWeg,
];

/** Grammar rules in course order. */
export const grammarFiles = [
  ruleV2,
  ruleDat,
  ruleOmdat,
  ruleAls,
  ruleAdvies,
  ruleKunnen,
  ruleHoeven,
  ruleGeen,
  ruleScheidbaar,
  ruleZalIk,
  ruleZullenWe,
  ruleZouKunnen,
  ruleZouWillen,
  ruleOmTe,
  rulePerfectum,
  ruleHebbenZijn,
  ruleVeranderen,
  ruleVerleden,
  ruleDubbel,
  ruleModalenVerleden,
  ruleDieDat,
  ruleDaarmee,
  ruleLiever,
  ruleZoDat,
  ruleWederkerend,
  ruleIedereen,
  ruleSamenstelling,
  ruleTijdAl,
  ruleVraag,
  rulePlusquamperfectum,
  ruleTijdManierPlaats,
  ruleHebbenVervoegen,
  ruleVerledenTD,
  ruleDeelwoordTD,
  ruleDeelwoordZonderGe,
  ruleDeelwoordScheidbaar,
  ruleOnregelmatigDeelwoord,
  ruleAanwijzen,
  ruleVerkleinwoord,
  ruleAnderhalf,
  ruleVoorbereiden,
  ruleVoornaamwoordDingen,
  ruleErVoorzetsel,
  ruleZouMogen,
  ruleNogGeenMeer,
  ruleToenAls,
  ruleIndirecteVraag,
  ruleHypothese,
  ruleKlaarOpUit,
  // Beginners (A0–A1)
  ruleZijn,
  ruleLidwoord,
  ruleMeervoud,
  rulePresens,
  ruleBezittelijk,
  ruleNiet,
  ruleErIs,
];

/** Theme groups as the website and the apps list them; every theme is in exactly one group. */
export const groups = [
  {
    id: 'beginnen',
    nl: 'Beginnen',
    fa: 'شروع از صفر',
    themes: ['kennismaken', 'getallen', 'kleuren', 'eten-drinken', 'mijn-dag', 'de-weg']
  },
  {
    id: 'dagelijks',
    nl: 'Elke dag',
    fa: 'زندگی روزمره',
    themes: ['boodschappen', 'wonen', 'huis-kopen', 'huishouden', 'school', 'digitaal', 'geld', 'gemeente', 'huisarts', 'apotheek', 'gezondheid', 'noodgeval']
  },
  {
    id: 'werk',
    nl: 'Werk',
    fa: 'کار و شغل',
    themes: ['werk', 'overleg', 'loopbaan', 'beroepen', 'solliciteren']
  },
  {
    id: 'vrijetijd',
    nl: 'Vrije tijd & uitgaan',
    fa: 'اوقات فراغت و بیرون',
    themes: ['vrijetijd', 'cultuur', 'reizen', 'verkeer', 'natuur', 'uitgaan', 'kleding', 'feest']
  },
  {
    id: 'taal',
    nl: 'Taal, contact & gevoel',
    fa: 'زبان، ارتباط و احساسات',
    themes: ['contact', 'mening', 'familie', 'weer', 'tijd', 'modalen', 'inburgering']
  }
];

/**
 * The path in Leren: every situation in the order you learn them, from A0 to B1.
 * Each situation has five steps (words, sentences, grammar, conversation, final game); see src/core/path.js.
 * A new theme goes in exactly one section here (and in one of the groups above).
 */
export const path = [
  {id: 'beginnen', nl: 'Beginnen', fa: 'شروع از صفر', level: 'A0', themes: ['kennismaken', 'getallen', 'kleuren', 'eten-drinken', 'mijn-dag', 'de-weg']},
  {id: 'elke-dag', nl: 'Elke dag', fa: 'زندگی روزمره', level: 'A2', themes: ['boodschappen', 'contact', 'familie', 'wonen', 'huishouden', 'tijd', 'weer', 'kleding']},
  {id: 'regelen', nl: 'Gezondheid & regelen', fa: 'سلامت و کارهای اداری', level: 'A2', themes: ['gezondheid', 'huisarts', 'apotheek', 'noodgeval', 'gemeente', 'geld', 'digitaal', 'school']},
  {id: 'vrije-tijd', nl: 'Vrije tijd & onderweg', fa: 'اوقات فراغت و سفر', level: 'A2', themes: ['vrijetijd', 'uitgaan', 'feest', 'verkeer', 'reizen', 'natuur', 'cultuur']},
  {id: 'werk', nl: 'Werk & inburgering', fa: 'کار و جا افتادن', level: 'A2', themes: ['modalen', 'inburgering', 'beroepen', 'werk', 'overleg']},
  {id: 'b1', nl: 'Op weg naar B1', fa: 'به سوی B1', level: 'B1', themes: ['mening', 'loopbaan', 'solliciteren', 'huis-kopen']},
];
