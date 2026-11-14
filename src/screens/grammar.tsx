import {useEffect, useState} from 'react';
import {ArrowRight, Search} from 'lucide-react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Mascot} from '@/components/game/mascot';
import {ListenButton} from '@/components/listen-button';
import {Page, PageHeader} from '@/components/page';
import {Translation} from '@/components/translation';
import {sceneFor} from '@/lib/illustrations';
import {progressStatus} from '@/core/srs.js';
import {usePractice} from '@/hooks/use-practice';
import {useProgress} from '@/hooks/use-progress';
import {sentences} from '@/core/sentence-data.js';

export function GrammarScreen({rule}: {rule: string | null}) {
  const {practice, start} = usePractice();
  const {reviews} = useProgress();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string[]>(rule ? [rule] : []);
  useEffect(() => {
    if (!rule || !sentences.some((card) => card.id === rule)) return;
    setQuery('');
    setOpen((current) => (current.includes(rule) ? current : [...current, rule]));
    requestAnimationFrame(() => document.getElementById(`rule-${rule}`)?.scrollIntoView({block: 'start', behavior: 'smooth'}));
  }, [rule]);
  const needle = query.trim().toLocaleLowerCase('nl');
  const visible = sentences.filter((card) => `${card.title} ${card.pattern} ${card.example} ${card.rule} ${card.note}`.toLocaleLowerCase('nl').includes(needle));
  const known = sentences.filter((card) => progressStatus(reviews[card.id]) === 'known').length;
  return (
    <Page>
      <PageHeader eyebrow="Zo valt alles op z’n plek" title="Een beetje zinsbouw." description="Een helder patroon. Een gewone zin. En dan zelf proberen."
        action={<img src={sceneFor('zinsbouw')} alt="" className="hidden size-28 rounded-2xl border object-cover sm:block" />} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:w-96">
          <span className="sr-only">Zoek zinsbouw</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek bijvoorbeeld omdat of verleden tijd" className="h-11 bg-card pl-9" dir="auto" />
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">{known}/{sentences.length} goed onthouden</span>
          <Button game onClick={() => start({theme: 'zinsbouw', type: 'zinnen', label: 'Zinsbouw'})}>Oefen zinsbouw<ArrowRight /></Button>
        </div>
      </div>
      {visible.length ? (
        <Accordion type="multiple" value={open} onValueChange={setOpen} className="flex flex-col gap-2.5">
          {visible.map((card) => (
            <AccordionItem key={card.id} value={card.id} id={`rule-${card.id}`} className="scroll-mt-20 rounded-xl border bg-card px-4 last:border-b">
              <AccordionTrigger className="items-center gap-3 hover:no-underline">
                <span className="flex min-w-0 items-center gap-3">
                  <Badge variant="outline" className="shrink-0">{card.level}</Badge>
                  <span className="font-semibold">{card.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-3">
                <Translation className="text-muted-foreground">{card.rule}</Translation>
                <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm">{card.pattern}</p>
                <blockquote className="flex items-start justify-between gap-2 border-l-4 border-primary pl-3 text-lg font-medium" lang="nl">
                  {card.example}
                  <ListenButton text={card.example!} />
                </blockquote>
                <Translation className="text-sm text-muted-foreground">{card.translation}</Translation>
                <Translation className="rounded-md bg-xp-soft px-3 py-2 text-sm text-xp-foreground">{card.note}</Translation>
                <Button variant="outline" className="self-start" onClick={() => practice({...card, themeId: 'zinsbouw'})}>Probeer deze zin<ArrowRight /></Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Mascot mood="think" className="size-20" />
          <p className="font-semibold">Geen patroon gevonden. Probeer een ander woord.</p>
        </div>
      )}
    </Page>
  );
}
