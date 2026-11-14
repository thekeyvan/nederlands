import {Lock} from 'lucide-react';
import {cn} from '@/lib/utils';
import {stampFor} from '@/lib/illustrations';
import {stamps, type StampId} from '@/core/game.js';

export function Stamp({id, earned, className, showLabel = false}: {id: StampId; earned: boolean; className?: string; showLabel?: boolean}) {
  const stamp = stamps.find((item) => item.id === id)!;
  return (
    <figure className={cn('flex flex-col items-center gap-1.5 text-center', className)}>
      <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-[#fcfaf6]">
        <img src={stampFor(id)} alt="" className={cn('size-full object-cover transition', !earned && 'opacity-30 grayscale')} draggable={false} />
        {!earned && (
          <span className="absolute inset-0 grid place-items-center">
            <Lock className="size-4 text-slate-500" aria-hidden />
          </span>
        )}
      </span>
      <figcaption className={cn('text-[11px] leading-tight font-medium', showLabel ? '' : 'sr-only', earned ? 'text-foreground' : 'text-muted-foreground')}>
        {stamp.title}
        <span className="sr-only">{earned ? ', verdiend' : `, nog niet verdiend: ${stamp.description}`}</span>
      </figcaption>
    </figure>
  );
}
