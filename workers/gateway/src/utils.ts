// workers/gateway/src/utils.ts
function isAuthed(request, url, token) {
  if (!token) return false;
  const auth = request.headers.get("Authorization") || "";
  const qt = url.searchParams.get("token") || "";
  return auth === `Bearer ${token}` || qt === token;
}
function json(d, s = 200) {
  return new Response(JSON.stringify(d, null, 2), {
    status: s,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN"
    }
  });
}
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}
function secHTML() {
  return {
    "Content-Type": "text/html;charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:"
  };
}
function reqMeta(request) {
  return {
    method: request.method,
    path: new URL(request.url).pathname,
    colo: request.cf?.colo || "",
    country: request.cf?.country || "",
    ip: (request.headers.get("CF-Connecting-IP") || "").replace(/(\d+\.\d+)\.\d+\.\d+$/, "$1.x.x"),
    ua: (request.headers.get("User-Agent") || "").slice(0, 160)
  };
}

// packages/shared/src/index.ts
var AI_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", emoji: "\u26A1", provider: "groq", speed: "fast" },
  { id: "llama-3.1-8b-instant", label: "Llama 8B Fast", emoji: "\u{1F680}", provider: "groq", speed: "fast" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B", emoji: "\u{1F9E0}", provider: "openrouter", speed: "medium", thinking: true },
  { id: "qwen/qwen3-235b-a22b", label: "Qwen3 235B", emoji: "\u{1F3C6}", provider: "openrouter", speed: "slow" },
  { id: "qwen/qwen3.6-27b", label: "Qwen3.6 27B", emoji: "\u{1F52C}", provider: "openrouter", speed: "medium", thinking: true },
  { id: "openai/gpt-4o", label: "GPT-4o", emoji: "\u{1F48E}", provider: "openrouter", speed: "medium" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", emoji: "\u{1F9BE}", provider: "openrouter", speed: "slow" },
  { id: "gpt-4.1", label: "GPT-4.1", emoji: "\u{1F537}", provider: "openai", speed: "medium" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", emoji: "\u{1F539}", provider: "openai", speed: "fast" },
  { id: "gpt-4o", label: "GPT-4o Direct", emoji: "\u{1F4A0}", provider: "openai", speed: "medium" },
  { id: "o3-mini", label: "O3 Mini", emoji: "\u{1F9E9}", provider: "openai", speed: "medium" },
  { id: "o4-mini", label: "O4 Mini", emoji: "\u{1F3AF}", provider: "openai", speed: "medium" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", emoji: "\u{1F52E}", provider: "openrouter", speed: "slow", thinking: true },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Scout Vision", emoji: "\u{1F441}\uFE0F", provider: "openrouter", speed: "medium" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", emoji: "\u2728", provider: "google", speed: "fast" },
  { id: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro", emoji: "\u{1F31F}", provider: "google", speed: "slow" }
];

