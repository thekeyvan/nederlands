import {Outlet} from 'react-router';
import '../../../src/site/site.css';
import {SiteFrame} from '../../site/ui';

/** Header and footer around the public pages; their own stylesheet (Persian and Dutch fonts). */
export default function SiteLayout() {
  return <SiteFrame><Outlet /></SiteFrame>;
}
