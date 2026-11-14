// Generated deployment settings are intentionally absent from a fresh fork.
export const cloudConfig = {url:'',key:'',appleWeb:false};
export async function loadCloudConfig() {
 try {
  const response=await fetch('./deployment-config.json');
  if(!response.ok)return;
  const settings=await response.json();
  if(settings.url&&settings.key?.startsWith('sb_publishable_'))Object.assign(cloudConfig,{url:settings.url,key:settings.key,appleWeb:settings.appleWeb===true});
 } catch { /* Offline mode remains available. */ }
}
