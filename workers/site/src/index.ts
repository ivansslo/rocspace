// ═══════════════════════════════════════════════════════════
//  roc-site — Unified Router v19.1.0 "Command Center"
//  Kanonik: hub.roadfx.biz.id (anti-mirror) · API: api.roadfx.biz.id
//  17 hosts → roc-site, WebVirtCloud + Firebase (yttriferous-magpie-16ppv)
// ═══════════════════════════════════════════════════════════

import { ENDPOINTS, DOMAIN_MAP, AI_STUDIO, CANONICAL, HUB_SECTIONS, corsHeaders, jsonResponse, htmlResponse } from '@rocspace/shared';
import { connect } from 'cloudflare:sockets';

const GATEWAY = ENDPOINTS.GATEWAY;
const CLOUDRUN = ENDPOINTS.CLOUDRUN;
const AIS_DEV = ENDPOINTS.AIS_DEV;  // New candidate: Google AI Studio Applet (asia-east1)
const VM_HOST = '161.118.253.28';

// v19: di host lama, prefix FUNGSIONAL ini TIDAK dialihkan (mesin/webhook aman);
// semua halaman (GET/HEAD lain) di-301-kan ke hub.roadfx.biz.id (anti-mirror).
const LEGACY_KEEP_PREFIX = ['/api/', '/v1/', '/ai/', '/auth/', '/gateway/', '/webhook/', '/cloudrun/', '/crawl', '/notify', '/solace', '/.well-known/'];

// ─── Oracle VM TCP bridge (Workers fetch() ke IP-literal diblokir CF 1003) ──
// Raw HTTP/1.1 over TCP socket → mengambil endpoint JSON dari VM (Nginx :80).
async function vmTcpGet(path: string, timeoutMs = 6000): Promise<string> {
  const socket = connect({ hostname: VM_HOST, port: 80 });
  const enc = new TextEncoder();
  const req = `GET ${path} HTTP/1.1\r\nHost: ${VM_HOST}\r\nUser-Agent: roc-site/18\r\nAccept: application/json\r\nConnection: close\r\n\r\n`;
  const writeAndRead = (async () => {
    const writer = socket.writable.getWriter();
    await writer.write(enc.encode(req));
    writer.releaseLock();
    const reader = socket.readable.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    reader.releaseLock();
    return chunks;
  })();
  const chunks = await Promise.race([
    writeAndRead,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('vm socket timeout')), timeoutMs)),
  ]);
  await socket.close().catch(() => {});
  let len = 0;
  for (const c of chunks) len += c.length;
  const buf = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) { buf.set(c, off); off += c.length; }
  const raw = new TextDecoder().decode(buf);
  const idx = raw.indexOf('\r\n\r\n');
  if (idx === -1) throw new Error('vm bad response');
  const statusLine = raw.slice(0, raw.indexOf('\r\n'));
  if (!/^HTTP\/1\.[01] 2\d\d/.test(statusLine)) throw new Error(`vm ${statusLine}`);
  return raw.slice(idx + 4);
}

const FULL_DOMAIN_MAP = [
  { hostname: CANONICAL.HUB, worker: 'site', description: '🛰️ Hub Tunggal (kanonik)' },
  ...DOMAIN_MAP,
  { hostname: 'vm.roadfx.biz.id',      worker: 'site', description: '🖥️ VM Console (WebVirtCloud + Firebase)' },
  { hostname: 'monitor.roadfx.biz.id',  worker: 'site', description: '📊 Uptime Monitor' },
];

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const host = url.hostname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // ─── v19: Hub Tunggal (satu situs kanonik, anti-mirror) ─────────
    // Semua HALAMAN di host lama → 301 ke hub.roadfx.biz.id (path dipertahankan).
    // Endpoint fungsional (proxy/webhook/health) tetap dilayani di host lama
    // + ditandai deprecated (opsi 3). Host API (api./gateway./ai.) = mesin
    // murni → tidak disentuh sama sekali; api.roadfx.biz.id adalah nama API kanonik.
    const HUB = CANONICAL.HUB;
    const isApiHost = host.startsWith('api.') || host.startsWith('gateway.') || host.startsWith('ai.');
    if (host !== HUB && !host.endsWith('.workers.dev') && !isApiHost) {
      const functional = path === '/health' || LEGACY_KEEP_PREFIX.some(p => path.startsWith(p));
      if (!functional && (request.method === 'GET' || request.method === 'HEAD')) {
        const section = HUB_SECTIONS[host.split('.')[0]] ?? '/';
        const target = path === '/' ? section : path;
        return Response.redirect(`https://${HUB}${target}${url.search}`, 301);
      }
      const resp = await serve(request, env);
      const h = new Headers(resp.headers);
      h.set('X-ROC-Deprecated-Host', host);
      h.set('X-ROC-Hub', `https://${HUB}`);
      h.set('Deprecation', 'true');
      return new Response(resp.body, { status: resp.status, headers: h });
    }
    return serve(request, env);
  }
};

// Pipeline lama (host-agnostic untuk path) — dipakai hub & endpoint fungsional.
async function serve(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const host = url.hostname;
    const gwToken = env.GATEWAY_TOKEN || '';

    // ─── Health bridge (v19: host-agnostic — jalan di hub juga) ─────
    // dashboard/AI Studio page tidak bisa fetch http://IP langsung (mixed
    // content) → /health di-proxy server-side dari sini. Workers fetch() ke
    // IP-literal diblokir (CF error 1003) dan token kami Read-only (tak bisa
    // buat record origin) → pakai raw TCP socket ke Nginx VM.
    if (path === '/health') {
      try {
        const body = await vmTcpGet('/health');
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(), 'Cache-Control': 'no-store' },
        });
      } catch {
        return new Response(JSON.stringify({ status: 'down', host: 'roc-vm', error: 'VM unreachable' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(), 'Cache-Control': 'no-store' },
        });
      }
    }

    // ─── VM Console (legacy host — halamannya kini 301 → hub/vm) ────
    if (host.startsWith('vm.')) {
      if (path === '/' || path === '') return htmlResponse(renderVMConsole());
      return Response.redirect(`http://${VM_HOST}/vm${path === '/' ? '/' : path}`, 302);
    }
    if (host.startsWith('monitor.')) {
      return Response.redirect(`http://${VM_HOST}/monitor${path === '/' ? '/' : path}`, 302);
    }

    // ─── Hub exact sections (v19) — bentuk tanpa trailing slash ────
    if (path === '/ai' || path === '/gateway') return proxyTo(request, GATEWAY, '/', url, gwToken);
    if (path === '/cloudrun') return proxyTo(request, GATEWAY, '/dashboard', url, gwToken);
    if (path === '/auth' || path === '/factory' || path === '/r2') return proxyTo(request, GATEWAY, path, url, gwToken);
    if (path === '/webhook') return proxyTo(request, GATEWAY, path, url, gwToken);
    if (path === '/app') return Response.redirect(`${url.origin}/links`, 302);

    // ─── Path-based VM/Monitor ──────────────────────────
    if (path === '/vm' || path === '/vm/') return htmlResponse(renderVMConsole());
    if (path.startsWith('/vm/')) return Response.redirect(`http://${VM_HOST}${path}`, 302);
    if (path === '/monitor' || path === '/monitor/') return Response.redirect(`http://${VM_HOST}/monitor/`, 302);
    if (path.startsWith('/monitor/')) return Response.redirect(`http://${VM_HOST}/monitor${path.substring(9)}`, 302);

    // ─── AI / API (auto-auth) ───────────────────────────
    if (path.startsWith('/ai/')) return proxyTo(request, GATEWAY, path, url, gwToken);
    if (path.startsWith('/v1/')) return proxyTo(request, GATEWAY, path, url, gwToken);

    // ─── Host-based routing ─────────────────────────────
    if (host.startsWith('ai.') && !host.startsWith('aiven')) return proxyTo(request, GATEWAY, path, url, gwToken);
    if (host.startsWith('gateway.')) return proxyTo(request, GATEWAY, path, url, gwToken);
    if (host.startsWith('api.')) return proxyTo(request, GATEWAY, path, url, gwToken);
    if (host.startsWith('chat.') || host.startsWith('live.')) {
      // CloudRun DOWN (billing) — route to Gateway (full chat-live + Clerk auth)
      return proxyTo(request, GATEWAY, path === '/' ? '/chat-live' : path, url, gwToken);
    }
    if (host.startsWith('status.')) return htmlResponse(renderStatus());
    if (host.startsWith('dashboard.')) return proxyTo(request, GATEWAY, '/dashboard', url, gwToken);
    if (host.startsWith('cloudrun.')) {
      // Support /cloudrun/ais for the new candidate
      if (path.startsWith('/ais')) {
        return proxyTo(request, AIS_DEV, path.replace('/ais', '') || '/', url);
      }
      return proxyTo(request, GATEWAY, path === '/' ? '/dashboard' : path, url, gwToken);
    }
    if (host.startsWith('auth.')) return proxyTo(request, GATEWAY, path, url);
    if (host.startsWith('factory.')) return proxyTo(request, GATEWAY, path, url, gwToken);
    if (host.startsWith('webhook.')) return proxyTo(request, GATEWAY, path, url, gwToken);
    if (host.startsWith('r2.')) return proxyTo(request, GATEWAY, path, url);
    if (host.startsWith('app.')) {
      if (path === '/' || path === '') return Response.redirect('https://roadfx.biz.id/links', 302);
      return proxyTo(request, GATEWAY, path, url);
    }

    // ─── Path-based routing ─────────────────────────────
    if (path === '/chat-live' || path.startsWith('/chat-live/')) {
      // CloudRun DOWN → use Gateway (full chat-live UI + auth)
      return proxyTo(request, GATEWAY, path, url, gwToken);
    }
    if (path === '/profile' || path.startsWith('/profile/')) return Response.redirect(url.origin + '/chat-live#profile', 302);
    if (path === '/chat') return htmlResponse(renderQuickChat());
    if (path === '/status') return htmlResponse(renderStatus());
    if (path.startsWith('/api/')) return proxyTo(request, GATEWAY, path, url);
    if (path.startsWith('/auth/')) return proxyTo(request, GATEWAY, path, url);
    if (path.startsWith('/gateway/')) return proxyTo(request, GATEWAY, path.replace('/gateway', ''), url);
    if (path.startsWith('/cloudrun/')) {
      const sub = path.replace('/cloudrun', '');
      if (sub.startsWith('/ais')) {
        // Explicit /cloudrun/ais → new candidate
        return proxyTo(request, AIS_DEV, sub.replace('/ais', '') || '/', url);
      }
      // Default: CloudRun DOWN → Gateway
      return proxyTo(request, GATEWAY, '/dashboard', url, gwToken);
    }

    // v19.1: applet AIS kandidat (AIS_DEV) mati 404 → di hub arahkan ke applet resmi privat
    if ((path === '/ais' || path === '/ais-dev') && host === CANONICAL.HUB) return Response.redirect(AI_STUDIO.APP, 302);

    // ─── New AIS_DEV fallback (Google AI Studio Applet / new CloudRun) ──
    // Usage: /ais , /ais/..., /ais-dev , /ais-dev/...
    if (path === '/ais' || path.startsWith('/ais/') || path === '/ais-dev' || path.startsWith('/ais-dev/')) {
      const subpath = path.replace(/^\/(ais|ais-dev)/, '') || '/';
      return proxyTo(request, AIS_DEV, subpath, url);
    }

    // Optional: host-based new candidate (e.g. ais.roadfx.biz.id or newcr.roadfx.biz.id)
    if (host.startsWith('ais.') || host.startsWith('newcr.') || host.startsWith('ais-dev.')) {
      return proxyTo(request, AIS_DEV, path, url);
    }

    if (path.startsWith('/webhook/')) return proxyTo(request, GATEWAY, path, url, gwToken);
    if (path === '/crew' || path.startsWith('/crew/') || path === '/crawl4ai' || path.startsWith('/crawl4ai/') ||
        path === '/zapier' || path.startsWith('/zapier/') || path === '/logs' || path.startsWith('/logs/') ||
        path === '/dashboard' || path.startsWith('/dashboard/')) return proxyTo(request, GATEWAY, path, url);
    if (path === '/links') return host === CANONICAL.HUB ? htmlResponse(renderLinks()) : proxyTo(request, GATEWAY, '/links', url);
    if (path === '/solace/' || path === '/solace/status' || path === '/solace/queues') return proxyTo(request, GATEWAY, path, url);
    if (path.startsWith('/crawl') || path.startsWith('/notify')) return proxyTo(request, GATEWAY, path, url);

    // v19: hub = landing kanonik; host lain (workers.dev/internal) = dashboard lama
    return htmlResponse(host === CANONICAL.HUB ? renderHub() : renderDashboard());
}

async function proxyTo(request: Request, base: string, path: string, url: URL, injectToken?: string): Promise<Response> {
  try {
    const target = base + path + url.search;
    const headers = new Headers(request.headers);
    for (const key of ['cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker']) headers.delete(key);
    headers.set('X-Forwarded-Host', url.hostname);
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
    if (injectToken) {
      const existingAuth = headers.get('Authorization') || '';
      if (!existingAuth || existingAuth === 'Bearer ' || existingAuth === 'Bearer') {
        headers.set('Authorization', `Bearer ${injectToken}`);
      }
    }
    const resp = await fetch(target, { method: request.method, headers, body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined });
    const newHeaders = new Headers(resp.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    const location = newHeaders.get('location');
    if (location?.includes('ai-vitality')) {
      newHeaders.set('location', location.replace(/https?:\/\/ai-vitality-[^.]+\.us-west1\.run\.app/g, `https://${url.hostname}`));
    }
    return new Response(resp.body, { status: resp.status, headers: newHeaders });
  } catch (e: any) { return jsonResponse({ error: e.message }, 502); }
}

// ─── VM Console (Firebase bridge - yttriferous-magpie-16ppv) ──

function renderVMConsole(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RocSpace VM — WebVirtCloud</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
.header{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-bottom:1px solid #334155;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
.header h1{font-size:18px;font-weight:600;color:#60a5fa}
.badge{padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;color:#fff}
.badge-ok{background:#22c55e}.badge-warn{background:#f59e0b}.badge-err{background:#ef4444}
.container{display:flex;height:calc(100vh - 52px)}
.sidebar{width:220px;background:#1e293b;border-right:1px solid #334155;padding:16px 0;overflow-y:auto;flex-shrink:0}
.si{padding:10px 20px;cursor:pointer;transition:all .15s;font-size:13px;display:flex;align-items:center;gap:8px}
.si:hover{background:#334155}.si.active{background:#3b82f6;color:#fff}
.main{flex:1;position:relative}
iframe{width:100%;height:100%;border:none}
.overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:#0f172a;display:flex;align-items:center;justify-content:center;z-index:10}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px;width:380px;text-align:center}
.card h2{color:#60a5fa;margin-bottom:8px;font-size:20px}.card p{color:#94a3b8;font-size:13px;margin-bottom:24px}
.btn{background:#3b82f6;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;width:100%;transition:background .15s}
.btn:hover{background:#2563eb}.btn-danger{background:#ef4444}.btn-danger:hover{background:#dc2626}
.spinner{width:24px;height:24px;border:3px solid #334155;border-top:3px solid #3b82f6;border-radius:50%;animation:spin .8s linear infinite;margin:16px auto}
@keyframes spin{to{transform:rotate(360deg)}}
.user-info{display:flex;align-items:center;gap:8px;font-size:12px}
.avatar{width:28px;height:28px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
.status-bar{position:absolute;bottom:0;left:0;right:0;background:#1e293b;border-top:1px solid #334155;padding:6px 16px;font-size:11px;color:#64748b;display:flex;justify-content:space-between;z-index:5}
@media(max-width:768px){.sidebar{display:none}}
</style>
</head>
<body>
<div class="header">
  <h1>🖥️ RocSpace VM Console</h1>
  <div style="display:flex;align-items:center;gap:12px">
    <span class="badge badge-warn" id="fb-status">Firebase: Checking...</span>
    <div class="user-info" id="user-info" style="display:none">
      <div class="avatar" id="u-avatar"></div>
      <span id="u-name"></span>
      <button class="btn btn-danger" style="width:auto;padding:4px 10px;font-size:11px" onclick="signOutUser()">Logout</button>
    </div>
  </div>
</div>
<div class="container">
  <div class="sidebar">
    <div class="si active" onclick="nav('wvc',this)">🖥️ VM Console</div>
    <div class="si" onclick="nav('instances',this)">💻 Instances</div>
    <div class="si" onclick="nav('networks',this)">🌐 Networks</div>
    <div class="si" onclick="nav('storages',this)">💾 Storages</div>
    <div class="si" onclick="nav('admin',this)">⚙️ Admin</div>
    <hr style="border-color:#334155;margin:12px 16px">
    <div class="si" onclick="window.open('https://ai.roadfx.biz.id','_blank')">🧠 AI Gateway</div>
    <div class="si" onclick="window.open('https://roadfx.biz.id','_blank')">🏠 Home</div>
    <div class="si" onclick="window.open('https://monitor.roadfx.biz.id','_blank')">📊 Monitor</div>
  </div>
  <div class="main">
    <div class="overlay" id="overlay">
      <div class="card">
        <h2>🖥️ RocSpace VM</h2>
        <p>Sign in with Google to manage virtual machines</p>
        <div class="spinner" id="auth-load"></div>
        <button class="btn" id="auth-btn" style="display:none" onclick="signInWithFirebase()">🔑 Sign in with Google</button>
        <p id="auth-err" style="color:#f87171;font-size:12px;margin-top:12px;display:none"></p>
      </div>
    </div>
    <iframe id="wvc-frame" src="" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"></iframe>
    <div class="status-bar">
      <span id="conn-status">WebVirtCloud: Waiting for auth...</span>
      <span>RocSpace v19.1.0 · Firebase yttriferous-magpie-16ppv</span>
    </div>
  </div>
</div>
<script type="module">
import{initializeApp}from'https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js';
import{getAuth,signInWithPopup,GoogleAuthProvider,onAuthStateChanged,signOut}from'https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js';

// Firebase web config below is the PUBLIC client config by design
// (identitas client yttriferous; keamanan dijaga Firebase Auth + Security Rules).
// Semua kredensial rahasia → CF secret bindings, tidak pernah di source.
const cfg={apiKey:"AIzaSyBLpdsheG9pYmtYqGgo0af0_5Du_fDvJYk",authDomain:"yttriferous-magpie-16ppv.firebaseapp.com",projectId:"yttriferous-magpie-16ppv",storageBucket:"yttriferous-magpie-16ppv.firebasestorage.app",messagingSenderId:"819208434965",appId:"1:819208434965:web:35c60025a91bd089c3251c"};
const app=initializeApp(cfg);const auth=getAuth(app);const prov=new GoogleAuthProvider();
const WVC="http://161.118.253.28/vm/wvc/";

window.signInWithFirebase=async()=>{
  try{document.getElementById('auth-btn').style.display='none';document.getElementById('auth-load').style.display='block';await signInWithPopup(auth,prov)}
  catch(e){document.getElementById('auth-err').textContent=e.message;document.getElementById('auth-err').style.display='block';document.getElementById('auth-btn').style.display='block';document.getElementById('auth-load').style.display='none'}
};
window.signOutUser=async()=>{await signOut(auth);location.reload()};

onAuthStateChanged(auth,u=>{
  if(u){
    document.getElementById('overlay').style.display='none';
    document.getElementById('fb-status').textContent='Firebase: Connected';document.getElementById('fb-status').className='badge badge-ok';
    document.getElementById('user-info').style.display='flex';
    document.getElementById('u-name').textContent=u.displayName||u.email;
    document.getElementById('u-avatar').textContent=(u.displayName||u.email).charAt(0).toUpperCase();
    document.getElementById('wvc-frame').src=WVC;
    document.getElementById('conn-status').textContent='WebVirtCloud: Connected as '+u.email;
  }else{
    document.getElementById('overlay').style.display='flex';document.getElementById('auth-load').style.display='none';
    document.getElementById('auth-btn').style.display='block';
    document.getElementById('fb-status').textContent='Firebase: Not signed in';document.getElementById('fb-status').className='badge badge-warn';
    document.getElementById('user-info').style.display='none';
  }
});

window.nav=(s,el)=>{
  document.querySelectorAll('.si').forEach(i=>i.classList.remove('active'));el.classList.add('active');
  const f=document.getElementById('wvc-frame');
  const r={wvc:WVC,instances:WVC+'instances/',networks:WVC+'networks/',storages:WVC+'storages/',admin:WVC+'admin/'};
  if(r[s])f.src=r[s];
};
</script>
</body></html>`;
}

// ─── Dashboard ─────────────────────────────────────────

function renderDashboard(): string {
  const domains = FULL_DOMAIN_MAP.map(d => `<a href="https://${d.hostname}" class="domain-card">${d.description.split(' ')[0]} ${d.hostname}</a>`).join('\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RocSpace — AI Dashboard</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh}
.hero{text-align:center;padding:60px 20px 40px;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e)}.hero h1{font-size:2.5em;font-weight:800;background:linear-gradient(135deg,#60a5fa,#a78bfa,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.hero p{color:#94a3b8;margin:12px 0 24px;font-size:1.1em}.hero .tag{display:inline-block;padding:6px 14px;border-radius:20px;font-size:0.8em;margin:4px;background:rgba(96,165,250,0.15);color:#60a5fa;border:1px solid rgba(96,165,250,0.3)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1200px;margin:40px auto;padding:0 20px}.card{background:#12121a;border:1px solid #1e1e2e;border-radius:16px;padding:24px;transition:all 0.3s;cursor:pointer;text-decoration:none;color:inherit;display:block}.card:hover{border-color:#60a5fa;box-shadow:0 0 30px rgba(96,165,250,0.1);transform:translateY(-2px)}.card h2{font-size:1.3em;margin-bottom:8px}.card p{color:#94a3b8;font-size:0.9em;line-height:1.6}.card .stat{font-size:2em;font-weight:700;background:linear-gradient(135deg,#34d399,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.card .label{color:#64748b;font-size:0.8em}
nav{text-align:center;padding:16px;background:#0f0f17;border-bottom:1px solid #1e1e2e}nav a{color:#94a3b8;text-decoration:none;margin:0 12px;font-size:0.9em;padding:8px 16px;border-radius:8px;transition:0.2s}nav a:hover{color:#60a5fa;background:rgba(96,165,250,0.1)}
.svc-row{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#12121a;border:1px solid #1e1e2e;border-radius:12px;margin-bottom:8px}.svc-name{font-weight:600;font-size:0.95em}.svc-detail{color:#64748b;font-size:0.8em;margin-top:2px}.svc-status{padding:4px 12px;border-radius:20px;font-size:0.75em;font-weight:600;white-space:nowrap}.on{background:rgba(52,211,153,0.15);color:#34d399}.warn{background:rgba(251,191,36,0.15);color:#fbbf24}.off{background:rgba(239,68,68,0.15);color:#ef4444}
.services{max-width:1200px;margin:40px auto;padding:0 20px}.domain-grid{max-width:1200px;margin:40px auto;padding:0 20px}.domain-card{display:inline-block;padding:10px 18px;background:#12121a;border:1px solid #1e1e2e;border-radius:10px;margin:4px;color:#60a5fa;text-decoration:none;font-size:0.85em;font-family:monospace;transition:0.2s}.domain-card:hover{border-color:#60a5fa;background:#1a1a2e}footer{text-align:center;padding:40px;color:#475569;font-size:0.8em}
</style></head><body>
<nav><a href="/">🏠 Dashboard</a><a href="/chat-live">💬 Chat Live</a><a href="/chat">🤖 Quick Chat</a><a href="/status">📊 Status</a><a href="/vm">🖥️ VM Console</a></nav>
<div class="hero"><h1>RocSpace</h1><p>AI Infrastructure · Unified Router · v19.1.0</p>
<span class="tag">🤖 16 AI Models</span><span class="tag">📡 Solace PubSub+</span><span class="tag">☁️ CF Workers</span><span class="tag">🧠 Cloud Run</span><span class="tag">🖥️ Oracle VM</span><span class="tag">🔥 Firebase</span><span class="tag">🛡️ WebVirtCloud</span><span class="tag">🎨 AI Studio (rocspace.ai.studio)</span></div>
<div class="grid">
<a href="/vm" class="card"><h2>🖥️ VM Console</h2><div class="stat">KVM</div><div class="label">WebVirtCloud + Firebase</div><p>VM management · Firebase Auth · noVNC</p></a>
<a href="/chat-live" class="card"><h2>🔴 Chat Live</h2><div class="stat">16</div><div class="label">AI Models</div><p>Clerk auth · 8 social logins · 3 modes</p></a>
<a href="/chat" class="card"><h2>💬 Quick Chat</h2><div class="stat">16</div><div class="label">Chat Models</div><p>No login · OpenAI · Gemini · Groq · Qwen</p></a>
<a href="/monitor" class="card"><h2>📊 Monitor</h2><div class="stat">99%</div><div class="label">Uptime</div><p>Uptime Kuma · Alerts · Status Pages</p></a>
<a href="https://ai.roadfx.biz.id" class="card"><h2>🧠 AI Engine</h2><div class="stat">5</div><div class="label">Providers</div><p>Groq · OpenRouter · Google · OpenAI</p></a>
<a href="https://app.roadfx.biz.id" class="card"><h2>📱 Apps Hub</h2><div class="stat">16</div><div class="label">Domains</div><p>Apps · Tools · Skills</p></a>
<a href="${AI_STUDIO.APP}" class="card"><h2>🎨 AI Studio</h2><div class="stat">🚀</div><div class="label">rocspace.ai.studio 🔒</div><p>Applet privat Google AI Studio · Gemini · AIS-DEV (login Google pemilik)</p></a>
</div>
<div class="services"><h2 style="margin-bottom:16px;font-size:1.3em">🔄 Infrastructure</h2>
<div class="svc-row"><div><div class="svc-name">WebVirtCloud + Firebase</div><div class="svc-detail">Oracle VM · yttriferous-magpie-16ppv · KVM</div></div><span class="svc-status on">● Running</span></div>
<div class="svc-row"><div><div class="svc-name">Gateway (hermes-cloudflare)</div><div class="svc-detail">v19.1.0 · 16 models · 5 providers</div></div><span class="svc-status on">● Active</span></div>
<div class="svc-row"><div><div class="svc-name">CloudRun (ai-vitality)</div><div class="svc-detail">us-west1 · billing issue</div></div><span class="svc-status off">● Down</span></div>
<div class="svc-row"><div><div class="svc-name">AIS-DEV (new candidate)</div><div class="svc-detail">asia-east1 · AI Studio Applet (fallback)</div></div><span class="svc-status warn">● Available</span></div>
<div class="svc-row"><div><div class="svc-name">AI Studio Applet</div><div class="svc-detail">alias: rocspace.ai.studio 🔒 · privat · aistudio.google.com</div></div><span class="svc-status on">● Integrated</span></div>
<div class="svc-row"><div><div class="svc-name">CF Workers (roc-site)</div><div class="svc-detail">v19.1.0 · 16 domains</div></div><span class="svc-status on">● Active</span></div>
<div class="svc-row"><div><div class="svc-name">Oracle Cloud VM</div><div class="svc-detail">Singapore · 1CPU/16GB · Docker</div></div><span class="svc-status on">● Running</span></div>
<div class="svc-row"><div><div class="svc-name">Clerk Auth</div><div class="svc-detail">25 origins · 8 social logins</div></div><span class="svc-status on">● Active</span></div>
<div class="svc-row"><div><div class="svc-name">Firebase Auth</div><div class="svc-detail">yttriferous-magpie-16ppv · Google Sign-in</div></div><span class="svc-status on">● Active</span></div>
<div class="svc-row"><div><div class="svc-name">Solace PubSub+</div><div class="svc-detail">Singapore · 5 queues</div></div><span class="svc-status on">● Connected</span></div>
</div>
<div class="domain-grid"><h2 style="margin-bottom:16px;font-size:1.3em">🌐 Domains (All → roc-site)</h2>${domains}</div>
<footer>RocSpace by RoadFX AI · 2026 · v19.1.0 · <a href="https://github.com/ivansslo/rocspace" style="color:#60a5fa">GitHub</a></footer>
</body></html>`;
}

// ─── Quick Chat ────────────────────────────────────────

// ─── v19.1: Command Center — landing kanonik hub.roadfx.biz.id ────
// Gaya mengikuti template "full-stack-dashboard" (zinc-950, neon cyan/fuchsia,
// agent orchestra 8 mode) · sinkron live via fetch · tanpa mirror.
function renderHub(): string {
  const cards = [
    { href: '/vm',        icon: '🖥️', title: 'VM Console', stat: 'KVM', label: 'webvirtcloud.ai.studio',    desc: 'WebVirtCloud · Firebase Auth · noVNC' },
    { href: '/monitor',   icon: '📊', title: 'Monitor',    stat: '99%', label: 'Uptime Kuma',               desc: 'Alerts · status pages' },
    { href: '/ai',        icon: '🧠', title: 'AI Gateway', stat: '16',  label: 'Models',                    desc: 'Groq · OpenRouter · Google · OpenAI' },
    { href: '/chat-live', icon: '🔴', title: 'Chat Live',  stat: '🔐',  label: 'Clerk auth',                desc: '8 social logins · 3 modes' },
    { href: '/chat',      icon: '💬', title: 'Quick Chat', stat: '⚡',  label: 'No login',                  desc: 'Langsung pakai, tanpa akun' },
    { href: '/status',    icon: '📈', title: 'Status',     stat: '●',   label: 'Live',                      desc: 'Kesehatan seluruh layanan' },
    { href: '/dashboard', icon: '🎛️', title: 'Dashboard',  stat: '∞',   label: 'Gateway UI',                desc: 'Panel infrastruktur hermes' },
    { href: '/links',     icon: '🗂️', title: 'Directory',  stat: '☰',   label: 'Lokal v19.1',               desc: 'Semua koneksi & integrasi ROC (tidak lagi via gateway 522)' },
    { href: '/cloudrun',  icon: '☁️', title: 'Cloud Run',  stat: '—',   label: 'via gateway',               desc: 'ai-vitality DOWN (billing) → fallback' },
  ].map(c => `<a href="${c.href}" class="card"><h2>${c.icon} ${c.title}</h2><div class="stat">${c.stat}</div><div class="label">${c.label}</div><p>${c.desc}</p></a>`).join('\n');

  const modes = [
    ['🎯','task','Task Planner'],['💻','code','Code Builder'],['🧠','think','Deep Thinker'],
    ['🛡️','ground','Grounding Analyst'],['🔨','hack','Security Reviewer'],['🔎','research','Research Scout'],
    ['🪄','sculp','UX Sculptor'],['🔬','ask','Clarifying Agent'],
  ].map(m => `<a href="/chat-live" class="mode" title="${m[2]}"><span>${m[0]}</span>${m[1]}</a>`).join('');

  const probes = [
    ['VM Bridge (Oracle roc-vm)', '/health', 'hub · raw TCP socket → Nginx'],
    ['API kanonik (16 models)', 'https://api.roadfx.biz.id/v1/models', 'api.roadfx.biz.id'],
    ['Chat Live (Clerk)', '/chat-live', 'via hermes-cloudflare'],
    ['Status page', '/status', 'render lokal worker'],
  ].map(p => `<div class="svc-row"><div><div class="svc-name">${p[0]}</div><div class="svc-detail">${p[2]}</div></div><span class="svc-status warn" data-probe="${p[1]}">● cek…</span></div>`).join('\n');

  const repos = [
    ['rocspace', 'repo ini — hub + shared v19.1.0', '🛰️'],
    ['Solace-Hermes-Project', 'kandidat sumber gateway hermes-cloudflare', '📡'],
    ['roadfx-ai-stack', 'stack AI Cloud Run (arsip)', '☁️'],
    ['ai-vitality', 'Cloud Run ai-vitality — 🔴 DOWN billing OR_BACR2_44', '🧯'],
    ['roc-containers', 'Termux menu/wrapper v1.6.0', '📱'],
    ['roc-agentsroute', 'hermes CLI v5.13.1 "Oracle"', '🧭'],
    ['Rofwin', 'APK v1.0.1 (9 aset release)', '🎮'],
  ].map(r => `<a href="https://github.com/ivansslo/${r[0]}" class="repo"><span class="ric">${r[2]}</span><span><b>${r[0]}</b><br><small>${r[1]}</small></span></a>`).join('\n');

  const oldHosts = FULL_DOMAIN_MAP.filter(d => d.hostname !== CANONICAL.HUB)
    .map(d => `<a href="https://${d.hostname}" class="domain-card" title="301 → hub">${d.description.split(' ')[0]} ${d.hostname}</a>`).join('\n');

  return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="https://hub.roadfx.biz.id/"><title>RocSpace Hub — Command Center</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090b;color:#e4e4e7;min-height:100vh}
.hero{text-align:center;padding:64px 20px 44px;background:radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent 42%),linear-gradient(135deg,#09090b,#18181b)}.hero .kick{display:inline-block;font-size:0.72em;letter-spacing:0.35em;text-transform:uppercase;color:#22d3ee;border:1px solid rgba(34,211,238,0.3);border-radius:20px;padding:6px 16px;margin-bottom:16px}
.hero h1{font-size:2.6em;font-weight:900;letter-spacing:-0.02em;background:linear-gradient(135deg,#22d3ee,#e879f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.hero p{color:#a1a1aa;margin:12px 0 22px;font-size:1.05em}.tag{display:inline-block;padding:5px 14px;border-radius:20px;font-size:0.78em;margin:4px;background:rgba(34,211,238,0.1);color:#67e8f9;border:1px solid rgba(34,211,238,0.25)}
.tag.hot{background:rgba(232,121,249,0.1);color:#f0abfc;border-color:rgba(232,121,249,0.25)}
nav{position:sticky;top:0;z-index:10;text-align:center;padding:14px;background:rgba(9,9,11,0.85);backdrop-filter:blur(8px);border-bottom:1px solid #27272a}nav a{color:#a1a1aa;text-decoration:none;margin:0 10px;font-size:0.88em;padding:7px 14px;border-radius:9px;transition:0.2s}nav a:hover{color:#22d3ee;background:rgba(34,211,238,0.08)}
.modes{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:1000px;margin:26px auto 0;padding:0 20px}.mode{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#d4d4d8;text-decoration:none;font-size:0.8em;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;transition:0.2s}.mode span{font-size:1.05em}.mode:hover{border-color:rgba(34,211,238,0.4);background:rgba(34,211,238,0.08)}
.sec-t{max-width:1200px;margin:44px auto 0;padding:0 20px;font-size:0.75em;letter-spacing:0.3em;text-transform:uppercase;color:#22d3ee}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px;max-width:1200px;margin:18px auto;padding:0 20px}.card{background:#101014;border:1px solid #27272a;border-radius:16px;padding:22px;transition:all 0.25s;text-decoration:none;color:inherit;display:block}.card:hover{border-color:#22d3ee;box-shadow:0 0 30px rgba(34,211,238,0.12);transform:translateY(-2px)}.card h2{font-size:1.2em;margin-bottom:6px}.card p{color:#a1a1aa;font-size:0.86em;line-height:1.55}.card .stat{font-size:1.8em;font-weight:800;background:linear-gradient(135deg,#22d3ee,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.card .label{color:#71717a;font-size:0.76em}
.svc-row{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:#101014;border:1px solid #27272a;border-radius:12px;margin-bottom:8px}.svc-name{font-weight:600;font-size:0.92em}.svc-detail{color:#71717a;font-size:0.76em;margin-top:2px}.svc-status{padding:4px 12px;border-radius:20px;font-size:0.72em;font-weight:700;white-space:nowrap}.on{background:rgba(74,222,128,0.12);color:#4ade80}.warn{background:rgba(250,204,21,0.12);color:#facc15}.off{background:rgba(248,113,113,0.12);color:#f87171}
.services{max-width:1200px;margin:18px auto;padding:0 20px}.repog{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;max-width:1200px;margin:18px auto;padding:0 20px}.repo{display:flex;gap:12px;align-items:center;background:#101014;border:1px solid #27272a;border-radius:12px;padding:14px 16px;color:inherit;text-decoration:none;font-size:0.86em;transition:0.2s}.repo small{color:#71717a}.repo:hover{border-color:#e879f9}.repo .ric{font-size:1.35em}
.domain-grid{max-width:1200px;margin:18px auto;padding:0 20px}.domain-card{display:inline-block;padding:9px 16px;background:#101014;border:1px solid #27272a;border-radius:10px;margin:4px;color:#71717a;text-decoration:none;font-size:0.8em;font-family:monospace;transition:0.2s}.domain-card:hover{border-color:#22d3ee;color:#22d3ee}footer{text-align:center;padding:36px;color:#52525b;font-size:0.78em}
</style></head><body>
<nav><a href="/">🏠 Hub</a><a href="/vm">🖥️ VM</a><a href="/monitor">📊 Monitor</a><a href="/ai">🧠 AI</a><a href="/chat">💬 Chat</a><a href="/links">🗂️ Directory</a><a href="/status">📈 Status</a></nav>
<div class="hero"><span class="kick">Command Center · v19.1.0</span>
<h1>RocSpace Hub</h1><p>Satu situs for semuanya · tanpa mirror · semua kolaborasi tersinkron di sini</p>
<span class="tag">✅ hub.roadfx.biz.id</span><span class="tag hot">⚡ API: api.roadfx.biz.id</span><span class="tag">🚫 Anti-mirror</span><span class="tag">🔀 Host lama → 301</span>
<div class="modes">${modes}</div></div>
<div class="sec-t">// Layanan</div>
<div class="grid">${cards}</div>
<div class="sec-t">// Sinkron · live probe</div>
<div class="services">${probes}</div>
<div class="sec-t">// Integrasi & kolaborasi</div>
<div class="services">
<div class="svc-row"><div><div class="svc-name">API kanonik — api.roadfx.biz.id</div><div class="svc-detail">Satu-satunya nama resmi untuk mesin/integrasi (keputusan final)</div></div><span class="svc-status on">● Active</span></div>
<div class="svc-row"><div><div class="svc-name">/health — bridge HTTPS → VM Oracle</div><div class="svc-detail">Host-agnostic · raw TCP socket (CF 1003 workaround)</div></div><span class="svc-status on">● JSON</span></div>
<div class="svc-row"><div><div class="svc-name">Label kolaborasi</div><div class="svc-detail">rocspace.ai.studio · webvirtcloud.ai.studio · antigravity.ai.studio</div></div><span class="svc-status warn">● Label</span></div>
<div class="svc-row"><div><div class="svc-name">AI Studio applet (privat)</div><div class="svc-detail"><a href="${AI_STUDIO.APP}" style="color:#67e8f9">rocspace.ai.studio → applet Google AI Studio</a> · login Google pemilik</div></div><span class="svc-status on">● Link</span></div>
<div class="svc-row"><div><div class="svc-name">Tailscale tailnet</div><div class="svc-detail">roc-vm 100.93.139.73 · rocfx (HP) · CPH1823</div></div><span class="svc-status on">● Mesh</span></div>
<div class="svc-row"><div><div class="svc-name">Firebase + GCP trial $300</div><div class="svc-detail">planning-with-ai-36675 · budget alert aktif</div></div><span class="svc-status warn">● Trial</span></div>
</div>
<div class="sec-t">// Repositori sumber (anti-mirror: tautan, bukan duplikat)</div>
<div class="repog">${repos}</div>
<div class="sec-t">// Host lama (otomatis 301 ke hub)</div>
<div class="domain-grid">${oldHosts}</div>
<footer>RocSpace by RoadFX AI · 2026 · v19.1.0 Command Center · satu situs kanonik · <a href="https://github.com/ivansslo/rocspace" style="color:#67e8f9">GitHub</a></footer>
<script>
document.querySelectorAll('[data-probe]').forEach(async el=>{
  const t0=performance.now();
  try{
    const r=await fetch(el.dataset.probe,{cache:'no-store'});
    const ms=Math.round(performance.now()-t0);
    if(r.ok){el.textContent='● online · '+ms+'ms';el.className='svc-status on'}
    else{el.textContent='● HTTP '+r.status;el.className='svc-status off'}
  }catch{el.textContent='● unreachable';el.className='svc-status off'}
});
</script>
</body></html>`;
}

// ─── v19.1: Directory lokal — pengganti /links gateway yang 522 ──
function renderLinks(): string {
  const sec = (t: string, rows: string) => `<div class="sec-t">${t}</div><div class="services">${rows}</div>`;
  const row = (n: string, d: string, href: string) => `<a class="svc-row" href="${href}" style="text-decoration:none;color:inherit"><div><div class="svc-name">${n}</div><div class="svc-detail">${d}</div></div><span class="svc-status on">↗</span></a>`;
  return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="https://hub.roadfx.biz.id/links"><title>ROC Directory — Semua Koneksi</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090b;color:#e4e4e7;min-height:100vh}
.hero{text-align:center;padding:56px 20px 36px;background:radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent 42%),#09090b}.hero h1{font-size:2.2em;font-weight:900;background:linear-gradient(135deg,#22d3ee,#e879f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.hero p{color:#a1a1aa;margin-top:10px}
.sec-t{max-width:900px;margin:36px auto 10px;padding:0 20px;font-size:0.75em;letter-spacing:0.3em;text-transform:uppercase;color:#22d3ee}
.services{max-width:900px;margin:0 auto;padding:0 20px}.svc-row{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:#101014;border:1px solid #27272a;border-radius:12px;margin-bottom:8px;transition:0.2s}.svc-row:hover{border-color:#22d3ee}.svc-name{font-weight:600;font-size:0.92em}.svc-detail{color:#71717a;font-size:0.76em;margin-top:2px}.svc-status{padding:4px 12px;border-radius:20px;font-size:0.72em;font-weight:700;background:rgba(34,211,238,0.1);color:#67e8f9}
a{text-decoration:none}footer{text-align:center;padding:36px;color:#52525b;font-size:0.78em}
</style></head><body>
<div class="hero"><h1>🗂️ ROC Directory</h1><p>Semua koneksi & integrasi · lokal di worker · v19.1.0 (pengganti /links gateway yang 522)</p></div>
${sec('// Layanan inti (hub)', row('🖥️ VM Console','WebVirtCloud + Firebase + noVNC','/vm') + row('📊 Monitor','Uptime Kuma via Nginx VM','/monitor') + row('🧠 AI Gateway','16 models · 5 providers','/ai') + row('🔴 Chat Live','Clerk auth penuh','/chat-live') + row('💬 Quick Chat','tanpa login','/chat') + row('📈 Status','status page lokal','/status') + row('🎛️ Dashboard','panel infrastruktur gateway','/dashboard') + row('🎨 AI Studio','applet privat (login Google)',AI_STUDIO.APP))}
${sec('// API & endpoint (mesin)', row('⚡ api.roadfx.biz.id','API kanonik — /v1/models dll','https://api.roadfx.biz.id/v1/models') + row('🏥 /health','bridge JSON ke VM','/health') + row('📡 gateway — hermes-cloudflare','workers.dev internal · anti-loop','https://hermes-cloudflare.certveis.workers.dev'))}
${sec('// Kolaborasi & label', row('🌐 Tailscale tailnet','roc-vm · rocfx · CPH1823','https://login.tailscale.com/admin/machines') + row('🔥 Firebase planning-with-ai-36675','Firestore + Hosting','https://console.firebase.google.com') + row('☁️ GCP trial $300','budget alert 50/90/100%','https://console.cloud.google.com/billing') + row('🛠️ OCI Console','Run Command → SSH VM','https://cloud.oracle.com'))}
${sec('// Repositori sumber', row('ivansslo/rocspace','hub + shared (repo ini)','https://github.com/ivansslo/rocspace') + row('ivansslo/Solace-Hermes-Project','sumber gateway','https://github.com/ivansslo/Solace-Hermes-Project') + row('ivansslo/roadfx-ai-stack','stack Cloud Run','https://github.com/ivansslo/roadfx-ai-stack') + row('ivansslo/ai-vitality','Cloud Run down billing 🔴','https://github.com/ivansslo/ai-vitality') + row('ivansslo/roc-containers','Termux v1.6.0','https://github.com/ivansslo/roc-containers') + row('ivansslo/roc-agentsroute','hermes v5.13.1','https://github.com/ivansslo/roc-agentsroute') + row('ivansslo/Rofwin','APK v1.0.1','https://github.com/ivansslo/Rofwin'))}
${sec('// Eksternal', row('🧠 Termux di HP (roc-menu)','Antigravity udocker localhost:5905','/vm') + row('🏷️ Labels','rocspace.ai.studio · webvirtcloud.ai.studio · antigravity.ai.studio','/'))}
<footer>RocSpace by RoadFX AI · 2026 · <a href="/" style="color:#67e8f9">← kembali ke Hub</a></footer>
</body></html>`;
}

function renderQuickChat(): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RocSpace Quick Chat</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;background:#0a0a0f;color:#e2e8f0;height:100vh;display:flex;flex-direction:column}
nav{padding:12px 20px;background:#0f0f17;border-bottom:1px solid #1e1e2e;display:flex;align-items:center;gap:16px}nav a{color:#94a3b8;text-decoration:none;font-size:0.9em}nav a:hover{color:#60a5fa}nav .brand{font-weight:700;color:#60a5fa;font-size:1.1em}
#chat{flex:1;overflow-y:auto;padding:20px;max-width:800px;margin:0 auto;width:100%}.msg{margin-bottom:16px;padding:14px 18px;border-radius:14px;max-width:85%;line-height:1.6;font-size:0.95em;white-space:pre-wrap;word-wrap:break-word}.msg.user{background:#1e3a5f;margin-left:auto;border-bottom-right-radius:4px}.msg.bot{background:#1a1a2e;border-bottom-left-radius:4px}
#input-area{padding:16px;background:#0f0f17;border-top:1px solid #1e1e2e;display:flex;gap:8px;max-width:800px;margin:0 auto;width:100%}#msg-input{flex:1;padding:12px 16px;border-radius:12px;border:1px solid #1e1e2e;background:#12121a;color:#e2e8f0;font-size:0.95em;outline:none}#msg-input:focus{border-color:#60a5fa}#send-btn{padding:12px 24px;border-radius:12px;border:none;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-weight:600;cursor:pointer}#send-btn:hover{opacity:0.9}
.note{text-align:center;padding:8px;background:#1a1a2e;color:#64748b;font-size:0.8em}a.live{color:#f97316;text-decoration:none}
</style></head><body>
<nav><span class="brand">💬 Quick Chat</span><a href="/">🏠 Home</a><a href="/chat-live">🔴 Chat Live</a></nav>
<div id="chat"><div class="msg bot">Halo! Saya RocSpace AI. Ada yang bisa saya bantu? 🤖</div></div>
<div class="note">🔓 No login required · <a class="live" href="/chat-live">Chat Live → full features</a></div>
<div id="input-area"><input id="msg-input" placeholder="Ketik pesan..." onkeydown="if(event.key==='Enter')send()"><button id="send-btn" onclick="send()">Kirim</button></div>
<script>
const chat=document.getElementById('chat');const input=document.getElementById('msg-input');
async function send(){const msg=input.value.trim();if(!msg)return;chat.innerHTML+='<div class="msg user">'+esc(msg)+'</div>';input.value='';
chat.innerHTML+='<div class="msg bot typing" id="typing">⏳ Thinking...</div>';chat.scrollTop=chat.scrollHeight;
try{const r=await fetch('/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'user',content:msg}],max_tokens:1024})});
const d=await r.json();const t=document.getElementById('typing');
if(d.choices&&d.choices[0]){t.classList.remove('typing');t.textContent=d.choices[0].message.content}else{t.textContent='⚠️ Try /chat-live'}}catch(e){document.getElementById('typing').textContent='❌ '+e.message}
chat.scrollTop=chat.scrollHeight}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
</script></body></html>`;
}

// ─── Status ────────────────────────────────────────────

function renderStatus(): string {
  const date = new Date().toISOString().split('T')[0];
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RocSpace Status</title><meta http-equiv="refresh" content="30">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;background:#0a0a0f;color:#34d399;padding:20px;max-width:900px;margin:0 auto}h1{color:#60a5fa;margin-bottom:20px}nav{margin-bottom:20px}nav a{color:#60a5fa;text-decoration:none;margin-right:16px}.row{padding:10px 0;border-bottom:1px solid #1e1e2e;display:flex;justify-content:space-between}.ok{color:#34d399}.warn{color:#fbbf24}.err{color:#ef4444}footer{margin-top:40px;color:#475569;font-size:0.8em}</style></head><body>
<nav><a href="/">🏠 Dashboard</a><a href="/chat-live">💬 Chat Live</a><a href="/vm">🖥️ VM Console</a></nav>
<h1>📊 RocSpace Status</h1>
<div class="row"><span>roc-site (Unified Router)</span><span class="ok">● Active · 16 domains</span></div>
<div class="row"><span>hermes-cloudflare (Gateway)</span><span class="ok">● Active · v17.1.1</span></div>
<div class="row"><span>WebVirtCloud + Firebase</span><span class="ok">● Running · Oracle VM</span></div>
<div class="row"><span>Uptime Monitor</span><span class="ok">● Running</span></div>
<div class="row"><span>CloudRun (ai-vitality)</span><span class="err">● DOWN · billing issue</span></div>
<div class="row"><span>Clerk Auth</span><span class="ok">● 25 origins · 8 social logins</span></div>
<div class="row"><span>Firebase Auth</span><span class="ok">● yttriferous-magpie-16ppv</span></div>
<div class="row"><span>Solace Broker</span><span class="ok">● Connected · Singapore</span></div>
<div class="row"><span>Oracle VM</span><span class="ok">● Running · Singapore</span></div>
<div class="row"><span>AI Models</span><span class="ok">● 16 models (5 providers)</span></div>
<footer>RocSpace · ${date} · v17.3.0</footer>
</body></html>`;
}
