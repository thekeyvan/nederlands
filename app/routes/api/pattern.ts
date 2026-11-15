import type {Route} from './+types/pattern';
import {json, missing, patternDetail, patterns} from '../../api/content.server';

export function loader({params}: Route.LoaderArgs) {
  const pattern = patterns.find((item) => item.slug === params.id || item.id === params.id);
  return pattern ? json(patternDetail(pattern)) : missing('Patroon');
}
