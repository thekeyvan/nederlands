import {useCallback, useEffect, useMemo, useState} from 'react';
import {ListenButton} from '@/components/listen-button';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {articleItems, raceQuestion, roundPool, type ArticleItem} from '@/core/games.js';
import {seededRandom, shuffle} from '@/core/practice.js';
import {vocabulary} from '@/core/learning-data.js';
import {ChoiceGrid, GameBar, GameFrame, GameOver, newRoundId, useCountdown, whyFor, type Miss} from '@/games/shell';
import {WhyText} from '@/components/why';
import type {GameInfo} from '@/games/registry';

interface Props {game: GameInfo; theme: string; onAgain: () => void}

/** Big for short words, smaller for long compounds, so every noun fits on one line of a phone. */
const wordSize = (word: string) =>
  word.length <= 9 ? 'text-5xl sm:text-6xl' : word.length <= 13 ? 'text-4xl sm:text-6xl' : word.length <= 20 ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl';

/** De of het? Sixty seconds of articles. Keys: D or ←, H or →. */
export function ArticleGame({game, theme, onAgain}: Props) {
  const [roundId] = useState(() => newRoundId(game.id));
  const items = useMemo(() => {
    const {items} = roundPool(articleItems(vocabulary), theme, 15);
    return shuffle(items, seededRandom(roundId));
  }, [theme, roundId]);
  const left = useCountdown(60);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<'de' | 'het' | null>(null);
  const [misses, setMisses] = useState<Miss[]>([]);
  // The last mistake's reason stays at the bottom while the clock runs on.
  const [lastMiss, setLastMiss] = useState<ArticleItem | null>(null);
  const item: ArticleItem = items[index % items.length];
  const choose = useCallback((article: 'de' | 'het') => {
    if (picked || left === 0) return;
    setPicked(article);
    const right = article === item.article;
    if (right) setScore((value) => value + 1);
    else {
      setMisses((list) => [...list, {key: `${item.card.id}:${index}`, nl: item.card.nl!, meaning: item.card.meaning, card: item.card, why: item.why}]);
      setLastMiss(item);
    }
    setTimeout(() => { setPicked(null); setIndex((value) => value + 1); }, right ? 260 : 950);
  }, [picked, left, item, index]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey) return;
      if (['d', 'D', 'ArrowLeft', '1'].includes(event.key)) { event.preventDefault(); choose('de'); }
      if (['h', 'H', 'ArrowRight', '2'].includes(event.key)) { event.preventDefault(); choose('het'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose]);
  if (left === 0) return <GameOver game={game} roundId={roundId} score={score} misses={misses} theme={theme} onAgain={onAgain} />;
  const right = picked === item.article;
  return (
    <GameFrame>
      <GameBar game={game} seconds={left} score={score} theme={theme} />
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
        <div key={index} className="w-full min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">De of het?</p>
          <h1 className={cn('mt-3 font-extrabold tracking-tight', wordSize(item.noun), picked && (right ? 'text-success-foreground' : 'text-destructive-foreground'))} lang="nl">
            {picked ? <><span className="underline decoration-4 underline-offset-8">{item.article}</span> {item.noun}</> : item.noun}
          </h1>
          <Translation className="mx-auto mt-3 text-muted-foreground">{item.card.meaning}</Translation>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          {(['de', 'het'] as const).map((article) => (
            <button key={article} type="button" onClick={() => choose(article)} disabled={Boolean(picked)}
              className={cn('h-28 rounded-2xl border-2 text-4xl font-extrabold shadow-[0_5px_0_var(--border)] transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-1 active:shadow-none',
                article === 'de' ? 'border-primary/40 bg-accent text-accent-foreground' : 'border-secondary/40 bg-info-soft text-info-foreground',
                picked && article === item.article && 'border-success bg-success-soft text-success-foreground',
                picked === article && article !== item.article && 'border-destructive bg-destructive-soft text-destructive-foreground')}>
              {article}
              <span className="mt-1 hidden text-[11px] font-medium opacity-60 [@media(hover:hover)]:block">{article === 'de' ? 'D of ←' : 'H of →'}</span>
            </button>
          ))}
        </div>
      </div>
      {lastMiss && (
        <div role="status" className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-xl rounded-2xl border-2 border-destructive/25 bg-card p-3 shadow-lg lg:static lg:mt-2 lg:w-full">
          <div className="flex items-center gap-2">
            <strong className="text-base" lang="nl">{lastMiss.card.nl}</strong>
            <span className="ml-auto truncate rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground" lang="nl">{lastMiss.why.tag}</span>
          </div>
          <WhyText text={lastMiss.why.fa} className="mt-1 text-sm leading-6" />
        </div>
      )}
    </GameFrame>
  );
}

/** Tijdrace: as many translations as you can in sixty seconds. */
export function RaceGame({game, theme, onAgain}: Props) {
  const [roundId] = useState(() => newRoundId(game.id));
  const cards = useMemo(() => {
    const words = vocabulary.filter((card) => card.meaning);
    const {items} = roundPool(words, theme, 12);
    return shuffle(items, seededRandom(roundId));
  }, [theme, roundId]);
  const left = useCountdown(60);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [misses, setMisses] = useState<Miss[]>([]);
  const card = cards[index % cards.length];
  const question = useMemo(() => raceQuestion(card, vocabulary, `${roundId}:${index}`), [card, roundId, index]);
  if (left === 0) return <GameOver game={game} roundId={roundId} score={score} misses={misses} theme={theme} onAgain={onAgain} />;
  const pick = (choice: number) => {
    if (picked !== null) return;
    setPicked(choice);
    const right = question.options[choice].correct;
    if (right) setScore((value) => value + 1);
    else setMisses((list) => [...list, {key: `${card.id}:${index}`, nl: card.nl!, meaning: card.meaning, card, why: whyFor(question.options, choice)}]);
    setTimeout(() => { setPicked(null); setIndex((value) => value + 1); }, right ? 300 : 1000);
  };
  return (
    <GameFrame>
      <GameBar game={game} seconds={left} score={score} theme={theme} />
      <div key={index} className="mt-8 flex flex-col gap-6 sm:mt-12">
        <div className="flex items-center gap-3">
          <ListenButton text={card.nl!} variant="info" size="icon-lg" className="size-12 rounded-xl" />
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" lang="nl">{card.nl}</h1>
        </div>
        <ChoiceGrid options={question.options} picked={picked} onPick={pick} translated />
      </div>
    </GameFrame>
  );
}
