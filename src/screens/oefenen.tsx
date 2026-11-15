import {useMemo} from 'react';
import {ArrowRight, Flame, Star} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Group, Row} from '@/components/app/list';
import {LevelCoin, MissionsCard} from '@/components/game/cards';
import {Mascot} from '@/components/game/mascot';
import {NextStepCard} from '@/components/path/path-ui';
import {practiceScene} from '@/lib/illustrations';
import {SignInNudge} from '@/components/app/sign-in';
import {Page} from '@/components/page';
import {useGame} from '@/hooks/use-progress';
import {usePractice} from '@/hooks/use-practice';
import {usePreferences} from '@/hooks/use-preferences';
import {navigate} from '@/hooks/use-route';
import {cards, missionRound} from '@/core/learning-model.js';
import {currentTheme} from '@/core/path.js';
import {openLevelTest} from '@/components/level-test';
import type {Card} from '@/core/types';

/**
 * Vandaag, the start screen (same as the iPhone app): your next step on the path as the one big button,
 * then what to repeat, today's missions, and the niveautest for new learners.
 */
export function OefenenScreen() {
  const game = useGame();
  const [preferences] = usePreferences();
  const {start} = usePractice();
  const {reviews, events} = game.progress;
  const goal = preferences.goal;
  const today = game.activity.today;
  const due = game.dueCards;
  const level = preferences.level;
  const current = useMemo(() => currentTheme(reviews, events, level), [reviews, events, level]);
  const mistakes = useMemo(() => cards.filter((card: Card) => reviews[card.id] && reviews[card.id].grade < 3)
    .sort((a, b) => reviews[b.id].lastReviewed.localeCompare(reviews[a.id].lastReviewed)).slice(0, 20), [reviews]);
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
          <NextStepCard themeId={current} today={today} goal={goal} />
          {(due > 0 || mistakes.length > 0) && (
            <Group>
              {due > 0 && (
                <Row onClick={() => start({queue: missionRound('herhaal', reviews, {limit: 20}), label: 'Herhalen'})} label={`Herhalen: ${due} kaartjes`}
                  leading={<img src={practiceScene('fouten')} alt="" className="size-11 shrink-0 rounded-xl bg-[#fcfaf6] object-cover" draggable={false} />}
                  title="Herhalen" detail="Wat je bijna vergeet, uit alle situaties" trailing={<span className="text-sm font-semibold text-primary tabular-nums">{due}</span>} />
              )}
              {mistakes.length > 0 && (
                <Row onClick={() => start({queue: mistakes, label: 'Mijn fouten'})} label={`Mijn fouten: ${mistakes.length} kaartjes`}
                  leading={<img src={practiceScene('woorden')} alt="" className="size-11 shrink-0 rounded-xl bg-[#fcfaf6] object-cover" draggable={false} />}
                  title="Mijn fouten" detail="Wat je de laatste keer fout had" trailing={<span className="text-sm font-semibold text-primary tabular-nums">{mistakes.length}</span>} />
              )}
            </Group>
          )}
          <SignInNudge />
          {!level && <LevelCard />}
        </div>
        <div className="min-w-0">
          <MissionsCard className="mt-4 lg:mt-0" events={events} onStart={(id, title) => start({queue: missionRound(id, reviews, {theme: current}), label: title})} />
        </div>
      </div>
    </Page>
  );
}

/** Asks new learners for the niveautest; their level then decides where the path starts. */
function LevelCard() {
  return (
    <button type="button" onClick={openLevelTest} className="flex items-center gap-3 rounded-2xl border-2 border-primary/30 bg-primary/10 p-3.5 text-left transition hover:bg-primary/15">
      <Mascot mood="think" className="size-12 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Hoe goed ken je Nederlands al?</span>
        <span className="block text-sm text-muted-foreground">Doe de niveautest (± 3 min). Dan begint je pad op jouw niveau.</span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-primary" />
    </button>
  );
}
