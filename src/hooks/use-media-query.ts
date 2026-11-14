import {useSyncExternalStore} from 'react';

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's lg breakpoint: sidebar layout and dialogs instead of drawers. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
