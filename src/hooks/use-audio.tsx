import {createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode} from 'react';
import {toast} from 'sonner';
import {audioCatalog} from '@/core/audio-catalog.js';
import {createPlayback, validSpeed, validVoice, type Playback, type PlaybackState} from '@/core/audio-playback.js';

// Bundled Dutch MP3 clips only: no device voices, no speech service, no microphone.
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* The choice still applies for this visit. */
  }
};

interface AudioValue {
  play: (text: string, options?: {speed?: number}) => void;
  cancel: () => void;
  voice: string;
  speed: number;
  setVoice: (voice: string) => void;
  setSpeed: (speed: number) => void;
  current: string | null;
  state: PlaybackState;
  voiceName: string;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const AudioContext = createContext<AudioValue | null>(null);

export function AudioProvider({children}: {children: ReactNode}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<Playback | null>(null);
  const [voice, setVoiceState] = useState(() => validVoice(read('nederlands-audio-voice')));
  const [speed, setSpeedState] = useState(() => validSpeed(read('nederlands-audio-speed')));
  const [current, setCurrent] = useState<string | null>(null);
  const [state, setState] = useState<PlaybackState>('idle');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const player = useCallback(() => {
    if (!playerRef.current && audioRef.current) {
      playerRef.current = createPlayback(audioRef.current, (next) => {
        setState(next);
        if (next === 'error') toast.error('De audio kan niet laden. Probeer het nog eens.');
        if (next === 'idle' || next === 'ended' || next === 'error') setCurrent(null);
      });
    }
    return playerRef.current;
  }, []);

  const play = useCallback(
    (text: string, options: {speed?: number} = {}) => {
      const playback = player();
      if (!playback) return;
      setCurrent(text);
      // A one-off slower replay ("Langzamer") passes its own speed; the saved speed stays.
      void playback.play(text, voice, options.speed ?? speed);
    },
    [player, voice, speed],
  );
  const cancel = useCallback(() => playerRef.current?.cancel(), []);
  const setVoice = useCallback((next: string) => {
    playerRef.current?.cancel();
    const value = validVoice(next);
    setVoiceState(value);
    write('nederlands-audio-voice', value);
  }, []);
  const setSpeed = useCallback((next: number) => {
    const value = validSpeed(next);
    setSpeedState(value);
    playerRef.current?.setSpeed(value);
    write('nederlands-audio-speed', String(value));
  }, []);

  const voiceName = audioCatalog.voices.find((item) => item.id === voice)?.name ?? voice;
  const value = useMemo(
    () => ({play, cancel, voice, speed, setVoice, setSpeed, current, state, voiceName, settingsOpen, setSettingsOpen}),
    [play, cancel, voice, speed, setVoice, setSpeed, current, state, voiceName, settingsOpen],
  );
  return (
    <AudioContext value={value}>
      {children}
      <audio ref={audioRef} preload="none" hidden />
    </AudioContext>
  );
}

export function useAudio() {
  const value = useContext(AudioContext);
  if (!value) throw new Error('useAudio must be used inside AudioProvider');
  return value;
}
