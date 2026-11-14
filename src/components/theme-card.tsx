import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Stars} from '@/components/game/stars';
import {ThemeArt} from '@/components/game/theme-art';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {hrefFor, navigate} from '@/hooks/use-route';
import {themeStars} from '@/core/game.js';
import {themeStats} from '@/core/learning-model.js';
import {vocabulary} from '@/core/learning-data.js';
import {phrases} from '@/core/phrase-data.js';
import type {Review, Theme} from '@/core/types';

const counts = new Map<string, string>();
const countLabel = (id: string) => {
  if (!counts.has(id)) counts.set(id, `${vocabulary.filter((card) => card.themeId === id).length} woorden · ${phrases.filter((card) => card.themeId === id).length} zinnen`);
  return counts.get(id)!;
};

export function ThemeCard({theme, reviews, compact = false, className}: {theme: Theme; reviews: Record<string, Review>; compact?: boolean; className?: string}) {
  const stats = themeStats(theme.id, reviews);
  const stars = themeStars(stats);
  return (
    <a href={hrefFor('woorden', {theme: theme.id})}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate('woorden', {theme: theme.id});
      }}
      className={cn('group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-[0_4px_0_var(--border)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--border)] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none', className)}>
      <ThemeArt theme={theme} className={cn('w-full', compact ? 'aspect-[4/3]' : 'aspect-[16/10]')} />
      <div className={cn('flex flex-1 flex-col gap-1.5', compact ? 'p-3' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn('font-bold leading-tight', compact ? 'text-sm' : 'text-base')}>{theme.title}</h3>
          {stats.done ? <Stars count={stars} className="mt-0.5 shrink-0" /> : <Badge variant="streak" className="shrink-0 text-[10px]">Nieuw</Badge>}
        </div>
        {!compact && <Translation className="text-sm text-muted-foreground">{theme.meaning}</Translation>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <span>{compact ? `${stats.done}/${stats.total}` : countLabel(theme.id)}</span>
        </div>
        {stats.done > 0 && <Progress value={(stats.done / stats.total) * 100} className="h-1.5" aria-label={`${stats.done} van ${stats.total} geoefend`} />}
      </div>
    </a>
  );
}
