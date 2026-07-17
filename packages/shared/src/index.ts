// ═══════════════════════════════════════════════════════════
//  @rocspace/shared — Constants, Types, and Utilities
// ═══════════════════════════════════════════════════════════

// ─── AI Models ───────────────────────────────────────────
// Only models that are VERIFIED working on the Gateway

export interface ModelInfo {
  id: string;
  label: string;
  emoji: string;
  provider: 'groq' | 'openrouter' | 'google' | 'openai';
  speed: 'fast' | 'medium' | 'slow';
  thinking?: boolean;
}

export const AI_MODELS: ModelInfo[] = [
  { id: 'llama-3.3-70b-versatile',      label: 'Llama 3.3 70B',   emoji: '⚡', provider: 'groq',      speed: 'fast' },
  { id: 'llama-3.1-8b-instant',          label: 'Llama 8B Fast',   emoji: '🚀', provider: 'groq',      speed: 'fast' },
  { id: 'qwen/qwen3-32b',               label: 'Qwen3 32B',       emoji: '🧠', provider: 'openrouter', speed: 'medium', thinking: true },
  { id: 'qwen/qwen3-235b-a22b',         label: 'Qwen3 235B',      emoji: '🏆', provider: 'openrouter', speed: 'slow' },
  { id: 'qwen/qwen3.6-27b',             label: 'Qwen3.6 27B',     emoji: '🔬', provider: 'openrouter', speed: 'medium', thinking: true },
  { id: 'openai/gpt-4o',                label: 'GPT-4o',          emoji: '💎', provider: 'openrouter', speed: 'medium' },
  { id: 'openai/gpt-oss-120b',          label: 'GPT-OSS 120B',    emoji: '🦾', provider: 'openrouter', speed: 'slow' },
  { id: 'gpt-4.1',                      label: 'GPT-4.1',         emoji: '🔷', provider: 'openai',     speed: 'medium' },
  { id: 'gpt-4.1-mini',                 label: 'GPT-4.1 Mini',    emoji: '🔹', provider: 'openai',     speed: 'fast' },
  { id: 'gpt-4o',                       label: 'GPT-4o Direct',   emoji: '💠', provider: 'openai',     speed: 'medium' },
  { id: 'o3-mini',                      label: 'O3 Mini',         emoji: '🧩', provider: 'openai',     speed: 'medium' },
  { id: 'o4-mini',                      label: 'O4 Mini',         emoji: '🎯', provider: 'openai',     speed: 'medium' },
  { id: 'deepseek/deepseek-r1',         label: 'DeepSeek R1',     emoji: '🔮', provider: 'openrouter', speed: 'slow', thinking: true },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Scout Vision', emoji: '👁️', provider: 'openrouter', speed: 'medium' },
  { id: 'google/gemini-2.5-flash',       label: 'Gemini 2.5 Flash', emoji: '✨', provider: 'google',     speed: 'fast' },
  { id: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro',  emoji: '🌟', provider: 'google',     speed: 'slow' },
];

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// ─── Endpoints ───────────────────────────────────────────

export const ENDPOINTS = {
  GATEWAY: 'https://hermes-cloudflare.certveis.workers.dev', // MUST use internal endpoint to avoid circular loop (roc-site → gateway.roadfx.biz.id → roc-site → 💥)
  CLOUDRUN: 'https://ai-vitality-819208434965.us-west1.run.app', // DOWN (billing OR_BACR2_44) — routes prefer GATEWAY
  AIS_DEV: 'https://ais-dev-jqizmthqeu2hdc4e3pgh63-70765440683.asia-east1.run.app', // Google AI Studio Applet (asia-east1)
  CLERK_DOMAIN: 'awake-chicken-95.clerk.accounts.dev',
} as const;

// ─── AI Studio (integrasi applet privat Google AI Studio) ──
// Alias "rocspace.ai.studio"/"webvirtcloud.ai.studio" = label integrasi.
// Subdomain *.ai.studio milik Google & tidak bisa di-klaim user — link resmi
// applet (private, redirect login Google pemilik) adalah URL di bawah ini.
export const AI_STUDIO = {
  APP: 'https://ai.studio/apps/90047957-bcb6-4808-8e03-3df0c091f88f',
  HOME: 'https://aistudio.google.com',
  ALIAS: 'rocspace.ai.studio',
  ALIAS_VM: 'webvirtcloud.ai.studio',
} as const;

// ─── Domain Map ──────────────────────────────────────────

export interface DomainMapping {
  hostname: string;
  worker: string;
  description: string;
}

export const DOMAIN_MAP: DomainMapping[] = [
  { hostname: 'roadfx.biz.id',          worker: 'site', description: '🏠 Dashboard' },
  { hostname: 'www.roadfx.biz.id',      worker: 'site', description: '🏠 Dashboard (www)' },
  { hostname: 'dashboard.roadfx.biz.id', worker: 'site', description: '📊 Dashboard' },
  { hostname: 'chat.roadfx.biz.id',     worker: 'site', description: '💬 Chat Live' },
  { hostname: 'status.roadfx.biz.id',   worker: 'site', description: '📈 Status' },
  { hostname: 'cloudrun.roadfx.biz.id', worker: 'site', description: '☁️ Cloud Run Proxy' },
  { hostname: 'ai.roadfx.biz.id',       worker: 'site', description: '🧠 AI Gateway' },
  { hostname: 'gateway.roadfx.biz.id',  worker: 'site', description: '🌐 API Gateway' },
  { hostname: 'api.roadfx.biz.id',      worker: 'site', description: '⚡ API Endpoint' },
  { hostname: 'auth.roadfx.biz.id',     worker: 'site', description: '🔐 Authentication' },
  { hostname: 'factory.roadfx.biz.id',  worker: 'site', description: '🏭 AI Factory' },
  { hostname: 'webhook.roadfx.biz.id',  worker: 'site', description: '🔗 Webhook' },
  { hostname: 'r2.roadfx.biz.id',       worker: 'site', description: '💾 R2 Explorer' },
  { hostname: 'app.roadfx.biz.id',      worker: 'site', description: '📱 Apps Hub' },
  { hostname: 'vm.roadfx.biz.id',       worker: 'site', description: '🖥️ VM Console (WebVirtCloud + Firebase)' },
  { hostname: 'monitor.roadfx.biz.id',  worker: 'site', description: '📊 Uptime Monitor' },
];

// ─── v19: Hub Tunggal ────────────────────────────────────
// Satu situs kanonik untuk semua HALAMAN; api.roadfx.biz.id tetap nama API.
export const CANONICAL = {
  HUB: 'hub.roadfx.biz.id',
  API: 'api.roadfx.biz.id',
} as const;

// Sub-domain lama → seksi di hub (target 301 untuk root path).
export const HUB_SECTIONS: Record<string, string> = {
  'www': '/', 'roadfx': '/', 'dashboard': '/dashboard',
  'chat': '/chat-live', 'live': '/chat-live', 'status': '/status',
  'cloudrun': '/cloudrun', 'vm': '/vm', 'monitor': '/monitor',
  'auth': '/auth', 'factory': '/factory', 'webhook': '/webhook',
  'r2': '/r2', 'app': '/app', 'ais': '/ais', 'newcr': '/ais', 'ais-dev': '/ais',
};

// ─── Cloudflare Config ───────────────────────────────────
// DIBERSIHKAN (v18.0.3): CF_ACCOUNT_ID / CF_ZONE_ID / CLERK_PK tidak lagi
// di-hardcode di source — skrip membaca dari env (lihat .env.example),
// worker memakai secret bindings (wrangler secret). Jangan commit nilai nyata.

// ─── Utility Functions ───────────────────────────────────

export function modelSelectOptions(): string {
  return AI_MODELS.map(m =>
    `<option value="${m.id}">${m.emoji} ${m.label}</option>`
  ).join('');
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...headers,
    },
  });
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

/**
 * Infrastructure Xloud — RocSpace as the Unified Multi-Provider / Multi-OS
 * Orchestrator Platform (Big Scale Autonomous Models)
 */
export const INFRA_XLOUD = {
  description: "RocSpace = Infrastructure Xloud : All Apps + Integrated auto across providers. Multi-Orchestra + Autonomous Big Scale Models",
  providers: [
    "gateway (primary)", 
    "ais-dev (gemini-2.5-flash fast+high-thinking)", 
    "groq", "openrouter", "gemini-direct", "cloudflare-ai"
  ],
  orchestrator_modes: ["planner", "researcher", "coder", "reviewer", "tester", "grounding"],
  first_class: "AIS_DEV + GATEWAY priority (preserve legacy cloudrun only as fallback)",
  auto_import: "roc-agentsroute/hermes agent JSON ready for AI Studio / AIS-DEV",
} as const;

export const MULTI_ORCHESTRATOR = {
  hermes: "roc-agentsroute/hermes (patched autonomous loop)",
  roc_ai: "roc-containers roc-ai orchestrator (delegates to hermes)",
  lsmod: "Pewaris lsmod orchestration across all containers",
} as const;
