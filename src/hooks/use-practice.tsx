import {createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode} from 'react';
import {getProgress, reviewCard} from '@/core/progress-store.js';
import {planSession} from '@/core/learning-model.js';
import {gameStats, xpForGrade, type StampId} from '@/core/game.js';
import {cardKind} from '@/core/practice.js';
import type {Card} from '@/core/types';
import {navigate} from '@/hooks/use-route';

export interface SessionOptions {theme?: string; type?: string; limit?: number; cardIds?: string[]; label?: string}
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

interface PracticeValue {
  session: Session | null;
  theme: string;
  type: string;
  setTheme: (theme: string) => void;
  setType: (type: string) => void;
  start: (options?: SessionOptions) => void;
  practice: (card: Card) => void;
  answer: (grade: number, correct: boolean) => void;
  next: () => void;
  stop: () => void;
}

const PracticeContext = createContext<PracticeValue | null>(null);

function snapshot() {
  const {reviews, events} = getProgress();
  const stats = gameStats(reviews, events);
  return {earned: stats.earned, level: stats.level.number, streak: stats.streak.count};
}

export function PracticeProvider({children}: {children: ReactNode}) {
  const [session, setSessionState] = useState<Session | null>(null);
  // The ref mirrors the latest session so answers record exactly one review, even in StrictMode.
  const sessionRef = useRef<Session | null>(null);
  const setSession = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSessionState(next);
  }, []);
  const [theme, setThemeState] = useState('all');
  const [type, setTypeState] = useState('all');

  // Grammar patterns live in their own "zinsbouw" theme, so the two choices stay consistent.
  const setTheme = useCallback((value: string) => {
    setThemeState(value);
    setTypeState((current) => (value === 'zinsbouw' ? 'zinnen' : current === 'zinnen' ? 'all' : current));
  }, []);
  const setType = useCallback((value: string) => {
    setTypeState(value);
    setThemeState((current) => (value === 'zinnen' ? 'zinsbouw' : current === 'zinsbouw' ? 'all' : current));
  }, []);

  const begin = useCallback((queue: Card[], options: SessionOptions) => {
    setSession({id: Date.now(), queue, index: 0, results: [], options, combo: 0, bestCombo: 0, before: snapshot()});
    navigate('oefenen');
  }, [setSession]);

  const start = useCallback(
    (options: SessionOptions = {}) => {
      const chosenTheme = options.theme ?? theme;
      const chosenType = options.type ?? type;
      const queue = planSession(getProgress().reviews, {theme: chosenTheme, type: chosenType, limit: options.limit ?? 20, cardIds: options.cardIds});
      begin(queue, {...options, theme: chosenTheme, type: chosenType});
    },
    [begin, theme, type],
  );

  const practice = useCallback(
    (card: Card) => {
      const kind = cardKind(card);
      begin([card], {theme: card.themeId, type: kind === 'grammar' ? 'zinnen' : kind === 'phrase' ? 'praktisch' : 'woorden', label: 'Eén kaartje'});
    },
    [begin],
  );

  const answer = useCallback((grade: number, correct: boolean) => {
    const current = sessionRef.current;
    if (!current || current.index >= current.queue.length || current.results.length > current.index) return;
    const card = current.queue[current.index];
    reviewCard(card.id, grade);
    const combo = correct ? current.combo + 1 : 0;
    setSession({...current, combo, bestCombo: Math.max(current.bestCombo, combo), results: [...current.results, {cardId: card.id, grade, correct, xp: xpForGrade(grade)}]});
  }, [setSession]);

  const next = useCallback(() => {
    const current = sessionRef.current;
    if (current && current.results.length > current.index) setSession({...current, index: current.index + 1});
  }, [setSession]);

  const stop = useCallback(() => setSession(null), [setSession]);

  const value = useMemo(
    () => ({session, theme, type, setTheme, setType, start, practice, answer, next, stop}),
    [session, theme, type, setTheme, setType, start, practice, answer, next, stop],
  );
  return <PracticeContext value={value}>{children}</PracticeContext>;
}

export function usePractice() {
  const value = useContext(PracticeContext);
  if (!value) throw new Error('usePractice must be used inside PracticeProvider');
  return value;
}
