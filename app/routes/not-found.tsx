import {data} from 'react-router';

export const loader = () => {
  throw data(null, {status: 404});
};
export const meta = () => [{title: 'Niet gevonden — Nedfa'}, {name: 'robots', content: 'noindex'}];
export default function NotFound() {
  return null;
}
