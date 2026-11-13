// Generated deployment settings are intentionally absent from a fresh fork.
export const cloudConfig = {url:'',key:''};
export async function loadCloudConfig() {
 try {
  const response=await fetch('./deployment-config.json');
  if(!response.ok)return;
  const settings=await response.json();
  if(settings.url&&settings.key?.startsWith('sb_publishable_'))Object.assign(cloudConfig,settings);
 } catch { /* Offline mode remains available. */ }
}
