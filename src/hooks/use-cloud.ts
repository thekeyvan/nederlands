import {useSyncExternalStore} from 'react';
import {getCloud, subscribeCloud, type CloudStatus} from '@/core/cloud.js';

export const useCloud = () => useSyncExternalStore(subscribeCloud, getCloud, getCloud);

export const syncMessages: Record<CloudStatus, string> = {
  starting: 'Even kijken of je bent ingelogd…',
  'local-only': 'Je oefent op dit apparaat. Inloggen is in deze versie niet ingesteld.',
  unavailable: 'Inloggen is nu niet beschikbaar. Je kunt lokaal oefenen.',
  guest: 'Je voortgang blijft op dit apparaat.',
  syncing: 'Opslaan…',
  saved: 'Opgeslagen in je account.',
  retry: 'Nog niet online opgeslagen. Je voortgang staat op dit apparaat; we proberen het opnieuw.',
  'load-failed': 'Je online voortgang kon niet worden geladen. Je kunt lokaal verder oefenen.',
};
