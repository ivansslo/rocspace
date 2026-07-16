// workers/gateway/src/utils.ts
import { Env } from './types';

export function isAuthed(request: Request, url: URL, token: string): boolean {
  if (!token) return false;
  const auth = request.headers.get("Authorization") || "";
  const qt = url.searchParams.get("token") || "";
  return auth === `Bearer ${token}` || qt === token;
}

export function json(d: unknown, s = 200): Response {
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

export function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

export function secHTML() {
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

export function reqMeta(request: Request) {
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
