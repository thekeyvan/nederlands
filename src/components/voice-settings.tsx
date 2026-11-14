import {Play} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {ResponsiveSheet} from '@/components/responsive-sheet';
import {useAudio} from '@/hooks/use-audio';
import {audioCatalog} from '@/core/audio-catalog.js';
import {audioSpeeds} from '@/core/audio-playback.js';

const speedNames: Record<number, string> = {0.75: 'Langzaam', 0.85: 'Rustig', 1: 'Normaal', 1.15: 'Vlot', 1.25: 'Snel'};

export function VoiceControls() {
  const audio = useAudio();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Stem</Label>
        <ToggleGroup type="single" variant="outline" value={audio.voice} onValueChange={(value) => value && audio.setVoice(value)} className="w-full">
          {audioCatalog.voices.map((voice) => <ToggleGroupItem key={voice.id} value={voice.id} className="flex-1">{voice.name}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Snelheid</Label>
        <ToggleGroup type="single" variant="outline" value={String(audio.speed)} onValueChange={(value) => value && audio.setSpeed(Number(value))} className="w-full">
          {audioSpeeds.map((speed) => (
            <ToggleGroupItem key={speed} value={String(speed)} className="flex-1 flex-col gap-0 py-6 text-xs" aria-label={`${speed}× ${speedNames[speed]}`}>
              <span className="font-semibold">{String(speed).replace('.', ',')}×</span>
              <span className="text-[10px] text-muted-foreground">{speedNames[speed]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="text-muted-foreground">{audioCatalog.sampleText}</p>
        <Button variant="info" game size="sm" className="mt-3" onClick={() => audio.play(audioCatalog.sampleText)}><Play />Luister naar {audio.voiceName}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Dit is Nederlandse audio die op deze website staat: op elk apparaat dezelfde stem. Er gaat geen tekst naar een spraakdienst.</p>
    </div>
  );
}

export function VoiceSettingsSheet() {
  const audio = useAudio();
  return (
    <ResponsiveSheet open={audio.settingsOpen} onOpenChange={(open) => { if (!open) audio.cancel(); audio.setSettingsOpen(open); }} title="Nederlandse audio" description="Kies een stem en hoe snel je wilt luisteren.">
      <VoiceControls />
    </ResponsiveSheet>
  );
}
