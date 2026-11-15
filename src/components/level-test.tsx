import {useMemo, useState, useSyncExternalStore} from 'react';
import {ArrowRight, Check, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Mascot} from '@/components/game/mascot';
import {ResponsiveSheet} from '@/components/responsive-sheet';
import {ThemeArt} from '@/components/game/theme-art';
import {cn} from '@/lib/utils';
import {usePreferences} from '@/hooks/use-preferences';
import {useGame} from '@/hooks/use-progress';
import {navigate} from '@/hooks/use-route';
import {themes} from '@/core/learning-data.js';
import {LEVELS, levelInfo, passMark, placementDone, placementQuestions, placementResult, suggestedThemes} from '@/core/level.js';
import type {Level} from '@/core/types';

/* The niveautest: a short adaptive quiz that sets the learner's level, which then decides the suggested themes. */
let open = false;
const listeners = new Set<() => void>();
const setOpen = (value: boolean) => {
  open = value;
  listeners.forEach((listener) => listener());
};
export const openLevelTest = () => setOpen(true);
const useOpen = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => open, () => open);

const shuffle = <T,>(list: T[]) => list.map((value) => ({value, key: Math.random()})).sort((a, b) => a.key - b.key).map(({value}) => value);
const persian = /[؀-ۿ]/;

type Step = {kind: 'intro'} | {kind: 'question'; level: Level; index: number} | {kind: 'result'; level: Level};

export function LevelTestSheet() {
  const isOpen = useOpen();
  const [, update] = usePreferences();
  const game = useGame();
  const [step, setStep] = useState<Step>({kind: 'intro'});
  const [scores, setScores] = useState<Partial<Record<Level, number>>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  const blocks = useMemo(() => Object.fromEntries(LEVELS.map((level) => [level, placementQuestions.filter((question) => question.level === level)
    .map((question) => ({...question, options: shuffle(question.options)}))])) as Record<Level, typeof placementQuestions>, [round]);
  const totalBlocks = LEVELS.length;

  const close = (value: boolean) => {
    setOpen(value);
    if (!value) setTimeout(() => { setStep({kind: 'intro'}); setScores({}); setPicked(null); setRound((count) => count + 1); }, 300);
  };
  const finish = (level: Level) => {
    update((current) => ({...current, level}));
    setStep({kind: 'result', level});
  };
  const start = () => {
    setScores({});
    setStep({kind: 'question', level: 'A0', index: 0});
  };
  const answer = (option: string) => {
    if (step.kind !== 'question' || picked) return;
    const question = blocks[step.level][step.index];
    const right = option === question.answer;
    setPicked(option);
    const nextScores = {...scores, [step.level]: (scores[step.level] ?? 0) + (right ? 1 : 0)};
    setScores(nextScores);
    setTimeout(() => {
      setPicked(null);
      const asked = step.index + 1;
      const rightSoFar = nextScores[step.level] ?? 0;
      if (!placementDone(step.level, rightSoFar, asked)) return setStep({...step, index: asked});
      const levelIndex = LEVELS.indexOf(step.level);
      const passed = rightSoFar >= passMark && asked >= blocks[step.level].length;
      if (passed && levelIndex < totalBlocks - 1) return setStep({kind: 'question', level: LEVELS[levelIndex + 1], index: 0});
      finish(placementResult(nextScores));
    }, right ? 450 : 900);
  };

  const progress = step.kind === 'question' ? (LEVELS.indexOf(step.level) * 5 + step.index) / (totalBlocks * 5) : 0;
  const statsFor = (id: string) => game.themes.find((item) => item.theme.id === id)?.stats;

  return (
    <ResponsiveSheet open={isOpen} onOpenChange={close} title={step.kind === 'result' ? 'Jouw niveau' : 'Niveautest'}
      description={step.kind === 'intro' ? 'In een paar minuten weet je waar je het best kunt beginnen.' : undefined}>
      <div className="flex flex-col gap-5 pb-4">
        {step.kind === 'intro' && (
          <>
            <div className="flex items-center gap-4 rounded-2xl bg-muted/60 p-4">
              <Mascot mood="think" className="size-16 shrink-0" />
              <p className="text-sm">Je krijgt korte vragen, eerst heel makkelijk en daarna moeilijker. Weet je het niet? Kies dan gewoon. De test stopt vanzelf op jouw niveau.</p>
            </div>
            <Button size="xl" game className="w-full" onClick={start}>Start de test<ArrowRight /></Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => finish('A0')}>Ik begin bij nul</Button>
          </>
        )}

        {step.kind === 'question' && (() => {
          const question = blocks[step.level][step.index];
          const [before, after] = question.prompt.split('___');
          return (
            <>
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-all" style={{width: `${Math.max(4, progress * 100)}%`}} /></div>
                <span className="text-xs font-bold text-muted-foreground">{step.level}</span>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{question.kind === 'fill' ? 'Welk woord past?' : question.kind === 'meaning' ? 'Wat betekent dit?' : 'Wat betekent deze zin?'}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight">
                  {after === undefined ? question.prompt : <>{before}<span className="mx-1 inline-block min-w-16 border-b-2 border-primary text-primary">{picked && question.kind === 'fill' ? picked : ' '}</span>{after}</>}
                </p>
              </div>
              <div className="grid gap-2.5">
                {question.options.map((option) => {
                  const isRight = option === question.answer;
                  const state = picked ? (isRight ? 'right' : option === picked ? 'wrong' : 'idle') : 'idle';
                  return (
                    <button key={option} type="button" onClick={() => answer(option)} disabled={Boolean(picked)} dir={persian.test(option) ? 'rtl' : 'ltr'}
                      className={cn('flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 bg-card px-4 text-left text-[17px] font-semibold shadow-[0_3px_0_var(--border)] transition active:translate-y-0.5',
                        state === 'right' && 'border-success bg-success-soft', state === 'wrong' && 'border-destructive bg-destructive/10', state === 'idle' && 'hover:bg-muted')}>
                      <span lang={persian.test(option) ? 'fa' : 'nl'} className={persian.test(option) ? 'translation' : undefined}>{option}</span>
                      {state === 'right' && <Check className="size-5 shrink-0 text-success" aria-label="Goed" />}
                      {state === 'wrong' && <X className="size-5 shrink-0 text-destructive" aria-label="Fout" />}
                    </button>
                  );
                })}
              </div>
            </>
          );
        })()}

        {step.kind === 'result' && (() => {
          const info = levelInfo[step.level];
          const suggestions = suggestedThemes(themes, step.level, statsFor, 3);
          return (
            <>
              <div className="flex items-center gap-4">
                <Mascot mood="cheer" className="size-20 shrink-0" />
                <div>
                  <p className="text-4xl font-extrabold tracking-tight text-primary">{step.level}</p>
                  <p className="text-lg font-bold">{info.name}</p>
                </div>
              </div>
              <p className="text-[15px] text-muted-foreground">{info.text} De app zet thema’s voor jouw niveau voortaan bovenaan. Je kunt de test altijd opnieuw doen bij Instellingen.</p>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold">Begin hiermee</p>
                {suggestions.map((theme) => (
                  <button key={theme.id} type="button" onClick={() => { close(false); navigate('woorden', {theme: theme.id}); }}
                    className="flex items-center gap-3 rounded-xl border bg-card p-2.5 text-left hover:bg-muted">
                    <ThemeArt theme={theme} className="size-11 shrink-0 rounded-lg" />
                    <span className="min-w-0 flex-1 font-semibold">{theme.title}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <Button size="xl" game className="w-full" onClick={() => close(false)}>Klaar</Button>
            </>
          );
        })()}
      </div>
    </ResponsiveSheet>
  );
}
