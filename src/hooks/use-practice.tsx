import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {getProgress, reviewCard} from '@/core/progress-store.js';
import {planSession} from '@/core/learning-model.js';
import {irregularRound} from '@/core/irregular.js';
import {gameStats, xpForGrade, type StampId} from '@/core/game.js';
import type {Card} from '@/core/types';

/**
 * Practice rounds and games open as a layer over the screen you are on. Closing the layer
 * (Stop, Klaar, the browser's back button) brings you back to exactly that screen and scroll position.
 */
export interface SessionOptions {theme?: string; type?: string; limit?: number; cardIds?: string[]; label?: string; queue?: Card[]; drill?: boolean; /** Onregelmatig: a round from this set (or 'all'), planned again for "Nog een rondje". */ irregular?: string}
export interface AnswerResult {cardId: string; grade: number; correct: boolean; xp: number}
export interface Session {
  id: number;
  queue: Card[];
  index: number;
  results: AnswerResult[];
  options: SessionOptions;
  combo: number;
  bestCombo: number;
  before: {earned: StampId[]; level: number; streak: number};
}
export interface OpenGame {id: string; theme: string; started: boolean; round: number}

interface PracticeValue {
  session: Session | null;
  game: OpenGame | null;
  start: (options?: SessionOptions) => void;
  practice: (card: Card) => void;
  answer: (grade: number, correct: boolean) => void;
  next: () => void;
  /** Close the round or game and return to the screen underneath. `then` runs after that screen is back. */
  close: (then?: () => void) => void;
  playGame: (id: string, theme?: string) => void;
  startGame: () => void;
  replayGame: () => void;
}

const PracticeContext = createContext<PracticeValue | null>(null);

function snapshot() {
  const {reviews, events} = getProgress();
  const stats = gameStats(reviews, events);
  return {earned: stats.earned, level: stats.level.number, streak: stats.streak.count};
}

const layerOpen = () => Boolean((history.state as {layer?: boolean} | null)?.layer);

export function PracticeProvider({children}: {children: ReactNode}) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [game, setGameState] = useState<OpenGame | null>(null);
  // The ref mirrors the latest session so answers record exactly one review, even in StrictMode.
  const sessionRef = useRef<Session | null>(null);
  const gameRef = useRef<OpenGame | null>(null);
  const scroll = useRef(0);
  const after = useRef<(() => void) | null>(null);
  const setSession = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSessionState(next);
  }, []);
  const setGame = useCallback((next: OpenGame | null) => {
    gameRef.current = next;
    setGameState(next);
  }, []);

  /** One history entry per layer, so the browser's back button closes it instead of leaving the screen. */
  const openLayer = useCallback(() => {
    if (sessionRef.current || gameRef.current) return;
    scroll.current = window.scrollY;
    history.pushState({...(history.state ?? {}), layer: true}, '', location.href);
    window.scrollTo({top: 0, behavior: 'instant'});
  }, []);

  const finishClose = useCallback(() => {
    setSession(null);
    setGame(null);
    const then = after.current;
    after.current = null;
    const top = scroll.current;
    requestAnimationFrame(() => {
      window.scrollTo({top, behavior: 'instant'});
      then?.();
    });
  }, [setSession, setGame]);

  useEffect(() => {
    const onPop = () => {
      if ((sessionRef.current || gameRef.current) && !layerOpen()) finishClose();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [finishClose]);

  const close = useCallback((then?: () => void) => {
    after.current = then ?? null;
    if (layerOpen()) history.back();
    else finishClose();
  }, [finishClose]);

  const begin = useCallback((queue: Card[], options: SessionOptions) => {
    openLayer();
    setGame(null);
    setSession({id: Date.now(), queue, index: 0, results: [], options, combo: 0, bestCombo: 0, before: snapshot()});
  }, [openLayer, setGame, setSession]);

  const start = useCallback((options: SessionOptions = {}) => {
    const theme = options.theme ?? 'all';
    const type = options.type ?? 'all';
    const queue = options.queue ?? (options.irregular ? irregularRound(options.irregular, getProgress().reviews) : planSession(getProgress().reviews, {theme, type, limit: options.limit ?? 20, cardIds: options.cardIds}));
    begin(queue, {...options, theme, type});
  }, [begin]);

  const practice = useCallback((card: Card) => begin([card], {theme: card.themeId, label: 'Eén kaartje'}), [begin]);

  const answer = useCallback((grade: number, correct: boolean) => {
    const current = sessionRef.current;
    if (!current || current.index >= current.queue.length || current.results.length > current.index) return;
    const card = current.queue[current.index];
    // A pattern round asks about one pattern several times; only its first answer goes into the schedule.
    if (!current.options.drill || !current.results.some((result) => result.cardId === card.id)) reviewCard(card.id, grade);
    const combo = correct ? current.combo + 1 : 0;
    setSession({...current, combo, bestCombo: Math.max(current.bestCombo, combo), results: [...current.results, {cardId: card.id, grade, correct, xp: xpForGrade(grade)}]});
  }, [setSession]);

  const next = useCallback(() => {
    const current = sessionRef.current;
    if (current && current.results.length > current.index) setSession({...current, index: current.index + 1});
  }, [setSession]);

  const playGame = useCallback((id: string, theme = 'all') => {
    openLayer();
    setSession(null);
    setGame({id, theme, started: false, round: 0});
  }, [openLayer, setSession]);
  const startGame = useCallback(() => { if (gameRef.current) setGame({...gameRef.current, started: true}); }, [setGame]);
  const replayGame = useCallback(() => { if (gameRef.current) setGame({...gameRef.current, round: gameRef.current.round + 1}); }, [setGame]);

  const value = useMemo(
    () => ({session, game, start, practice, answer, next, close, playGame, startGame, replayGame}),
    [session, game, start, practice, answer, next, close, playGame, startGame, replayGame],
  );
  return <PracticeContext value={value}>{children}</PracticeContext>;
}

export function usePractice() {
  const value = useContext(PracticeContext);
  if (!value) throw new Error('usePractice must be used inside PracticeProvider');
  return value;
}
