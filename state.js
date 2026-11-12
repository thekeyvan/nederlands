export function weekKey(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return [monday.getFullYear(), String(monday.getMonth() + 1).padStart(2, '0'), String(monday.getDate()).padStart(2, '0')].join('-');
}
export function loadState(storage, validIds, currentWeek = weekKey()) {
  let raw;
  try { raw = JSON.parse(storage.getItem('mijn-nederlands-v1') || '{}'); } catch { raw = {}; }
  if (!raw || typeof raw !== 'object') raw = {};
  return {
    saved: Array.isArray(raw.saved) ? [...new Set(raw.saved.filter(id => validIds.includes(id)))] : [],
    week: currentWeek,
    done: raw.week === currentWeek && Array.isArray(raw.done) ? [...new Set(raw.done.filter(id => ['listen','read','speak','write','review'].includes(id)))] : []
  };
}
export function matchingResources(resources, { category, level, query }, saved) {
  const words = query.trim().toLocaleLowerCase('nl').split(/\s+/).filter(Boolean);
  return resources.filter(resource => {
    const inCategory = category === 'all' || (category === 'start' ? resource.start : category === 'saved' ? saved.includes(resource.id) : resource.categories.includes(category));
    const inLevel = level === 'all' || resource.level === level || (level === 'B1' && resource.start);
    const separateBooks = ['all', 'saved', 'Boeken'].includes(category) || !resource.categories.includes('Boeken');
    const text = [resource.name, resource.description, ...resource.categories].join(' ').toLocaleLowerCase('nl');
    return inCategory && inLevel && separateBooks && words.every(word => text.includes(word));
  });
}
