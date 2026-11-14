import {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowRight, Check, Lightbulb, MessageCircle, Turtle, Undo2, Volume2, X} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ListenButton} from '@/components/listen-button';
import {Translation} from '@/components/translation';
import {ThemeArt} from '@/components/game/theme-art';
import {cn} from '@/lib/utils';
import {useAudio} from '@/hooks/use-audio';
import {builderCorrect, builderItem, checkDictation, dialogueSteps, dictationItems, pick, roundPool, type BuilderItem} from '@/core/games.js';
import {seededRandom, shuffle} from '@/core/practice.js';
import {themes, vocabulary} from '@/core/learning-data.js';
import {dialogues, phrases} from '@/core/phrase-data.js';
import {FeedbackBar, GameBar, GameFrame, GameOver, newRoundId, type Miss} from '@/games/shell';
import type {GameInfo} from '@/games/registry';
import type {Card, Dialogue} from '@/core/types';

interface Props {game: GameInfo; theme: string; onAgain: () => void}

/* ------------------------------------------------------------ Zinnen bouwen */

export function BuilderGame({game, theme, onAgain}: Props) {
  const audio = useAudio();
  const [roundId] = useState(() => newRoundId(game.id));
  const items = useMemo(() => {
    const random = seededRandom(roundId);
    const {items: pool} = roundPool(phrases, theme, 5);
    return shuffle(pool, random).map((card) => builderItem(card, card.nl, `${roundId}:${card.id}`)).filter(Boolean).slice(0, 8) as BuilderItem[];
  }, [roundId, theme]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  if (index >= items.length) return <GameOver game={game} roundId={roundId} score={score} total={items.length} misses={misses} theme={theme} onAgain={onAgain} />;
  const item = items[index];
  const used = new Set(chosen);
  const remaining = item.tiles.filter((tile) => !used.has(tile.id));
  const words = chosen.map((id) => item.tiles.find((tile) => tile.id === id)!.text);
  const check = () => {
    const right = builderCorrect(item, words);
    setChecked(right);
    audio.play(item.sentence);
    if (right) setScore((value) => value + 1);
    else setMisses((list) => [...list, {key: item.card.id, nl: item.sentence, meaning: item.card.meaning, card: item.card}]);
  };
  const next = () => { setChosen([]); setChecked(null); setIndex((value) => value + 1); };
  return (
    <GameFrame>
      <GameBar game={game} progress={index / items.length} score={score} theme={theme} />
      <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">{index + 1} / {items.length}</p>
      <div key={item.card.id} className="mt-6 flex animate-pop flex-col gap-6 sm:mt-10">
        <div>
          <Badge variant="info">Zet de woorden in de goede volgorde</Badge>
          <Translation className="mt-4 text-xl font-medium">{item.card.meaning}</Translation>
        </div>
        <div className={cn('flex min-h-24 flex-wrap content-start items-center gap-2 rounded-2xl border-2 border-dashed p-3 transition',
          checked === true && 'border-success bg-success-soft', checked === false && 'border-destructive bg-destructive-soft')} aria-label="Jouw zin" lang="nl">
          <span className="rounded-lg bg-secondary px-3 py-2 font-semibold text-secondary-foreground">{item.first}</span>
          {chosen.map((id) => (
            <button key={id} type="button" disabled={checked !== null} onClick={() => setChosen(chosen.filter((value) => value !== id))}
              className="animate-pop rounded-lg border-2 border-primary/40 bg-accent px-3 py-2 font-semibold text-accent-foreground shadow-[0_2px_0_var(--primary-edge)] transition hover:opacity-80">
              {item.tiles.find((tile) => tile.id === id)!.text}
            </button>
          ))}
          {item.ending && <span className="text-xl font-bold text-muted-foreground">{item.ending}</span>}
        </div>
        <div className="flex min-h-14 flex-wrap justify-center gap-2" lang="nl">
          {remaining.map((tile) => (
            <button key={tile.id} type="button" disabled={checked !== null} onClick={() => setChosen([...chosen, tile.id])}
              className="rounded-lg border-2 bg-card px-4 py-2.5 text-lg font-semibold shadow-[0_3px_0_var(--border)] transition hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0.5 active:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
              {tile.text}
            </button>
          ))}
        </div>
        {checked === null && (
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="lg" disabled={!chosen.length} onClick={() => setChosen(chosen.slice(0, -1))}><Undo2 />Terug</Button>
            <Button size="xl" game disabled={remaining.length > 0} onClick={check}>Controleer</Button>
          </div>
        )}
      </div>
      {checked !== null && (
        <FeedbackBar tone={checked ? 'success' : 'wrong'} title={checked ? 'Goed gebouwd!' : 'Bijna! De gewone volgorde is:'} onNext={next}>
          <div className="mt-1 flex items-start gap-2">
            <p className="text-base font-semibold" lang="nl">{item.sentence}</p>
            <ListenButton text={item.sentence} className="-mt-1 shrink-0" />
          </div>
          {!checked && <p className="mt-1 text-xs opacity-80">Soms kan een zin ook anders. Dit is de volgorde die je het vaakst hoort.</p>}
        </FeedbackBar>
      )}
    </GameFrame>
  );
}

/* ------------------------------------------------------------ Luisterdictee */

export function DictationGame({game, theme, onAgain}: Props) {
  const audio = useAudio();
  const [roundId] = useState(() => newRoundId(game.id));
  const items = useMemo(() => {
    const random = seededRandom(roundId);
    const {items: phrasePool} = roundPool(dictationItems(phrases), theme, 5);
    const {items: wordPool} = roundPool(vocabulary.filter((card) => card.nl), theme, 3);
    return shuffle([...pick(phrasePool, 5, random), ...pick(wordPool, 3, random)], random);
  }, [roundId, theme]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ReturnType<typeof checkDictation> | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const card: Card | undefined = items[index];
  useEffect(() => {
    if (!card) return;
    const timer = setTimeout(() => audio.play(card.nl!), 300);
    input.current?.focus();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  if (!card) return <GameOver game={game} roundId={roundId} score={score} total={items.length} misses={misses} theme={theme} onAgain={onAgain} />;
  const check = () => {
    const outcome = checkDictation(value, card);
    setResult(outcome);
    if (outcome.result === 'wrong') setMisses((list) => [...list, {key: card.id, nl: card.nl!, meaning: card.meaning, card}]);
    else setScore((total) => total + 1);
  };
  const next = () => { setValue(''); setResult(null); setIndex((total) => total + 1); };
  const playing = audio.current === card.nl && audio.state === 'playing';
  return (
    <GameFrame>
      <GameBar game={game} progress={index / items.length} score={score} theme={theme} />
      <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">{index + 1} / {items.length}</p>
      <div key={card.id} className="mt-6 flex animate-pop flex-col items-center gap-5 sm:mt-10">
        <h1 className="font-semibold text-muted-foreground">Luister en typ wat je hoort.</h1>
        <Button variant="info" game className="size-28 rounded-2xl" onClick={() => audio.play(card.nl!)} aria-label="Luister nog eens">
          <Volume2 className={cn('size-12', playing && 'animate-pulse')} />
        </Button>
        <Button variant="ghost" size="sm" className="text-info-foreground" onClick={() => audio.play(card.nl!, {speed: 0.75})}><Turtle />Langzamer</Button>
        <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (!result && value.trim()) check(); }}>
          <Input ref={input} value={value} onChange={(event) => setValue(event.target.value)} disabled={Boolean(result)} placeholder="Typ hier wat je hoort…" lang="nl" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
            className={cn('h-14 flex-1 bg-card text-lg', result?.result === 'correct' && 'border-success bg-success-soft', result?.result === 'close' && 'border-xp bg-xp-soft', result?.result === 'wrong' && 'animate-wiggle border-destructive bg-destructive-soft')} aria-label="Wat je hoort" />
          {!result && <Button type="submit" size="xl" game disabled={!value.trim()}>Controleer</Button>}
        </form>
        {!result && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lightbulb className="size-3.5" />Hoofdletters en leestekens tellen niet mee.</p>}
      </div>
      {result && (
        <FeedbackBar tone={result.result === 'correct' ? 'success' : result.result === 'close' ? 'close' : 'wrong'} title={result.result === 'correct' ? 'Precies goed!' : result.result === 'close' ? 'Bijna! Let op de spelling:' : 'Nog niet. Je hoorde:'} onNext={next}>
          <p className="mt-1 text-base font-semibold" lang="nl">{card.nl}</p>
          <Translation className="text-sm opacity-80">{card.meaning}</Translation>
        </FeedbackBar>
      )}
    </GameFrame>
  );
}

/* --------------------------------------------------------------- Gesprekken */

export function ConversationGame({game, theme, onAgain}: Props) {
  const audio = useAudio();
  const [roundId] = useState(() => newRoundId(game.id));
  const chosen = useMemo<Dialogue[]>(() => {
    const random = seededRandom(roundId);
    const themed = dialogues.find((dialogue) => dialogue.themeId === theme);
    const others = shuffle(dialogues.filter((dialogue) => dialogue !== themed), random);
    return (themed ? [themed, ...others] : others).slice(0, 3);
  }, [roundId, theme]);
  const steps = useMemo(() => chosen.map((dialogue) => dialogueSteps(dialogue, dialogues, `${roundId}:${dialogue.id}`)), [chosen, roundId]);
  const total = steps.flat().filter((step) => step.options).length;
  const [conversation, setConversation] = useState(0);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const current = steps[conversation];
  const step = current?.[position];
  // Lines from the other person appear one by one and are read aloud.
  useEffect(() => {
    if (!step) return;
    end.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
    if (step.options) return;
    audio.play(step.line.nl);
    const timer = setTimeout(() => setPosition((value) => value + 1), 1400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, position]);
  if (conversation >= steps.length) return <GameOver game={game} roundId={roundId} score={score} total={total} misses={misses} theme={theme} onAgain={onAgain} />;
  const finished = position >= current.length;
  const answer = (choice: number) => {
    if (!step?.options || answers[step.line.id] !== undefined) return;
    setAnswers({...answers, [step.line.id]: choice});
    const right = step.options[choice].correct;
    audio.play(step.line.nl);
    if (right) setScore((value) => value + 1);
    else setMisses((list) => [...list, {key: step.line.id, nl: step.line.nl, meaning: step.line.translation}]);
    setTimeout(() => setPosition((value) => value + 1), right ? 900 : 2000);
  };
  const shown = current.slice(0, Math.min(position + 1, current.length));
  const setting = themes.find((item) => item.id === chosen[conversation].themeId);
  return (
    <GameFrame>
      <GameBar game={game} progress={conversation / steps.length} score={score} theme={theme} />
      <p className="mt-2 text-center text-xs text-muted-foreground">Gesprek {conversation + 1} van {steps.length}</p>
      {setting && (
        <div key={setting.id} className="mt-5 flex animate-pop items-center gap-3 rounded-xl border bg-card p-3">
          <ThemeArt theme={setting} className="size-16 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Waar ben je?</p>
            <p className="font-bold">{setting.title}</p>
            <p className="text-sm text-muted-foreground">{setting.intro}</p>
          </div>
        </div>
      )}
      <ol className="mt-6 flex flex-col gap-3" aria-live="polite">
        {shown.map((item) => {
          const mine = item.line.speaker === 'Jij';
          const picked = answers[item.line.id];
          const waiting = item.options && picked === undefined;
          const wrongPick = item.options && picked !== undefined && !item.options[picked].correct;
          return (
            <li key={item.line.id} className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
              <span className="px-1 text-xs font-semibold text-muted-foreground">{item.line.speaker}</span>
              {waiting ? (
                <div className="flex w-full flex-col items-end gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><MessageCircle className="size-4" />Wat zeg jij?</p>
                  {item.options!.map((option, index) => (
                    <button key={option.line.id} type="button" onClick={() => answer(index)}
                      className="max-w-[90%] animate-pop rounded-2xl rounded-br-md border-2 border-primary/30 bg-card px-4 py-3 text-right font-medium shadow-[0_3px_0_var(--border)] transition hover:border-primary hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" lang="nl">
                      {option.line.nl}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={cn('max-w-[85%] animate-pop rounded-2xl px-4 py-3', mine ? 'rounded-br-md bg-primary/12 dark:bg-primary/20' : 'rounded-bl-md border bg-card', wrongPick && 'ring-2 ring-destructive/50')}>
                  {wrongPick && <p className="mb-1 flex items-center gap-1 text-xs text-destructive-foreground line-through" lang="nl"><X className="size-3.5" />{item.options![picked].line.nl}</p>}
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-medium" lang="nl">{item.options && !wrongPick && <Check className="mr-1 inline size-4 text-success-foreground" />}{item.line.nl}</p>
                      <Translation className="mt-0.5 text-sm text-muted-foreground">{item.line.translation}</Translation>
                    </div>
                    <ListenButton text={item.line.nl} className="-mt-1 -mr-2" />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div ref={end} />
      {finished && (
        <div className="mt-6 flex justify-center">
          <Button size="xl" game onClick={() => { setConversation(conversation + 1); setPosition(0); }}>
            {conversation + 1 < steps.length ? 'Volgend gesprek' : 'Bekijk je score'}<ArrowRight />
          </Button>
        </div>
      )}
    </GameFrame>
  );
}
