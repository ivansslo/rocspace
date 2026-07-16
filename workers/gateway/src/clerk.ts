// workers/gateway/src/clerk.ts
import { json } from './utils';
var CLERK_DOMAIN = "awake-chicken-95.clerk.accounts.dev";
export async function clerkConfig(env) {
  const configured = !!(env.CLERK_PK && env.CLERK_SK);
  return json({
    publishableKey: env.CLERK_PK || "",
    domain: CLERK_DOMAIN,
    configured
  });
}
export async function clerkVerify(request, env) {
  if (!env.CLERK_SK) return json({ error: "Clerk not configured" }, 503);
  const body = await request.json().catch(() => ({}));
  if (!body.token) return json({ error: "Missing token" }, 400);
  try {
    const r = await fetch("https://api.clerk.com/v1/sessions/verify", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CLERK_SK}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token: body.token })
    });
    return json(await r.json());
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
export async function clerkUser(url, env) {
  if (!env.CLERK_SK) return json({ error: "Clerk not configured" }, 503);
  const uid = url.searchParams.get("id") || "";
  if (!uid) return json({ error: "Missing id" }, 400);
  try {
    const r = await fetch(`https://api.clerk.com/v1/users/${uid}`, {
      headers: { "Authorization": `Bearer ${env.CLERK_SK}` }
    });
    return json(await r.json());
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

