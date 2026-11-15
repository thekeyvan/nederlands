import {useMemo, useState} from 'react';
import {ArrowRight, ChevronDown, Flame, Star} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger} from '@/components/ui/select';
import {GoalRing} from '@/components/game/goal-ring';
import {ThemeArt} from '@/components/game/theme-art';
import {Group, GroupLabel, Row} from '@/components/app/list';
import {LevelCoin, MissionsCard} from '@/components/game/cards';
import {RouteStrip} from '@/components/game/route-strip';
import {Mascot} from '@/components/game/mascot';
import {practiceScene, sceneFor} from '@/lib/illustrations';
import {SignInNudge} from '@/components/app/sign-in';
import {Page} from '@/components/page';
import {useGame} from '@/hooks/use-progress';
import {usePractice} from '@/hooks/use-practice';
import {usePreferences} from '@/hooks/use-preferences';
import {navigate} from '@/hooks/use-route';
import {themes} from '@/core/learning-data.js';
import {cards, planSession, resumeTheme} from '@/core/learning-model.js';
import {levelInfo, startTheme, suggestedThemes} from '@/core/level.js';
import {openLevelTest} from '@/components/level-test';
import type {Card, Level, Theme} from '@/core/types';

/** Vandaag, the start screen (same as the iPhone app): level and streak, today's round, your level, the path, missions and focused rounds. */
export function OefenenScreen() {
  const game = useGame();
  const [preferences] = usePreferences();
  const {start} = usePractice();
  const [theme, setTheme] = useState('all');
  const {reviews, events} = game.progress;
  const goal = preferences.goal;
  const today = game.activity.today;
  const due = game.dueCards;
  const fresh = events.length === 0;
  const level = preferences.level;
  // New learners start at a theme that fits their level (from the niveautest).
  const resumeId = fresh ? (level ? startTheme(themes, level) : 'huisarts') : resumeTheme(events);
  const resume = themes.find((item) => item.id === resumeId) ?? themes[0];
  const resumeStats = game.themes.find((item) => item.theme.id === resume.id)?.stats;
  const roundSize = Math.min(20, Math.max(5, goal - today));
  const daily = useMemo(() => planSession(reviews, {theme: due ? 'all' : resumeId, limit: due ? 20 : roundSize}), [reviews, due, resumeId, roundSize]);
  const counts = useMemo(() => ({
    woorden: planSession(reviews, {theme, type: 'woorden'}).length,
    praktisch: planSession(reviews, {theme, type: 'praktisch'}).length,
    zinnen: planSession(reviews, {theme: 'zinsbouw', type: 'zinnen'}).length,
  }), [reviews, theme]);
  const mistakes = useMemo(() => cards.filter((card: Card) => reviews[card.id] && reviews[card.id].grade < 3 && (theme === 'all' || card.themeId === theme))
    .sort((a, b) => reviews[b.id].lastReviewed.localeCompare(reviews[a.id].lastReviewed)).slice(0, 20), [reviews, theme]);
  const themeTitle = themes.find((item) => item.id === theme)?.title;
  const step = game.route.steps[game.route.current];

  const rows = [
    {id: 'woorden', title: 'Woorden', image: practiceScene('woorden'), count: counts.woorden, run: () => start({theme, type: 'woorden', label: themeTitle ? `${themeTitle} · woorden` : 'Woorden'})},
    {id: 'praktisch', title: 'Handige zinnen', image: practiceScene('zinnen'), count: counts.praktisch, run: () => start({theme, type: 'praktisch', label: themeTitle ? `${themeTitle} · zinnen` : 'Handige zinnen'})},
    {id: 'zinnen', title: 'Zinsbouw', image: practiceScene('zinsbouw'), count: counts.zinnen, run: () => start({theme: 'zinsbouw', type: 'zinnen', label: 'Zinsbouw'})},
    {id: 'fouten', title: 'Mijn fouten', image: practiceScene('fouten'), count: mistakes.length, run: () => start({queue: mistakes, label: 'Mijn fouten'})},
  ];

  return (
    <Page wide>
      <h1 className="sr-only">Vandaag</h1>
      <header className="mb-4 flex items-center gap-3 pt-2 lg:pt-0">
        <button type="button" onClick={() => navigate('voortgang', {root: true})} className="flex min-w-0 items-center gap-2.5 rounded-full text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" aria-label={`Niveau ${game.level.number}, ${game.level.name}. Bekijk je voortgang.`}>
          <LevelCoin stats={game} />
          <span className="min-w-0">
            <span className="block text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">Niveau {game.level.number}</span>
            <span className="block truncate text-[17px] leading-tight font-black">{game.level.name}</span>
          </span>
        </button>
        <div className="ml-auto flex shrink-0 gap-2">
          <Badge variant="streak" className="h-8 px-3 text-sm" aria-label={`Reeks van ${game.streak.count} dagen`}><Flame />{game.streak.count}</Badge>
          <Badge variant="xp" className="h-8 px-3 text-sm" aria-label={`${game.xp} XP`}><Star />{game.xp}</Badge>
        </div>
      </header>
      <div className="grid gap-x-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="daily-title" className="rounded-2xl bg-secondary p-4 text-secondary-foreground shadow-[0_4px_0_var(--secondary-edge)] sm:p-5">
            <div className="flex items-center gap-4">
              <GoalRing value={today} max={goal} className="size-[72px] shrink-0 sm:size-24">
                <span className="block text-lg leading-none font-extrabold tabular-nums sm:text-xl">{Math.min(today, goal)}/{goal}</span>
              </GoalRing>
              <div className="min-w-0 flex-1">
                <h2 id="daily-title" className="text-lg font-bold sm:text-xl">{today >= goal ? 'Dagdoel gehaald' : 'Dagrondje'}</h2>
                <p className="text-sm opacity-75">{daily.length ? `${daily.length} kaartjes · ± ${Math.max(2, Math.round(daily.length * 0.4))} min` : 'Alles is herhaald'}</p>
              </div>
              <Mascot mood={today >= goal ? 'cheer' : daily.length ? 'wave' : 'sleep'} className="size-16 shrink-0 sm:size-20" />
            </div>
            <Button size="xl" game className="mt-4 w-full" disabled={!daily.length} onClick={() => start({queue: daily, label: 'Dagrondje', theme: due ? 'all' : resumeId})}>
              {today >= goal ? 'Nog een rondje' : 'Start'}<ArrowRight />
            </Button>
          </section>
          <SignInNudge />
          <LevelCard level={level} suggestions={suggestedThemes(themes, level, (id) => game.themes.find((item) => item.theme.id === id)?.stats, 3)} />
          <div>
            <GroupLabel className="mt-2" action={<span className="text-xs font-semibold text-muted-foreground tabular-nums">Halte {Math.min(game.route.current + 1, game.route.steps.length)} van {game.route.steps.length}</span>}>Jouw pad</GroupLabel>
            <div className="rounded-2xl border bg-card px-3 pb-2"><RouteStrip route={game.route} /></div>
          </div>
          <MissionsCard events={events} />
          <div>
            <GroupLabel className="mt-2" action={
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger size="sm" className="h-7 max-w-44 gap-1 rounded-full bg-card px-2.5 text-xs [&>svg:last-child]:hidden" aria-label="Thema">
                  <span className="truncate">{themeTitle ?? 'Alle thema’s'}</span><ChevronDown className="size-3.5 opacity-60" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">Alle thema’s</SelectItem>
                  {themes.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
                </SelectContent>
              </Select>
            }>Gericht oefenen</GroupLabel>
            <Group>
              {rows.map((row) => (
                <Row key={row.id} onClick={row.count ? row.run : undefined} label={`${row.title}: ${row.count} kaartjes`}
                  leading={<img src={row.image} alt="" className="size-12 shrink-0 rounded-xl bg-[#fcfaf6] object-cover" draggable={false} />} title={row.title} className={row.count ? undefined : 'opacity-50'}
                  trailing={<span className="text-sm font-semibold text-primary tabular-nums">{row.count || '–'}</span>} />
              ))}
            </Group>
          </div>
        </div>
        <div className="min-w-0">
          <GroupLabel className="lg:mt-0">Verder met</GroupLabel>
          <Group>
            <Row onClick={() => navigate('woorden', {theme: resume.id})} leading={<ThemeArt theme={resume} className="size-11 shrink-0 rounded-lg" />}
              title={resume.title} detail={resumeStats ? `${resumeStats.done} van ${resumeStats.total} geoefend` : undefined} />
            {step && (
              <Row onClick={() => navigate('route', {step: game.route.current + 1})} leading={<img src={sceneFor('route')} alt="" className="size-11 shrink-0 rounded-lg bg-[#fcfaf6] object-cover" draggable={false} />}
                title={`Halte ${game.route.current + 1}: ${step.lesson.title}`} detail={`Route · ${step.done} van ${step.total} geoefend`} />
            )}
          </Group>
        </div>
      </div>
    </Page>
  );
}

/** Asks new learners for the niveautest; afterwards shows their level and three themes that fit it. */
function LevelCard({level, suggestions}: {level: Level | null; suggestions: Theme[]}) {
  if (!level) {
    return (
      <button type="button" onClick={openLevelTest} className="flex items-center gap-3 rounded-2xl border-2 border-primary/30 bg-primary/10 p-3.5 text-left transition hover:bg-primary/15">
        <Mascot mood="think" className="size-12 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Hoe goed ken je Nederlands al?</span>
          <span className="block text-sm text-muted-foreground">Doe de niveautest (± 3 min). Dan kiest Nedfa wat bij je past.</span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-primary" />
      </button>
    );
  }
  return (
    <div>
      <GroupLabel className="mt-2" action={<button type="button" onClick={openLevelTest} className="text-xs font-semibold text-primary">Test opnieuw</button>}>
        Voor jouw niveau · {level} {levelInfo[level].name}
      </GroupLabel>
      <Group>
        {suggestions.map((theme) => (
          <Row key={theme.id} onClick={() => navigate('woorden', {theme: theme.id})} leading={<ThemeArt theme={theme} className="size-11 shrink-0 rounded-lg" />} title={theme.title} detail={theme.intro} />
        ))}
      </Group>
    </div>
  );
}
