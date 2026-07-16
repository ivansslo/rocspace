// workers/gateway/src/solace.ts
import { json } from './utils';

// v18.0.3 — identitas broker TIDAK lagi di-hardcode:
//   broker/serviceId diturunkan dari hostname binding SOLACE_URL/SOLACE_SEMP_URL,
//   nama msgVpn dibaca dari binding opsional SOLACE_VPN (fallback "default").
//   Kredensial (user/pass/token) memang sudah 100% dari secret bindings.
const solaceHost = (u) => { try { return u ? new URL(u).hostname : ""; } catch { return ""; } };
const solaceVpn  = (env) => env.SOLACE_VPN || "default";
export function solaceEmit(env, topic, data) {
  if (!env.SOLACE_URL) return;
  fetch(`${env.SOLACE_URL}/topic/${topic}`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${env.SOLACE_USER}:${env.SOLACE_PASS}`),
      "Content-Type": "application/json",
      "Solace-delivery-mode": "direct"
    },
    body: JSON.stringify(data)
  }).catch(() => {
  });
}
export async function solaceStatus(env) {
  if (!env.SOLACE_URL) {
    return json({ error: "Solace not configured" }, 503);
  }
  try {
    const r = await fetch(`${env.SOLACE_URL}/topic/hermes/ping`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${env.SOLACE_USER}:${env.SOLACE_PASS}`),
        "Content-Type": "application/json",
        "Solace-delivery-mode": "direct"
      },
      body: JSON.stringify({ ping: true, ts: (/* @__PURE__ */ new Date()).toISOString() })
    });
    return json({
      status: r.status === 200 ? "connected" : "error",
      httpCode: r.status,
      broker: solaceHost(env.SOLACE_SEMP_URL) || solaceHost(env.SOLACE_URL) || "unknown",
      vpn: solaceVpn(env),
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    return json({ error: e.message, status: "disconnected" }, 502);
  }
}
export async function solaceQueues(env) {
  if (!env.SOLACE_SEMP_URL || !env.SOLACE_VIEW_USER || !env.SOLACE_VIEW_PASS) {
    return json({ error: "Solace SEMP credentials not configured" }, 503);
  }
  try {
    const sempUrl = env.SOLACE_SEMP_URL.replace(/\/$/, "") + "/SEMP/v2/monitor/msgVpns/" + encodeURIComponent(solaceVpn(env)) + "/queues";
    const r = await fetch(sempUrl, {
      headers: { "Authorization": "Basic " + btoa(`${env.SOLACE_VIEW_USER}:${env.SOLACE_VIEW_PASS}`) }
    });
    const d: any = await r.json();
    const qs = (d.data || []).map((q) => ({
      name: q.queueName,
      spoolUsage: q.msgSpoolUsage || 0,
      bindCount: q.bindCount || 0,
      msgCountIn: q.rxMsgCount || 0,
      msgCountOut: q.txMsgCountOut || q.txMsgCount || 0
    }));
    return json({ queues: qs, count: qs.length, vpn: "roclace-cluster" });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
export async function solaceService(env) {
  try {
    const r = await fetch("https://api.solace.cloud/api/v0/services/p37j7q6aggq", {
      headers: { "Authorization": `Bearer ${env.SOLACE_API_TOKEN}` }
    });
    const d: any = await r.json();
    const s = d.data || {};
    return json({
      name: s.name,
      serviceId: s.serviceId,
      vpn: s.msgVpnName,
      region: s.datacenterId,
      type: s.serviceTypeId,
      state: `${s.adminState}/${s.adminProgress}`,
      limits: s.serviceClassDisplayedAttributes || {},
      created: s.created
    });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

