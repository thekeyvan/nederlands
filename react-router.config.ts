import type {Config} from '@react-router/dev/config';

// Server rendering for every page; the practice app at /leren.html renders in the browser (progress lives on the device).
export default {
  appDirectory: 'app',
  ssr: true,
} satisfies Config;
