addEventListener('fetch', event => { event.respondWith(handleRequest(event.request)); });

async function handleRequest(request) {
  return new Response(PAGE_HTML, { headers: { 'Content-Type': 'text/html;charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'X-XSS-Protection': '1; mode=block', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy': "default-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:" } });
}

var PAGE_HTML = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">\n' +
'<title>Solace Hermes \u2014 AI Agent Hub</title>\n' +
'<meta name="description" content="Solace Hermes AI Agent Hub \u2014 77 models, 1019 tools, event-driven multi-agent orchestration">\n' +
'<style>\n' +
'*{margin:0;padding:0;box-sizing:border-box}\n' +
'body{font-family:system-ui,sans-serif;background:#09090b;color:#fafafa;min-height:100dvh;display:flex;justify-content:center}\n' +
'.pg{width:100%;max-width:480px;padding:20px 16px 40px}\n' +
'.pf{text-align:center;margin-bottom:24px}\n' +
'.av{width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 12px;box-shadow:0 0 30px rgba(59,130,246,.25)}\n' +
'.pf h1{font-size:20px;font-weight:700;background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}\n' +
'.pf p{color:#71717a;font-size:12px;margin-top:3px}\n' +
'.st{display:flex;justify-content:center;gap:16px;margin-top:10px;flex-wrap:wrap}\n' +
'.st div{text-align:center}.st .n{font-size:17px;font-weight:700}.st .l{font-size:9px;color:#71717a;text-transform:uppercase;letter-spacing:.5px}\n' +
'.sc{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin:20px 0 8px 4px}\n' +
'.ls{display:flex;flex-direction:column;gap:6px}\n' +
'.lk{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#18181b;border:1px solid #27272a;border-radius:12px;text-decoration:none;color:#fafafa;transition:all .2s;overflow:hidden}\n' +
'.lk:hover{border-color:#3b82f6;transform:translateY(-1px);box-shadow:0 4px 16px rgba(59,130,246,.08)}\n' +
'.lk .ic{font-size:20px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,.06);border-radius:8px;flex-shrink:0}\n' +
'.lk .in{flex:1;min-width:0}.lk .in h3{font-size:13px;font-weight:600}.lk .in p{font-size:10px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n' +
'.tg{font-size:8px;font-weight:700;padding:2px 6px;border-radius:5px;letter-spacing:.4px;flex-shrink:0}\n' +
'.tg.live{background:#22c55e;color:#000}.tg.api{background:#3b82f6;color:#fff}.tg.new{background:#f97316;color:#000}.tg.ext{background:#8b5cf6;color:#fff}.tg.mesh{background:#06b6d4;color:#000}\n' +
'.ar{color:#3f3f46;font-size:12px;flex-shrink:0}.lk:hover .ar{color:#71717a}\n' +
'.so{display:flex;gap:8px;justify-content:center;margin-top:20px}\n' +
'.so a{width:40px;height:40px;border-radius:10px;background:#18181b;border:1px solid #27272a;display:flex;align-items:center;justify-content:center;font-size:16px;text-decoration:none;transition:all .2s}\n' +
'.so a:hover{border-color:#8b5cf6}\n' +
'.ib{margin-top:20px;padding:12px;background:linear-gradient(135deg,rgba(59,130,246,.04),rgba(139,92,246,.04));border:1px solid #27272a;border-radius:12px;font-size:11px;color:#a1a1aa}\n' +
'.ib .r{display:flex;align-items:center;gap:6px;margin-bottom:4px}.ib .r:last-child{margin-bottom:0}\n' +
'.ib .d{width:5px;height:5px;border-radius:50%;background:#22c55e;flex-shrink:0}\n' +
'.ft{text-align:center;margin-top:24px;color:#3f3f46;font-size:9px;letter-spacing:.3px}\n' +
'@keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}\n' +
'.lk{animation:fi .3s ease-out both}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="pg">\n' +
'\n' +
'<div class="pf">\n' +
'<div class="av">\u26A1</div>\n' +
'<h1>Solace Hermes</h1>\n' +
'<p>AI Agent Hub \u2014 Event-Driven Multi-Agent Platform</p>\n' +
'<div class="st">\n' +
'<div><div class="n">77</div><div class="l">AI Models</div></div>\n' +
'<div><div class="n">1019</div><div class="l">Tools</div></div>\n' +
'<div><div class="n">5</div><div class="l">Queues</div></div>\n' +
'<div><div class="n">25</div><div class="l">Endpoints</div></div>\n' +
'</div>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83D\uDCAC AI Chat</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://ca.certveis.space/chat" target="_blank" style="animation-delay:.03s"><span class="ic">\uD83D\uDCAC</span><div class="in"><h3>Hermes AI Chat</h3><p>Multi-agent \u00B7 16 models \u00B7 Groq + Gemini + OpenRouter \u00B7 streaming</p></div><span class="tg live">LIVE</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://cm.certveis.space/chat" target="_blank" style="animation-delay:.06s"><span class="ic">\uD83D\uDCAC</span><div class="in"><h3>Chat Mirror</h3><p>cm.certveis.space \u00B7 Redundant gateway</p></div><span class="tg live">LIVE</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://cb.certveis.space/chat" target="_blank" style="animation-delay:.09s"><span class="ic">\uD83D\uDCAC</span><div class="in"><h3>Chat Backup</h3><p>cb.certveis.space \u00B7 Third endpoint</p></div><span class="tg live">LIVE</span><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83D\uDCE1 Solace Event Mesh</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/solace/status" target="_blank" style="animation-delay:.12s"><span class="ic">\uD83D\uDCE1</span><div class="in"><h3>Broker Status</h3><p>RoClace Cluster \u00B7 Singapore \u00B7 PubSub+ Event Broker</p></div><span class="tg mesh">MESH</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/solace/queues" target="_blank" style="animation-delay:.15s"><span class="ic">\uD83D\uDCEC</span><div class="in"><h3>Queue Monitor</h3><p>5 queues \u00B7 orchestrator \u00B7 ai-chat \u00B7 tools \u00B7 memory \u00B7 events</p></div><span class="tg mesh">MESH</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/solace/service" target="_blank" style="animation-delay:.18s"><span class="ic">\u2601</span><div class="in"><h3>Solace Cloud</h3><p>Service info \u00B7 limits \u00B7 region \u00B7 protocols</p></div><span class="tg mesh">MESH</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://console.solace.cloud" target="_blank" style="animation-delay:.21s"><span class="ic">\uD83D\uDD27</span><div class="in"><h3>Solace Console</h3><p>Manage event broker \u00B7 queues \u00B7 topics \u00B7 clients</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83C\uDFA8 AI Factory (Cloudflare AI)</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://cf-ai.certveis.workers.dev/" target="_blank" style="animation-delay:.24s"><span class="ic">\uD83C\uDFA8</span><div class="in"><h3>AI Factory</h3><p>60 models: Llama 70B, GPT-OSS, Gemma 4, DeepSeek R1</p></div><span class="tg new">NEW</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://cf-ai.certveis.workers.dev/image" target="_blank" style="animation-delay:.27s"><span class="ic">\uD83D\uDDBC</span><div class="in"><h3>Image Generator</h3><p>Flux 1 Schnell \u00B7 Flux 2 Klein \u00B7 Stable Diffusion XL</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://cf-ai.certveis.workers.dev/translate" target="_blank" style="animation-delay:.30s"><span class="ic">\uD83C\uDF0D</span><div class="in"><h3>Translator</h3><p>M2M100 \u00B7 100+ languages</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://cf-ai.certveis.workers.dev/embed" target="_blank" style="animation-delay:.33s"><span class="ic">\uD83D\uDCD0</span><div class="in"><h3>Embeddings</h3><p>BGE-M3 \u00B7 Qwen3 Embedding \u00B7 1024d vectors</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83E\uDD16 CrewAI Agents</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/crew" target="_blank" style="animation-delay:.33s"><span class="ic">\uD83E\uDD16</span><div class="in"><h3>CrewAI Dashboard</h3><p>3 agents \u00B7 Researcher + Analyst + Writer \u00B7 Run crews</p></div><span class="tg new">NEW</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://app.crewai.com" target="_blank" style="animation-delay:.35s"><span class="ic">\u2699</span><div class="in"><h3>CrewAI Platform</h3><p>AMP \u00B7 Deploy \u00B7 Monitor \u00B7 Manage</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83D\uDD77 Crawl4AI</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/crawl4ai" target="_blank" style="animation-delay:.35s"><span class="ic">\uD83D\uDD77</span><div class="in"><h3>Crawl4AI</h3><p>URL \u2192 clean markdown \u00B7 extract \u00B7 batch crawl</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/crawl4ai/extract" target="_blank" style="animation-delay:.37s"><span class="ic">\uD83D\uDCCA</span><div class="in"><h3>Data Extractor</h3><p>JSON-LD \u00B7 OpenGraph \u00B7 structured data</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://github.com/ivansslo/crawl4ai" target="_blank" style="animation-delay:.39s"><span class="ic">\uD83D\uDC19</span><div class="in"><h3>Crawl4AI Source</h3><p>github.com/ivansslo/crawl4ai</p></div><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83E\uDD16 APIs</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/v1/models" target="_blank" style="animation-delay:.36s"><span class="ic">\uD83E\uDD16</span><div class="in"><h3>OpenAI-Compatible API</h3><p>/v1/chat/completions \u00B7 OpenAI drop-in \u00B7 16 models</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/" target="_blank" style="animation-delay:.39s"><span class="ic">\uD83D\uDCCB</span><div class="in"><h3>Gateway Docs</h3><p>25 endpoints \u00B7 Solace \u00B7 crawl \u00B7 webhook \u00B7 tools \u00B7 Honcho</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/health" target="_blank" style="animation-delay:.42s"><span class="ic">\uD83D\uDFE2</span><div class="in"><h3>Health Check</h3><p>Gateway status \u00B7 Cloudflare edge \u00B7 uptime</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83D\uDD17 Integrations</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/honcho/peers" target="_blank" style="animation-delay:.45s"><span class="ic">\uD83E\uDDE0</span><div class="in"><h3>Honcho Memory</h3><p>Identity layer \u00B7 peer memory \u00B7 4 peers \u00B7 workspace rochobase</p></div><span class="tg new">NEW</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://clawhub.ai" target="_blank" style="animation-delay:.48s"><span class="ic">\uD83D\uDC3E</span><div class="in"><h3>ClawHub</h3><p>AI skills &amp; plugins marketplace</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://claw-link.dev" target="_blank" style="animation-delay:.51s"><span class="ic">\uD83D\uDD17</span><div class="in"><h3>ClawLink</h3><p>1019 tools \u00B7 GitHub \u00B7 Telegram \u00B7 Firecrawl \u00B7 OpenAI</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://skillsllm.com" target="_blank" style="animation-delay:.54s"><span class="ic">\u26A1</span><div class="in"><h3>SkillsLLM</h3><p>1600+ open-source AI agent skills</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://app.honcho.dev" target="_blank" style="animation-delay:.57s"><span class="ic">\uD83D\uDCA0</span><div class="in"><h3>Honcho Dashboard</h3><p>Manage peers, sessions, dreams</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://www.notion.so" target="_blank" style="animation-delay:.59s"><span class="ic">\uD83D\uDCDD</span><div class="in"><h3>Notion</h3><p>45 tools via ClawLink \u00B7 pages \u00B7 databases \u00B7 comments</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://zapier.com/app/dashboard" target="_blank" style="animation-delay:.61s"><span class="ic">\u26A1</span><div class="in"><h3>Zapier</h3><p>MCP automation \u00B7 webhook triggers</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="sc">\uD83D\uDCBB Developer</div>\n' +
'<div class="ls">\n' +
'<a class="lk" href="https://github.com/ivansslo/roadfx-ai-stack" target="_blank" style="animation-delay:.60s"><span class="ic">\uD83D\uDC19</span><div class="in"><h3>GitHub Repository</h3><p>ivansslo/roadfx-ai-stack</p></div><span class="tg new">NEW</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/tailscale/devices" target="_blank" style="animation-delay:.63s"><span class="ic">\uD83C\uDF10</span><div class="in"><h3>Tailscale Network</h3><p>VPN device status</p></div><span class="tg api">API</span><span class="ar">\u203A</span></a>\n' +
'<a class="lk" href="https://cloud.mongodb.com" target="_blank" style="animation-delay:.66s"><span class="ic">\uD83D\uDCE6</span><div class="in"><h3>MongoDB Atlas</h3><p>3 databases \u00B7 hermes-infra \u00B7 debate-forum \u00B7 nextroc</p></div><span class="tg ext">EXT</span><span class="ar">\u203A</span></a>\n' +
'</div>\n' +
'\n' +
'<div class="so">\n' +
'<a href="https://awake-chicken-95.accounts.dev/sign-in" target="_blank" title="Login">\uD83D\uDD11</a>\n' +
'<a href="mailto:ivanssl@certveis.space" title="Email">\uD83D\uDCE7</a>\n' +
'<a href="https://github.com/ivansslo/roadfx-ai-stack" target="_blank" title="GitHub">\uD83D\uDC19</a>\n' +
'<a href="https://hermes-cloudflare.certveis.workers.dev/chat" target="_blank" title="Chat">\uD83D\uDCAC</a>\n' +
'</div>\n' +
'\n' +
'<div class="ib">\n' +
'<div class="r"><span class="d"></span> Groq \u26A1 9 models (free, ~200ms)</div>\n' +
'<div class="r"><span class="d"></span> Google AI \uD83D\uDD35 3 models (free)</div>\n' +
'<div class="r"><span class="d"></span> OpenRouter \u2728 4 models (premium)</div>\n' +
'<div class="r"><span class="d"></span> Cloudflare AI \uD83D\uDFE0 60 models (free)</div>\n' +
'<div class="r"><span class="d"></span> Solace PubSub+ \uD83D\uDCE1 Event Mesh (Singapore)</div>\n' +
'<div class="r"><span class="d"></span> ClawLink \uD83D\uDD17 1019 tools, 4 integrations</div>\n' +
'<div class="r"><span class="d"></span> Honcho \uD83E\uDDE0 4 peers, identity layer</div>\n' +
'<div class="r"><span class="d"></span> Cloudflare \u2601 5 Workers, 4 domains</div>\n' +
'</div>\n' +
'\n' +
'<div class="ft">Solace Hermes Project v13.0<br>\u00A9 2026 Ivan Ssl \u00B7 Cloudflare Workers + Solace Event Mesh</div>\n' +
'\n' +
'</div>\n' +
'</body>\n' +
'</html>\n';
