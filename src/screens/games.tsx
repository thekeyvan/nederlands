import {useState} from 'react';
import {ArrowRight, Gamepad2, Play, Trophy} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Mascot} from '@/components/game/mascot';
import {Page, PageHeader} from '@/components/page';
import {cn} from '@/lib/utils';
import {hrefFor, navigate} from '@/hooks/use-route';
import {useGameRecords} from '@/hooks/use-game-records';
import {themes} from '@/core/learning-data.js';
import {gameInfo, games, type GameId, type GameInfo} from '@/games/registry';
import {ArticleGame, RaceGame} from '@/games/timed';
import {ClozeGame, VerbGame} from '@/games/questions';
import {BuilderGame, ConversationGame, DictationGame} from '@/games/language';

const components: Record<GameId, (props: {game: GameInfo; theme: string; onAgain: () => void}) => React.ReactNode> = {
  lidwoord: ArticleGame, tijdrace: RaceGame, werkwoorden: VerbGame, aanvullen: ClozeGame, zinsbouwer: BuilderGame, dictee: DictationGame, gesprek: ConversationGame,
};

export function GamesScreen({game, theme}: {game: string | null; theme: string | null}) {
  const info = gameInfo(game);
  const themeId = theme && themes.some((item) => item.id === theme) ? theme : 'all';
  const [round, setRound] = useState(0);
  if (info) {
    const Game = components[info.id];
    return <Game key={`${info.id}:${themeId}:${round}`} game={info} theme={themeId} onAgain={() => setRound(round + 1)} />;
  }
  return <GamesHub theme={themeId} />;
}

function GamesHub({theme}: {theme: string}) {
  const {records} = useGameRecords();
  const played = Object.values(records).reduce((sum, record) => sum + record.played, 0);
  const open = (id: GameId) => navigate('spellen', {game: id, theme: theme === 'all' ? null : theme});
  return (
    <Page wide>
      <PageHeader eyebrow="Leren door te spelen" title="Spellen." description="Woorden, zinnen, zinsbouw, grammatica, luisteren en gesprekken. Kies een spel en verbeter je record."
        action={<div className="flex items-center gap-3"><Mascot mood="cheer" className="size-16" /><Badge variant="xp" className="h-8 px-3 text-sm"><Gamepad2 />{played} keer gespeeld</Badge></div>} />
      <div className="mb-6 flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="games-theme">Speel met woorden uit</Label>
        <Select value={theme} onValueChange={(value) => navigate('spellen', {theme: value === 'all' ? null : value, replace: true})}>
          <SelectTrigger id="games-theme" className="w-full bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle thema’s</SelectItem>
            {themes.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Heeft een thema te weinig woorden voor een spel, dan speel je met alles.</p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => {
          const record = records[game.id];
          return (
            <li key={game.id}>
              <a href={hrefFor('spellen', {game: game.id, theme: theme === 'all' ? undefined : theme})}
                onClick={(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); open(game.id); }}
                className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-[0_4px_0_var(--border)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--border)] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                <div className="relative">
                  <img src={game.image} alt="" className="aspect-[16/9] w-full object-cover" draggable={false} loading="lazy" />
                  <Badge className={cn('absolute top-3 left-3 shadow-sm', game.tint)}>{game.skill}</Badge>
                  {record && <Badge variant="xp" className="absolute top-3 right-3 shadow-sm"><Trophy />{record.best}</Badge>}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <h2 className="text-lg font-bold">{game.title}</h2>
                  <p className="text-sm text-muted-foreground">{game.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xs text-muted-foreground">{game.length}{record ? ` · ${record.played}× gespeeld` : ''}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><Play className="size-4 fill-current" />Speel<ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">Spellen veranderen je herhaalplanning niet en tellen niet mee voor XP. Je records blijven in deze browser. Na een spel kun je je fouten in een gewoon oefenrondje zetten.</p>
      <div className="mt-4"><Button variant="outline" onClick={() => navigate('oefenen')}>Liever slim herhalen?<ArrowRight /></Button></div>
    </Page>
  );
}
