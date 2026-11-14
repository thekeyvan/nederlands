import {ArrowRight, Brain, ChevronRight, Headphones, Keyboard} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {GoalRing} from '@/components/game/goal-ring';
import {Mascot} from '@/components/game/mascot';
import {RouteStrip} from '@/components/game/route-strip';
import {LevelCard, MissionsCard, StampsCard, StreakCard} from '@/components/game/cards';
import {ThemeArt} from '@/components/game/theme-art';
import {ThemeCard} from '@/components/theme-card';
import {Translation} from '@/components/translation';
import {Page, SectionTitle} from '@/components/page';
import {greeting, plural} from '@/lib/text';
import {useGame} from '@/hooks/use-progress';
import {usePractice} from '@/hooks/use-practice';
import {usePreferences} from '@/hooks/use-preferences';
import {navigate} from '@/hooks/use-route';
import {themes} from '@/core/learning-data.js';
import {resumeTheme} from '@/core/learning-model.js';
import {games} from '@/games/registry';

export function TodayScreen() {
  const game = useGame();
  const [preferences] = usePreferences();
  const {start} = usePractice();
  const {reviews, events} = game.progress;
  const goal = preferences.goal;
  const today = game.activity.today;
  const goalDone = today >= goal;
  const due = game.dueCards;
  const fresh = events.length === 0;
  const suggestedId = fresh ? 'huisarts' : resumeTheme(events);
  const suggested = themes.find((theme) => theme.id === suggestedId) ?? themes[0];
  const recommendedIds = [...new Set([suggestedId, 'reizen', 'werk', 'wonen', 'uitgaan', 'contact', 'huisarts'])].slice(0, 6);
  const recommended = recommendedIds.map((id) => themes.find((theme) => theme.id === id)!).filter(Boolean);
  const roundSize = Math.min(20, Math.max(5, goal - today));

  const bubble = fresh
    ? {title: 'Welkom! Fijn dat je er bent.', copy: 'Begin met een klein rondje van vijf kaartjes. Het is een spel, geen toets.'}
    : goalDone
      ? {title: 'Je dagdoel is gehaald!', copy: due ? `Er ${due === 1 ? 'wacht nog 1 kaartje' : `wachten nog ${due} kaartjes`}. Extra oefenen mag altijd.` : 'Alles is herhaald. Kies een thema als je zin hebt in meer.'}
      : {title: `${greeting()}! Nog ${plural(goal - today, 'kaartje', 'kaartjes')}.`, copy: game.streak.count ? `Dan is je dagdoel gehaald en blijft je reeks van ${plural(game.streak.count, 'dag', 'dagen')} staan.` : 'Dan is je dagdoel gehaald en begint je reeks.'};

  const startRound = () => start({theme: due ? 'all' : suggestedId, type: 'all', limit: due ? 20 : roundSize, label: due ? 'Dagmissie' : suggested.title});

  const rail = (
    <>
      <StreakCard stats={game} week={game.activity.week} />
      <LevelCard stats={game} />
      <MissionsCard events={events} />
      <StampsCard stats={game} />
    </>
  );

  return (
    <Page wide>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Mascot mood={goalDone ? 'cheer' : 'wave'} className="size-16 sm:size-20" label="De mascotte" />
            <div className="relative min-w-0 rounded-xl border bg-card px-4 py-3 shadow-sm before:absolute before:top-1/2 before:-left-[7px] before:size-3 before:-translate-y-1/2 before:rotate-45 before:border-b before:border-l before:bg-card">
              <h1 className="text-lg font-bold tracking-tight sm:text-2xl">{bubble.title}</h1>
              <p className="text-sm text-muted-foreground">{bubble.copy}</p>
            </div>
          </div>

          <section aria-labelledby="mission-title" className="relative overflow-hidden rounded-2xl bg-secondary p-5 text-secondary-foreground shadow-[0_5px_0_var(--secondary-edge)] sm:p-6">
            <span aria-hidden className="absolute -right-12 -bottom-16 size-56 rounded-full bg-white/5" />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
              <div className="flex items-center gap-4 md:contents">
                <GoalRing value={today} max={goal} className="size-20 shrink-0 md:size-28">
                  <span className="block text-lg leading-none font-extrabold tabular-nums md:text-2xl">{Math.min(today, goal)}/{goal}</span>
                  <span className="mt-0.5 block text-[10px] opacity-75 md:text-xs">vandaag</span>
                </GoalRing>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">Dagmissie · ± {Math.max(2, Math.round((due || roundSize) * 0.4))} min</p>
                  <h2 id="mission-title" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                    {due ? `${plural(due, 'kaartje wil', 'kaartjes willen')} herhaald worden` : goalDone ? 'Nog een rondje voor de fun?' : `Leer ${roundSize} kaartjes over ${suggested.title.toLocaleLowerCase('nl')}`}
                  </h2>
                  <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
                    <Badge className="bg-white/10 text-white"><Brain />Kiezen</Badge>
                    <Badge className="bg-white/10 text-white"><Headphones />Luisteren</Badge>
                    <Badge className="bg-white/10 text-white"><Keyboard />Typen</Badge>
                  </div>
                </div>
              </div>
              <Button size="xl" game onClick={startRound} className="w-full md:w-auto">Start rondje<ArrowRight /></Button>
            </div>
          </section>

          <section aria-labelledby="route-title">
            <SectionTitle title={<span id="route-title">De route · A2 → B1</span>} action={<Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('route')}>Bekijk de kaart<ChevronRight /></Button>} />
            <Card className="px-4 py-3 sm:px-5">
              <RouteStrip route={game.route} />
              <p className="text-xs text-muted-foreground">{game.route.finished ? 'Je hebt alle haltes geoefend. Herhaal ze gerust.' : `Halte ${game.route.current + 1}: ${game.route.steps[game.route.current].lesson.title} · ${game.route.steps[game.route.current].done}/${game.route.steps[game.route.current].total} kaartjes`}</p>
            </Card>
          </section>

          <section aria-labelledby="continue-title">
            <button type="button" onClick={() => navigate('woorden', {theme: suggested.id})} className="group flex w-full overflow-hidden rounded-xl border bg-card text-left shadow-[0_4px_0_var(--border)] transition hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
              <ThemeArt theme={suggested} className="w-28 shrink-0 sm:w-36" />
              <span className="flex min-w-0 flex-col justify-center gap-1 p-4">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{fresh ? 'Een goede plek om te beginnen' : 'Ga verder met'}</span>
                <span id="continue-title" className="text-lg font-bold">{suggested.title}</span>
                <Translation className="text-sm text-muted-foreground">{suggested.meaning}</Translation>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary">{fresh ? 'Ontdek dit thema' : 'Verder met dit thema'}<ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
              </span>
            </button>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:hidden">{rail}</div>

          <section aria-labelledby="games-title">
            <SectionTitle title={<span id="games-title">Even spelen?</span>} action={<Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('spellen')}>Alle {games.length} spellen<ChevronRight /></Button>} />
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
              {games.slice(0, 4).map((game) => (
                <button key={game.id} type="button" onClick={() => navigate('spellen', {game: game.id})}
                  className="group w-40 shrink-0 snap-start overflow-hidden rounded-xl border bg-card text-left shadow-[0_4px_0_var(--border)] transition hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:w-auto">
                  <img src={game.image} alt="" className="aspect-[4/3] w-full object-cover" draggable={false} loading="lazy" />
                  <span className="block p-3">
                    <span className="block text-sm font-bold">{game.title}</span>
                    <span className="block text-xs text-muted-foreground">{game.skill} · {game.length}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="themes-title">
            <SectionTitle title={<span id="themes-title">Waar wil je over praten?</span>} action={<Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('woorden')}>Alle {themes.length} thema’s<ChevronRight /></Button>} />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {recommended.map((theme) => <ThemeCard key={theme.id} theme={theme} reviews={reviews} compact />)}
            </div>
          </section>
        </div>
        <aside className="hidden flex-col gap-4 xl:flex" aria-label="Jouw spel">{rail}</aside>
      </div>
    </Page>
  );
}
