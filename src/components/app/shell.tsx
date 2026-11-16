import {useEffect, type ReactNode} from 'react';
import {ChevronLeft, Flame, Laptop, Moon, Star, Sun} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {Brand} from '@/components/app/brand';
import {AccountChip} from '@/components/app/account-chip';
import {InstallButton} from '@/components/pwa';
import {parentOf, tabOf, tabs, titleOf, type NavItem} from '@/components/app/nav';
import {cn} from '@/lib/utils';
import {trackView} from '@/lib/stats';
import {goBack, hrefFor, navigate, openedFrom, useRoute, type Panel, type Route} from '@/hooks/use-route';
import {useTheme, type ThemePreference} from '@/hooks/use-theme';
import {useGame} from '@/hooks/use-progress';

/** Tapping a tab opens its first screen. Tapping the tab you are on scrolls back to the top. */
function openTab(panel: Panel, route: Route) {
  if (tabOf(route.panel) === panel && !parentOf(route) && (panel !== 'woorden' || route.panel === 'woorden')) {
    window.scrollTo({top: 0, behavior: 'smooth'});
    return;
  }
  navigate(panel, {root: true});
}

function SideLink({item, active, count}: {item: NavItem; active: boolean; count?: number}) {
  const route = useRoute();
  const Icon = item.icon;
  return (
    <a href={hrefFor(item.panel)} aria-current={active ? 'page' : undefined}
      onClick={(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); openTab(item.panel, route); }}
      className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        active && 'bg-accent font-semibold text-accent-foreground hover:bg-accent hover:text-accent-foreground')}>
      <Icon className="size-[18px]" aria-hidden />
      {item.label}
      {count ? <Badge className="ml-auto bg-primary text-primary-foreground">{count}</Badge> : null}
    </a>
  );
}

export function ThemeMenuItems() {
  const {preference, setPreference} = useTheme();
  return (
    <DropdownMenuRadioGroup value={preference} onValueChange={(value) => setPreference(value as ThemePreference)}>
      <DropdownMenuRadioItem value="system"><Laptop />Zoals mijn apparaat</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="light"><Sun />Licht</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark"><Moon />Donker</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  );
}

function ThemeToggle() {
  const {resolved} = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Licht of donker">{resolved === 'dark' ? <Moon /> : <Sun />}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top"><ThemeMenuItems /></DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({panel}: {panel: Panel}) {
  const game = useGame();
  const tab = tabOf(panel);
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-4 lg:flex">
      <Brand className="mb-6 px-2" />
      <nav aria-label="Nedfa" className="flex flex-col gap-0.5">
        {tabs.map((item) => <SideLink key={item.panel} item={item} active={tab === item.panel} count={item.panel === 'oefenen' ? game.dueCards : undefined} />)}
      </nav>
      <div className="flex-1" />
      <button type="button" onClick={() => navigate('voortgang', {root: true})} className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted" aria-label={`Reeks ${game.streak.count}, ${game.xp} XP`}>
        <Badge variant="streak" className="h-7 px-2.5 text-sm"><Flame />{game.streak.count}</Badge>
        <Badge variant="xp" className="h-7 px-2.5 text-sm"><Star />{game.xp}</Badge>
      </button>
      <InstallButton variant="ghost" className="mb-1 w-full justify-start text-muted-foreground" />
      <AccountChip />
      <div className="mt-2 flex items-center gap-1 px-1 text-xs text-muted-foreground">
        <ThemeToggle />
        <a href="/privacy" className="rounded px-1.5 py-1 hover:text-foreground">Privacy</a>
        <a href="https://github.com/thekeyvan/nedfa" target="_blank" rel="noopener noreferrer" className="rounded px-1.5 py-1 hover:text-foreground">Open source ↗</a>
      </div>
    </aside>
  );
}

/** Sub-screens get a back button named after the screen you came from. First screens of a tab have none. */
function BackBar({route}: {route: Route}) {
  const parent = parentOf(route);
  if (!parent) return null;
  const label = openedFrom() ?? titleOf({...route, panel: parent, theme: null, rule: null});
  return (
    <div className="sticky top-0 z-30 flex min-h-11 items-center border-b border-transparent bg-background/90 px-2 backdrop-blur lg:static lg:bg-transparent lg:px-6 lg:pt-6 lg:backdrop-blur-none" style={{paddingTop: 'env(safe-area-inset-top)'}}>
      <Button variant="ghost" className="h-10 max-w-[70vw] gap-0.5 px-2 text-base font-medium text-primary hover:bg-transparent hover:text-primary/80 lg:text-sm" onClick={() => goBack(parent)}>
        <ChevronLeft className="size-6 shrink-0 lg:size-4" /><span className="truncate">{label}</span>
      </Button>
    </div>
  );
}

function TabBar({panel}: {panel: Panel}) {
  const route = useRoute();
  const tab = tabOf(panel);
  return (
    <nav aria-label="Nedfa" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card/95 px-2 pt-1.5 backdrop-blur pb-safe lg:hidden">
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = tab === item.panel;
        return (
          <a key={item.panel} href={hrefFor(item.panel)} aria-current={active ? 'page' : undefined}
            onClick={(event) => { event.preventDefault(); openTab(item.panel, route); }}
            className={cn('flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none', active && 'font-semibold text-primary')}>
            <Icon className={cn('size-6', active && 'stroke-[2.4]')} aria-hidden />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

/**
 * Laptop: sidebar + content. Phone: content and a tab bar, no header. A practice round or game (layer)
 * covers everything; the screen underneath stays as it was, so closing the layer returns you there.
 */
export function AppShell({route, layer, children}: {route: Route; layer: ReactNode | null; children: ReactNode}) {
  const {panel} = route;
  const sub = parentOf(route) !== null;
  // Anonymous screen views, e.g. /leren/woorden/huisarts (see src/lib/stats.ts).
  const screenPath = ['/leren', panel, route.theme ?? route.rule ?? route.game].filter(Boolean).join('/');
  useEffect(() => trackView(screenPath), [screenPath]);
  return (
    <>
      {layer && <main id="main" tabIndex={-1} className="min-h-dvh outline-none" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>{layer}</main>}
      <div className={cn('min-h-dvh', layer ? 'hidden' : 'flex')}>
        <Sidebar panel={panel} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* The status bar area stays readable while content scrolls under it. */}
          {!sub && <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 bg-background/90 backdrop-blur lg:hidden" style={{height: 'env(safe-area-inset-top)'}} />}
          <BackBar route={route} />
          <main id={layer ? undefined : 'main'} tabIndex={-1} className="flex-1 pb-28 outline-none lg:pb-10" style={sub ? undefined : {paddingTop: 'env(safe-area-inset-top)'}}>{children}</main>
        </div>
        <TabBar panel={panel} />
      </div>
    </>
  );
}
