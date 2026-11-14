import {useEffect, useMemo, useState, useSyncExternalStore} from 'react';
import {getProgress, subscribe} from '@/core/progress-store.js';
import {gameStats} from '@/core/game.js';
import {activity, dayKey} from '@/core/learning-model.js';

export function useProgress() {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

/** Re-render after midnight so "today", streaks and missions roll over without a reload. */
function useToday() {
  const [today, setToday] = useState(() => dayKey(new Date()));
  useEffect(() => {
    const check = () => setToday(dayKey(new Date()));
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return today;
}

export function useGame() {
  const progress = useProgress();
  const today = useToday();
  return useMemo(() => {
    const now = new Date();
    return {...gameStats(progress.reviews, progress.events, now), activity: activity(progress.events, now), progress, today};
  }, [progress, today]);
}
