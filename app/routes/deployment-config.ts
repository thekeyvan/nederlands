// Tells the app whether accounts are available: they need the Railway Postgres database (DATABASE_URL).
export function loader() {
  const auth = Boolean(process.env.DATABASE_URL);
  // Sign in with Apple JS works on nedfa.nl (the Services ID lists that domain); PUBLIC_APPLE_WEB_SIGNIN=0 turns it off.
  const appleWeb = auth && process.env.PUBLIC_APPLE_WEB_SIGNIN !== '0';
  return Response.json({auth, appleWeb}, {headers: {'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex'}});
}
