/** Small Dutch plural helper: plural(3, 'kaartje', 'kaartjes') → "3 kaartjes". */
export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 6) return 'Goedenacht';
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}
