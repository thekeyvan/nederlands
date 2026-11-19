import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {ArrowRight, Check, CircleCheck, CircleX, Flame, Lightbulb, Puzzle, Sparkles, Star, Timer, Trophy, Turtle, Volume2, X, Zap} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Progress} from '@/components/ui/progress';
import {Mascot} from '@/components/game/mascot';
import {MascotActor} from '@/components/game/mascot-actor';
import {Stamp} from '@/components/game/stamp';
import {ListenButton} from '@/components/listen-button';
import {Page} from '@/components/page';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {trackEvent} from '@/lib/stats';
import {plural} from '@/lib/text';
import {useAudio} from '@/hooks/use-audio';
import {useGame} from '@/hooks/use-progress';
import {usePractice, type Session} from '@/hooks/use-practice';
import {getProgress} from '@/core/progress-store.js';
import {ratings, scheduleReview} from '@/core/srs.js';
import {buildOptions, cardKind, checkTyped, chooseMode, gradeAnswer, normalizeAnswer, pairsFrom, shuffle, seededRandom, type Mode, type Option} from '@/core/practice.js';
import {vocabulary} from '@/core/learning-data.js';
import {phrases} from '@/core/phrase-data.js';
import {stamps, xpForGrade} from '@/core/game.js';
import {t} from '@/core/i18n.js';
import {haptic} from '@/lib/native';
import {QuitButton} from '@/components/quit-button';
import type {Card as LearningCard} from '@/core/types';
import {orderItem, pickOptions} from '@/lib/drill';
import {builderCorrect} from '@/core/games.js';
import {audioUrl} from '@/core/audio-playback.js';
import {checkForm, formInput} from '@/core/irregular.js';
import {ruleWhy, type Why} from '@/core/why.js';
import {TypedDiff, typedWhy, WhyCard, WhyToggle} from '@/components/why';
import {WordOrder} from '@/components/word-order';

/** A practice round, shown as a layer over the screen it was started from. */
export function PracticeLayer({session}: {session: Session}) {
  if (session.index >= session.queue.length) return <RoundComplete session={session} />;
  return <SessionView session={session} />;
}

/* ---------------------------------------------------------------- session */

type Outcome = {grade: number; correct: boolean; result: 'correct' | 'close' | 'wrong'; hint?: string; why?: Why | null; typed?: string};

const modeBadges: Record<Mode, {label: string; variant: 'lavender' | 'info' | 'xp' | 'success' | 'streak'}> = {
  order: {label: 'Volgorde', variant: 'info'},
  pick: {label: 'Kies de zin', variant: 'lavender'},
  choose: {label: 'Kiezen', variant: 'lavender'},
  reverse: {label: 'Kiezen', variant: 'lavender'},
  listen: {label: 'Luisteren', variant: 'info'},
  type: {label: 'Typen', variant: 'xp'},
  gap: {label: 'Grammatica', variant: 'success'},
  flash: {label: 'Kaartje', variant: 'streak'},
  form: {label: 'Onregelmatig', variant: 'xp'},
};

function SessionView({session}: {session: Session}) {
  const {close, answer, next} = usePractice();
  const card = session.queue[session.index];
  const answered = session.results.length > session.index;
  const xp = session.results.reduce((sum, result) => sum + result.xp, 0);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-4 pb-40 sm:px-6 lg:pt-8">
      <div className="flex items-center gap-3">
        <QuitButton label="Stoppen met oefenen" title="Stoppen met dit rondje?" description="Wat je al hebt beantwoord, is bewaard. De andere kaartjes komen later terug."
          confirm={session.results.length > 0 && session.results.length < session.queue.length} onQuit={() => close()} />
        <Progress value={(session.results.length / session.queue.length) * 100} className="h-3.5 flex-1 bg-success/15" indicatorClassName="bg-success" aria-label={`Kaartje ${session.index + 1} van ${session.queue.length}`} />
        {session.combo >= 2 ? (
          <Badge key={session.combo} variant="streak" className="h-7 px-2.5 text-sm" aria-label={`${session.combo} goed op rij`}><Zap />{session.combo}×</Badge>
        ) : (
          <Badge variant="xp" className="h-7 px-2.5 text-sm"><Star />+{xp}</Badge>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">{session.index + 1} / {session.queue.length}{session.options.label ? ` · ${session.options.label}` : card.themeTitle ? ` · ${card.themeTitle}` : ''}</p>
      <CardRunner key={`${session.id}:${session.index}`} card={card} position={session.index} answered={answered} combo={session.combo}
        onAnswer={(outcome) => answer(outcome.grade, outcome.correct)} onNext={next} />
    </div>
  );
}

function CardRunner({card, position, answered, combo, onAnswer, onNext}: {card: LearningCard; position: number; answered: boolean; combo: number; onAnswer: (outcome: Outcome) => void; onNext: () => void}) {
  // The mode is fixed when the card appears, so it does not change once the answer is saved.
  const [mode] = useState<Mode>(() => card.mode ?? chooseMode(card, getProgress().reviews[card.id], position));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const audio = useAudio();
  const submit = useCallback((result: Outcome) => {
    if (outcome) return;
    setOutcome(result);
    onAnswer(result);
    if (result.correct && card.nl && cardKind(card) !== 'grammar' && mode !== 'listen' && audioUrl(card.nl, 'ronnie')) audio.play(card.nl);
  }, [outcome, onAnswer, audio, card, mode]);
  const badge = modeBadges[mode];
  return (
    <div className="mt-6 flex flex-1 flex-col sm:mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      {mode === 'choose' && <ChooseCard card={card} field="meaning" outcome={outcome} onSubmit={submit} />}
      {mode === 'reverse' && <ChooseCard card={card} field="nl" outcome={outcome} onSubmit={submit} />}
      {mode === 'listen' && <ListenCard card={card} outcome={outcome} onSubmit={submit} />}
      {mode === 'type' && <TypeCard card={card} outcome={outcome} onSubmit={submit} />}
      {mode === 'gap' && <GapCard card={card} outcome={outcome} onSubmit={submit} />}
      {mode === 'order' && <OrderCard card={card} outcome={outcome} onSubmit={submit} />}
      {mode === 'pick' && <PickCard card={card} outcome={outcome} onSubmit={submit} />}
      {mode === 'form' && <FormCard card={card} outcome={outcome} onSubmit={submit} />}
      {mode === 'flash' && <FlashCard card={card} onRate={(grade) => { onAnswer({grade, correct: grade >= 3, result: grade >= 3 ? 'correct' : 'wrong'}); onNext(); }} />}
      {outcome && answered && mode !== 'flash' && <Feedback card={card} mode={mode} outcome={outcome} combo={combo} onNext={onNext} />}
    </div>
  );
}

/* ----------------------------------------------------------------- options */

function useNumberKeys(count: number, onPick: (index: number) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < count) {
        event.preventDefault();
        onPick(index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, onPick, enabled]);
}

function OptionList({options, chosen, outcome, translated, onPick}: {options: Option[]; chosen: string | null; outcome: Outcome | null; translated: boolean; onPick: (option: Option) => void}) {
  const pick = useCallback((index: number) => options[index] && onPick(options[index]), [options, onPick]);
  useNumberKeys(options.length, pick, !outcome);
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {options.map((option, index) => {
        const state = outcome ? (option.correct ? 'right' : option.id === chosen ? 'wrong' : 'dim') : 'idle';
        return (
          <li key={option.id}>
            <button type="button" disabled={Boolean(outcome)} onClick={() => onPick(option)}
              className={cn('flex min-h-14 w-full items-center gap-3 rounded-xl border-2 bg-card px-4 py-3 text-left font-medium shadow-[0_3px_0_var(--border)] transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                state === 'idle' && 'hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0.5 active:shadow-none',
                state === 'right' && 'border-success bg-success-soft text-success-foreground shadow-[0_3px_0_var(--success)]',
                state === 'wrong' && 'border-destructive bg-destructive-soft text-destructive-foreground shadow-[0_3px_0_var(--destructive)]',
                state === 'dim' && 'opacity-45')}>
              <kbd className={cn('hidden size-6 shrink-0 place-items-center rounded-md border text-[11px] font-semibold text-muted-foreground sm:grid', state === 'right' && 'border-success text-success-foreground', state === 'wrong' && 'border-destructive text-destructive-foreground')}>{index + 1}</kbd>
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

const wordPool = vocabulary;
const poolFor = (card: LearningCard) => (cardKind(card) === 'phrase' ? phrases : wordPool);

function ChooseCard({card, field, outcome, onSubmit}: {card: LearningCard; field: 'meaning' | 'nl'; outcome: Outcome | null; onSubmit: (outcome: Outcome) => void}) {
  const options = useMemo(() => buildOptions(card, poolFor(card), field), [card, field]);
  const [chosen, setChosen] = useState<string | null>(null);
  // A card the learner got wrong last time: the mascot tilts its head and thinks (as in the iPhone app).
  const [hard] = useState(() => (getProgress().reviews[card.id]?.grade ?? 5) < 3);
  const pick = (option: Option) => {
    if (outcome) return;
    setChosen(option.id);
    onSubmit({grade: gradeAnswer(option.correct ? 'correct' : 'wrong'), correct: option.correct, result: option.correct ? 'correct' : 'wrong', why: option.why ?? null});
  };
  return (
    <>
      <p className="font-semibold text-muted-foreground">{field === 'meaning' ? 'Wat betekent dit?' : 'Hoe zeg je dit in het Nederlands?'}</p>
      {field === 'nl' && <Translation className="text-sm text-muted-foreground">{t('reverseHint')}</Translation>}
      {/* The mascot asks from just above the question, so the word or sentence gets the full width. */}
      <div className="my-5 sm:my-8">
        <MascotActor pose="think" moment={hard ? 'ponder' : undefined} delay={250} className="relative z-10 -mb-3 ml-3 size-16 sm:size-20" />
        <div className="flex min-h-20 items-center gap-4 rounded-2xl border bg-card p-4">
        {field === 'meaning' ? (
          <>
            <ListenButton text={card.nl!} variant="info" size="icon-lg" className="size-14 rounded-xl shadow-[0_4px_0_var(--info)]" />
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" lang="nl">{card.nl}</h1>
          </>
        ) : (
          <Translation as="h1" className="flex-1 text-3xl font-bold sm:text-4xl">{card.meaning}</Translation>
        )}
        </div>
      </div>
      <OptionList options={options} chosen={chosen} outcome={outcome} translated={field === 'meaning'} onPick={pick} />
    </>
  );
}

function ListenCard({card, outcome, onSubmit}: {card: LearningCard; outcome: Outcome | null; onSubmit: (outcome: Outcome) => void}) {
  const audio = useAudio();
  const text = card.nl!;
  const options = useMemo(() => buildOptions(card, poolFor(card), 'nl'), [card]);
  const [chosen, setChosen] = useState<string | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const timer = setTimeout(() => audio.play(text), 250);
    return () => clearTimeout(timer);
  }, [audio, text]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        audio.play(text);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audio, text]);
  const playing = audio.current === text && audio.state === 'playing';
  const pick = (option: Option) => {
    if (outcome) return;
    setChosen(option.id);
    onSubmit({grade: gradeAnswer(option.correct ? 'correct' : 'wrong'), correct: option.correct, result: option.correct ? 'correct' : 'wrong', why: option.why ?? null});
  };
  return (
    <>
      <h1 className="text-center font-semibold text-muted-foreground">Wat hoor je?</h1>
      <div className="my-6 flex flex-col items-center gap-2 sm:my-8">
        <Button variant="info" game className="size-28 rounded-2xl [&_svg:not([class*='size-'])]:size-12" onClick={() => audio.play(text)} aria-label="Luister nog eens">
          <Volume2 className={cn('size-12', playing && 'animate-pulse')} />
        </Button>
        <Button variant="ghost" size="sm" className="text-info-foreground" onClick={() => audio.play(text, {speed: 0.75})}><Turtle />Langzamer</Button>
      </div>
      <OptionList options={options} chosen={chosen} outcome={outcome} translated={false} onPick={pick} />
    </>
  );
}

function AnswerInput({value, onChange, onSubmit, disabled, outcome, placeholder, className}: {value: string; onChange: (value: string) => void; onSubmit: () => void; disabled: boolean; outcome: Outcome | null; placeholder: string; className?: string}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!disabled) onSubmit(); }} className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      <Input ref={ref} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} lang="nl" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
        className={cn('h-14 flex-1 bg-card text-lg', outcome?.result === 'correct' && 'border-success bg-success-soft', outcome?.result === 'close' && 'border-xp bg-xp-soft', outcome?.result === 'wrong' && 'border-destructive bg-destructive-soft')} aria-label="Jouw antwoord" />
      {!outcome && <Button type="submit" size="xl" game disabled={!value.trim()}>Controleer</Button>}
    </form>
  );
}

function hintFor(answer: string) {
  const words = answer.split(' ');
  return words.map((word) => (/^(de|het|een)$/i.test(word) ? word : word.slice(0, Math.max(1, Math.ceil(word.length / 3))) + '…')).join(' ');
}

function TypeCard({card, outcome, onSubmit}: {card: LearningCard; outcome: Outcome | null; onSubmit: (outcome: Outcome) => void}) {
  const [value, setValue] = useState('');
  const [hinted, setHinted] = useState(false);
  const check = () => {
    const {result, hint} = checkTyped(value, card.nl!);
    onSubmit({grade: gradeAnswer(result, {hinted}), correct: result !== 'wrong', result, hint, why: result === 'correct' ? null : typedWhy(value, card.nl!, result), typed: value});
  };
  return (
    <>
      <p className="font-semibold text-muted-foreground">Typ het Nederlandse woord</p>
      <Translation as="h1" className="my-6 text-3xl font-bold sm:my-8 sm:text-4xl">{card.meaning}</Translation>
      <AnswerInput value={value} onChange={setValue} onSubmit={check} disabled={Boolean(outcome)} outcome={outcome} placeholder="Typ hier…" />
      {!outcome && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {hinted ? <p className="text-sm text-muted-foreground"><Lightbulb className="mr-1 inline size-4 text-xp-foreground" />Begint met <strong className="text-foreground" lang="nl">{hintFor(card.nl!)}</strong></p>
            : <Button variant="ghost" size="sm" onClick={() => setHinted(true)}><Lightbulb />Hint</Button>}
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onSubmit({grade: 1, correct: false, result: 'wrong'})}>Ik weet het niet</Button>
        </div>
      )}
    </>
  );
}

function GapCard({card, outcome, onSubmit}: {card: LearningCard; outcome: Outcome | null; onSubmit: (outcome: Outcome) => void}) {
  const [value, setValue] = useState('');
  const [hinted, setHinted] = useState(false);
  const [before, after] = (card.prompt ?? '').split('___');
  const check = () => {
    const {result, hint} = checkTyped(value, card.answer!);
    onSubmit({grade: gradeAnswer(result, {hinted}), correct: result !== 'wrong', result, hint, why: (result === 'close' ? typedWhy(value, card.answer!, result) : null) ?? ruleWhy(card)});
  };
  return (
    <>
      <p className="font-semibold text-muted-foreground">Vul het ontbrekende woord in.</p>
      <div className="my-6 rounded-xl border bg-card p-5 sm:my-8">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{card.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{card.pattern}</p>
        <h1 className="mt-4 text-2xl leading-relaxed font-bold sm:text-3xl" lang="nl">
          {before}<span className={cn('mx-1 inline-block min-w-20 rounded-md border-b-4 px-2 text-center', outcome ? (outcome.result === 'wrong' ? 'border-destructive text-destructive-foreground' : 'border-success text-success-foreground') : 'border-primary text-primary')}>{value || '…'}</span>{after}
        </h1>
      </div>
      <AnswerInput value={value} onChange={setValue} onSubmit={check} disabled={Boolean(outcome)} outcome={outcome} placeholder="Het ontbrekende woord" />
      {!outcome && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {hinted ? <Translation className="text-sm text-muted-foreground">{card.rule}</Translation>
            : <Button variant="ghost" size="sm" onClick={() => setHinted(true)}><Lightbulb />Toon de regel</Button>}
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onSubmit({grade: 1, correct: false, result: 'wrong'})}>Ik weet het niet</Button>
        </div>
      )}
    </>
  );
}

/**
 * Onregelmatig: one form of a row (blijven · ___ · is gebleven) or a present-tense form in a sentence.
 * New forms are chosen from four options with typical mistakes; after two good answers you type them.
 */
function FormCard({card, outcome, onSubmit}: {card: LearningCard; outcome: Outcome | null; onSubmit: (outcome: Outcome) => void}) {
  const [input] = useState(() => formInput(getProgress().reviews[card.id]));
  const [hard] = useState(() => (getProgress().reviews[card.id]?.grade ?? 5) < 3);
  const [value, setValue] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [hinted, setHinted] = useState(false);
  const options = useMemo<Option[]>(() => (card.choices ?? []).map((choice, index) => ({id: `c${index}`, ...choice})), [card]);
  const pick = (option: Option) => {
    if (outcome) return;
    setChosen(option.id);
    onSubmit({grade: gradeAnswer(option.correct ? 'correct' : 'wrong'), correct: option.correct, result: option.correct ? 'correct' : 'wrong', why: option.why ?? null});
  };
  const check = () => {
    const {result, hint} = checkForm(value, card);
    // A typed form that matches one of the choices gets that choice's reason; otherwise the right form's.
    const typedChoice = options.find((option) => normalizeAnswer(option.label) === normalizeAnswer(value));
    onSubmit({grade: gradeAnswer(result, {hinted}), correct: result !== 'wrong', result, hint, why: typedChoice?.why ?? options.find((option) => option.correct)?.why ?? ruleWhy(card)});
  };
  const shown = input === 'type' ? value : options.find((option) => option.id === chosen)?.label ?? '';
  const gapClass = cn('inline-block min-w-16 rounded-md border-b-4 px-2 text-center', outcome ? (outcome.result === 'wrong' ? 'border-destructive text-destructive-foreground' : 'border-success text-success-foreground') : 'border-primary text-primary');
  const [before, after] = (card.prompt ?? '').split('___');
  return (
    <>
      <p className="font-semibold text-muted-foreground">{input === 'type' ? 'Typ de goede vorm.' : 'Kies de goede vorm.'}</p>
      <div className="mt-5 flex items-center gap-3">
        <MascotActor pose="think" moment={hard ? 'ponder' : undefined} delay={250} className="-my-3 size-20 shrink-0 sm:size-24" />
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" lang="nl">{card.title}</h1>
          <Translation className="mt-0.5 text-muted-foreground">{card.meaning}</Translation>
        </div>
      </div>
      {card.chain ? (
        <ol className={cn('my-6 grid gap-2 sm:my-8', card.chain.length === 3 ? 'grid-cols-3' : 'grid-cols-2')} lang="nl">
          {card.chain.map((cell, index) => {
            const asked = index === card.ask;
            const later = index > card.ask!;
            return (
              <li key={index} className={cn('flex min-h-24 flex-col justify-between gap-2 rounded-xl border-2 bg-card p-2.5', asked && (outcome ? (outcome.result === 'wrong' ? 'border-destructive bg-destructive-soft' : 'border-success bg-success-soft') : 'border-dashed border-primary'), later && 'opacity-50')}>
                <span className="text-[11px] leading-tight font-semibold text-muted-foreground">{card.labels?.[index]}{index > 0 && cardIsVerb(card) ? ' · hij' : ''}</span>
                <span className={cn('leading-tight font-bold sm:text-xl', Math.max(...(asked ? shown || '?' : later ? '…' : cell).split(' ').map((word) => word.length)) > 8 ? 'text-[15px]' : 'text-lg', asked && !outcome && 'text-primary')}>{asked ? shown || '?' : later ? '…' : cell}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="my-6 rounded-xl border bg-card p-5 sm:my-8">
          <p className="text-2xl leading-relaxed font-bold" lang="nl">{before}<span className={gapClass}>{shown || '…'}</span>{after}</p>
        </div>
      )}
      {input === 'choose' ? <OptionList options={options} chosen={chosen} outcome={outcome} translated={false} onPick={pick} /> : (
        <>
          <AnswerInput value={value} onChange={setValue} onSubmit={check} disabled={Boolean(outcome)} outcome={outcome} placeholder={card.ask === 2 && cardIsVerb(card) ? 'heeft of is + deelwoord' : 'Typ hier…'} />
          {!outcome && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {hinted ? <Translation className="text-sm text-muted-foreground">{card.rule}</Translation>
                : <Button variant="ghost" size="sm" onClick={() => setHinted(true)}><Lightbulb />Toon de regel</Button>}
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onSubmit({grade: 1, correct: false, result: 'wrong'})}>Ik weet het niet</Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
const cardIsVerb = (card: LearningCard) => card.labels?.[0] === 'werkwoord';

/** Put the words in order. The first word is given; tap a placed word to take it back. */
function OrderCard({card, outcome, onSubmit}: {card: LearningCard; outcome: Outcome | null; onSubmit: (outcome: Outcome) => void}) {
  const item = useMemo(() => orderItem(card), [card]);
  const [chosen, setChosen] = useState<string[]>([]);
  if (!item) return null;
  const used = new Set(chosen);
  const remaining = item.tiles.filter((tile) => !used.has(tile.id));
  const words = chosen.map((id) => item.tiles.find((tile) => tile.id === id)!.text);
  const check = () => {
    const right = builderCorrect(item, words);
    onSubmit({grade: right ? 4 : 1, correct: right, result: right ? 'correct' : 'wrong', why: item.why});
  };
  return (
    <>
      <p className="font-semibold text-muted-foreground">Zet de woorden in de goede volgorde</p>
      <Translation className="mt-3 text-xl font-medium">{card.translation}</Translation>
      <div className="my-6 flex flex-col gap-4">
        <WordOrder first={item.first} tiles={item.tiles} chosen={chosen} onChange={setChosen} ending={item.ending} disabled={Boolean(outcome)}
          state={outcome ? (outcome.correct ? 'right' : 'wrong') : null} />
      </div>
      {!outcome && (
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" size="lg" disabled={!chosen.length} onClick={() => setChosen(chosen.slice(0, -1))}>Terug</Button>
          <Button size="xl" game disabled={remaining.length > 0} onClick={check}>Controleer</Button>
        </div>
      )}
    </>
  );
}

/** Choose the sentence with the right word order. */
function PickCard({card, outcome, onSubmit}: {card: LearningCard; outcome: Outcome | null; onSubmit: (outcome: Outcome) => void}) {
  const options = useMemo(() => pickOptions(card), [card]);
  const [chosen, setChosen] = useState<string | null>(null);
  const pick = (option: Option) => {
    if (outcome) return;
    setChosen(option.id);
    onSubmit({grade: option.correct ? 4 : 1, correct: option.correct, result: option.correct ? 'correct' : 'wrong', why: option.why ?? null});
  };
  return (
    <>
      <p className="font-semibold text-muted-foreground">Welke zin is goed?</p>
      <Translation className="my-5 text-xl font-medium">{card.translation}</Translation>
      <OptionList options={options} chosen={chosen} outcome={outcome} translated={false} onPick={pick} />
    </>
  );
}

function FlashCard({card, onRate}: {card: LearningCard; onRate: (grade: number) => void}) {
  const [revealed, setRevealed] = useState(false);
  const grammar = cardKind(card) === 'grammar';
  const review = getProgress().reviews[card.id];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target instanceof HTMLInputElement) return;
      if (event.code === 'Space' && !revealed) {
        event.preventDefault();
        setRevealed(true);
      }
      const index = Number(event.key) - 1;
      if (revealed && index >= 0 && index < ratings.length) {
        event.preventDefault();
        onRate(ratings[index].grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, onRate]);
  return (
    <>
      <p className="font-semibold text-muted-foreground">{grammar ? 'Maak de zin af' : 'Weet je het nog?'}</p>
      <div className="my-6 rounded-2xl border bg-card p-6 text-center shadow-[0_4px_0_var(--border)] sm:my-8 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl" lang="nl">{grammar ? card.prompt : card.nl}</h1>
        <Translation className="mt-2 text-sm text-muted-foreground">{t(grammar ? 'grammarHint' : 'meaningHint')}</Translation>
        {revealed && (
          <div className="mt-5 flex flex-col items-center gap-2 border-t pt-5">
            {grammar ? (
              <>
                <p className="text-xl font-bold text-primary" lang="nl">{card.answer}</p>
                <p lang="nl">{card.example}</p>
                <Translation className="text-sm text-muted-foreground">{card.translation}</Translation>
                <Translation className="text-sm text-muted-foreground">{card.rule}</Translation>
              </>
            ) : (
              <>
                <Translation className="text-xl font-medium">{card.meaning}</Translation>
                {card.example && <p className="text-muted-foreground" lang="nl">{card.example}</p>}
                <ListenButton text={card.example || card.nl!} showLabel label="Luister" variant="outline" size="sm" />
              </>
            )}
          </div>
        )}
      </div>
      {!revealed ? (
        <Button size="xl" game className="self-center" onClick={() => setRevealed(true)}>Bekijk het antwoord</Button>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ratings.map((rating, index) => {
            const next = scheduleReview(review, rating.grade);
            return (
              <button key={rating.grade} type="button" onClick={() => onRate(rating.grade)}
                className={cn('flex flex-col items-center gap-0.5 rounded-xl border-2 bg-card px-3 py-3 shadow-[0_3px_0_var(--border)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                  rating.grade === 1 && 'hover:border-destructive', rating.grade === 5 && 'hover:border-success')}>
                <span className="font-semibold"><kbd className="mr-1.5 hidden text-xs text-muted-foreground sm:inline">{index + 1}</kbd>{rating.label}</span>
                <Translation as="span" className="text-xs text-muted-foreground">{t(`rating${rating.grade}`)}</Translation>
                <span className="text-[11px] text-muted-foreground">over {plural(next.interval, 'dag', 'dagen')}</span>
              </button>
            );
          })}
        </div>
      )}
      <p className="mt-4 hidden text-center text-xs text-muted-foreground sm:block">Spatie: antwoord bekijken · 1–4: hoe goed wist je het?</p>
    </>
  );
}

/* --------------------------------------------------------------- feedback */

function Feedback({card, mode, outcome, combo, onNext}: {card: LearningCard; mode: Mode; outcome: Outcome; combo: number; onNext: () => void}) {
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
  useEffect(() => haptic(outcome.result === 'wrong' ? 'error' : 'success'), [outcome.result]);
  const grammar = cardKind(card) === 'grammar';
  const form = mode === 'form';
  const whole = mode === 'order' || mode === 'pick' || (mode === 'gap' && Boolean(card.mode));
  const answerText = whole ? card.example : grammar ? card.answer : card.nl;
  const tone = outcome.result === 'correct' ? 'success' : outcome.result === 'close' ? 'xp' : 'destructive';
  const title = outcome.result === 'correct' ? ['Goed zo!', 'Precies!', 'Top!', 'Lekker bezig!'][answerText!.length % 4] : outcome.result === 'close' ? (outcome.hint === 'article' ? 'Bijna! Let op de of het.' : outcome.hint === 'aux' ? 'Bijna! Met hebben of zijn:' : 'Bijna! Kleine typfout.') : 'Nog niet. Dit is het:';
  const Icon = outcome.result === 'wrong' ? CircleX : CircleCheck;
  return (
    <div role="status" className={cn('fixed inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom-4 border-t-2 px-4 pt-4 pb-safe sm:px-6 lg:static lg:mt-6 lg:rounded-2xl lg:border-2 lg:px-6 lg:pb-5',
      tone === 'success' && 'border-success/30 bg-success-soft text-success-foreground',
      tone === 'xp' && 'border-xp/50 bg-xp-soft text-xp-foreground',
      tone === 'destructive' && 'border-destructive/30 bg-destructive-soft text-destructive-foreground')}>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MascotActor pose={outcome.result === 'wrong' ? 'oops' : 'cheer'} className="size-14 -my-2"
              moment={outcome.result === 'wrong' ? 'nope' : [3, 5, 10, 15, 20, 30].includes(combo) ? 'double' : 'hop'} />
            <Icon className="size-6 shrink-0" aria-hidden />
            <p className="text-lg font-bold">{title}</p>
            <Badge className="relative ml-auto bg-card text-xp-foreground lg:ml-2"><Star />+{xpForGrade(outcome.grade)} XP
            </Badge>
          </div>
          {form && (
            <div className="mt-1">
              <p className="text-lg font-semibold" lang="nl">{card.note}</p>
              {card.chain ? <Translation className="text-sm opacity-80">{card.meaning}</Translation> : null}
              {outcome.result !== 'correct' && !outcome.why && <Translation className="mt-1 text-sm opacity-80">{card.rule}</Translation>}
              {outcome.result === 'wrong' && <p className="mt-1 text-xs opacity-80">Deze vorm komt morgen terug.</p>}
            </div>
          )}
          {/* Words and sentences: the Dutch answer and its translation, also when it was right. */}
          {!form && !grammar && <p className="mt-1 text-lg font-semibold" lang="nl">{answerText}</p>}
          {!form && !grammar && card.meaning && <Translation className="text-[15px] font-medium">{card.meaning}</Translation>}
          {!form && grammar && <p className="mt-1 text-lg font-semibold" lang="nl">{answerText}</p>}
          {!form && !grammar && card.example && (
            <div className="mt-1 flex items-start gap-1">
              <div className="min-w-0">
                <p className="text-sm" lang="nl">{card.example}</p>
                <Translation className="text-sm opacity-80">{card.translation}</Translation>
              </div>
              <ListenButton text={card.example} className="-mt-1 shrink-0" />
            </div>
          )}
          {grammar && whole && card.example && audioUrl(card.example, 'ronnie') && <ListenButton text={card.example} className="-mt-1" />}
          {grammar && (whole || !outcome.why) && <Translation className="mt-1 text-sm opacity-80">{whole ? card.translation : card.rule}</Translation>}
          {outcome.typed !== undefined && outcome.result !== 'correct' && <TypedDiff typed={outcome.typed} answer={card.nl!} />}
          {outcome.why && (outcome.result === 'correct' ? <WhyToggle why={outcome.why} /> : <WhyCard why={outcome.why} tone={outcome.result === 'close' ? 'close' : 'wrong'} />)}
          {outcome.result === 'wrong' && !card.mode && <p className="mt-1 text-xs opacity-80">Dit kaartje komt morgen terug.</p>}
        </div>
        <Button ref={ref} size="xl" game variant={tone === 'success' ? 'success' : tone === 'xp' ? 'default' : 'destructive'} className="w-full lg:w-auto" onClick={onNext}>
          Verder<ArrowRight />
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- complete */

function RoundComplete({session}: {session: Session}) {
  const {start, close} = usePractice();
  const game = useGame();
  const [pairs, setPairs] = useState(false);
  const results = session.results;
  const right = results.filter((result) => result.correct).length;
  const xp = results.reduce((sum, result) => sum + result.xp, 0);
  const newStamps = stamps.filter((stamp) => game.earned.includes(stamp.id) && !session.before.earned.includes(stamp.id));
  const levelUp = game.level.number > session.before.level;
  // One anonymous count per finished round: what kind, how long, how many right.
  useEffect(() => { trackEvent('ronde klaar', {soort: session.options.type ?? (session.options.theme ? 'thema' : 'mix'), kaartjes: results.length, goed: right}); }, [session.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const pairCards = useMemo(() => pairsFrom(session.queue, vocabulary, {count: 5, seed: String(session.id)}), [session.queue, session.id]);
  // Pattern rounds and fixed lists repeat the same cards; other rounds plan fresh ones.
  const again = () => start(session.options.drill ? session.options : {...session.options, queue: undefined});

  if (pairs) return <PairsGame cards={pairCards} onDone={() => setPairs(false)} />;

  if (!results.length) {
    return (
      <Page className="flex max-w-xl flex-col items-center gap-4 pt-16 text-center">
        <Mascot mood="sleep" className="size-36" />
        <h1 className="text-3xl font-extrabold">Je bent weer bij.</h1>
        <p className="text-muted-foreground">Voor deze keuze zijn nu geen kaartjes klaar. Kies een ander thema of kom later terug.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" size="lg" onClick={() => close()}>Terug</Button>
          <Button size="lg" game onClick={() => start({theme: 'all', type: 'all'})}>Oefen alles</Button>
        </div>
      </Page>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center px-4 pt-8 pb-10 text-center">
      <MascotActor pose="cheer" moment="double" stars delay={200} className="size-44 sm:size-52" label="De mascotte juicht" />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Rondje klaar!</h1>
      <p className="text-muted-foreground">{right === results.length ? 'Alles goed. Wat knap!' : right >= results.length / 2 ? 'Lekker bezig. De moeilijke komen snel terug.' : 'Goed geoefend. Morgen gaat het al makkelijker.'}</p>
      <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
        <Tile tone="bg-xp" label="XP"><span className="text-xp-foreground">+{xp}</span></Tile>
        <Tile tone="bg-success" label="Goed"><span className="text-success-foreground tabular-nums">{right}/{results.length}</span></Tile>
        <Tile tone="bg-primary" label="Reeks"><span className="flex items-center justify-center gap-1 text-accent-foreground"><Flame className="size-5" />{game.streak.count}</span></Tile>
      </div>
      {session.bestCombo >= 3 && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium"><Zap className="size-4 text-primary" />Beste combo: {session.bestCombo} goed op rij</p>}
      {levelUp && (
        <div className="mt-4 flex w-full items-center gap-3 rounded-xl border-2 border-xp bg-xp-soft p-3 text-left">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-xp text-xl font-extrabold text-white shadow-[0_3px_0_var(--xp-edge)]">{game.level.number}</span>
          <div><p className="font-bold">Nieuw niveau: {game.level.name}!</p><p className="text-sm text-muted-foreground">{game.level.next ? `Volgende: ${game.level.next.name}` : 'Het hoogste niveau.'}</p></div>
        </div>
      )}
      {newStamps.map((stamp) => (
        <div key={stamp.id} className="mt-4 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-card p-3 text-left">
          <Stamp id={stamp.id} earned className="w-16 shrink-0" />
          <div><p className="flex items-center gap-1.5 font-bold"><Sparkles className="size-4 text-primary" />Nieuwe stempel: {stamp.title}</p><p className="text-sm text-muted-foreground">{stamp.description}</p></div>
        </div>
      ))}
      <div className="mt-6 flex w-full flex-col gap-3">
        <Button size="xl" game onClick={again}>Nog een rondje<ArrowRight /></Button>
        {pairCards.length >= 4 && <Button size="xl" variant="info" game onClick={() => setPairs(true)}><Puzzle />Bonus: speel paren</Button>}
        <Button size="xl" variant="outline" onClick={() => close()}>Klaar</Button>
      </div>
    </div>
  );
}

function Tile({tone, label, children}: {tone: string; label: string; children: ReactNode}) {
  return (
    <div className={cn('rounded-xl p-[3px]', tone)}>
      <p className="py-1 text-[11px] font-bold tracking-wide text-white uppercase">{label}</p>
      <div className="rounded-lg bg-card py-3 text-2xl font-extrabold">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------- pairs */

function PairsGame({cards, onDone}: {cards: LearningCard[]; onDone: () => void}) {
  // Dutch on the left, Persian on the right, each column in its own order; the grid fills row by row.
  const tiles = useMemo(() => {
    const seed = cards.map((card) => card.id).join();
    const dutch = shuffle(cards.map((card) => ({key: `nl:${card.id}`, id: card.id, label: card.nl!, dutch: true})), seededRandom(seed));
    // No pair may start on the same row: shuffle the Persian again until none lines up (a few tries at most).
    const meanings = cards.map((card) => ({key: `m:${card.id}`, id: card.id, label: card.meaning!, dutch: false}));
    let persian = meanings;
    for (let attempt = 0; attempt < 20; attempt++) {
      persian = shuffle(meanings, seededRandom(`${seed}:fa:${attempt}`));
      if (persian.every((tile, index) => tile.id !== dutch[index].id)) break;
    }
    return dutch.flatMap((tile, index) => [tile, persian[index]]);
  }, [cards]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const finished = matched.size === cards.length;
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(timer);
  }, [finished, startedAt]);
  const pick = (tile: (typeof tiles)[number]) => {
    if (matched.has(tile.id) || wrong.length) return;
    if (!selected) return setSelected(tile.key);
    if (selected === tile.key) return setSelected(null);
    const first = tiles.find((item) => item.key === selected)!;
    if (first.dutch === tile.dutch) return setSelected(tile.key);
    if (first.id === tile.id) {
      setMatched(new Set(matched).add(tile.id));
      setSelected(null);
    } else {
      setWrong([selected, tile.key]);
      setTimeout(() => { setWrong([]); setSelected(null); }, 600);
    }
  };
  const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-6 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onDone} aria-label="Terug"><X className="size-5" /></Button>
        <Progress value={(matched.size / cards.length) * 100} className="h-3.5 flex-1 bg-info/30" indicatorClassName="bg-secondary" aria-label={`${matched.size} van ${cards.length} paren`} />
        <Badge variant="info" className="h-7 px-2.5 text-sm tabular-nums"><Timer />{time}</Badge>
      </div>
      {finished ? (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Trophy className="size-16 text-xp" />
          <h1 className="text-3xl font-extrabold">Alle paren in {time}!</h1>
          <p className="text-muted-foreground">Een bonus voor de fun. Je planning verandert er niet door.</p>
          <Button size="xl" game onClick={onDone}>Terug</Button>
        </div>
      ) : (
        <>
          <h1 className="mt-6 mb-5 text-center text-xl font-bold">Zoek de paren</h1>
          <div className="grid grid-cols-2 gap-2.5">
            {tiles.map((tile) => {
              const done = matched.has(tile.id);
              const isWrong = wrong.includes(tile.key);
              return (
                <button key={tile.key} type="button" disabled={done} onClick={() => pick(tile)}
                  className={cn('min-h-16 rounded-xl border-2 bg-card px-3 py-3 font-medium shadow-[0_3px_0_var(--border)] transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                    selected === tile.key && 'border-secondary bg-info-soft',
                    done && 'border-success bg-success-soft text-success-foreground opacity-60 shadow-none',
                    isWrong && 'border-destructive bg-destructive-soft')}>
                  {tile.dutch ? <span lang="nl">{tile.label}</span> : <Translation as="span">{tile.label}</Translation>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
