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

