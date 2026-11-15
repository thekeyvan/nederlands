// Public Supabase settings for sign-in and sync (the same values every visitor receives; never a secret key).
export function loader() {
  const url = process.env.PUBLIC_SUPABASE_URL || '';
  const key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const valid = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && key.startsWith('sb_publishable_');
  // Set PUBLIC_APPLE_WEB_SIGNIN=1 once Supabase has the Apple web flow (Services ID and key).
  const appleWeb = process.env.PUBLIC_APPLE_WEB_SIGNIN === '1';
  const body = valid ? (appleWeb ? {url, key, appleWeb} : {url, key}) : {url: '', key: ''};
  return Response.json(body, {headers: {'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex'}});
}
