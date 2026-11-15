import {reviewCard} from '@/core/progress-store.js';
import {conversationId} from '@/core/path.js';
import {useCallback, useEffect, useRef, useState, type ReactNode} from 'react';
import {ArrowRight, Check, RotateCcw, Timer, Trophy, X, Zap} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {MascotActor} from '@/components/game/mascot-actor';
import {ListenButton} from '@/components/listen-button';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {usePractice} from '@/hooks/use-practice';
import {useGameRecords} from '@/hooks/use-game-records';
import type {Card} from '@/core/types';
import {audioUrl} from '@/core/audio-playback.js';
import {haptic} from '@/lib/native';
import {QuitButton} from '@/components/quit-button';
import {trackEvent} from '@/lib/stats';
import type {GameInfo} from '@/games/registry';

/** Top bar for every game: leave, progress or timer, score. */
export function GameBar({game, progress, seconds, score}: {game: GameInfo; progress?: number; seconds?: number; score: number; theme?: string}) {
  const {close} = usePractice();
  return (
    <div className="flex items-center gap-3">
      <QuitButton label="Stoppen met dit spel" title="Stoppen met dit spel?" description="Je score van dit spel telt dan niet mee voor je record."
        confirm={score > 0 || (progress ?? 0) > 0 || seconds !== undefined} onQuit={() => close()} />
      {seconds !== undefined ? (
        <>
          <Progress value={(seconds / 60) * 100} className="h-3.5 flex-1 bg-destructive/15" indicatorClassName={seconds <= 10 ? 'bg-destructive' : 'bg-primary'} aria-label={`Nog ${seconds} seconden`} />
          <Badge variant={seconds <= 10 ? 'destructive' : 'outline'} className="h-7 min-w-14 px-2.5 text-sm tabular-nums"><Timer />{seconds}</Badge>
        </>
      ) : (
        <Progress value={(progress ?? 0) * 100} className="h-3.5 flex-1 bg-success/15" indicatorClassName="bg-success" aria-label={`${game.title}: voortgang`} />
      )}
      <Badge key={score} variant="xp" className="h-7 px-2.5 text-sm tabular-nums"><Check />{score}</Badge>
    </div>
  );
}

export function GameFrame({children}: {children: ReactNode}) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-4 pb-40 sm:px-6 lg:pt-8">{children}</div>;
}

/** A 60-second countdown that starts on mount. */
export function useCountdown(total = 60) {
  const [startedAt] = useState(() => Date.now());
  const [left, setLeft] = useState(total);
  useEffect(() => {
    const timer = setInterval(() => setLeft(Math.max(0, total - Math.floor((Date.now() - startedAt) / 1000))), 200);
    return () => clearInterval(timer);
  }, [startedAt, total]);
  return left;
}

export interface Choice {label: string; correct: boolean}

/** Answer buttons with 1–4 keyboard shortcuts. After a pick, the right answer turns green. */
export function ChoiceGrid({options, picked, onPick, translated = false, columns = 2}: {options: Choice[]; picked: number | null; onPick: (index: number) => void; translated?: boolean; columns?: 1 | 2}) {
  const pick = useCallback((index: number) => { if (picked === null && options[index]) onPick(index); }, [picked, options, onPick]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target instanceof HTMLInputElement) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < options.length) {
        event.preventDefault();
        pick(index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options.length, pick]);
  return (
    <ul className={cn('grid gap-2.5', columns === 2 && 'sm:grid-cols-2')}>
      {options.map((option, index) => {
        const state = picked === null ? 'idle' : option.correct ? 'right' : index === picked ? 'wrong' : 'dim';
        return (
          <li key={`${option.label}-${index}`}>
            <button type="button" disabled={picked !== null} onClick={() => pick(index)}
              className={cn('flex min-h-14 w-full items-center gap-3 rounded-xl border-2 bg-card px-4 py-3 text-left font-medium shadow-[0_3px_0_var(--border)] transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                state === 'idle' && 'hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0.5 active:shadow-none',
                state === 'right' && 'border-success bg-success-soft text-success-foreground shadow-[0_3px_0_var(--success)]',
                state === 'wrong' && 'border-destructive bg-destructive-soft text-destructive-foreground shadow-[0_3px_0_var(--destructive)]',
                state === 'dim' && 'opacity-45')}>
              <kbd className="hidden size-6 shrink-0 place-items-center rounded-md border text-[11px] font-semibold text-muted-foreground sm:grid">{index + 1}</kbd>
              {state === 'right' && <Check className="size-5 shrink-0" aria-label="goed" />}
              {state === 'wrong' && <X className="size-5 shrink-0" aria-label="fout" />}
              {translated ? <Translation as="span" className="flex-1 text-lg">{option.label}</Translation> : <span className="flex-1 text-base" lang="nl">{option.label}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Bottom feedback panel with a "Verder" button that also answers to Enter. */
export function FeedbackBar({tone, title, children, onNext}: {tone: 'success' | 'close' | 'wrong'; title: string; children?: ReactNode; onNext: () => void}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({preventScroll: true});
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);
  useEffect(() => haptic(tone === 'wrong' ? 'error' : 'success'), [tone]);
  return (
    <div role="status" className={cn('fixed inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom-4 border-t-2 px-4 pt-4 pb-safe sm:px-6 lg:static lg:mt-6 lg:rounded-2xl lg:border-2 lg:px-6 lg:pb-5',
      tone === 'success' && 'border-success/30 bg-success-soft text-success-foreground',
      tone === 'close' && 'border-xp/50 bg-xp-soft text-xp-foreground',
      tone === 'wrong' && 'border-destructive/30 bg-destructive-soft text-destructive-foreground')}>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-lg font-bold"><MascotActor pose={tone === 'wrong' ? 'oops' : 'cheer'} moment={tone === 'wrong' ? 'nope' : 'hop'} className="-my-2 size-14" />{title}</p>
          {children}
        </div>
        <Button ref={ref} size="xl" game variant={tone === 'success' ? 'success' : tone === 'close' ? 'default' : 'destructive'} className="w-full lg:w-auto" onClick={onNext}>Verder<ArrowRight /></Button>
      </div>
    </div>
  );
}

export interface Miss {key: string; nl: string; meaning?: string; card?: Card}

// One saved score per round, even when React runs initialisers twice in development.
const recorded = new Map<string, ReturnType<ReturnType<typeof useGameRecords>['record']>>();
export const newRoundId = (game: string) => `${game}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

/** End of a game: score, personal best, mistakes and what to do next. */
export function GameOver({game, roundId, score, total, misses, theme, onAgain}: {game: GameInfo; roundId: string; score: number; total?: number; misses: Miss[]; theme?: string; onAgain: () => void}) {
  const {record} = useGameRecords();
  const {start, close} = usePractice();
  const [result] = useState(() => {
    if (!recorded.has(roundId)) {
      trackEvent('spel klaar', {spel: game.id, score});
      // A situation's conversation with half or more right finishes step 4 of its path.
      if (game.id === 'gesprek' && theme && theme !== 'all' && total && score * 2 >= total) reviewCard(conversationId(theme), 4);
    }
    const saved = recorded.get(roundId) ?? record(game.id, score);
    recorded.set(roundId, saved);
    return saved;
  });
  const good = total ? score / total >= 0.7 : score >= 10;
  const cards = [...new Map(misses.filter((miss) => miss.card).map((miss) => [miss.card!.id, miss.card!])).values()];
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center px-4 pt-8 pb-10 text-center">
      <MascotActor pose={good ? 'cheer' : 'oops'} moment={good ? 'double' : 'nope'} stars={good} delay={200} className="size-40 sm:size-48" label="De mascotte" />
      <p className="mt-4 text-xs font-semibold tracking-wider text-primary uppercase">{game.title}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{total ? `${score} van de ${total} goed` : `${score} goed!`}</h1>
      <p className="mt-1 text-muted-foreground">
        {result.isBest && score > 0 ? (result.previousBest ? `Nieuw record! Je vorige record was ${result.previousBest}.` : 'Je eerste record staat erop.') : `Jouw record: ${Math.max(result.previousBest, score)}.`}
      </p>
      {result.isBest && score > 0 && <Badge variant="xp" className="mt-3 h-8 px-3 text-sm"><Trophy />Nieuw record</Badge>}
      {misses.length > 0 && (
        <div className="mt-6 w-full rounded-xl border bg-card p-4 text-left">
          <p className="mb-2 text-sm font-semibold">Nog even oefenen</p>
          <ul className="flex flex-col divide-y">
            {misses.slice(0, 8).map((miss) => (
              <li key={miss.key} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium" lang="nl">{miss.nl}</p>
                  {miss.meaning && <Translation className="text-sm text-muted-foreground">{miss.meaning}</Translation>}
                </div>
                {audioUrl(miss.nl, 'ronnie') && <ListenButton text={miss.nl} />}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6 flex w-full flex-col gap-3">
        <Button size="xl" game onClick={onAgain}><RotateCcw />Nog een keer</Button>
        {cards.length > 0 && <Button size="xl" variant="info" game onClick={() => start({queue: cards, label: `Fouten uit ${game.title}`})}><Zap />Oefen deze kaartjes</Button>}
        <Button size="xl" variant="outline" onClick={() => close()}>Klaar</Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Spellen veranderen je herhaalplanning niet. Met “Oefen deze kaartjes” zet je je fouten in een gewoon rondje.</p>
    </div>
  );
}
