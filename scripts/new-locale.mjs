import {writeFile} from 'node:fs/promises';
import fa from '../locales/fa.js';
const code=process.argv[2];
if(!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(code || ''))throw new Error('Usage: npm run locale:new -- es');
const blank=value=>typeof value==='string'?'':Object.fromEntries(Object.entries(value).map(([key,item])=>[key,blank(item)]));
const pack={code,name:'YOUR LANGUAGE',dutchName:'YOUR LANGUAGE IN DUTCH',dir:'ltr',font:'sans-serif',themes:blank(fa.themes),cards:blank(fa.cards),dialogues:blank(fa.dialogues),ui:blank(fa.ui)};
await writeFile(`locales/${code}.js`,`export default ${JSON.stringify(pack,null,2)};\n`,{flag:'wx'});
console.log(`Created locales/${code}.js. Translate it, register it in locales/index.js, then run npm test.`);
