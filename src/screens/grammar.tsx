import {useState} from 'react';
import {ArrowRight, Check, Search} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Mascot} from '@/components/game/mascot';
import {ListenButton} from '@/components/listen-button';
import {Group, Row, ScreenTitle} from '@/components/app/list';
import {LearnTabs} from '@/components/app/learn-tabs';
import {Page} from '@/components/page';
import {Translation} from '@/components/translation';
import {progressStatus} from '@/core/srs.js';
import {usePractice} from '@/hooks/use-practice';
import {useProgress} from '@/hooks/use-progress';
import {navigate} from '@/hooks/use-route';
import {sentences} from '@/core/sentence-data.js';
import {examplesFor} from '@/core/grammar-examples.js';
import {audioUrl} from '@/core/audio-playback.js';
import {patternDrill} from '@/lib/drill';
import type {Card} from '@/core/types';

export function GrammarScreen({rule}: {rule: string | null}) {
  const card = rule ? sentences.find((item) => item.id === rule) : undefined;
  return card ? <PatternScreen card={card} /> : <PatternList />;
}

function PatternList() {
  const {reviews} = useProgress();
  const {start} = usePractice();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('nl');
  const visible = sentences.filter((card) => `${card.title} ${card.pattern} ${card.example}`.toLocaleLowerCase('nl').includes(needle));
  return (
    <Page>
      <ScreenTitle title="Leren" />
      <LearnTabs active="zinnen" />
      <div className="mb-3 flex gap-2 sm:max-w-3xl">
        <label className="relative block flex-1">
          <span className="sr-only">Zoek zinsbouw</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek bijvoorbeeld omdat" className="h-10 border-0 bg-muted pl-9 text-[15px]" dir="auto" />
        </label>
        <Button className="h-10" onClick={() => start({theme: 'zinsbouw', type: 'zinnen', label: 'Zinsbouw'})}>Mix<ArrowRight /></Button>
      </div>
      {visible.length ? (
        <Group className="max-w-3xl">
          {visible.map((card) => {
            const known = progressStatus(reviews[card.id]) === 'known';
            return (
              <Row key={card.id} onClick={() => navigate('zinnen', {rule: card.id})} title={card.title} detail={card.pattern}
                leading={<Badge variant="outline" className="w-9 shrink-0 justify-center">{card.level}</Badge>}
                trailing={known ? <Check className="size-4 text-success-foreground" aria-label="Goed onthouden" /> : undefined} />
            );
          })}
        </Group>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Mascot mood="think" className="size-20" />
          <p className="font-semibold">Geen patroon gevonden.</p>
        </div>
      )}
    </Page>
  );
}

/** One pattern: the rule, four example sentences, and a round of six exercises. */
function PatternScreen({card}: {card: Card}) {
  const {start} = usePractice();
  const drill = patternDrill({...card, themeId: 'zinsbouw'});
  const examples = [{nl: card.example!, gap: card.answer ?? '', translation: card.translation ?? ''}, ...examplesFor(card.id)];
  return (
    <Page className="max-w-2xl pb-32 lg:pb-10">
      <Badge variant="outline">{card.level}</Badge>
      <h1 className="mt-2 text-[26px] leading-tight font-extrabold tracking-tight sm:text-3xl">{card.title}</h1>
      <p className="mt-3 rounded-lg bg-muted px-3 py-2.5 font-mono text-[13px]">{card.pattern}</p>
      <Group className="mt-4">
        {examples.map((example) => (
          <li key={example.nl} className="flex items-start gap-2 border-b px-3.5 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium" lang="nl"><Highlighted sentence={example.nl} word={example.gap} /></p>
              {example.translation && <Translation className="mt-0.5 text-sm text-muted-foreground">{example.translation}</Translation>}
            </div>
            {audioUrl(example.nl, 'ronnie') && <ListenButton text={example.nl} className="-mt-1 shrink-0" />}
          </li>
        ))}
      </Group>
      <Translation className="mt-4 text-[15px] text-muted-foreground">{card.rule}</Translation>
      {card.note && <Translation className="mt-3 rounded-lg bg-xp-soft px-3 py-2 text-sm text-xp-foreground">{card.note}</Translation>}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-20 border-t bg-background/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
        <Button size="xl" game className="w-full lg:w-auto" onClick={() => start({queue: drill, drill: true, label: card.title})}>
          Oefen dit patroon<Badge className="ml-1 bg-white/20 text-white">{drill.length}</Badge>
        </Button>
      </div>
    </Page>
  );
}

/** The sentence with the practised word in the accent colour. */
function Highlighted({sentence, word}: {sentence: string; word: string}) {
  if (!word) return <>{sentence}</>;
  const parts = sentence.split(new RegExp(`(^|[^\\p{L}])(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^\\p{L}]|$)`, 'u'));
  if (parts.length < 4) return <>{sentence}</>;
  return <>{parts[0]}{parts[1]}<strong className="text-primary">{parts[2]}</strong>{parts.slice(3).join('')}</>;
}
