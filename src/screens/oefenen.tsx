import {useMemo, useState} from 'react';
import {ArrowRight, ChevronDown, Flame, Layers, MapPin, MessageSquare, Puzzle, RotateCcw} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger} from '@/components/ui/select';
import {GoalRing} from '@/components/game/goal-ring';
import {ThemeArt} from '@/components/game/theme-art';
import {Group, GroupLabel, Row, RowIcon, ScreenTitle} from '@/components/app/list';
import {SignInNudge} from '@/components/app/sign-in';
import {Page} from '@/components/page';
import {useGame} from '@/hooks/use-progress';
import {usePractice} from '@/hooks/use-practice';
import {usePreferences} from '@/hooks/use-preferences';
import {navigate} from '@/hooks/use-route';
import {themes} from '@/core/learning-data.js';
import {cards, planSession, resumeTheme} from '@/core/learning-model.js';
import type {Card} from '@/core/types';

/** The start screen: today's mixed round, then one list of focused rounds. */
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
  const resumeId = fresh ? 'huisarts' : resumeTheme(events);
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
    {id: 'woorden', title: 'Woorden', icon: Layers, tint: 'bg-accent text-accent-foreground', count: counts.woorden, run: () => start({theme, type: 'woorden', label: themeTitle ? `${themeTitle} · woorden` : 'Woorden'})},
    {id: 'praktisch', title: 'Handige zinnen', icon: MessageSquare, tint: 'bg-info-soft text-info-foreground', count: counts.praktisch, run: () => start({theme, type: 'praktisch', label: themeTitle ? `${themeTitle} · zinnen` : 'Handige zinnen'})},
    {id: 'zinnen', title: 'Zinsbouw', icon: Puzzle, tint: 'bg-lavender text-lavender-foreground', count: counts.zinnen, run: () => start({theme: 'zinsbouw', type: 'zinnen', label: 'Zinsbouw'})},
    {id: 'fouten', title: 'Mijn fouten', icon: RotateCcw, tint: 'bg-destructive-soft text-destructive-foreground', count: mistakes.length, run: () => start({queue: mistakes, label: 'Mijn fouten'})},
  ];

  return (
    <Page wide>
      <ScreenTitle title="Oefenen" action={
        <button type="button" onClick={() => navigate('voortgang', {root: true})} className="rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none lg:hidden" aria-label={`Reeks van ${game.streak.count} dagen. Bekijk je voortgang.`}>
          <Badge variant="streak" className="h-8 px-3 text-sm"><Flame />{game.streak.count}</Badge>
        </button>
      } />
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
            </div>
            <Button size="xl" game className="mt-4 w-full" disabled={!daily.length} onClick={() => start({queue: daily, label: 'Dagrondje', theme: due ? 'all' : resumeId})}>
              {today >= goal ? 'Nog een rondje' : 'Start'}<ArrowRight />
            </Button>
          </section>
          <SignInNudge />
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
                  leading={<RowIcon className={row.tint}><row.icon /></RowIcon>} title={row.title} className={row.count ? undefined : 'opacity-50'}
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
              <Row onClick={() => navigate('route', {step: game.route.current + 1})} leading={<RowIcon className="bg-success-soft text-success-foreground"><MapPin /></RowIcon>}
                title={`Halte ${game.route.current + 1}: ${step.lesson.title}`} detail={`Route · ${step.done} van ${step.total} geoefend`} />
            )}
          </Group>
        </div>
      </div>
    </Page>
  );
}
