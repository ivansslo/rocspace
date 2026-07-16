// workers/gateway/src/solace.ts
import { json } from './utils';
import type { Env } from './types';

export function solaceEmit(env: Env, topic: string, data: any) {
  if (!env.SOLACE_URL) return;
  fetch(`${env.SOLACE_URL}/topic/${topic}`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${env.SOLACE_USER}:${env.SOLACE_PASS}`),
      "Content-Type": "application/json",
      "Solace-delivery-mode": "direct"
    },
    body: JSON.stringify(data)
  }).catch(() => {});
}

export async function solaceStatus(env: Env) {
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
      body: JSON.stringify({ ping: true, ts: new Date().toISOString() })
    });
    return json({
      status: r.status === 200 ? "connected" : "error",
      httpCode: r.status,
      broker: "mr-connection-mwc1f9igml1.messaging.solace.cloud",
      vpn: "roclace-cluster",
      serviceId: "p37j7q6aggq",
      ts: new Date().toISOString()
    });
  } catch (e: any) {
    return json({ error: e.message, status: "disconnected" }, 502);
  }
}

export async function solaceQueues(env: Env) {
  if (!env.SOLACE_SEMP_URL || !env.SOLACE_VIEW_USER || !env.SOLACE_VIEW_PASS) {
    return json({ error: "Solace SEMP credentials not configured" }, 503);
  }
  try {
    const sempUrl = env.SOLACE_SEMP_URL.replace(/\/$/, "") + "/SEMP/v2/monitor/msgVpns/roclace-cluster/queues";
    const r = await fetch(sempUrl, {
      headers: { "Authorization": "Basic " + btoa(`${env.SOLACE_VIEW_USER}:${env.SOLACE_VIEW_PASS}`) }
    });
    const d = await r.json();
    const qs = (d.data || []).map((q: any) => ({
      name: q.queueName,
      spoolUsage: q.msgSpoolUsage || 0,
      bindCount: q.bindCount || 0,
      msgCountIn: q.rxMsgCount || 0,
      msgCountOut: q.txMsgCountOut || q.txMsgCount || 0
    }));
    return json({ queues: qs, count: qs.length, vpn: "roclace-cluster" });
  } catch (e: any) {
    return json({ error: e.message }, 502);
  }
}

export async function solaceService(env: Env) {
  try {
    const r = await fetch("https://api.solace.cloud/api/v0/services/p37j7q6aggq", {
      headers: { "Authorization": `Bearer ${env.SOLACE_API_TOKEN}` }
    });
    const d = await r.json();
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
  } catch (e: any) {
    return json({ error: e.message }, 502);
  }
}
