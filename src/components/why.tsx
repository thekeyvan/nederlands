import {useEffect, useRef, useState} from 'react';
import {ArrowRight, CircleHelp, Info} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {haptic} from '@/lib/native';
import {spellingDiff, spellingWhy, type Why} from '@/core/why.js';

/** Persian text with the Dutch in **bold**, kept left-to-right inside the right-to-left line. */
export function WhyText({text, className}: {text: string; className?: string}) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <Translation className={cn('text-[15px] leading-7', className)}>
      {parts.map((part, index) => (index % 2 ? <b key={index} dir="ltr" lang="nl" className="font-bold">{part.replace(/[⁦⁩]/g, '')}</b> : part))}
    </Translation>
  );
}

/** "Waarom?" with the rule's name and one sentence, inside a feedback bar. */
export function WhyCard({why, tone = 'wrong', className}: {why: Why; tone?: 'success' | 'close' | 'wrong'; className?: string}) {
  return (
    <div className={cn('mt-3 flex flex-col gap-1.5 rounded-xl bg-card p-3 text-card-foreground', className)}>
      <div className="flex items-center gap-2">
        <Info className={cn('size-4 shrink-0', tone === 'success' ? 'text-success' : tone === 'close' ? 'text-xp-edge' : 'text-primary')} aria-hidden />
        <span className={cn('text-xs font-bold', tone === 'success' ? 'text-success-foreground' : tone === 'close' ? 'text-xp-foreground' : 'text-accent-foreground')}>Waarom?</span>
        <span className="ml-auto truncate rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground" lang="nl">{why.tag}</span>
      </div>
      <WhyText text={why.fa} />
    </div>
  );
}

/**
 * After a right answer: "Goed!" and a Waarom? button. The round goes on by itself after `delay`,
 * unless the learner opens the explanation; then "Verder" goes on.
 */
export function CorrectBar({why, onNext, delay = 1500}: {why: Why; onNext: () => void; delay?: number}) {
  const [open, setOpen] = useState(false);
  const done = useRef(false);
  const next = () => { if (!done.current) { done.current = true; onNext(); } };
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, delay]);
  useEffect(() => haptic('success'), []);
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom-4 border-t-2 border-success/30 bg-success-soft px-4 pt-3 pb-safe text-success-foreground sm:px-6 lg:static lg:mt-6 lg:rounded-2xl lg:border-2 lg:px-6 lg:pb-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 pb-3">
        <div className="flex items-center gap-3">
          <p className="flex-1 text-lg font-bold">Goed!</p>
          {!open && (
            <Button variant="outline" className="h-11 rounded-full border-2 border-success bg-card px-4 text-success-foreground hover:bg-card/80" onClick={() => setOpen(true)}>
              <CircleHelp />Waarom?
            </Button>
          )}
        </div>
        {!open && <div className="h-1 overflow-hidden rounded-full bg-success/20" aria-hidden><div className="h-full origin-left bg-success" style={{animation: `why-countdown ${delay}ms linear forwards`}} /></div>}
        {open && (
          <>
            <WhyCard why={why} tone="success" className="mt-0" />
            <Button size="xl" game variant="success" className="mt-1 w-full lg:w-auto lg:self-end" onClick={next} autoFocus>Verder<ArrowRight /></Button>
          </>
        )}
      </div>
    </div>
  );
}

/** In a bar that already waits for "Verder" (a right answer): the explanation folds open on request. */
export function WhyToggle({why}: {why: Why}) {
  const [open, setOpen] = useState(false);
  if (open) return <WhyCard why={why} tone="success" />;
  return (
    <Button variant="outline" size="sm" className="mt-2 h-9 rounded-full border-2 border-success bg-card text-success-foreground hover:bg-card/80" onClick={() => setOpen(true)}>
      <CircleHelp />Waarom?
    </Button>
  );
}

/** The reason for a typed answer: always when it was close, for a wrong one only when we recognise the mistake. */
export function typedWhy(typed: string, answer: string, result: 'close' | 'wrong') {
  const why = spellingWhy(typed, answer);
  return why && (result === 'close' || why.tag !== 'spelling') ? why : null;
}

/** What was typed, with the letters that differ from the answer marked. */
export function TypedDiff({typed, answer}: {typed: string; answer: string}) {
  if (!typed.trim()) return null;
  return (
    <p className="mt-1 text-sm" lang="nl">
      <span className="opacity-75">Jij typte: </span>
      {spellingDiff(typed.trim(), answer).map((part, index) => part.wrong
        ? <del key={index} className="rounded bg-destructive-soft px-0.5 text-destructive-foreground decoration-2">{part.text}</del>
        : <span key={index}>{part.text}</span>)}
    </p>
  );
}
