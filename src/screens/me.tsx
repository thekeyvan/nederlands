import {useState} from 'react';
import {ChevronRight, Flame, Laptop, Moon, Settings, Shield, Sun, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {LevelCard, MissionsCard, StampsCard, StreakCard} from '@/components/game/cards';
import {Mascot} from '@/components/game/mascot';
import {sceneFor} from '@/lib/illustrations';
import {Stars} from '@/components/game/stars';
import {ThemeArt} from '@/components/game/theme-art';
import {Avatar} from '@/components/app/account-chip';
import {Group, GroupLabel, Row, RowIcon, ScreenTitle} from '@/components/app/list';
import {openSignIn, useCanSignIn} from '@/components/app/sign-in';
import {AppCard} from '@/components/pwa';
import {Page} from '@/components/page';
import {useAudio} from '@/hooks/use-audio';
import {syncMessages, useCloud} from '@/hooks/use-cloud';
import {useGame} from '@/hooks/use-progress';
import {usePreferences} from '@/hooks/use-preferences';
import {navigate} from '@/hooks/use-route';
import {useTheme, type ThemePreference} from '@/hooks/use-theme';
import {deleteAccount, forgetDevice, signOut} from '@/core/cloud.js';
import {dailyGoals} from '@/core/state.js';
import {chooseLocale, locale, locales} from '@/core/i18n.js';

export function MeScreen() {
  const game = useGame();
  const cloud = useCloud();
  const canSignIn = useCanSignIn();
  const week = game.activity.week;
  const themeRows = game.themes.filter((item) => item.stats.done > 0);
  return (
    <Page>
      <ScreenTitle title="Ik" action={
        <Button variant="secondary" size="icon" className="rounded-full bg-muted text-foreground hover:bg-muted/70" onClick={() => navigate('instellingen')} aria-label="Instellingen"><Settings className="size-5" /></Button>
      } />
      <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          {cloud.user ? (
            <Group><Row leading={<Avatar name={cloud.user.name} className="size-11 text-base" />} title={cloud.user.name || 'Mijn account'} detail={syncMessages[cloud.status]} /></Group>
          ) : canSignIn && cloud.status !== 'starting' ? (
            <Group><Row onClick={openSignIn} leading={<Mascot mood="wave" className="size-12" />} title="Inloggen" detail="Ga verder op je telefoon en de website" /></Group>
          ) : null}
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border bg-card py-3"><dd className="flex items-center justify-center gap-1 text-2xl font-extrabold text-primary tabular-nums"><Flame className="size-5" />{game.streak.count}</dd><dt className="text-xs text-muted-foreground">{game.streak.count === 1 ? 'dag' : 'dagen'} op rij</dt></div>
            <div className="rounded-xl border bg-card py-3"><dd className="text-2xl font-extrabold text-xp-foreground tabular-nums">{game.xp}</dd><dt className="text-xs text-muted-foreground">XP</dt></div>
            <div className="rounded-xl border bg-card py-3"><dd className="text-2xl font-extrabold tabular-nums">{game.knownCards}</dd><dt className="text-xs text-muted-foreground">onthouden</dt></div>
          </dl>
          <div className="flex items-center gap-3"><Mascot mood={game.streak.today ? 'cheer' : 'wave'} className="size-20 shrink-0" /><LevelCard stats={game} className="flex-1" /></div>
          <StreakCard stats={game} week={week} />
        </div>
        <div className="flex flex-col gap-4">
          <MissionsCard events={game.progress.events} />
          <StampsCard stats={game} labels />
          {themeRows.length > 0 && (
            <div>
              <GroupLabel className="mt-0">Jouw thema’s</GroupLabel>
              <Group>
                {themeRows.map(({theme, stats, stars}) => (
                  <Row key={theme.id} onClick={() => navigate('woorden', {theme: theme.id})} leading={<ThemeArt theme={theme} className="size-10 shrink-0 rounded-lg" />}
                    title={theme.title} detail={`${stats.done} van ${stats.total} geoefend · ${stats.known} onthouden`} trailing={<Stars count={stars} className="[&_svg]:size-3.5" />} />
                ))}
              </Group>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

/** Instellingen, opened with the gear on Ik: grouped rows like the iPhone's own Settings. */
export function SettingsScreen() {
  const cloud = useCloud();
  const canSignIn = useCanSignIn();
  const [preferences, update] = usePreferences();
  const audio = useAudio();
  const {preference, setPreference} = useTheme();
  const packs = Object.values(locales);
  const provider = cloud.user?.provider === 'apple' ? 'Apple' : 'Google';
  return (
    <Page className="max-w-2xl">
      <h1 className="mb-2 text-[28px] font-extrabold tracking-tight">Instellingen</h1>
      <GroupLabel>Oefenen</GroupLabel>
      <Group>
        <li className="flex flex-col gap-2 border-b px-3.5 py-3">
          <span className="text-[15px] font-medium">Dagdoel</span>
          <ToggleGroup type="single" variant="outline" value={String(preferences.goal)} onValueChange={(value) => value && update((current) => ({...current, goal: Number(value)}))} className="w-full">
            {dailyGoals.map((goal) => <ToggleGroupItem key={goal} value={String(goal)} className="flex-1">{goal} kaartjes</ToggleGroupItem>)}
          </ToggleGroup>
        </li>
        <Row onClick={() => audio.setSettingsOpen(true)} title="Stem en snelheid" titleClassName="font-medium" trailing={<span className="text-sm text-muted-foreground">{audio.voiceName} · {String(audio.speed).replace('.', ',')}×</span>} />
        {packs.length > 1 && (
          <li className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <Label htmlFor="translation-language" className="text-[15px] font-medium">Vertaling</Label>
            <Select value={locale.code} onValueChange={chooseLocale}>
              <SelectTrigger id="translation-language" className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{packs.map((pack) => <SelectItem key={pack.code} value={pack.code}>{pack.name}</SelectItem>)}</SelectContent>
            </Select>
          </li>
        )}
      </Group>
      <GroupLabel>Weergave</GroupLabel>
      <Group className="p-1.5">
        <li>
          <ToggleGroup type="single" value={preference} onValueChange={(value) => value && setPreference(value as ThemePreference)} className="grid w-full grid-cols-3 rounded-lg bg-muted p-0.5">
            <ToggleGroupItem value="light" className="rounded-md data-[state=on]:bg-card data-[state=on]:shadow-sm"><Sun />Licht</ToggleGroupItem>
            <ToggleGroupItem value="dark" className="rounded-md data-[state=on]:bg-card data-[state=on]:shadow-sm"><Moon />Donker</ToggleGroupItem>
            <ToggleGroupItem value="system" className="rounded-md data-[state=on]:bg-card data-[state=on]:shadow-sm"><Laptop />Systeem</ToggleGroupItem>
          </ToggleGroup>
        </li>
      </Group>
      <GroupLabel>Account</GroupLabel>
      <Group>
        {cloud.user ? (
          <>
            <Row title={`Ingelogd met ${provider}`} detail={syncMessages[cloud.status]} titleClassName="font-medium" />
            <Row onClick={() => void signOut()} chevron={false} title="Uitloggen" titleClassName="font-medium text-primary" />
          </>
        ) : canSignIn && cloud.status !== 'starting' ? (
          <Row onClick={openSignIn} title="Inloggen met Apple of Google" detail="Je voortgang staat nu alleen op dit apparaat" titleClassName="font-medium text-primary" />
        ) : (
          <Row title="Je oefent op dit apparaat" detail={syncMessages[cloud.status]} titleClassName="font-medium" />
        )}
        <DeleteData signedIn={Boolean(cloud.user)} />
      </Group>
      <GroupLabel>Meer</GroupLabel>
      <Group>
        <Row onClick={() => navigate('bronnen')} leading={<img src={sceneFor('bronnen')} alt="" className="size-10 shrink-0 rounded-lg bg-[#fcfaf6] object-cover" draggable={false} />} title="Websites & boeken" titleClassName="font-medium" />
        <li><a href="/privacy" className="flex min-h-[52px] items-center gap-3 px-3.5 py-2.5 hover:bg-muted/60"><RowIcon className="bg-info-soft text-info-foreground"><Shield /></RowIcon><span className="flex-1 text-[15px] font-medium">Privacy</span><ChevronRight className="size-4 text-muted-foreground/60" /></a></li>
      </Group>
      <GroupLabel>App</GroupLabel>
      <AppCard />
    </Page>
  );
}

/** "Verwijder alles": the account and its saved progress online, plus everything on this device. */
function DeleteData({signedIn}: {signedIn: boolean}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    const done = signedIn ? await deleteAccount() : (forgetDevice(), true);
    setBusy(false);
    if (!done) return;
    setOpen(false);
    location.reload();
  };
  return (
    <li className="border-b last:border-b-0">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button type="button" className="flex min-h-[52px] w-full items-center px-3.5 py-2.5 text-left text-[15px] font-medium text-destructive hover:bg-muted/60">{signedIn ? 'Account verwijderen' : 'Wis mijn voortgang'}</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{signedIn ? 'Je account verwijderen?' : 'Je voortgang wissen?'}</DialogTitle>
            <DialogDescription>
              {signedIn
                ? 'Je account en alles wat erbij is opgeslagen worden definitief verwijderd: je oefeningen, je planning, je streak en je instellingen. Ook alles op dit apparaat wordt gewist. Dit kun je niet ongedaan maken.'
                : 'Alles op dit apparaat wordt gewist: je oefeningen, je planning, je streak, je records en je instellingen. Dit kun je niet ongedaan maken.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuleren</Button></DialogClose>
            <Button variant="destructive" disabled={busy} onClick={() => void confirm()}><Trash2 />{busy ? 'Bezig…' : signedIn ? 'Verwijder mijn account' : 'Wis alles'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
