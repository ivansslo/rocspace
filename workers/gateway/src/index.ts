import { VERSION, COMPONENTS, Env } from './types';
import { isAuthed, json, cors, secHTML, reqMeta } from './utils';
import { aiCall, modelsList } from './ai';
import { clerkConfig, clerkVerify, clerkUser } from './clerk';
import { crawl4ai, simpleCrawl } from './crawl';
import { logEvent, listLogs } from './logs';
import { solaceEmit, solaceStatus, solaceQueues, solaceService } from './solace';

// Import pages as raw text (via esbuild loader)
import dashboardHtml from './pages/dashboard.html';
import chatHtml from './pages/chat.html';
import crewHtml from './pages/crew.html';
import crawlHtml from './pages/crawl.html';
import zapierHtml from './pages/zapier.html';
import logsHtml from './pages/logs.html';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const TK = env.TOKEN || env.GATEWAY_TOKEN || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    if (path === "/" || path === "/api") return gatewayInfo(url.origin);

    if (path === "/dashboard") return htmlResponse(env, dashboardHtml);
    if (path === "/chat-live") return htmlResponse(env, chatHtml);
    if (path === "/crew") return htmlResponse(env, crewHtml);
    if (path === "/crawl4ai" && request.method === "GET") return htmlResponse(env, crawlHtml);
    if (path === "/zapier" && request.method === "GET") return htmlResponse(env, zapierHtml);
    if (path === "/zapier/template") return zapierTemplate();
    if (path === "/logs" && request.method === "GET") return htmlResponse(env, logsHtml);

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
      solaceEmit(env, "hermes/event/chat", { endpoint: "v1", model: body.model, ts: new Date().toISOString() });
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
      return listLogs(env, parseInt(url.searchParams.get("limit") || "50"), url.searchParams.get("type") || undefined);
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
        ts: new Date().toISOString()
      });
      return json({ status: "notified" });
    }

    return json({ error: "Not found", path }, 404);
  }
};

function gatewayInfo(origin: string) {
  return json({
    name: "RocSpace Gateway",
    version: VERSION,
    home: origin + "/dashboard",
    live: {
      dashboard: origin + "/dashboard",
      chatlive: origin + "/chat-live",
      chat: origin + "/chat-live",
      crew: origin + "/crew",
      crawl: origin + "/crawl4ai",
      zapier: origin + "/zapier",
      logs: origin + "/logs",
      hub: "https://app.roadfx.biz.id",
      api: origin + "/api"
    },
    components: COMPONENTS,
    endpoints: {
      "GET /": "Gateway info (JSON)",
      "GET /dashboard": "Dashboard UI",
      "GET /chat-live": "Chat-Live AI UI",
      "GET /crew": "CrewAI UI",
      "GET /crawl4ai": "Crawl4AI UI",
      "POST /crawl4ai": "Crawl URL → markdown",
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

function htmlResponse(_env: Env, html: string) {
  return new Response(html, {
    status: 200,
    headers: { ...secHTML(), "Access-Control-Allow-Origin": "*" }
  });
}

async function dashboardStatus(env: Env, request: Request) {
  const out: any = {
    version: VERSION,
    ts: new Date().toISOString(),
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
  } catch { }
  try {
    out.logs = await listLogs(env, 10);
  } catch { }
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

function firebaseConfig(env: Env) {
  if (!env.FIREBASE_CONFIG) return json({ configured: false });
  try {
    const cfg = JSON.parse(env.FIREBASE_CONFIG);
    return json({ ...cfg, configured: true });
  } catch {
    return json({ configured: false, error: "Invalid FIREBASE_CONFIG JSON" });
  }
}
