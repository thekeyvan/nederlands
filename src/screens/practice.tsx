import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {ArrowRight, Brain, Check, CircleCheck, CircleX, Flame, Headphones, Keyboard, Layers, Lightbulb, Puzzle, Sparkles, Star, Timer, Trophy, Turtle, Volume2, X, Zap} from 'lucide-react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Progress} from '@/components/ui/progress';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Confetti} from '@/components/game/confetti';
import {Mascot} from '@/components/game/mascot';
import {Stamp} from '@/components/game/stamp';
import {ListenButton} from '@/components/listen-button';
import {Page, PageHeader} from '@/components/page';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {plural} from '@/lib/text';
import {useAudio} from '@/hooks/use-audio';
import {useGame} from '@/hooks/use-progress';
import {usePractice, type Session} from '@/hooks/use-practice';
import {navigate} from '@/hooks/use-route';
import {getProgress} from '@/core/progress-store.js';
import {ratings, scheduleReview} from '@/core/srs.js';
import {buildOptions, cardKind, checkTyped, chooseMode, gradeAnswer, pairsFrom, shuffle, seededRandom, type Mode, type Option} from '@/core/practice.js';
import {themes, vocabulary} from '@/core/learning-data.js';
import {phrases} from '@/core/phrase-data.js';
import {stamps, xpForGrade} from '@/core/game.js';
import {t} from '@/core/i18n.js';
import type {Card as LearningCard} from '@/core/types';

export function PracticeScreen() {
  const {session} = usePractice();
  if (!session) return <PracticeSetup />;
  if (session.index >= session.queue.length) return <RoundComplete session={session} />;
  return <SessionView session={session} />;
}

/* ------------------------------------------------------------------ setup */

const modeList = [
  {icon: Brain, title: 'Kiezen', copy: 'Kies de goede vertaling.', tint: 'bg-lavender text-lavender-foreground'},
  {icon: Headphones, title: 'Luisteren', copy: 'Hoor het en kies wat je hoort.', tint: 'bg-info-soft text-info-foreground'},
  {icon: Keyboard, title: 'Typen', copy: 'Typ het Nederlandse woord.', tint: 'bg-xp-soft text-xp-foreground'},
  {icon: Puzzle, title: 'Zinsbouw', copy: 'Vul het ontbrekende woord in.', tint: 'bg-success-soft text-success-foreground'},
  {icon: Layers, title: 'Kaartje', copy: 'Denk na, draai om en kies.', tint: 'bg-accent text-accent-foreground'},
];

function PracticeSetup() {
  const game = useGame();
  const {start, theme, type, setTheme, setType} = usePractice();
  const due = game.dueCards;
  return (
    <Page>
      <PageHeader eyebrow="Een beetje blijft hangen" title="Wat weet je nog?" />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className="relative overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 py-6 text-center sm:py-8">
            <Mascot mood={due ? 'think' : 'wave'} className="size-28" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Klein rondje. Groot verschil.</h2>
              <p className="mt-1 text-muted-foreground">{due ? `${plural(due, 'kaartje wacht', 'kaartjes wachten')} op je. Daarna een paar nieuwe.` : 'Alles is herhaald. Je krijgt een paar nieuwe kaartjes.'}</p>
            </div>
            <Button size="xl" game onClick={() => start()}>Begin met oefenen<ArrowRight /></Button>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="xp"><Star />+{xpForGrade(4)} XP per goed antwoord</Badge>
              <Badge variant="streak"><Flame />Combo’s voor goede reeksen</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="font-bold">Kies wat je oefent</h2>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="practice-theme">Thema</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="practice-theme" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle thema’s</SelectItem>
                  {themes.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
                  <SelectItem value="zinsbouw">Zinsbouw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="practice-type">Inhoud</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="practice-type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Woorden + zinnen</SelectItem>
                  <SelectItem value="woorden">Alleen woorden</SelectItem>
                  <SelectItem value="praktisch">Praktische zinnen</SelectItem>
                  <SelectItem value="zinnen">Alleen zinsbouw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Maximaal 20 kaartjes per rondje, met maximaal 5 nieuwe. Eerst wat je moet herhalen.</p>
          </CardContent>
        </Card>
      </div>
      <h2 className="mt-8 mb-3 text-lg font-bold">Vijf manieren om te oefenen</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {modeList.map((mode) => (
          <div key={mode.title} className="rounded-xl border bg-card p-4">
            <span className={cn('mb-3 grid size-11 place-items-center rounded-lg', mode.tint)}><mode.icon className="size-5" /></span>
            <p className="font-semibold">{mode.title}</p>
            <p className="text-sm text-muted-foreground">{mode.copy}</p>
          </div>
        ))}
      </div>
      <Accordion type="single" collapsible className="mt-6">
        <AccordionItem value="method">
          <AccordionTrigger>Hoe werkt slim herhalen?</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 text-muted-foreground">
            <p>We gebruiken SM-2. Goede antwoorden komen steeds later terug; moeilijke kaartjes eerder. Nieuwe kaartjes kies je eerst uit vier antwoorden; kaartjes die je goed kent, typ je zelf.</p>
            <p>Goed in één keer telt als <strong>Goed</strong>. Goed met een hint of een kleine typfout telt als <strong>Moeilijk</strong>. Fout telt als <strong>Nog niet</strong>: dat kaartje komt morgen terug.</p>
            <Translation>{t('method')}</Translation>
            <a href="https://www.super-memory.com/english/ol/sm2.htm" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">Over de methode ↗</a>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Page>
  );
}

/* ---------------------------------------------------------------- session */

type Outcome = {grade: number; correct: boolean; result: 'correct' | 'close' | 'wrong'; hint?: string};

const modeBadges: Record<Mode, {label: string; variant: 'lavender' | 'info' | 'xp' | 'success' | 'streak'}> = {
  choose: {label: 'Kiezen', variant: 'lavender'},
  reverse: {label: 'Kiezen', variant: 'lavender'},
  listen: {label: 'Luisteren', variant: 'info'},
  type: {label: 'Typen', variant: 'xp'},
  gap: {label: 'Zinsbouw', variant: 'success'},
  flash: {label: 'Kaartje', variant: 'streak'},
};

function SessionView({session}: {session: Session}) {
  const {stop, answer, next} = usePractice();
  const card = session.queue[session.index];
  const answered = session.results.length > session.index;
  const xp = session.results.reduce((sum, result) => sum + result.xp, 0);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-4 pb-40 sm:px-6 lg:pt-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={stop} aria-label="Stoppen met oefenen"><X className="size-5" /></Button>
        <Progress value={(session.results.length / session.queue.length) * 100} className="h-3.5 flex-1 bg-success/15" indicatorClassName="bg-success" aria-label={`Kaartje ${session.index + 1} van ${session.queue.length}`} />
        {session.combo >= 2 ? (
          <Badge key={session.combo} variant="streak" className="animate-pop h-7 px-2.5 text-sm"><Flame />{session.combo}×</Badge>
        ) : (
          <Badge variant="xp" className="h-7 px-2.5 text-sm"><Star />+{xp}</Badge>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">{session.index + 1} / {session.queue.length}{card.themeTitle ? ` · ${card.themeTitle}` : cardKind(card) === 'grammar' ? ' · Zinsbouw' : ''}</p>
      <CardRunner key={`${session.id}:${session.index}`} card={card} position={session.index} answered={answered}
        onAnswer={(outcome) => answer(outcome.grade, outcome.correct)} onNext={next} />
    </div>
  );
}

function CardRunner({card, position, answered, onAnswer, onNext}: {card: LearningCard; position: number; answered: boolean; onAnswer: (outcome: Outcome) => void; onNext: () => void}) {
  // The mode is fixed when the card appears, so it does not change once the answer is saved.
  const [mode] = useState<Mode>(() => chooseMode(card, getProgress().reviews[card.id], position));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const audio = useAudio();
  const submit = useCallback((result: Outcome) => {
    if (outcome) return;
    setOutcome(result);
    onAnswer(result);
    if (result.correct && card.nl && cardKind(card) !== 'grammar' && mode !== 'listen') audio.play(card.nl);
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
      {mode === 'flash' && <FlashCard card={card} onRate={(grade) => { onAnswer({grade, correct: grade >= 3, result: grade >= 3 ? 'correct' : 'wrong'}); onNext(); }} />}
      {outcome && answered && mode !== 'flash' && <Feedback card={card} mode={mode} outcome={outcome} onNext={onNext} />}
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
                state === 'right' && 'animate-pop border-success bg-success-soft text-success-foreground shadow-[0_3px_0_var(--success)]',
                state === 'wrong' && 'animate-wiggle border-destructive bg-destructive-soft text-destructive-foreground shadow-[0_3px_0_var(--destructive)]',
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
  const pick = (option: Option) => {
    if (outcome) return;
    setChosen(option.id);
    onSubmit({grade: gradeAnswer(option.correct ? 'correct' : 'wrong'), correct: option.correct, result: option.correct ? 'correct' : 'wrong'});
  };
  return (
    <>
      <p className="font-semibold text-muted-foreground">{field === 'meaning' ? 'Wat betekent dit?' : 'Hoe zeg je dit in het Nederlands?'}</p>
      {field === 'nl' && <Translation className="text-sm text-muted-foreground">{t('reverseHint')}</Translation>}
      <div className="my-6 flex items-center gap-4 sm:my-8">
        {field === 'meaning' ? (
          <>
            <ListenButton text={card.nl!} variant="info" size="icon-lg" className="size-14 rounded-xl shadow-[0_4px_0_var(--info)]" />
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" lang="nl">{card.nl}</h1>
          </>
        ) : (
          <Translation as="h1" className="text-3xl font-bold sm:text-4xl">{card.meaning}</Translation>
        )}
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
    onSubmit({grade: gradeAnswer(option.correct ? 'correct' : 'wrong'), correct: option.correct, result: option.correct ? 'correct' : 'wrong'});
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
        className={cn('h-14 flex-1 bg-card text-lg', outcome?.result === 'correct' && 'border-success bg-success-soft', outcome?.result === 'close' && 'border-xp bg-xp-soft', outcome?.result === 'wrong' && 'animate-wiggle border-destructive bg-destructive-soft')} aria-label="Jouw antwoord" />
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
    onSubmit({grade: gradeAnswer(result, {hinted}), correct: result !== 'wrong', result, hint});
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
    onSubmit({grade: gradeAnswer(result, {hinted}), correct: result !== 'wrong', result, hint});
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
          <div className="mt-5 flex animate-pop flex-col items-center gap-2 border-t pt-5">
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

function Feedback({card, mode, outcome, onNext}: {card: LearningCard; mode: Mode; outcome: Outcome; onNext: () => void}) {
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
  const grammar = cardKind(card) === 'grammar';
  const answerText = grammar ? card.answer : card.nl;
  const tone = outcome.result === 'correct' ? 'success' : outcome.result === 'close' ? 'xp' : 'destructive';
  const title = outcome.result === 'correct' ? ['Goed zo!', 'Precies!', 'Top!', 'Lekker bezig!'][answerText!.length % 4] : outcome.result === 'close' ? (outcome.hint === 'article' ? 'Bijna! Let op de of het.' : 'Bijna! Kleine typfout.') : 'Nog niet. Dit is het:';
  const Icon = outcome.result === 'wrong' ? CircleX : CircleCheck;
  return (
    <div role="status" className={cn('fixed inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom-4 border-t-2 px-4 pt-4 pb-safe sm:px-6 lg:static lg:mt-6 lg:rounded-2xl lg:border-2 lg:px-6 lg:pb-5',
      tone === 'success' && 'border-success/30 bg-success-soft text-success-foreground',
      tone === 'xp' && 'border-xp/50 bg-xp-soft text-xp-foreground',
      tone === 'destructive' && 'border-destructive/30 bg-destructive-soft text-destructive-foreground')}>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="size-6 shrink-0" aria-hidden />
            <p className="text-lg font-bold">{title}</p>
            <Badge className="relative ml-auto bg-card text-xp-foreground lg:ml-2"><Star />+{xpForGrade(outcome.grade)} XP
              <span aria-hidden className="animate-float-up pointer-events-none absolute inset-x-0 -top-1 text-center text-xs font-bold">+{xpForGrade(outcome.grade)}</span>
            </Badge>
          </div>
          {mode === 'choose' && outcome.result !== 'correct' && <p className="mt-1 text-lg font-semibold"><span lang="nl">{card.nl}</span> = <Translation as="span">{card.meaning}</Translation></p>}
          {mode !== 'choose' && (outcome.result !== 'correct' || grammar) && <p className="mt-1 text-lg font-semibold" lang="nl">{answerText}</p>}
          {!grammar && card.example && (
            <div className="mt-1 flex items-start gap-1">
              <div className="min-w-0">
                <p className="text-sm" lang="nl">{card.example}</p>
                <Translation className="text-sm opacity-80">{card.translation}</Translation>
              </div>
              <ListenButton text={card.example} className="-mt-1 shrink-0" />
            </div>
          )}
          {!grammar && !card.example && card.meaning && <Translation className="text-sm opacity-80">{card.meaning}</Translation>}
          {grammar && <Translation className="mt-1 text-sm opacity-80">{card.rule}</Translation>}
          {outcome.result === 'wrong' && <p className="mt-1 text-xs opacity-80">Dit kaartje komt morgen terug.</p>}
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
  const {start, stop} = usePractice();
  const game = useGame();
  const [pairs, setPairs] = useState(false);
  const results = session.results;
  const right = results.filter((result) => result.correct).length;
  const xp = results.reduce((sum, result) => sum + result.xp, 0);
  const newStamps = stamps.filter((stamp) => game.earned.includes(stamp.id) && !session.before.earned.includes(stamp.id));
  const levelUp = game.level.number > session.before.level;
  const pairCards = useMemo(() => pairsFrom(session.queue, vocabulary, {count: 5, seed: String(session.id)}), [session.queue, session.id]);
  const again = () => start(session.options.cardIds || session.options.theme ? session.options : {});

  if (pairs) return <PairsGame cards={pairCards} onDone={() => setPairs(false)} />;

  if (!results.length) {
    return (
      <Page className="flex max-w-xl flex-col items-center gap-4 pt-16 text-center">
        <Mascot mood="sleep" className="size-36" />
        <h1 className="text-3xl font-extrabold">Je bent weer bij.</h1>
        <p className="text-muted-foreground">Voor deze keuze zijn nu geen kaartjes klaar. Kies een ander thema of kom later terug.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" size="lg" onClick={() => { stop(); navigate('woorden'); }}>Ontdek een thema</Button>
          <Button size="lg" game onClick={() => start({theme: 'all', type: 'all'})}>Oefen alles</Button>
        </div>
      </Page>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center px-4 pt-8 pb-10 text-center">
      <Confetti />
      <Mascot mood="cheer" className="size-40 animate-pop sm:size-48" label="De mascotte juicht" />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Rondje klaar!</h1>
      <p className="text-muted-foreground">{right === results.length ? 'Alles goed. Wat knap!' : right >= results.length / 2 ? 'Lekker bezig. De moeilijke komen snel terug.' : 'Goed geoefend. Morgen gaat het al makkelijker.'}</p>
      <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
        <Tile tone="bg-xp" label="XP"><span className="text-xp-foreground">+{xp}</span></Tile>
        <Tile tone="bg-success" label="Goed"><span className="text-success-foreground tabular-nums">{right}/{results.length}</span></Tile>
        <Tile tone="bg-primary" label="Reeks"><span className="flex items-center justify-center gap-1 text-accent-foreground"><Flame className="size-5" />{game.streak.count}</span></Tile>
      </div>
      {session.bestCombo >= 3 && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium"><Zap className="size-4 text-primary" />Beste combo: {session.bestCombo} goed op rij</p>}
      {levelUp && (
        <div className="mt-4 flex w-full animate-pop items-center gap-3 rounded-xl border-2 border-xp bg-xp-soft p-3 text-left">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-xp text-xl font-extrabold text-white shadow-[0_3px_0_var(--xp-edge)]">{game.level.number}</span>
          <div><p className="font-bold">Nieuw niveau: {game.level.name}!</p><p className="text-sm text-muted-foreground">{game.level.next ? `Volgende: ${game.level.next.name}` : 'Het hoogste niveau.'}</p></div>
        </div>
      )}
      {newStamps.map((stamp) => (
        <div key={stamp.id} className="mt-4 flex w-full animate-pop items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-card p-3 text-left">
          <Stamp id={stamp.id} earned className="w-16 shrink-0" />
          <div><p className="flex items-center gap-1.5 font-bold"><Sparkles className="size-4 text-primary" />Nieuwe stempel: {stamp.title}</p><p className="text-sm text-muted-foreground">{stamp.description}</p></div>
        </div>
      ))}
      <div className="mt-6 flex w-full flex-col gap-3">
        <Button size="xl" game onClick={again}>Nog een rondje<ArrowRight /></Button>
        {pairCards.length >= 4 && <Button size="xl" variant="info" game onClick={() => setPairs(true)}><Puzzle />Bonus: speel paren</Button>}
        <Button size="xl" variant="outline" onClick={() => { stop(); navigate('vandaag'); }}>Klaar voor vandaag</Button>
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
  const tiles = useMemo(() => shuffle(cards.flatMap((card) => [{key: `nl:${card.id}`, id: card.id, label: card.nl!, dutch: true}, {key: `m:${card.id}`, id: card.id, label: card.meaning!, dutch: false}]), seededRandom(cards.map((card) => card.id).join())), [cards]);
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
    if (first.id === tile.id && first.dutch !== tile.dutch) {
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
          <Confetti pieces={24} />
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
                    isWrong && 'animate-wiggle border-destructive bg-destructive-soft')}>
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
