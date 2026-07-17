// workers/gateway/src/index.ts
import { COMPONENTS, VERSION } from './types';
import { HUB_NAV_ITEMS } from '@rocspace/shared';
import { isAuthed, json, cors, secHTML, reqMeta } from './utils';
import { aiCall, modelsList } from './ai';
import { clerkConfig, clerkVerify, clerkUser } from './clerk';
import { crawl4ai, simpleCrawl } from './crawl';
import { logEvent, listLogs } from './logs';
import { solaceEmit, solaceStatus, solaceQueues, solaceService } from './solace';
import dashboard_default from './pages/dashboard.html';
import chat_default from './pages/chat.html';
import crew_default from './pages/crew.html';
import crawl_default from './pages/crawl.html';
import zapier_default from './pages/zapier.html';
import logs_default from './pages/logs.html';
import dashboard_v18_default from './pages/ui/dashboard-v18.html';
import orchestrator_default from './pages/ui/orchestrator.html';
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const TK = env.TOKEN || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }
    // The Workers.dev hostname is a private gateway origin. UI pages belong to
    // the canonical Hub; requests forwarded by roc-site retain X-Forwarded-Host
    // and continue to be served here without a redirect loop.
    const forwardedHost = request.headers.get("X-Forwarded-Host");
    const isDirectGatewayHost = (url.hostname === "hermes-cloudflare.hubfx.workers.dev" || url.hostname === "internal-gateway.roadfx.biz.id") && !forwardedHost;
    const hubPages = new Set(["/dashboard", "/dashboard-v18", "/orchestrator", "/chat-live", "/crew", "/crawl4ai", "/zapier", "/logs"]);
    if (isDirectGatewayHost && (request.method === "GET" || request.method === "HEAD") && hubPages.has(path)) {
      const targetPath = path === "/dashboard-v18" || path === "/orchestrator" ? "/" : path;
      return Response.redirect(`https://hub.roadfx.biz.id${targetPath}${url.search}`, 301);
    }
    if (path === "/" || path === "/api") return gatewayInfo(url.origin);
    if (path === "/dashboard") return htmlResponse(env, renderDashboard(), 'dashboard');
    if (path === "/dashboard-v18") return htmlResponse(env, renderDashboardV18());
    if (path === "/orchestrator") return htmlResponse(env, renderOrchestrator());
    if (path === "/chat-live") return htmlResponse(env, renderChatLive(), 'chatlive');
    if (path === "/crew") return htmlResponse(env, renderCrew(), 'crew');
    if (path === "/crawl4ai" && request.method === "GET") return htmlResponse(env, renderCrawl(), 'crawl');
    if (path === "/zapier" && request.method === "GET") return htmlResponse(env, renderZapier(), 'zapier');
    if (path === "/zapier/template") return zapierTemplate();
    if (path === "/logs" && request.method === "GET") return htmlResponse(env, renderLogs(), 'logs');
    if (path === "/links") return Response.redirect("https://app.roadfx.biz.id");
    if (path === "/integrations") return json(COMPONENTS);
    if (path === "/dashboard/status") return dashboardStatus(env, request);
    if (path === "/v1/models") return modelsList();
    if (path === "/auth/clerk-config") return clerkConfig(env);
    if (path === "/auth/firebase-config") return firebaseConfig(env);
    if (path === "/auth/verify" && request.method === "POST") return clerkVerify(request, env);
    if (path === "/auth/user") return clerkUser(url, env);
    if ((path === "/ai/chat" || path === "/ai/stream") && request.method === "POST") {
      logEvent(env, "ai.chat", { stream: path === "/ai/stream" }, request);
      const body = await request.json().catch(() => ({}));
      return aiCall(env, body.model || "qwen/qwen3-32b", body.messages || [], body.max_tokens || 4096, path === "/ai/stream");
    }
    if (path === "/v1/chat/completions" && request.method === "POST") {
      logEvent(env, "ai.v1_chat", { endpoint: path }, request);
      if (!isAuthed(request, url, TK)) return json({ error: { message: "Unauthorized" } }, 401);
      const body = await request.json().catch(() => ({}));
      solaceEmit(env, "hermes/event/chat", { endpoint: "v1", model: body.model, ts: (/* @__PURE__ */ new Date()).toISOString() });
      return aiCall(env, body.model || "qwen/qwen3-32b", body.messages || [], body.max_tokens || 4096, body.stream || false);
    }
    if (path === "/crawl4ai" && request.method === "POST") {
      if (!isAuthed(request, url, TK)) return json({ error: { message: "Unauthorized" } }, 401);
      logEvent(env, "crawl4ai.start", {}, request);
      return crawl4ai(request);
    }
    if (path === "/crawl" && request.method === "POST") {
      if (!isAuthed(request, url, TK)) return json({ error: "Unauthorized" }, 401);
      return simpleCrawl(request);
    }
    if (path === "/logs/list") {
      if (!isAuthed(request, url, TK)) return json({ error: "Unauthorized" }, 401);
      return listLogs(env, parseInt(url.searchParams.get("limit") || "50"), url.searchParams.get("type") || void 0);
    }
    if (path === "/solace/status") return solaceStatus(env);
    if (path === "/solace/queues") return solaceQueues(env);
    if (path === "/solace/service") return solaceService(env);
    if (path === "/solace/publish" && request.method === "POST") {
      if (!isAuthed(request, url, TK)) return json({ error: "Unauthorized" }, 401);
      const body = await request.json().catch(() => ({}));
      solaceEmit(env, body.topic || "hermes/publish", body.data || body);
      return json({ status: "published", topic: body.topic });
    }
    if (path === "/solace/task" && request.method === "POST") {
      if (!isAuthed(request, url, TK)) return json({ error: "Unauthorized" }, 401);
      const body = await request.json().catch(() => ({}));
      solaceEmit(env, "hermes/task/" + (body.agent || "default"), body);
      return json({ status: "task_sent", agent: body.agent });
    }
    if (path === "/webhook/zapier" && request.method === "POST") {
      if (!isAuthed(request, url, TK)) return json({ error: "Unauthorized" }, 401);
      logEvent(env, "webhook.zapier", {}, request);
      const body = await request.json().catch(() => ({}));
      solaceEmit(env, "hermes/webhook/zapier", body);
      return json({ status: "received", action: body.action || "unknown" });
    }
    if (path === "/notify" && request.method === "POST") {
      logEvent(env, "notify", {}, request);
      const body = await request.json().catch(() => ({}));
      solaceEmit(env, "hermes/notify/owner", {
        type: "user_activity",
        user: body.user || "anon",
        clerkUser: body.clerkUser || null,
        action: body.action || "visit",
        ts: (/* @__PURE__ */ new Date()).toISOString()
      });
      return json({ status: "notified" });
    }
    return json({ error: "Not found", path }, 404);
  }
};
function gatewayInfo(origin) {
  return json({
    name: "RocSpace Gateway",
    version: VERSION,
    home: "https://hub.roadfx.biz.id/dashboard",
    live: {
      dashboard: "https://hub.roadfx.biz.id/dashboard",
      chatlive: "https://hub.roadfx.biz.id/chat-live",
      chat: "https://hub.roadfx.biz.id/chat-live",
      crew: "https://hub.roadfx.biz.id/crew",
      crawl: "https://hub.roadfx.biz.id/crawl4ai",
      zapier: "https://hub.roadfx.biz.id/zapier",
      logs: "https://hub.roadfx.biz.id/logs",
      hub: "https://hub.roadfx.biz.id",
      api: "https://api.roadfx.biz.id"
    },
    components: COMPONENTS,
    endpoints: {
      "GET /": "Gateway info (JSON)",
      "GET /dashboard": "Dashboard UI",
      "GET /chat-live": "Chat-Live AI UI",
      "GET /crew": "CrewAI UI",
      "GET /crawl4ai": "Crawl4AI UI",
      "POST /crawl4ai": "Crawl URL \u2192 markdown",
      "GET /zapier": "Zapier template UI",
      "POST /ai/chat": "AI chat (non-stream)",
      "POST /ai/stream": "AI chat (streaming)",
      "POST /v1/chat/completions": "OpenAI-compatible API",
      "GET /v1/models": "Model list",
      "GET /auth/clerk-config": "Clerk config",
      "GET /auth/firebase-config": "Firebase config"
    }
  });
}
function htmlResponse(_env, html, activePage = '') {
  return new Response(injectGatewayShell(html, activePage), { status: 200, headers: { ...secHTML(), "Access-Control-Allow-Origin": "*" } });
}

// Gateway UI pages are legacy application documents with different internal
// layouts. Injecting this small, isolated shell gives every one the canonical
// Hub menu without rewriting or breaking each app's functional markup.
function injectGatewayShell(html, activePage) {
  const nav = JSON.stringify(HUB_NAV_ITEMS);
  const shell = `<script>(function(){
    if(document.getElementById('roc-gateway-shell'))return;
    var items=${nav}, active=${JSON.stringify(activePage)};
    var groups=['Workspace','Applications','Infrastructure','Manage'];
    var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})};
    var links=groups.map(function(group){var entries=items.filter(function(i){return i.group===group});if(!entries.length)return'';return '<div class="label">'+group+'</div>'+entries.map(function(i){return '<a class="item '+(i.id===active?'active':'')+'" href="'+esc(i.href)+'"'+(i.external?' target="_blank" rel="noopener"':'')+'><span>'+esc(i.icon)+'</span>'+esc(i.label)+(i.external?'<em>↗</em>':'')+'</a>'}).join('')}).join('');
    var host=document.createElement('aside');host.id='roc-gateway-shell';host.setAttribute('aria-label','RocSpace navigation');host.innerHTML='<a class="brand" href="https://hub.roadfx.biz.id/"><b>R</b><span>RocSpace<small>Canonical Hub</small></span></a><nav>'+links+'</nav>';
    var style=document.createElement('style');style.id='roc-gateway-shell-style';style.textContent='@media(min-width:901px){html{background:#09090b!important}body{margin-left:232px!important;width:calc(100% - 232px)!important}}#roc-gateway-shell{position:fixed;z-index:2147483647;inset:0 auto 0 0;width:232px;padding:17px 11px;background:#0b0b0ff2;border-right:1px solid #292931;box-sizing:border-box;font:12px Inter,system-ui,-apple-system,sans-serif;color:#f4f4f5;overflow-y:auto;box-shadow:12px 0 34px #0004}#roc-gateway-shell *{box-sizing:border-box}#roc-gateway-shell .brand{display:flex;align-items:center;gap:10px;padding:5px 8px 19px;color:#f4f4f5;text-decoration:none;font-weight:800;font-size:15px}#roc-gateway-shell .brand b{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:linear-gradient(135deg,#22d3ee,#8b5cf6);color:#09090b}#roc-gateway-shell .brand small{display:block;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#898994;margin-top:2px}#roc-gateway-shell .label{color:#70707b;font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;padding:11px 9px 4px}#roc-gateway-shell .item{display:flex;align-items:center;gap:9px;padding:8px 9px;margin:2px 0;border-radius:8px;text-decoration:none;color:#aaaab4}#roc-gateway-shell .item:hover,#roc-gateway-shell .item.active{background:#202027;color:#ecfeff}#roc-gateway-shell .item.active{box-shadow:inset 2px 0 #22d3ee}#roc-gateway-shell .item em{font-style:normal;margin-left:auto;color:#67e8f9}@media(max-width:900px){#roc-gateway-shell{position:sticky;top:0;width:100%;height:auto;min-height:52px;padding:7px 9px;display:flex;align-items:center;gap:8px;overflow-x:auto;border-right:0;border-bottom:1px solid #292931}#roc-gateway-shell .brand{padding:3px 4px;white-space:nowrap}#roc-gateway-shell .brand small,#roc-gateway-shell .label{display:none}#roc-gateway-shell nav{display:flex;gap:3px}#roc-gateway-shell .item{white-space:nowrap;padding:7px 8px;margin:0}#roc-gateway-shell .item span{display:none}}';
    document.head.appendChild(style);document.body.insertBefore(host,document.body.firstChild);
  })();</script>`;
  return html.includes('</body>') ? html.replace('</body>', shell + '</body>') : html + shell;
}
async function dashboardStatus(env, request) {
  const out: any = {
    version: VERSION,
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    providers: {
      groq: !!env.GROQ_KEY,
      gemini: !!env.GEMINI_KEY,
      openrouter: !!env.OR_KEY,
      openai: !!env.OPENAI_KEY,
      clerk: !!env.CLERK_PK
    }
  };
  try {
    if (env.SOLACE_URL) {
      const r = await fetch(env.SOLACE_URL + "/topic/hermes/dashboard-ping", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${env.SOLACE_USER}:${env.SOLACE_PASS}`),
          "Content-Type": "application/json",
          "Solace-delivery-mode": "direct"
        },
        body: JSON.stringify({ ping: true, ts: out.ts })
      });
      out.solace = { status: r.status === 200 ? "connected" : "error" };
    }
  } catch {
  }
  try {
    const lr = await listLogs(env, 10);
    const ld = JSON.parse(await lr.text());
    out.logs = (ld.items || []).slice(0, 10);
    out.logsCount = ld.count || 0;
  } catch {
  }
  return json(out);
}
function zapierTemplate() {
  return json({
    trigger: { app: "Clerk", event: "User Created / Session Created" },
    steps: [
      { step: 1, action: "Normalize", app: "Formatter", fields: ["id", "email", "name", "username"] },
      { step: 2, action: "POST to Hermes", url: "/webhook/zapier", method: "POST" },
      { step: 3, action: "Solace Publish", topic: "hermes/notify/owner" }
    ]
  });
}
function firebaseConfig(env) {
  if (!env.FIREBASE_CONFIG) return json({ configured: false });
  try {
    const cfg = JSON.parse(env.FIREBASE_CONFIG);
    return json({ ...cfg, configured: true });
  } catch {
    return json({ configured: false, error: "Invalid FIREBASE_CONFIG JSON" });
  }
}
function renderDashboard() {
  return dashboard_default;
}
function renderChatLive() {
  return chat_default;
}
function renderCrew() {
  return crew_default;
}
function renderCrawl() {
  return crawl_default;
}
function renderZapier() {
  return zapier_default;
}
function renderLogs() {
  return logs_default;
}
function renderDashboardV18() {
  return dashboard_v18_default;
}
function renderOrchestrator() {
  return orchestrator_default;
}
export {
  index_default as default
};