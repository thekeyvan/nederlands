// Whether this deployment has accounts (nedfa.nl's own API on Railway) and Apple on the web. A fresh fork runs without.
export const cloudConfig = {auth:false,appleWeb:false};
export async function loadCloudConfig() {
 try {
  const response=await fetch('/deployment-config.json');
  if(!response.ok)return;
  const settings=await response.json();
  Object.assign(cloudConfig,{auth:settings.auth===true,appleWeb:settings.auth===true&&settings.appleWeb===true});
 } catch { /* Offline mode remains available. */ }
}
