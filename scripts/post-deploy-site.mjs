#!/usr/bin/env node
// Post-deploy roc-site (v19 Hub Tunggal):
//   1) Pastikan Custom Domain hub.roadfx.biz.id terpasang ke worker roc-site
//   2) Re-put secret GATEWAY_TOKEN bila tersedia (metadata bindings:[] saat
//      upload multipart bisa mengosongkan binding — handoff doc known issue)
// Env wajib : CF_API_TOKEN (Workers:Edit), CF_ACCOUNT_ID
// Env opsional: CF_ZONE_ROADFX_BIZ_ID / CF_ZONE_ID (auto-lookup bila kosong), GATEWAY_TOKEN

const ACC = process.env.CF_ACCOUNT_ID;
const TOK = process.env.CF_API_TOKEN || process.env.CFAT || '';
let ZONE = process.env.CF_ZONE_ROADFX_BIZ_ID || process.env.CF_ZONE_ID || '';
const HOSTNAME = 'hub.roadfx.biz.id';
const SERVICE = 'roc-site';

if (!ACC || !TOK) {
  console.error('❌ CF_ACCOUNT_ID dan CF_API_TOKEN wajib di-set (Actions secrets / env)');
  process.exit(1);
}
const H = { Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json' };
const api = async (method, url, body) => (await fetch(`https://api.cloudflare.com/client/v4${url}`, {
  method, headers: H, body: body ? JSON.stringify(body) : undefined,
})).json();

// 1) Zone ID (lookup by name bila tidak disediakan)
if (!ZONE) {
  const z = await api('GET', '/zones?name=roadfx.biz.id');
  ZONE = z.result?.[0]?.id || '';
}
if (!ZONE) { console.error('❌ Zone roadfx.biz.id tidak ditemukan di akun ini'); process.exit(1); }
console.log(`🌐 zone roadfx.biz.id: ${ZONE.slice(0, 6)}…`);

// 2) Custom Domain — idempotent
const list = await api('GET', `/accounts/${ACC}/workers/domains`);
if (!list.success) { console.error('❌ list domains gagal:', JSON.stringify(list.errors)); process.exit(1); }
const exists = (list.result || []).some(d => d.hostname === HOSTNAME);
if (exists) {
  console.log(`✅ Custom Domain ${HOSTNAME} sudah terpasang`);
} else {
  const put = await api('PUT', `/accounts/${ACC}/workers/domains`, {
    environment: 'production', hostname: HOSTNAME, service: SERVICE, zone_id: ZONE,
  });
  if (put.success) console.log(`✅ Custom Domain ${HOSTNAME} dibuat → ${SERVICE}`);
  else {
    const msg = JSON.stringify(put.errors);
    if (/already|exist/i.test(msg)) console.log('ℹ️ domain sudah ada (race) — lanjut');
    else { console.error('❌ gagal membuat custom domain:', msg); process.exit(1); }
  }
}

// 3) Re-put GATEWAY_TOKEN (opsional tapi direkomendasikan)
const gw = process.env.GATEWAY_TOKEN || '';
if (gw) {
  const sec = await api('PUT', `/accounts/${ACC}/workers/scripts/${SERVICE}/secrets`, {
    name: 'GATEWAY_TOKEN', text: gw, type: 'secret_text',
  });
  console.log(sec.success ? '🔐 GATEWAY_TOKEN re-put OK' : `⚠️ re-put gagal: ${JSON.stringify(sec.errors)}`);
} else {
  console.log('ℹ️ GATEWAY_TOKEN tidak ada di env — dilewati');
}

console.log('POST-DEPLOY-OK');
