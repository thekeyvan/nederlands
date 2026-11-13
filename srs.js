// SuperMemo SM-2. Four UI answers map to quality 1, 3, 4 and 5.
export const ratings = [
 {grade:1,label:'Nog niet'},
 {grade:3,label:'Moeilijk'},
 {grade:4,label:'Goed'},
 {grade:5,label:'Makkelijk'}
];
export function scheduleReview(previous = {}, grade, now = new Date()) {
 if (![1,3,4,5].includes(grade)) throw new RangeError('Unknown review grade');
 const ease = Number.isFinite(previous.ease) ? previous.ease : 2.5;
 let repetitions = Number.isInteger(previous.repetitions) ? previous.repetitions : 0;
 let interval;
 if (grade < 3) { repetitions=0; interval=1; }
 else {
  interval=repetitions===0 ? 1 : repetitions===1 ? 6 : Math.ceil((previous.interval || 1)*ease);
  repetitions++;
 }
 interval=Math.min(36500,interval);
 const nextEase=Math.min(10,Math.max(1.3,ease+0.1-(5-grade)*(0.08+(5-grade)*0.02)));
 const due=new Date(now); due.setDate(due.getDate()+interval);
 return {ease:Math.round(nextEase*100)/100,interval,repetitions,due:due.toISOString(),lastReviewed:now.toISOString(),grade,reviews:(previous.reviews || 0)+1};
}
export function progressStatus(review) {
 if (!review) return 'new';
 if (review.grade < 3) return 'learning';
 return review.repetitions >= 3 ? 'known' : 'learning';
}
export function makeQueue(cards, reviews, {now=new Date(),limit=20,newLimit=5,theme='all'}={}) {
 const pool=cards.filter(card=>theme==='all'||card.themeId===theme);
 const due=pool.filter(card=>reviews[card.id]&&new Date(reviews[card.id].due)<=now).sort((a,b)=>new Date(reviews[a.id].due)-new Date(reviews[b.id].due));
 const fresh=pool.filter(card=>!reviews[card.id]).slice(0,newLimit);
 return [...due,...fresh].slice(0,limit);
}
export function mergeReviews(local, remote) {
 const result={...local};
 for (const [id,review] of Object.entries(remote)) {
  if (!result[id] || new Date(review.lastReviewed)>new Date(result[id].lastReviewed)) result[id]=review;
 }
 return result;
}
export function validReviews(input, validIds) {
 if (!input || typeof input!=='object'||Array.isArray(input)) return {};
 return Object.fromEntries(Object.entries(input).filter(([id,r])=>validIds.has(id)&&r&&Number.isFinite(r.ease)&&r.ease>=1.3&&Number.isInteger(r.interval)&&r.interval>=1&&Number.isInteger(r.repetitions)&&r.repetitions>=0&&[1,3,4,5].includes(r.grade)&&Number.isFinite(Date.parse(r.due))&&Number.isFinite(Date.parse(r.lastReviewed))));
}
