import {Bike, Check, Flame, MessageCircle, RotateCcw, Sparkles, Star} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Stamp} from '@/components/game/stamp';
import {cn} from '@/lib/utils';
import {plural} from '@/lib/text';
import {dailyMissions, stamps, type GameStats} from '@/core/game.js';
import type {ReviewEvent} from '@/core/types';

type Week = {date: Date; label: string; count: number}[];

export function StreakCard({stats, week, className}: {stats: GameStats; week: Week; className?: string}) {
  const {count, today, atRisk} = stats.streak;
  const message = count === 0
    ? 'Oefen vandaag één kaartje en je reeks begint.'
    : atRisk
      ? 'Oefen vandaag om je reeks vast te houden.'
      : today && count === 6
        ? 'Morgen 7: dan krijg je een stempel!'
        : 'Lekker bezig. Tot morgen!';
  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className="flex items-center justify-between px-4">
        <CardTitle className="text-sm">Jouw reeks</CardTitle>
        <Badge variant="streak"><Flame />{count}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-center gap-3">
          <span className={cn('text-4xl font-extrabold tabular-nums', count ? 'text-primary' : 'text-muted-foreground')}>{count}</span>
          <p className="text-xs leading-snug text-muted-foreground"><span className="font-medium text-foreground">{count === 1 ? 'dag' : 'dagen'} op rij.</span><br />{message}</p>
        </div>
        <ol className="flex justify-between" aria-label="Geoefend in de laatste 7 dagen">
          {week.map((day, index) => {
            const isToday = index === week.length - 1;
            return (
              <li key={day.label + index} className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <span className={cn('grid size-7 place-items-center rounded-full', day.count ? 'bg-primary text-primary-foreground' : isToday ? 'border-2 border-dashed border-primary' : 'bg-muted')}>
                  {day.count > 0 && <Check className="size-3.5" aria-hidden />}
                </span>
                <span>{day.label.replace('.', '')}</span>
                <span className="sr-only">{day.count ? `${day.count} kaartjes` : 'niet geoefend'}</span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export function LevelCard({stats, className}: {stats: GameStats; className?: string}) {
  const {level, xp} = stats;
  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className="flex items-center justify-between px-4">
        <CardTitle className="text-sm">Niveau {level.number}</CardTitle>
        <Badge variant="xp"><Star />{xp} XP</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold">{level.name}</span>
          {level.next && <span className="text-xs text-muted-foreground tabular-nums">{xp} / {level.next.xp}</span>}
        </div>
        <Progress value={level.progress * 100} className="h-2.5 bg-xp/25" indicatorClassName="bg-xp" aria-label={`Voortgang naar ${level.next?.name ?? 'het hoogste niveau'}`} />
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {level.next ? <>Nog {level.toNext} XP tot <strong className="text-foreground">{level.next.name}</strong><Bike className="size-3.5" aria-hidden /></> : 'Je hebt het hoogste niveau. Knap!'}
        </p>
      </CardContent>
    </Card>
  );
}

const missionIcons = {rotate: RotateCcw, sparkles: Sparkles, message: MessageCircle};
const missionTints = {rotate: 'bg-info-soft text-info-foreground', sparkles: 'bg-accent text-accent-foreground', message: 'bg-lavender text-lavender-foreground'};

export function MissionsCard({events, className}: {events: ReviewEvent[]; className?: string}) {
  const missions = dailyMissions(events);
  const done = missions.filter((mission) => mission.done).length;
  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className="flex items-center justify-between px-4">
        <CardTitle className="text-sm">Missies van vandaag</CardTitle>
        <span className="text-xs text-muted-foreground tabular-nums">{done} / {missions.length}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        {missions.map((mission) => {
          const Icon = mission.done ? Check : missionIcons[mission.icon];
          return (
            <div key={mission.id} className="flex items-center gap-3">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', mission.done ? 'bg-success text-white' : missionTints[mission.icon])}><Icon className="size-4" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', mission.done && 'text-muted-foreground line-through decoration-success/60')}>{mission.title}</p>
                <Progress value={(mission.count / mission.target) * 100} className="mt-1.5 h-1.5" indicatorClassName={mission.done ? 'bg-success' : undefined} aria-label={`${mission.title}: ${mission.count} van ${mission.target}`} />
              </div>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">{mission.count}/{mission.target}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function StampsCard({stats, className, labels = false}: {stats: GameStats; className?: string; labels?: boolean}) {
  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className="flex items-center justify-between px-4">
        <CardTitle className="text-sm">Stempelkaart</CardTitle>
        <span className="text-xs text-muted-foreground tabular-nums">{plural(stats.earned.length, 'stempel', 'stempels')} van {stamps.length}</span>
      </CardHeader>
      <CardContent className={cn('grid grid-cols-3 px-4', labels ? 'gap-x-3 gap-y-4' : 'gap-2')}>
        {stamps.map((stamp) => (
          <Stamp key={stamp.id} id={stamp.id} earned={stats.earned.includes(stamp.id)} showLabel={labels} />
        ))}
      </CardContent>
    </Card>
  );
}
