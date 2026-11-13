import {cp,mkdir,readdir,rm,writeFile} from 'node:fs/promises';
const url=process.env.PUBLIC_SUPABASE_URL || '';
const key=process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if(Boolean(url)!==Boolean(key))throw new Error('Set both public Supabase settings or neither.');
if(url&&(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key.startsWith('sb_publishable_')))throw new Error('Use your HTTPS Supabase project URL and a publishable key, never a secret key.');
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const entry of await readdir('.',{withFileTypes:true})){
 if(entry.isFile()&&/\.(html|css|js|svg)$/.test(entry.name)&&entry.name!=='deployment-config.json')await cp(entry.name,`dist/${entry.name}`);
}
for(const directory of ['assets','content','locales'])await cp(directory,`dist/${directory}`,{recursive:true});
await writeFile('dist/deployment-config.json',JSON.stringify({url,key})+'\n');
console.log(`Built static site. Account sync: ${url?'configured':'off (local-only fork)'}.`);
