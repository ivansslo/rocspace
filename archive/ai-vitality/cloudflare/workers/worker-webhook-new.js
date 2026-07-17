addEventListener('fetch', event => { event.respondWith(handleRequest(event.request)); });

var TK=(typeof TOKEN!=='undefined'?TOKEN:'hk-rocspace-2026');
var GK=(typeof GROQ_KEY!=='undefined'?GROQ_KEY:'');
var OK=(typeof OR_KEY!=='undefined'?OR_KEY:'');
var GEM=(typeof GEMINI_KEY!=='undefined'?GEMINI_KEY:'');
var CK=(typeof CLAW_KEY!=='undefined'?CLAW_KEY:'');
var CLK=(typeof CLAWLINK_KEY!=='undefined'?CLAWLINK_KEY:'');
var TSK=(typeof TAILSCALE_KEY!=='undefined'?TAILSCALE_KEY:'');
var OPK=(typeof OR_PROV_KEY!=='undefined'?OR_PROV_KEY:'');
var HCH=(typeof HONCHO_KEY!=='undefined'?HONCHO_KEY:'');
var SOU=(typeof SOLACE_URL!=='undefined'?SOLACE_URL:'');
var SUS=(typeof SOLACE_USER!=='undefined'?SOLACE_USER:'');
var SPA=(typeof SOLACE_PASS!=='undefined'?SOLACE_PASS:'');
var SAT=(typeof SOLACE_API_TOKEN!=='undefined'?SOLACE_API_TOKEN:'');

var CLAW='https://clawhub.ai/api/v1';
var LINK='https://claw-link.dev/api';
var TAPI='https://api.tailscale.com/api/v2';
var HAPI='https://api.honcho.dev/v3';
var HWS='rochobase';
var SAPI='https://api.solace.cloud/api/v0';
var SSVC='p37j7q6aggq';
var SVPN='roclace-cluster';
var OWNER_NOTIFY_TOPIC='hermes/notify/owner';

var MODELS=[
  {id:'qwen/qwen3-32b',p:'groq',f:true,ctx:131072},{id:'llama-3.3-70b-versatile',p:'groq',f:true,ctx:128000},
  {id:'qwen/qwen3.6-27b',p:'groq',f:true,ctx:131072},{id:'meta-llama/llama-4-scout-17b-16e-instruct',p:'groq',f:true,ctx:131072},
  {id:'openai/gpt-oss-120b',p:'groq',f:true,ctx:131072},{id:'groq/compound',p:'groq',f:true,ctx:131072},
  {id:'llama-3.1-8b-instant',p:'groq',f:true,ctx:131072},{id:'groq/compound-mini',p:'groq',f:true,ctx:131072},
  {id:'gemini-2.5-flash',p:'gemini',f:true,ctx:1048576},{id:'gemini-3-flash-preview',p:'gemini',f:true,ctx:1048576},
  {id:'gemini-2.5-pro',p:'gemini',f:true,ctx:2097152},
  {id:'google/gemini-2.5-pro-preview',p:'openrouter',f:false,ctx:2097152},{id:'google/gemini-2.5-flash',p:'openrouter',f:false,ctx:1048576},
  {id:'openai/gpt-4o',p:'openrouter',f:false,ctx:128000},{id:'deepseek/deepseek-r1',p:'openrouter',f:false,ctx:163840},
  {id:'qwen/qwen3-235b-a22b',p:'openrouter',f:false,ctx:131072},
];

async function handleRequest(request) {
  var url=new URL(request.url),path=url.pathname;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors()});
  if(path==='/chat'||path==='/chat/') return new Response(CHAT_HTML,{headers:{'Content-Type':'text/html;charset=utf-8'}});
  if(path==='/'||path==='') return json({name:'Solace Hermes Gateway',version:'14.0',endpoints:{'GET /chat':'Multi-agent AI Chat','GET /v1/models':'Model list','POST /v1/chat/completions':'Chat API','POST /ai/chat':'Chat','POST /ai/stream':'Stream','POST /crawl':'Web crawl','GET /hub/*':'ClawHub','GET /link/*':'ClawLink','GET /skills':'SkillsLLM','GET /tailscale/devices':'Tailscale','POST /link/tools/:name/execute':'Execute tool','POST /webhook/zapier':'Zapier','GET /honcho/peers':'Honcho peers','POST /honcho/chat':'Honcho chat','GET /honcho/context':'Peer context','GET /health':'Health','GET /solace/status':'Broker status','POST /solace/publish':'Publish event','GET /solace/queues':'Queue stats','POST /solace/task':'Agent task','GET /solace/service':'Service info','POST /notify':'User notification'}});
  if(path==='/health') return json({status:'ok',ts:new Date().toISOString(),colo:request.cf?.colo||'?',version:'14.0'});

  // v1 LiteLLM-compatible
  if(path==='/v1/models') return json({object:'list',data:MODELS.map(function(m){return{id:m.id,object:'model',owned_by:m.p,context_length:m.ctx}})});
  if(path==='/v1/chat/completions'&&request.method==='POST'){var a2=request.headers.get('Authorization')||'';if(a2!=='Bearer '+TK)return json({error:{message:'Unauthorized'}},401);var b=await request.json().catch(function(){return{}});solaceEmit('hermes/event/chat',{endpoint:'v1',model:b.model,ts:new Date().toISOString()});return aiCall(b.model||'qwen/qwen3-32b',b.messages||[],b.max_tokens||4096,b.stream||false)}

  // Honcho
  if(path==='/honcho/peers'){try{var r=await fetch(HAPI+'/workspaces/'+HWS+'/peers/list',{method:'POST',headers:{'Authorization':'Bearer '+HCH,'Content-Type':'application/json'},body:'{}'});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  if(path==='/honcho/chat'&&request.method==='POST'){var auth2=request.headers.get('Authorization')||'';if(auth2!=='Bearer '+TK)return json({error:'Unauthorized'},401);var b=await request.json().catch(function(){return{}});var peer=b.peer||'hermes-agent';try{var r=await fetch(HAPI+'/workspaces/'+HWS+'/peers/'+peer+'/chat',{method:'POST',headers:{'Authorization':'Bearer '+HCH,'Content-Type':'application/json'},body:JSON.stringify({query:b.query||b.message||''})});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  if(path==='/honcho/context'){var peer=url.searchParams.get('peer')||'hermes-agent';try{var r=await fetch(HAPI+'/workspaces/'+HWS+'/peers/'+peer+'/context',{headers:{'Authorization':'Bearer '+HCH}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // SkillsLLM
  if(path.startsWith('/skills')){try{var r=await fetch('https://skillsllm.com/api/skills'+url.search);return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // ClawHub
  if(path.startsWith('/hub/')){try{var r=await fetch(CLAW+'/'+path.replace('/hub/','')+url.search,{headers:{'Authorization':'Bearer '+CK}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // ClawLink
  if(path.startsWith('/link/')){var sub=path.replace('/link/','');if(sub.includes('/execute')){var a3=request.headers.get('Authorization')||'';if(a3!=='Bearer '+TK)return json({error:'Unauthorized'},401);var tn=sub.replace('tools/','').replace('/execute','');var bd=await request.json().catch(function(){return{}});try{var r=await fetch(LINK+'/tools/'+tn+'/execute',{method:'POST',headers:{'Authorization':'Bearer '+CLK,'Content-Type':'application/json'},body:JSON.stringify({params:bd.params||bd})});return json(await r.json())}catch(e){return json({error:e.message},502)}}try{var r=await fetch(LINK+'/'+sub+url.search,{headers:{'Authorization':'Bearer '+CLK}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // Tailscale
  if(path==='/tailscale/devices'){try{var r=await fetch(TAPI+'/tailnet/-/devices',{headers:{'Authorization':'Basic '+btoa(TSK+':')}});return json(await r.json())}catch(e){return json({error:e.message},502)}}

  // Solace - public
  if(path==='/solace/status'){if(!SOU)return json({error:'Solace not configured'},503);try{var r=await fetch(SOU+'/topic/hermes/ping',{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':'direct'},body:JSON.stringify({ping:true,ts:new Date().toISOString()})});return json({status:r.status===200?'connected':'error',httpCode:r.status,broker:'mr-connection-mwc1f9igml1.messaging.solace.cloud',vpn:SVPN,serviceId:SSVC,ts:new Date().toISOString()})}catch(e){return json({error:e.message,status:'disconnected'},502)}}
  if(path==='/solace/queues'){try{var sempUrl='https://mr-connection-mwc1f9igml1.messaging.solace.cloud:943/SEMP/v2/monitor/msgVpns/'+SVPN+'/queues';var r=await fetch(sempUrl,{headers:{'Authorization':'Basic '+btoa('roclace-cluster-view:sefl1ij304n1ae6cu8hh2fr13i')}});var d=await r.json();var qs=(d.data||[]).map(function(q){return{name:q.queueName,spoolUsage:q.msgSpoolUsage||0,bindCount:q.bindCount||0,msgCountIn:q.rxMsgCount||0,msgCountOut:q.txMsgCount||0}});return json({queues:qs,count:qs.length,vpn:SVPN})}catch(e){return json({error:e.message},502)}}
  if(path==='/solace/service'){try{var r=await fetch(SAPI+'/services/'+SSVC,{headers:{'Authorization':'Bearer '+SAT}});var d=await r.json();var s=d.data||{};return json({name:s.name,serviceId:s.serviceId,vpn:s.msgVpnName,region:s.datacenterId,type:s.serviceTypeId,state:s.adminState+'/'+s.adminProgress,limits:s.serviceClassDisplayedAttributes||{},created:s.created})}catch(e){return json({error:e.message},502)}}

  // Notify owner endpoint (public - used by chat UI)
  if(path==='/notify'&&request.method==='POST'){var b=await request.json().catch(function(){return{}});var nPayload={type:'user_activity',user:b.user||'anonymous',action:b.action||'visit',ua:request.headers.get('User-Agent')||'?',ip:request.headers.get('CF-Connecting-IP')||'?',country:request.cf?.country||'?',city:request.cf?.city||'?',ts:new Date().toISOString()};solaceEmit(OWNER_NOTIFY_TOPIC,nPayload);return json({status:'notified'})}

  // Auth required below
  var auth=request.headers.get('Authorization')||'',qt=url.searchParams.get('token')||'';
  if(auth!=='Bearer '+TK&&qt!==TK) return json({error:'Unauthorized'},401);

  if(path==='/crawl'&&request.method==='POST'){var b=await request.json().catch(function(){return{}});if(!b.url)return json({error:'Missing url'},400);try{var t0=Date.now(),r=await fetch(b.url,{headers:{'User-Agent':'HermesBot/14'},redirect:'follow'}),h=await r.text(),x=h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,50000);return json({status:'success',url:b.url,content:x,response_time:Date.now()-t0})}catch(e){return json({error:e.message},502)}}
  if((path==='/ai/chat'||path==='/ai/stream')&&request.method==='POST'){var b=await request.json().catch(function(){return{}});solaceEmit('hermes/event/chat',{endpoint:path,model:b.model,stream:path==='/ai/stream',ts:new Date().toISOString()});return aiCall(b.model||'qwen/qwen3-32b',b.messages||[{role:'user',content:b.prompt||'hello'}],b.max_tokens||4096,path==='/ai/stream')}
  if(path==='/webhook/zapier'&&request.method==='POST'){var b=await request.json().catch(function(){return{}});if(b.action==='crawl'){if(!b.url)return json({error:'Missing url'},400);try{var r=await fetch(b.url,{headers:{'User-Agent':'HermesBot/14'},redirect:'follow'}),h=await r.text(),x=h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,30000);return json({url:b.url,content:x,status:'success'})}catch(e){return json({error:e.message},502)}}if(b.action==='chat'){return aiCall(b.model||'qwen/qwen3-32b',[{role:'user',content:b.prompt||''}],b.max_tokens||2048,false)}if(b.action==='tool'){try{var r=await fetch(LINK+'/tools/'+(b.tool||'')+'/execute',{method:'POST',headers:{'Authorization':'Bearer '+CLK,'Content-Type':'application/json'},body:JSON.stringify({params:b.params||{}})});return json(await r.json())}catch(e){return json({error:e.message},502)}}return json({error:'Unknown action'},400)}

  // Solace auth-required
  if(path==='/solace/publish'&&request.method==='POST'){if(!SOU)return json({error:'Solace not configured'},503);var b=await request.json().catch(function(){return{}});var topic=b.topic||'hermes/event/custom';var payload=b.payload||b.data||b;var mode=b.persistent?'persistent':'direct';try{var r=await fetch(SOU+'/topic/'+topic,{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':mode},body:JSON.stringify(payload)});return json({status:'published',topic:topic,mode:mode,httpCode:r.status,ts:new Date().toISOString()})}catch(e){return json({error:e.message},502)}}
  if(path==='/solace/task'&&request.method==='POST'){if(!SOU)return json({error:'Solace not configured'},503);var b=await request.json().catch(function(){return{}});var taskType=b.type||'chat';var taskId='task-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);var topic='hermes/task/'+taskType;var taskPayload={taskId:taskId,type:taskType,model:b.model||'qwen/qwen3-32b',prompt:b.prompt||'',messages:b.messages||[],params:b.params||{},source:'gateway',ts:new Date().toISOString()};try{var r=await fetch(SOU+'/topic/'+topic,{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':'persistent'},body:JSON.stringify(taskPayload)});if(b.async)return json({status:'queued',taskId:taskId,topic:topic});if(taskType==='chat'){var result=await aiCall(b.model||'qwen/qwen3-32b',b.messages||[{role:'user',content:b.prompt||''}],b.max_tokens||4096,false);return result}return json({status:'queued',taskId:taskId,topic:topic})}catch(e){return json({error:e.message},502)}}

  return json({error:'Not found'},404);
}

function aiCall(model,messages,max_tokens,stream){
  var info=MODELS.find(function(m){return m.id===model})||{p:'groq'};
  var aiUrl,aiKey;
  if(info.p==='gemini'){aiUrl='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';aiKey=GEM}
  else if(info.p==='openrouter'){aiUrl='https://openrouter.ai/api/v1/chat/completions';aiKey=OK}
  else{aiUrl='https://api.groq.com/openai/v1/chat/completions';aiKey=GK}
  return fetch(aiUrl,{method:'POST',headers:{'Authorization':'Bearer '+aiKey,'Content-Type':'application/json'},body:JSON.stringify({model:model,messages:messages,max_tokens:max_tokens,stream:stream})}).then(function(r){if(stream)return new Response(r.body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization'}});return r.text().then(function(t){return new Response(t,{status:r.status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}})})}).catch(function(e){return json({error:e.message},502)});
}

function solaceEmit(topic,data){if(!SOU)return;fetch(SOU+'/topic/'+topic,{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':'direct'},body:JSON.stringify(data)}).catch(function(){})}

function json(d,s){return new Response(JSON.stringify(d,null,2),{status:s||200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}})}
function cors(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}}

var CHAT_HTML=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Solace Hermes AI</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#09090b;--sf:#111113;--cd:#18181b;--bd:#27272a;--tx:#fafafa;--dm:#71717a;--ac:#3b82f6;--ac2:#8b5cf6;--gn:#22c55e;--rd:#ef4444;--or:#f97316;--cy:#06b6d4}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--tx);height:100dvh;display:flex;flex-direction:column;overflow:hidden}
header{padding:0 12px;height:50px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:6px;background:var(--sf)}
.logo{display:flex;align-items:center;gap:6px}
.dot{width:7px;height:7px;border-radius:50%;background:var(--gn);box-shadow:0 0 6px var(--gn)}
.logo h1{font-size:15px;font-weight:700;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hb{display:flex;gap:4px;margin-left:auto;align-items:center}
.ib{width:30px;height:30px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--dm);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ib:hover{border-color:var(--ac);color:var(--tx)}
#chat{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px}
.m{max-width:88%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.6;word-wrap:break-word;white-space:pre-wrap;position:relative}
.m.u{align-self:flex-end;background:var(--ac);color:#fff;border-bottom-right-radius:4px}
.m.a{align-self:flex-start;background:var(--cd);border:1px solid var(--bd);border-bottom-left-radius:4px}
.m.s{align-self:center;color:var(--dm);font-size:11px;background:none;max-width:100%}
.m .ml{font-size:10px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:4px}
.m .ml .mn{padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.3px}
.m .ml .mn.groq{background:rgba(249,115,22,.15);color:var(--or)}
.m .ml .mn.gemini{background:rgba(59,130,246,.15);color:var(--ac)}
.m .ml .mn.openrouter{background:rgba(139,92,246,.15);color:var(--ac2)}
.m .tk{color:var(--dm);font-size:12px;font-style:italic;border-left:2px solid var(--bd);padding:2px 0 2px 10px;margin-bottom:6px;display:block}
.m code{background:rgba(255,255,255,.06);padding:1px 5px;border-radius:4px;font-size:13px}
.m pre{background:rgba(0,0,0,.4);border:1px solid var(--bd);padding:10px;border-radius:8px;overflow-x:auto;margin:6px 0}
.m pre code{padding:0;background:none}
.m img{max-width:200px;border-radius:8px;margin:4px 0;display:block}
.m .fb{display:inline-flex;align-items:center;gap:4px;background:rgba(59,130,246,.12);padding:3px 8px;border-radius:6px;font-size:11px;color:var(--ac);margin:4px 0}
.cp{position:absolute;top:4px;right:4px;background:var(--cd);color:var(--dm);border:1px solid var(--bd);border-radius:5px;padding:1px 6px;font-size:10px;cursor:pointer;opacity:0;transition:opacity .15s}
.m:hover .cp{opacity:1}
.tp{color:var(--dm);font-size:13px;padding:4px 14px}
.tp::after{content:'';animation:dt 1s infinite}
@keyframes dt{0%,20%{content:''}40%{content:'.'}60%{content:'..'}80%,100%{content:'...'}}
footer{padding:8px 10px;border-top:1px solid var(--bd);background:var(--sf)}
#pv{display:none;padding:6px 10px;gap:8px;align-items:center;margin-bottom:6px;background:var(--bg);border-radius:8px;border:1px solid var(--bd)}
#pv.on{display:flex}
#pv img{width:36px;height:36px;object-fit:cover;border-radius:6px}
#pv .pn{flex:1;font-size:11px;color:var(--dm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#pv .pr{background:none;border:none;color:var(--rd);font-size:16px;cursor:pointer}
.ir{display:flex;gap:6px;align-items:flex-end}
.ir textarea{flex:1;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;resize:none;outline:none;min-height:42px;max-height:120px;line-height:1.4}
.ir textarea:focus{border-color:var(--ac)}
.ir .ab{width:42px;height:42px;border:1px solid var(--bd);border-radius:10px;background:var(--bg);color:var(--dm);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ir .sb{height:42px;padding:0 16px;border:none;border-radius:10px;background:var(--ac);color:#fff;font-size:14px;font-weight:600;cursor:pointer;flex-shrink:0}
.ir .sb:disabled{opacity:.3}
input[type=file]{display:none}
.info{text-align:center;padding:4px;font-size:9px;color:var(--dm)}
#pnl{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;align-items:flex-end;justify-content:center}
#pnl.on{display:flex}
#pc{background:var(--sf);border:1px solid var(--bd);border-bottom:none;border-radius:16px 16px 0 0;width:100%;max-width:480px;max-height:70dvh;overflow-y:auto;padding:16px;animation:su .2s}
@keyframes su{from{transform:translateY(100%)}to{transform:none}}
#pc h2{font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px}
#pc .cl{margin-left:auto;background:none;border:none;color:var(--dm);font-size:18px;cursor:pointer}
.ps{width:100%;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:8px 12px;font-size:13px;margin:8px 0;outline:none}
.pt{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
.pt button{background:var(--bg);color:var(--dm);border:1px solid var(--bd);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer}
.pt button.on{background:var(--ac);color:#fff;border-color:var(--ac)}
.pi{padding:10px;border:1px solid var(--bd);border-radius:10px;margin-bottom:6px;font-size:12px;cursor:pointer;background:var(--bg)}
.pi:hover{border-color:var(--ac)}
.pi b{color:var(--tx)}.pi small{color:var(--dm);display:block;margin-top:2px}
.msel{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0}
.msel label{font-size:10px;display:flex;align-items:center;gap:3px;background:var(--bg);border:1px solid var(--bd);padding:3px 8px;border-radius:6px;cursor:pointer;color:var(--dm)}
.msel label:has(input:checked){border-color:var(--ac);color:var(--ac);background:rgba(59,130,246,.08)}
.msel input{display:none}
</style>
</head>
<body>
<header>
<div class="logo"><span class="dot"></span><h1>Solace Hermes</h1></div>
<div class="hb">
<button class="ib" id="nb" title="New">+</button>
<button class="ib" id="hb" title="History">\u{1F4AC}</button>
<button class="ib" id="kb" title="Skills">\u26A1</button>
<button class="ib" id="ub" title="Hub">\u{1F43E}</button>
<button class="ib" id="lb" title="Link">\u{1F517}</button>
</div>
</header>
<div id="chat"><div class="m s">Multi-Agent Chat \u00B7 Select models below \u00B7 Each response shows its model</div></div>
<footer>
<div id="pv"><img id="pri" src=""><span class="pn" id="prn"></span><button class="pr" id="px">\u2715</button></div>
<div id="msel" class="msel"></div>
<div class="ir">
<button class="ab" id="fb">\u{1F4CE}</button>
<input type="file" id="fi" accept="image/*,.txt,.md,.csv,.json,.js,.py,.html,.css,.xml,.yaml,.log,.sh,.ts,.sql">
<textarea id="ti" rows="1" placeholder="Message..." autofocus></textarea>
<button class="sb" id="sb">\u25B6</button>
</div>
</footer>
<div class="info">Solace Hermes v14 \u00B7 Event-Driven AI</div>
<div id="pnl"><div id="pc"><h2 id="pt2">Panel<button class="cl" id="pcl">\u2715</button></h2><input class="ps" id="pq" placeholder="Search..."><div class="pt" id="ptb"></div><div id="pls"></div></div></div>
<script>
var API='';
var TK='hk-rocspace-2026';
var IMG=['image/jpeg','image/png','image/gif','image/webp'];
var hist=[],pf=null,pm='',pt='';
var SK='hermes_chats_v2';
var NOTIFIED=false;

var ALL_MODELS=[
  {id:'qwen/qwen3-32b',name:'Qwen3 32B',p:'groq',on:true},
  {id:'llama-3.3-70b-versatile',name:'Llama 70B',p:'groq',on:false},
  {id:'llama-3.1-8b-instant',name:'Llama 8B Fast',p:'groq',on:false},
  {id:'openai/gpt-oss-120b',name:'GPT-OSS 120B',p:'groq',on:false},
  {id:'meta-llama/llama-4-scout-17b-16e-instruct',name:'Scout \u{1F441}',p:'groq',on:false},
  {id:'groq/compound',name:'Compound',p:'groq',on:false},
  {id:'gemini-2.5-flash',name:'Gemini Flash',p:'gemini',on:true},
  {id:'gemini-2.5-pro',name:'Gemini Pro',p:'gemini',on:false},
  {id:'deepseek/deepseek-r1',name:'DeepSeek R1',p:'openrouter',on:false},
  {id:'google/gemini-2.5-pro-preview',name:'Gemini Pro OR',p:'openrouter',on:false}
];

var chat=document.getElementById('chat');
var ti=document.getElementById('ti');
var sb=document.getElementById('sb');
var fi=document.getElementById('fi');
var pv=document.getElementById('pv');
var pnl=document.getElementById('pnl');
var mselDiv=document.getElementById('msel');

function initModels(){
  var saved=localStorage.getItem('hermes_models');
  if(saved){try{var s=JSON.parse(saved);ALL_MODELS.forEach(function(m){var f=s.find(function(x){return x.id===m.id});if(f)m.on=f.on})}catch(e){}}
  renderModelSel();
}
function renderModelSel(){
  var h='';
  ALL_MODELS.forEach(function(m){
    h+='<label><input type="checkbox" data-mid="'+m.id+'"'+(m.on?' checked':'')+'>'+m.name+'</label>';
  });
  mselDiv.innerHTML=h;
  mselDiv.querySelectorAll('input').forEach(function(inp){
    inp.onchange=function(){
      var mid=inp.dataset.mid;
      var mo=ALL_MODELS.find(function(x){return x.id===mid});
      if(mo)mo.on=inp.checked;
      localStorage.setItem('hermes_models',JSON.stringify(ALL_MODELS.map(function(m){return{id:m.id,on:m.on}})));
    };
  });
}
function getActiveModels(){return ALL_MODELS.filter(function(m){return m.on})}

function provClass(p){if(p==='groq')return'groq';if(p==='gemini')return'gemini';return'openrouter'}
function provIcon(p){if(p==='groq')return'\u26A1';if(p==='gemini')return'\u{1F535}';return'\u2728'}

function msg(r,h,raw,modelInfo){
  var d=document.createElement('div');d.className='m '+r;
  var inner='';
  if(modelInfo&&r==='a'){
    inner+='<div class="ml"><span class="mn '+provClass(modelInfo.p)+'">'+provIcon(modelInfo.p)+' '+modelInfo.name+'</span></div>';
  }
  if(raw)inner+=h;else inner+=h.split('<').join('&lt;');
  d.innerHTML=inner;
  if(r==='u'||r==='a'){var c=document.createElement('button');c.className='cp';c.textContent='\u{1F4CB}';c.onclick=function(e){e.stopPropagation();navigator.clipboard.writeText(d.textContent).then(function(){c.textContent='\u2705';setTimeout(function(){c.textContent='\u{1F4CB}'},1200)})};d.appendChild(c)}
  chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;
}

function rAI(t){
  var th=t.match(/<think>[\s\S]*?<\/think>/g);
  var c=t.replace(/<think>[\s\S]*?<\/think>/g,'').trim();
  c=c.replace(/\`\`\`([\s\S]*?)\`\`\`/g,'<pre><code>$1</code></pre>');
  c=c.replace(/\`([^\`]+)\`/g,'<code>$1</code>');
  c=c.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  var h='';
  if(th&&th.length){var tx=[];for(var i=0;i<th.length;i++)tx.push(th[i].replace(/<\/?think>/g,'').trim());h+='<span class="tk">'+tx.join(String.fromCharCode(10))+'</span>'}
  return h+c;
}

// Notify owner on first visit
function notifyOwner(){
  if(NOTIFIED)return;NOTIFIED=true;
  fetch(API+'/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'chat_opened',user:localStorage.getItem('hermes_uid')||'visitor'})}).catch(function(){});
}

// Generate or get user ID
function getUid(){
  var uid=localStorage.getItem('hermes_uid');
  if(!uid){uid='user-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.setItem('hermes_uid',uid)}
  return uid;
}

// File handling
document.getElementById('fb').onclick=function(){fi.click()};
document.getElementById('px').onclick=function(){pf=null;pv.classList.remove('on')};
fi.onchange=function(){var f=fi.files[0];if(!f)return;fi.value='';if(IMG.indexOf(f.type)>=0){var r=new FileReader();r.onload=function(){pf={t:'img',n:f.name,d:r.result};document.getElementById('pri').src=r.result;document.getElementById('pri').style.display='block';document.getElementById('prn').textContent=f.name;pv.classList.add('on')};r.readAsDataURL(f)}else{var r2=new FileReader();r2.onload=function(){pf={t:'txt',n:f.name,c:r2.result.slice(0,30000)};document.getElementById('pri').style.display='none';document.getElementById('prn').textContent='\u{1F4C4} '+f.name;pv.classList.add('on')};r2.readAsText(f)}};

// Input
ti.oninput=function(){ti.style.height='auto';ti.style.height=Math.min(ti.scrollHeight,120)+'px'};
ti.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};
sb.onclick=send;

// Multi-agent send
async function send(){
  var text=ti.value.trim();
  if(!text&&!pf)return;
  ti.value='';ti.style.height='auto';sb.disabled=true;
  notifyOwner();
  var uc=[],dh='';
  if(pf){
    if(pf.t==='img'){dh+='<img src="'+pf.d+'">';uc.push({type:'image_url',image_url:{url:pf.d}})}
    else{dh+='<span class="fb">\u{1F4C4} '+pf.n+'</span><br>';uc.push({type:'text',text:'[File: '+pf.n+']'+String.fromCharCode(10)+pf.c})}
    pf=null;pv.classList.remove('on');
  }
  if(text){uc.push({type:'text',text:text});dh+=(dh?'<br>':'')+text.split('<').join('&lt;')}
  msg('u',dh,true);
  var hasI=uc.some(function(c){return c.type==='image_url'});
  var mc=hasI?uc:uc.map(function(c){return c.text||''}).join(String.fromCharCode(10));
  hist.push({role:'user',content:mc});

  var active=getActiveModels();
  if(!active.length){msg('s','No models selected. Check boxes below.');sb.disabled=false;return}

  // If image, force Scout vision model
  if(hasI){active=[{id:'meta-llama/llama-4-scout-17b-16e-instruct',name:'Scout \u{1F441}',p:'groq'}]}

  // Send to all active models in parallel
  var promises=active.map(function(mdl){
    var tp=document.createElement('div');tp.className='tp';tp.textContent=mdl.name+' thinking';chat.appendChild(tp);chat.scrollTop=chat.scrollHeight;

    return (hasI?
      fetch(API+'/ai/chat',{method:'POST',headers:{'Authorization':'Bearer '+TK,'Content-Type':'application/json'},body:JSON.stringify({model:mdl.id,messages:hist.slice(-10),max_tokens:4096})}).then(function(r){return r.json()}).then(function(d){
        tp.remove();
        var reply=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||(d.error&&d.error.message)||'No response';
        msg('a',rAI(reply),true,mdl);
        return{model:mdl,content:reply};
      })
    :
      fetch(API+'/ai/stream',{method:'POST',headers:{'Authorization':'Bearer '+TK,'Content-Type':'application/json'},body:JSON.stringify({model:mdl.id,messages:hist.slice(-20),max_tokens:4096,stream:true})}).then(function(res){
        tp.remove();var el=msg('a','',true,mdl);var full='';
        var reader=res.body.getReader(),dec=new TextDecoder(),buf='';
        function pump(){return reader.read().then(function(rv){
          if(rv.done)return{model:mdl,content:full};
          buf+=dec.decode(rv.value,{stream:true});var ls=buf.split(String.fromCharCode(10));buf=ls.pop()||'';
          for(var i=0;i<ls.length;i++){var l=ls[i];if(l.indexOf('data: ')!==0)continue;var dd=l.slice(6);if(dd==='[DONE]')continue;
            try{var j=JSON.parse(dd);var delta=(j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content)||'';if(delta){full+=delta;var mlh=el.querySelector('.ml');el.innerHTML=(mlh?mlh.outerHTML:'')+rAI(full);chat.scrollTop=chat.scrollHeight}}catch(ex){}}
          return pump();
        })}
        return pump();
      })
    ).catch(function(err){tp.remove();msg('s',mdl.name+': Error - '+err.message);return null});
  });

  var results=await Promise.all(promises);
  // Store first successful response in history for context
  var firstOk=results.find(function(r){return r&&r.content});
  if(firstOk)hist.push({role:'assistant',content:firstOk.content});
  saveChat();
  sb.disabled=false;ti.focus();
}

// History
function saveChat(){var cs=JSON.parse(localStorage.getItem(SK)||'[]');if(!hist.length)return;var t=(typeof hist[0].content==='string')?hist[0].content.slice(0,40):'Chat';cs.unshift({id:Date.now(),title:t,messages:hist.slice(),date:new Date().toISOString().slice(0,16)});if(cs.length>50)cs.length=50;localStorage.setItem(SK,JSON.stringify(cs))}
function gChats(){return JSON.parse(localStorage.getItem(SK)||'[]')}

document.getElementById('nb').onclick=function(){if(hist.length)saveChat();hist=[];chat.innerHTML='';msg('s','New chat \u00B7 Select models below')};
document.getElementById('hb').onclick=function(){pm='hist';openP()};
document.getElementById('kb').onclick=function(){pm='skills';openP()};
document.getElementById('ub').onclick=function(){pm='hub';openP()};
document.getElementById('lb').onclick=function(){pm='link';openP()};
document.getElementById('pcl').onclick=function(){pnl.classList.remove('on')};
pnl.onclick=function(e){if(e.target===pnl)pnl.classList.remove('on')};

var stm;
document.getElementById('pq').oninput=function(){clearTimeout(stm);stm=setTimeout(function(){loadP(document.getElementById('pq').value)},300)};

function openP(){
  pnl.classList.add('on');document.getElementById('pq').value='';
  if(pm==='hist'){
    document.getElementById('pt2').innerHTML='\u{1F4AC} History<button class="cl" onclick="pnl.classList.remove(String.fromCharCode(39)+'on'+String.fromCharCode(39))">\u2715</button>';
    document.getElementById('ptb').innerHTML='<button class="on" data-t="saved">Saved</button><button data-t="export">Export</button>';
    document.getElementById('ptb').querySelectorAll('button').forEach(function(b){b.onclick=function(){if(b.dataset.t==='export'){exportC();return}document.getElementById('ptb').querySelectorAll('button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');loadHist()}});
    document.getElementById('pq').placeholder='Search history...';loadHist();return;
  }
  if(pm==='skills'){document.getElementById('pt2').innerHTML='\u26A1 SkillsLLM<button class="cl" onclick="pnl.classList.remove(String.fromCharCode(39)+'on'+String.fromCharCode(39))">\u2715</button>';document.getElementById('ptb').innerHTML='';document.getElementById('pq').placeholder='Search skills...'}
  else if(pm==='hub'){document.getElementById('pt2').innerHTML='\u{1F43E} ClawHub<button class="cl" onclick="pnl.classList.remove(String.fromCharCode(39)+'on'+String.fromCharCode(39))">\u2715</button>';document.getElementById('ptb').innerHTML='<button class="on" data-t="skills">Skills</button><button data-t="plugins">Plugins</button>';pt='skills'}
  else{document.getElementById('pt2').innerHTML='\u{1F517} ClawLink<button class="cl" onclick="pnl.classList.remove(String.fromCharCode(39)+'on'+String.fromCharCode(39))">\u2715</button>';document.getElementById('ptb').innerHTML='<button class="on" data-t="integrations">Apps</button><button data-t="tools">Tools</button>';pt='integrations'}
  document.getElementById('ptb').querySelectorAll('button').forEach(function(b){b.onclick=function(){document.getElementById('ptb').querySelectorAll('button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');pt=b.dataset.t;loadP()}});
  loadP();
}

function loadHist(q){
  var cs=gChats();if(q)cs=cs.filter(function(c){return c.title.toLowerCase().indexOf(q.toLowerCase())>=0});
  if(!cs.length){document.getElementById('pls').innerHTML='<div style="color:var(--dm);padding:16px;text-align:center">No saved chats</div>';return}
  var h='';
  for(var i=0;i<cs.length;i++){var c=cs[i];h+='<div class="pi" data-idx="'+i+'"><b>'+c.title+'</b><small>'+c.date+' \u00B7 '+c.messages.length+' msgs</small><div style="margin-top:6px;display:flex;gap:4px"><button data-a="load" data-i="'+c.id+'" style="background:var(--ac);color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer">Load</button><button data-a="del" data-i="'+c.id+'" style="background:none;color:var(--rd);border:none;font-size:13px;cursor:pointer">\u2715</button></div></div>'}
  document.getElementById('pls').innerHTML=h;
  document.getElementById('pls').querySelectorAll('button[data-a]').forEach(function(b){
    b.onclick=function(e){e.stopPropagation();var id=parseInt(b.dataset.i);
      if(b.dataset.a==='load'){var ch=gChats().find(function(c){return c.id===id});if(!ch)return;hist=ch.messages.slice();chat.innerHTML='';msg('s','Loaded: '+ch.title);ch.messages.forEach(function(m){if(m.role==='user'){var t=typeof m.content==='string'?m.content:m.content.map(function(c){return c.text||'[img]'}).join(' ');msg('u',t.split('<').join('&lt;'),true)}else if(m.role==='assistant'){msg('a',rAI(m.content),true,{name:'AI',p:'groq'})}});pnl.classList.remove('on')}
      else if(b.dataset.a==='del'){var cs=gChats().filter(function(c){return c.id!==id});localStorage.setItem(SK,JSON.stringify(cs));loadHist()}}});
}

function exportC(){var cs=gChats();var txt=cs.map(function(c){return'=== '+c.title+' ('+c.date+') ==='+String.fromCharCode(10)+c.messages.map(function(m){var r=m.role==='user'?'You':'AI';var ct=typeof m.content==='string'?m.content:m.content.map(function(x){return x.text||'[img]'}).join(' ');return r+': '+ct}).join(String.fromCharCode(10,10))}).join(String.fromCharCode(10,10));var blob=new Blob([txt],{type:'text/plain'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hermes-chats.txt';a.click()}

async function loadP(q){
  document.getElementById('pls').innerHTML='<div style="color:var(--dm);padding:10px">Loading...</div>';
  var url;
  if(pm==='skills')url=API+'/skills'+(q?'?q='+encodeURIComponent(q):'');
  else if(pm==='hub')url=API+'/hub/'+(q?'search?q='+encodeURIComponent(q):pt);
  else url=API+'/link/'+pt;
  try{var r=await fetch(url);var d=await r.json();var items=d.items||d.results||d.integrations||d.tools||d.skills||[];if(!items.length){document.getElementById('pls').innerHTML='<div style="color:var(--dm);padding:10px">No results</div>';return}var h='';for(var i=0;i<Math.min(items.length,40);i++){var s=items[i];var nm=s.displayName||s.name||s.slug||s.integration||'?';var desc=(s.summary||s.description||s.connectionLabel||'').slice(0,60);h+='<div class="pi" data-n="'+nm+'"><b>'+nm+'</b>';if(desc)h+='<small>'+desc+'</small>';h+='</div>'}document.getElementById('pls').innerHTML=h;document.getElementById('pls').querySelectorAll('.pi').forEach(function(el){el.onclick=function(){ti.value='Tell me about "'+el.dataset.n+'"';pnl.classList.remove('on');ti.focus()}})}catch(e){document.getElementById('pls').innerHTML='<div style="color:var(--dm)">Error: '+e.message+'</div>'}
}

// Init
getUid();
initModels();
notifyOwner();
</script>
</body>
</html>
`;
