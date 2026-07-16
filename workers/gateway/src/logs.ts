// workers/gateway/src/logs.ts
import { json } from './utils';
import { solaceEmit } from './solace';
import type { Env } from './types';

export function logEvent(env: Env, type: string, data: any = {}, request?: Request) {
  const rec = {
    id: "log-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    type,
    ts: new Date().toISOString(),
    meta: request ? reqMetaLocal(request) : {},
    data: data || {}
  };

  try {
    console.log(JSON.stringify(rec));
  } catch {}

  try {
    solaceEmit(env, "hermes/log/" + String(type).replace(/[^a-z0-9_-]/gi, "_"), rec);
  } catch {}

  try {
    if (env.LOGS && (env.LOGS as any).put) {
      (env.LOGS as any).put(rec.id, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 14 });
    }
  } catch {}

  try {
    if (env.DB && (env.DB as any).prepare) {
      (env.DB as any).prepare(
        "insert into logs (id,type,ts,meta,data) values (?1,?2,?3,?4,?5)"
      ).bind(rec.id, rec.type, rec.ts, JSON.stringify(rec.meta), JSON.stringify(rec.data)).run();
    }
  } catch {}

  return rec;
}

export async function listLogs(env: Env, limit = 50, type?: string) {
  limit = Math.min(parseInt(String(limit || 50)), 200);
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (env.DB && (env.DB as any).prepare) {
    try {
      const q = type
        ? (env.DB as any).prepare("select id,type,ts,meta,data from logs where type=?1 order by ts desc limit ?2").bind(type, limit)
        : (env.DB as any).prepare("select id,type,ts,meta,data from logs order by ts desc limit ?1").bind(limit);

      const r = await q.all();
      const rows = (r.results || []).map((x: any) => ({
        id: x.id,
        type: x.type,
        ts: x.ts,
        meta: JSON.parse(x.meta || "{}"),
        data: JSON.parse(x.data || "{}")
      }));
      return new Response(JSON.stringify({ storage: "d1", count: rows.length, items: rows }), { headers });
    } catch {}
  }

  if (!env.LOGS || !(env.LOGS as any).list) {
    return new Response(JSON.stringify({
      storage: "not_configured",
      message: "KV/D1 LOGS binding not configured.",
      items: []
    }), { headers });
  }

  try {
    const ls = await (env.LOGS as any).list({ limit });
    const items: any[] = [];
    for (const key of ls.keys) {
      const v = await (env.LOGS as any).get(key.name, "json");
      if (v && (!type || v.type === type)) items.push(v);
    }
    items.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
    return new Response(JSON.stringify({ storage: "kv", count: items.length, items }), { headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}

function reqMetaLocal(request: Request) {
  const u = new URL(request.url);
  return {
    method: request.method,
    path: u.pathname,
    colo: (request as any).cf?.colo || "",
    country: (request as any).cf?.country || "",
    ip: (request.headers.get("CF-Connecting-IP") || "").replace(/(\d+\.\d+)\.\d+\.\d+$/, "$1.x.x"),
    ua: (request.headers.get("User-Agent") || "").slice(0, 160)
  };
}
