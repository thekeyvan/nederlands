import {useMemo} from 'react';

const colors = ['var(--primary)', 'var(--success)', 'var(--xp)', 'var(--destructive)', 'var(--info)', 'var(--secondary)'];

/** A one-shot confetti burst. Purely decorative and skipped with reduced motion. */
export function Confetti({pieces = 36}: {pieces?: number}) {
  const items = useMemo(
    () => Array.from({length: pieces}, (_, index) => {
      const angle = (index / pieces) * Math.PI * 2;
      const distance = 90 + ((index * 37) % 110);
      return {
        color: colors[index % colors.length],
        style: {
          '--dx': `${Math.cos(angle) * distance}px`,
          '--dy': `${Math.sin(angle) * distance - 40}px`,
          '--rot': `${(index * 47) % 360}deg`,
          animationDelay: `${(index % 6) * 30}ms`,
        } as React.CSSProperties,
        round: index % 3 === 0,
      };
    }),
    [pieces],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 motion-reduce:hidden">
      {items.map((item, index) => (
        <span key={index} className={`animate-confetti absolute block ${item.round ? 'size-2 rounded-full' : 'h-3 w-1.5 rounded-sm'}`} style={{...item.style, background: item.color}} />
      ))}
    </div>
  );
}
