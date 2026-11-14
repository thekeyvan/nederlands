import {cn} from '@/lib/utils';
import {mascotFor, type MascotMood} from '@/lib/illustrations';

/** The mascot sits on a cream "sticker" so it reads on light and dark backgrounds alike. */
export function Mascot({mood = 'wave', className, label}: {mood?: MascotMood; className?: string; label?: string}) {
  return (
    <span className={cn('inline-block shrink-0 overflow-hidden rounded-full bg-[#fcfaf6] ring-1 ring-black/5', className)}>
      <img src={mascotFor(mood)} alt={label ?? ''} className="size-full object-cover" draggable={false} />
    </span>
  );
}
