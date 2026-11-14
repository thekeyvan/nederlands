import {Star} from 'lucide-react';
import {cn} from '@/lib/utils';

export function Stars({count, className}: {count: number; className?: string}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${count} van 3 sterren`}>
      {[0, 1, 2].map((index) => (
        <Star key={index} className={cn('size-3.5', index < count ? 'fill-xp text-xp' : 'text-border')} aria-hidden />
      ))}
    </span>
  );
}
