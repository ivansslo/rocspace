// workers/gateway/src/ai.ts
import { json } from './utils';
import { AI_MODELS } from '@rocspace/shared';
import type { Env } from './types';

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-specdec",
  "deepseek-r1-distill-llama-70b",
  "qwen-2.5-coder-32b"
];

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

const OPENAI_DIRECT_MODELS = [
  "gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
  "gpt-4o", "gpt-4o-mini", "gpt-4.5-preview", "o3-pro", "o3", "o3-mini", "o4-mini", "codex-mini"
];

const OPENAI_OR_MODELS = ["gpt-4o", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-oss-120b"];

export async function aiCall(env: Env, model: string, messages: any[], maxTokens = 4096, stream = false) {
  let provider: string;
  let apiKey: string | undefined;
  let baseUrl: string;

  // Route logic
  if (model.startsWith("groq/") || GROQ_MODELS.some(m => model.includes(m))) {
    provider = "groq";
    apiKey = env.GROQ_KEY;
    baseUrl = "https://api.groq.com/openai/v1";
    if (model.startsWith("groq/")) model = model.replace("groq/", "");
  } else if (
    (model.startsWith("openai-direct/") ||
     (!model.startsWith("openai/") && !model.startsWith("google/") && !model.startsWith("qwen/") &&
      !model.startsWith("deepseek/") && !model.startsWith("meta-llama/") &&
      OPENAI_DIRECT_MODELS.some(m => model === m) && env.OPENAI_KEY))
  ) {
    provider = "openai";
    apiKey = env.OPENAI_KEY;
    baseUrl = "https://api.openai.com/v1";
    if (model.startsWith("openai-direct/")) model = model.replace("openai-direct/", "");
    if (model.startsWith("openai/")) model = model.replace("openai/", "");
  } else if (GEMINI_MODELS.some(m => model.includes(m)) && !model.startsWith("google/")) {
    provider = "gemini";
    apiKey = env.GEMINI_KEY;
    baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
  } else if (model.startsWith("google/")) {
    provider = "openrouter";
    apiKey = env.OR_KEY;
    baseUrl = "https://openrouter.ai/api/v1";
  } else if (model.startsWith("openai/") && !env.OPENAI_KEY) {
    provider = "openrouter";
    apiKey = env.OR_KEY;
    baseUrl = "https://openrouter.ai/api/v1";
  } else if (OPENAI_OR_MODELS.some(m => model.includes(m)) && !env.OPENAI_KEY) {
    provider = "openrouter";
    apiKey = env.OR_KEY;
    baseUrl = "https://openrouter.ai/api/v1";
  } else {
    provider = "openrouter";
    apiKey = env.OR_KEY;
    baseUrl = "https://openrouter.ai/api/v1";
  }

  if (!apiKey) {
    // Fallback chain
    if (env.OPENAI_KEY) {
      provider = "openai";
      apiKey = env.OPENAI_KEY;
      baseUrl = "https://api.openai.com/v1";
      model = "gpt-4.1";
    } else if (env.GROQ_KEY) {
      provider = "groq";
      apiKey = env.GROQ_KEY;
      baseUrl = "https://api.groq.com/openai/v1";
      model = "llama-3.3-70b-versatile";
    } else if (env.OR_KEY) {
      provider = "openrouter";
      apiKey = env.OR_KEY;
      baseUrl = "https://openrouter.ai/api/v1";
      model = "qwen/qwen3-32b";
    } else if (env.GEMINI_KEY) {
      provider = "gemini";
      apiKey = env.GEMINI_KEY;
      baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
      model = "gemini-2.5-flash";
    } else {
      return json({ error: "No AI provider configured" }, 503);
    }
  }

  const body = { model, messages, max_tokens: maxTokens || 4096, stream };

  try {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://roadfx.biz.id";
      headers["X-Title"] = "RocSpace Gateway";
    }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (stream) {
      return new Response(resp.body, {
        status: resp.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e: any) {
    return json({ error: e.message }, 502);
  }
}

export function modelsList() {
  return new Response(JSON.stringify({
    object: "list",
    data: AI_MODELS.map((m: any) => ({
      id: m.id,
      object: "model",
      created: 1700000000,
      owned_by: m.provider
    }))
  }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
