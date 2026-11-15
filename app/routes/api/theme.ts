import type {Route} from './+types/theme';
import {json, missing, themeDetail, themes} from '../../api/content.server';

export function loader({params}: Route.LoaderArgs) {
  const theme = themes.find((item) => item.id === params.id);
  return theme ? json(themeDetail(theme)) : missing('Thema');
}
