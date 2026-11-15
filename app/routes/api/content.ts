import type {Route} from './+types/content';
import {nativeContent, versioned} from '../../api/content.server';

export function loader({request}: Route.LoaderArgs) {
  const {version, body} = nativeContent();
  return versioned(request, version, () => body);
}
