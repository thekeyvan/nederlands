import {useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import {cn} from '@/lib/utils';
import {haptic} from '@/lib/native';

interface Tile {id: string; text: string}
type From = 'sentence' | 'bank';
interface Drag {id: string; from: From; x: number; y: number; dx: number; dy: number; width: number; over: 'sentence' | 'bank' | null; index: number}

/**
 * Put words in order: drag a word into the sentence (anywhere, also between words), move it within the
 * sentence or drag it back. Tapping still works: a word in the list goes to the end, a word in the
 * sentence goes back. The first word is given and stays in place.
 */
export function WordOrder({first, tiles, chosen, onChange, ending, disabled, state}: {
  first: string; tiles: Tile[]; chosen: string[]; onChange: (chosen: string[]) => void; ending?: string; disabled?: boolean; state?: 'right' | 'wrong' | null;
}) {
  const sentence = useRef<HTMLDivElement>(null);
  const bank = useRef<HTMLDivElement>(null);
  const press = useRef<{id: string; from: From; x: number; y: number; dx: number; dy: number; width: number; moved: boolean} | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const text = (id: string) => tiles.find((tile) => tile.id === id)?.text ?? '';
  const remaining = tiles.filter((tile) => !chosen.includes(tile.id));

  /** Where in the sentence a word dropped at (x, y) goes, counting only the other placed words. */
  const indexAt = (x: number, y: number, without: string) => {
    const nodes = [...(sentence.current?.querySelectorAll<HTMLElement>('[data-tile]') ?? [])].filter((node) => node.dataset.tile !== without);
    for (let index = 0; index < nodes.length; index++) {
      const box = nodes[index].getBoundingClientRect();
      if (y < box.top) return index;
      if (y <= box.bottom && x < box.left + box.width / 2) return index;
    }
    return nodes.length;
  };
  const inside = (element: HTMLElement | null, x: number, y: number, margin = 16) => {
    if (!element) return false;
    const box = element.getBoundingClientRect();
    return x >= box.left - margin && x <= box.right + margin && y >= box.top - margin && y <= box.bottom + margin;
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const current = press.current;
      if (!current) return;
      if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return;
      if (!current.moved) { current.moved = true; haptic('tap'); }
      event.preventDefault();
      const over = inside(sentence.current, event.clientX, event.clientY) ? 'sentence' : inside(bank.current, event.clientX, event.clientY) ? 'bank' : null;
      setDrag({id: current.id, from: current.from, x: event.clientX, y: event.clientY, dx: current.dx, dy: current.dy, width: current.width, over,
        index: over === 'sentence' ? indexAt(event.clientX, event.clientY, current.id) : -1});
    };
    const end = (event: PointerEvent) => {
      const current = press.current;
      press.current = null;
      if (!current?.moved) return;
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
      const over = event.type === 'pointercancel' ? null : inside(sentence.current, event.clientX, event.clientY) ? 'sentence' : inside(bank.current, event.clientX, event.clientY) ? 'bank' : null;
      setDrag(null);
      if (over === 'sentence') {
        const others = chosen.filter((id) => id !== current.id);
        const at = indexAt(event.clientX, event.clientY, current.id);
        onChange([...others.slice(0, at), current.id, ...others.slice(at)]);
        haptic('tap');
      } else if (over === 'bank' && current.from === 'sentence') {
        onChange(chosen.filter((id) => id !== current.id));
        haptic('tap');
      }
    };
    window.addEventListener('pointermove', move, {passive: false});
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, onChange]);

  const start = (event: ReactPointerEvent<HTMLButtonElement>, id: string, from: From) => {
    if (disabled || event.button !== 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    press.current = {id, from, x: event.clientX, y: event.clientY, dx: event.clientX - box.left, dy: event.clientY - box.top, width: box.width, moved: false};
  };
  const tap = (action: () => void) => () => { if (!suppressClick.current && !disabled) action(); };

  const placed = drag ? chosen.filter((id) => id !== drag.id) : chosen;
  const slot = <span key="slot" aria-hidden className="h-11 rounded-lg border-2 border-dashed border-primary bg-accent" style={{width: drag?.width}} />;
  const sentenceItems = placed.map((id) => (
    <button key={id} type="button" data-tile={id} disabled={disabled} onPointerDown={(event) => start(event, id, 'sentence')} onClick={tap(() => onChange(chosen.filter((value) => value !== id)))}
      className="touch-none rounded-lg border-2 border-primary/40 bg-accent px-3 py-2 font-semibold text-accent-foreground shadow-[0_2px_0_var(--primary-edge)] select-none hover:opacity-80">
      {text(id)}
    </button>
  ));
  if (drag?.over === 'sentence') sentenceItems.splice(drag.index, 0, slot);

  return (
    <>
      <div ref={sentence} className={cn('flex min-h-24 flex-wrap content-start items-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors',
        drag?.over === 'sentence' && 'border-primary bg-accent/40',
        state === 'right' && 'border-success bg-success-soft', state === 'wrong' && 'border-destructive bg-destructive-soft')} aria-label="Jouw zin" lang="nl">
        <span className="rounded-lg bg-secondary px-3 py-2 font-semibold text-secondary-foreground">{first}</span>
        {sentenceItems}
        {ending && <span className="text-xl font-bold text-muted-foreground">{ending}</span>}
      </div>
      <div ref={bank} className={cn('flex min-h-14 flex-wrap justify-center gap-2 rounded-2xl p-1 transition-colors', drag?.over === 'bank' && drag.from === 'sentence' && 'bg-muted')} lang="nl">
        {remaining.map((tile) => drag?.id === tile.id ? (
          <span key={tile.id} aria-hidden className="h-12 rounded-lg border-2 border-dashed border-border" style={{width: drag.width}} />
        ) : (
          <button key={tile.id} type="button" disabled={disabled} onPointerDown={(event) => start(event, tile.id, 'bank')} onClick={tap(() => onChange([...chosen, tile.id]))}
            className="touch-none rounded-lg border-2 bg-card px-4 py-2.5 text-lg font-semibold shadow-[0_3px_0_var(--border)] transition select-none hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0.5 active:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
            {tile.text}
          </button>
        ))}
      </div>
      {!disabled && <p className="text-center text-xs text-muted-foreground">Sleep een woord naar zijn plek, of tik erop.</p>}
      {drag && (
        <span aria-hidden className="pointer-events-none fixed z-50 rounded-lg border-2 border-primary bg-card px-4 py-2.5 text-lg font-bold shadow-xl" lang="nl"
          style={{left: drag.x - drag.dx, top: drag.y - drag.dy, transform: 'rotate(-3deg) scale(1.06)'}}>
          {text(drag.id)}
        </span>
      )}
    </>
  );
}
