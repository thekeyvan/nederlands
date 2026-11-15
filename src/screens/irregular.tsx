import {ArrowRight, Check, RotateCcw} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {Group, GroupLabel, Row} from '@/components/app/list';
import {Stars} from '@/components/game/stars';
import {Page} from '@/components/page';
import {Translation} from '@/components/translation';
import {usePractice} from '@/hooks/use-practice';
import {useProgress} from '@/hooks/use-progress';
import {navigate} from '@/hooks/use-route';
import {irregularCards, irregularIntro, irregularProgress, irregularSet, irregularSets, type IrregularSet} from '@/core/irregular.js';
import {mascotPose} from '@/lib/illustrations';
import {cn} from '@/lib/utils';

export const irregularRule = 'onregelmatig';
export const setRule = (id: string) => `${irregularRule}:${id}`;

/** Onregelmatig, under Leren › Grammatica: the overview, or one set. */
export function IrregularScreen({rule}: {rule: string}) {
  const set = rule.startsWith(`${irregularRule}:`) ? irregularSet(rule.slice(irregularRule.length + 1)) : null;
  return set ? <SetScreen set={set} /> : <Overview />;
}

const known = (reviews: ReturnType<typeof useProgress>['reviews'], id: string) => (reviews[id]?.repetitions ?? 0) >= 3 && reviews[id].grade >= 3;

/** The card at the top of Grammatica that opens Onregelmatig. */
export function IrregularBanner() {
  const {reviews} = useProgress();
  const done = irregularCards.filter((card) => known(reviews, card.id)).length;
  return (
    <button type="button" onClick={() => navigate('zinnen', {rule: irregularRule})}
      className="mb-3 flex w-full items-center gap-4 rounded-2xl border-2 border-xp/40 bg-xp-soft p-3 text-left text-xp-foreground shadow-[0_4px_0_var(--xp)] transition active:translate-y-1 active:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:max-w-3xl">
      <img src={mascotPose('think')} alt="" className="size-20 shrink-0 object-contain" draggable={false} />
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold">Onregelmatig</span>
        <span className="block text-sm font-medium opacity-85">Sterke werkwoorden, meervouden en meer: leer ze als rijtje.</span>
        <span className="mt-1 block text-xs font-semibold opacity-75 tabular-nums">{done ? `${done} van ${irregularCards.length} vormen gekend` : `${irregularSets.length} sets · ${irregularCards.length} vormen`}</span>
      </span>
      <ArrowRight className="size-5 shrink-0" aria-hidden />
    </button>
  );
}

function Overview() {
  const {reviews} = useProgress();
  const {start} = usePractice();
  const total = irregularCards.length;
  const done = irregularCards.filter((card) => known(reviews, card.id)).length;
  const due = irregularCards.filter((card) => reviews[card.id] && new Date(reviews[card.id].due) <= new Date()).length;
  const practised = irregularCards.some((card) => reviews[card.id]);
  // The first set you have not finished yet: where a new learner (or a returning one) carries on.
  const next = irregularSets.find((set) => irregularProgress(set, reviews).stars < 2) ?? irregularSets[0];
  return (
    <Page className="max-w-3xl pb-32 lg:pb-10">
      <div className="flex items-center gap-4">
        <img src={mascotPose('think')} alt="" className="size-24 shrink-0 object-contain" draggable={false} />
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Onregelmatig</h1>
          <p className="mt-1 text-sm text-muted-foreground">Wat je uit je hoofd leert. Eerst kies je, daarna typ je. Wat je fout had, komt terug.</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-bold">Gekend</p>
          <p className="text-sm font-semibold text-muted-foreground tabular-nums">{done} / {total}</p>
        </div>
        <Progress value={(done / total) * 100} className="mt-2 h-3 bg-xp/15" indicatorClassName="bg-xp" aria-label={`${done} van ${total} vormen gekend`} />
        <Translation className="mt-3 text-sm text-muted-foreground">{irregularIntro}</Translation>
      </div>
      {irregularSets.some((set) => set.group === 'werkwoorden') && <GroupLabel>Sterke werkwoorden</GroupLabel>}
      <SetList sets={irregularSets.filter((set) => set.group === 'werkwoorden')} />
      <GroupLabel>Ook onregelmatig</GroupLabel>
      <SetList sets={irregularSets.filter((set) => set.group === 'meer')} />
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-20 border-t bg-background/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
        {due > 0 ? (
          <Button size="xl" game className="w-full lg:w-auto" onClick={() => start({irregular: 'all', label: 'Onregelmatig'})}>
            <RotateCcw />Herhaal<Badge className="ml-1 bg-white/20 text-white">{Math.min(due, 10)}</Badge>
          </Button>
        ) : (
          <Button size="xl" game className="w-full lg:w-auto" onClick={() => start({irregular: next.id, label: next.title})}>
            {practised ? 'Ga verder' : 'Begin'}: {next.title}<ArrowRight />
          </Button>
        )}
      </div>
    </Page>
  );
}

function SetList({sets}: {sets: IrregularSet[]}) {
  const {reviews} = useProgress();
  return (
    <Group>
      {sets.map((set) => {
        const progress = irregularProgress(set, reviews);
        return (
          <Row key={set.id} onClick={() => navigate('zinnen', {rule: setRule(set.id)})} title={<span lang="nl">{set.title}</span>} detail={<span lang="nl">{set.pattern}</span>}
            leading={<Badge variant="outline" className="w-9 shrink-0 justify-center">{set.level}</Badge>}
            trailing={progress.done ? (
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <Stars count={progress.stars} />
                <span className="text-[11px] text-muted-foreground tabular-nums">{progress.due ? `${progress.due} te herhalen` : `${progress.known}/${progress.total}`}</span>
              </span>
            ) : <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{progress.total} vormen</span>} />
        );
      })}
    </Group>
  );
}

/** One set: the pattern, the rows to read through, and a round of ten. */
function SetScreen({set}: {set: IrregularSet}) {
  const {reviews} = useProgress();
  const {start} = usePractice();
  const progress = irregularProgress(set, reviews);
  const verb = set.kind === 'verb';
  const headers = verb ? ['werkwoord', 'verleden tijd', 'voltooid'] : set.kind === 'compare' ? ['', 'meer', 'meest'] : set.kind === 'plural' ? ['één', 'meer'] : ['', 'zo zeg je het'];
  const fresh = progress.total - progress.done;
  return (
    <Page className="max-w-3xl pb-32 lg:pb-10">
      <Badge variant="outline">{set.level}</Badge>
      <h1 className="mt-2 text-[26px] leading-tight font-extrabold tracking-tight sm:text-3xl" lang="nl">{set.title}</h1>
      <p className="mt-3 rounded-lg bg-muted px-3 py-2.5 font-mono text-[13px]" lang="nl">{set.pattern}</p>
      <Translation className="mt-3 text-[15px] text-muted-foreground">{set.rule}</Translation>
      <div className="mt-4 flex items-center gap-3 rounded-xl border bg-card p-3">
        <Stars count={progress.stars} className="[&_svg]:size-5" />
        <p className="text-sm font-semibold tabular-nums">{progress.known} van {progress.total} gekend</p>
        {progress.due > 0 && <Badge variant="xp" className="ml-auto">{progress.due} te herhalen</Badge>}
      </div>
      {verb && <p className="mt-4 px-1 text-xs text-muted-foreground">Verleden tijd en voltooid met <span lang="nl">hij</span>: hij <span lang="nl">bleef</span>, hij <span lang="nl">is gebleven</span>.</p>}
      <div className="mt-2 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-left text-[15px]" lang="nl">
          <thead>
            <tr className="border-b text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {headers.map((header, index) => <th key={index} scope="col" className="px-3 py-2 font-semibold">{header}</th>)}
              <th className="w-8 px-2"><span className="sr-only">Gekend</span></th>
            </tr>
          </thead>
          <tbody>
            {set.rows.map((row) => {
              const cards = set.cards.filter((card) => card.title === row.cells[0] && (set.kind !== 'present' || card.prompt?.replace('___', card.answer!) === row.cells[1]));
              const all = cards.length > 0 && cards.every((card) => known(reviews, card.id));
              return (
                <tr key={row.id} className="border-b last:border-b-0 align-top">
                  {row.cells.map((cell, index) => (
                    <td key={index} className={cn('px-3 py-2.5', index === 0 ? 'font-semibold' : 'font-medium')}>
                      {cell}
                      {index === 0 && <Translation className="mt-0.5 text-xs font-normal text-muted-foreground">{row.fa}</Translation>}
                    </td>
                  ))}
                  <td className="px-2 py-3">{all && <Check className="size-4 text-success-foreground" aria-label="Gekend" />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-20 border-t bg-background/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
        <Button size="xl" game className="w-full lg:w-auto" onClick={() => start({irregular: set.id, label: set.title})}>
          {progress.due ? 'Herhaal' : fresh ? 'Oefen' : 'Nog een keer'}<Badge className="ml-1 bg-white/20 text-white">{Math.min(10, progress.total)}</Badge>
        </Button>
      </div>
    </Page>
  );
}
