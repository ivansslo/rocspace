"""Provider discovery and OpenAI-compatible completion clients (stdlib only)."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ProviderResult:
    provider: str
    ok: bool
    models: tuple[str, ...] = ()
    error: str | None = None


def _request(url: str, headers: dict[str, str], payload: dict[str, Any] | None = None, timeout: int = 20) -> Any:
    body = json.dumps(payload).encode() if payload is not None else None
    headers = {"User-Agent": "Mozilla/5.0 (compatible; RocSpace-Autonomy/1.0)", **headers}
    request = urllib.request.Request(url, data=body, headers=headers, method="POST" if body else "GET")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode())


def _error(exc: Exception) -> str:
    if isinstance(exc, urllib.error.HTTPError):
        return f"HTTP {exc.code}"
    if isinstance(exc, urllib.error.URLError):
        return f"Network error: {exc.reason}"
    return type(exc).__name__


def discover_models(env: dict[str, str] | None = None) -> list[ProviderResult]:
    """Discover catalogues only for providers whose keys are configured.

    Results contain provider names/model IDs and compact errors only. No token,
    endpoint header, or response body carrying a secret is returned.
    """
    env = env or os.environ
    results: list[ProviderResult] = []

    groq = env.get("GROQ_KEY")
    if groq:
        try:
            data = _request("https://api.groq.com/openai/v1/models", {"Authorization": f"Bearer {groq}"})
            results.append(ProviderResult("groq", True, tuple(sorted(x["id"] for x in data.get("data", [])))))
        except Exception as exc:
            results.append(ProviderResult("groq", False, error=_error(exc)))

    openai = env.get("OPENAI_API_KEY") or env.get("OPENAI_KEY")
    if openai:
        try:
            data = _request("https://api.openai.com/v1/models", {"Authorization": f"Bearer {openai}"})
            results.append(ProviderResult("openai", True, tuple(sorted(x["id"] for x in data.get("data", [])))))
        except Exception as exc:
            results.append(ProviderResult("openai", False, error=_error(exc)))

    gemini = env.get("GEMINI_KEY")
    if gemini:
        try:
            data = _request(f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini}", {})
            models = tuple(sorted(x.get("name", "").removeprefix("models/") for x in data.get("models", []) if x.get("name")))
            results.append(ProviderResult("gemini", True, models))
        except Exception as exc:
            results.append(ProviderResult("gemini", False, error=_error(exc)))

    return results


class ProviderClient:
    """Minimal completion router. Groq is first choice, then OpenAI.

    It is intentionally explicit rather than autonomous by default: callers
    choose the model and receive only model response text.
    """
    def __init__(self, env: dict[str, str] | None = None):
        self.env = env or os.environ

    def complete(self, model: str, messages: list[dict[str, str]], max_tokens: int = 256) -> str:
        # ROCSPACE-INITIAL is deliberately reachable only through a caller on
        # the Tailscale/private network. Its address is never placed in a
        # browser bundle or public Cloudflare Worker binding.
        if model == "rocspace/initial":
            private_base = self.env.get("ROCSPACE_PRIVATE_MODEL_BASE", "").rstrip("/")
            if not private_base:
                raise RuntimeError("ROCSPACE-INITIAL is staged; set ROCSPACE_PRIVATE_MODEL_BASE on a private Tailscale client after OCI deployment")
            data = _request(
                f"{private_base}/v1/chat/completions",
                {"Content-Type": "application/json"},
                {"model": self.env.get("ROCSPACE_PRIVATE_MODEL_ID", "rocspace-initial"), "messages": messages, "max_tokens": max_tokens},
            )
            if data.get("choices"):
                return data["choices"][0]["message"]["content"]
            raise RuntimeError("ROCSPACE-INITIAL did not return an OpenAI-compatible completion")
        # Default to the canonical API. This gives local tools the exact same
        # routing, access policy, and provider fallback behavior as the web app
        # without placing provider credentials in child processes.
        if self.env.get("ROCSPACE_DIRECT_PROVIDER") != "1":
            base = self.env.get("ROCSPACE_API_BASE", "https://api.roadfx.biz.id").rstrip("/")
            data = _request(
                f"{base}/v1/chat/completions",
                {"Content-Type": "application/json"},
                {"model": model, "messages": messages, "max_tokens": max_tokens},
            )
            if data.get("choices"):
                return data["choices"][0]["message"]["content"]
            error = data.get("error", {})
            raise RuntimeError(error.get("message", "Canonical API completion failed"))
        # Route model families before considering key order. The Groq catalogue
        # endpoint may be restricted while its inference endpoint remains
        # available, so Llama/Groq models intentionally prefer GROQ_KEY.
        if self.env.get("GROQ_KEY") and (model.startswith("llama-") or model.startswith("groq/")):
            model = model.removeprefix("groq/")
            data = _request(
                "https://api.groq.com/openai/v1/chat/completions",
                {"Authorization": f"Bearer {self.env['GROQ_KEY']}", "Content-Type": "application/json"},
                {"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": 0},
            )
            return data["choices"][0]["message"]["content"]
        gemini = self.env.get("GEMINI_KEY")
        if gemini and model.startswith("gemini-"):
            prompt = "\n".join(message["content"] for message in messages if message.get("content"))
            data = _request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini}",
                {"Content-Type": "application/json"},
                {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0}},
            )
            return data["candidates"][0]["content"]["parts"][0]["text"]
        key = self.env.get("OPENAI_API_KEY") or self.env.get("OPENAI_KEY")
        if key:
            data = _request(
                "https://api.openai.com/v1/chat/completions",
                {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                {"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": 0},
            )
            return data["choices"][0]["message"]["content"]
        if self.env.get("GROQ_KEY"):
            data = _request(
                "https://api.groq.com/openai/v1/chat/completions",
                {"Authorization": f"Bearer {self.env['GROQ_KEY']}", "Content-Type": "application/json"},
                {"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": 0},
            )
            return data["choices"][0]["message"]["content"]
        raise RuntimeError("No configured OpenAI-compatible provider key")
