import {cn} from '@/lib/utils';

/** A circular progress ring for the daily goal. */
export function GoalRing({value, max, className, children, trackClassName = 'stroke-white/15', barClassName = 'stroke-primary'}: {
  value: number; max: number; className?: string; children?: React.ReactNode; trackClassName?: string; barClassName?: string;
}) {
  const ratio = Math.min(1, max ? value / max : 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={cn('relative grid place-items-center', className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="10" className={trackClassName} />
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="10" strokeLinecap="round" className={cn('transition-[stroke-dashoffset] duration-700', barClassName)}
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
