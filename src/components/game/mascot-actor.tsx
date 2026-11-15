import {Sparkle, Star} from 'lucide-react';
import type {CSSProperties} from 'react';
import {cn} from '@/lib/utils';
import {mascotPose, type MascotPose} from '@/lib/illustrations';

/**
 * The cut-out mascot, standing on a soft shadow. Only the character moves, never a picture frame,
 * and only once: `moment` plays when it appears (a right or wrong answer, a combo, a finished round,
 * the first visit). Without a moment it stands still. Same moments as MascotActor in the iPhone app.
 */
export type MascotMoment = 'hop' | 'double' | 'nope' | 'greet';

export function MascotActor({pose, moment, stars = false, delay = 0, className, label}: {
  pose: MascotPose; moment?: MascotMoment; stars?: boolean; delay?: number; className?: string; label?: string;
}) {
  const timing = {animationDelay: `${delay}ms`} as CSSProperties;
  const jumps = moment === 'hop' || moment === 'double';
  return (
    <span className={cn('relative inline-block shrink-0', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span className={cn('mascot-shadow absolute bottom-[4%] left-1/2 -ml-[26%] h-[7.5%] w-[52%] rounded-[50%] bg-black/20 blur-[3px] dark:bg-black/45', jumps && moment)} style={timing} />
      <img src={mascotPose(pose)} alt="" draggable={false}
        className={cn('mascot-body relative size-full object-contain select-none', moment, pose === 'think' && 'translate-y-[5%] scale-[1.14]')} style={timing} />
      {stars && (
        <span className="pointer-events-none absolute inset-0">
          {Array.from({length: 9}, (_, index) => {
            const angle = (index / 9) * Math.PI * 2 - Math.PI / 2;
            const radius = 92 + (index % 3) * 16;
            const Icon = index % 2 ? Sparkle : Star;
            return (
              <Icon key={index} aria-hidden
                className={cn('mascot-star absolute top-[35%] left-1/2 -m-2 size-4 fill-current', index % 3 === 0 ? 'text-success' : 'text-xp')}
                style={{'--x': `${Math.cos(angle) * radius}px`, '--y': `${Math.sin(angle) * radius - 24}px`, animationDelay: `${delay + 520 + (index % 3) * 40}ms`} as CSSProperties} />
            );
          })}
        </span>
      )}
    </span>
  );
}
