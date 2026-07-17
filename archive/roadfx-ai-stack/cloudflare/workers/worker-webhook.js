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
var CPK=(typeof CLERK_PK!=='undefined'?CLERK_PK:'');
var CSK=(typeof CLERK_SK!=='undefined'?CLERK_SK:'');
var CLERK_DOMAIN='awake-chicken-95.clerk.accounts.dev';

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
  {id:'llama-3.1-8b-instant',p:'groq',f:true,ctx:131072},
  {id:'gemini-2.5-flash',p:'gemini',f:true,ctx:1048576},
  {id:'google/gemini-2.5-pro-preview',p:'openrouter',f:false,ctx:2097152},{id:'google/gemini-2.5-flash',p:'openrouter',f:false,ctx:1048576},
  {id:'openai/gpt-4o',p:'openrouter',f:false,ctx:128000},{id:'deepseek/deepseek-r1',p:'openrouter',f:false,ctx:163840},
  {id:'qwen/qwen3-235b-a22b',p:'openrouter',f:false,ctx:131072},
];

async function handleRequest(request) {
  var url=new URL(request.url),path=url.pathname;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors()});
  if(path==='/chat'||path==='/chat/') return new Response(CHAT_HTML,{headers:secHTML()});
  if(path==='/crew'||path==='/crew/') return new Response(CREW_HTML,{headers:secHTML()});
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

  // Clerk auth
  if(path==='/auth/verify'&&request.method==='POST'){if(!CSK)return json({error:'Clerk not configured'},503);var b=await request.json().catch(function(){return{}});if(!b.token)return json({error:'Missing token'},400);try{var r=await fetch('https://api.clerk.com/v1/sessions/verify',{method:'POST',headers:{'Authorization':'Bearer '+CSK,'Content-Type':'application/json'},body:JSON.stringify({token:b.token})});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  if(path==='/auth/user'){if(!CSK)return json({error:'Clerk not configured'},503);var uid=url.searchParams.get('id')||'';if(!uid)return json({error:'Missing id'},400);try{var r=await fetch('https://api.clerk.com/v1/users/'+uid,{headers:{'Authorization':'Bearer '+CSK}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // Notify owner (public)
  if(path==='/notify'&&request.method==='POST'){var b=await request.json().catch(function(){return{}});solaceEmit(OWNER_NOTIFY_TOPIC,{type:'user_activity',user:b.user||'anon',clerkUser:b.clerkUser||null,action:b.action||'visit',ua:request.headers.get('User-Agent')||'?',ip:request.headers.get('CF-Connecting-IP')||'?',country:request.cf?.country||'?',ts:new Date().toISOString()});return json({status:'notified'})}

  // Auth required below
  var auth=request.headers.get('Authorization')||'',qt=url.searchParams.get('token')||'';
  if(auth!=='Bearer '+TK&&qt!==TK) return json({error:'Unauthorized'},401);

  // === CRAWL4AI ===
  if(path==='/crawl4ai'&&request.method==='POST'){var b=await request.json().catch(function(){return{}});if(!b.url)return json({error:'Missing url'},400);try{var t0=Date.now();var r=await fetch(b.url,{headers:{'User-Agent':'Crawl4AI/1.0 HermesBot'},redirect:'follow'});var h=await r.text();var titleM=h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);var title=titleM?titleM[1].trim():'';var text=h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi,'').replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi,'');var md=text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi,function(m,l,t){return'\n'+'#'.repeat(parseInt(l))+' '+t.replace(/<[^>]+>/g,'')+'\n'}).replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,'- $1\n').replace(/<p[^>]*>([\s\S]*?)<\/p>/gi,'$1\n\n').replace(/<br[^>]*>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\n{3,}/g,'\n\n').replace(/[ \t]+/g,' ').trim().slice(0,b.max_length||50000);solaceEmit('hermes/event/crawl',{url:b.url,title:title,ts:new Date().toISOString()});return json({status:'success',url:b.url,title:title,content:md,content_length:md.length,response_time:Date.now()-t0})}catch(e){return json({error:e.message},502)}}
  if(path==='/crawl4ai/extract'&&request.method==='POST'){var b=await request.json().catch(function(){return{}});if(!b.url)return json({error:'Missing url'},400);try{var r=await fetch(b.url,{headers:{'User-Agent':'Crawl4AI/1.0'},redirect:'follow'});var h=await r.text();var jsonld=[];var jre=/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;var jm;while((jm=jre.exec(h))!==null){try{jsonld.push(JSON.parse(jm[1]))}catch(e){}}var og={};var ogre=/<meta[^>]+property="(og:[^"]+)"[^>]+content="([^"]+)"/gi;var om;while((om=ogre.exec(h))!==null){og[om[1]]=om[2]}return json({status:'success',url:b.url,jsonld:jsonld,opengraph:og})}catch(e){return json({error:e.message},502)}}
  if(path==='/crawl4ai/batch'&&request.method==='POST'){var b=await request.json().catch(function(){return{}});var urls=b.urls||[];if(!urls.length)return json({error:'Missing urls'},400);var results=await Promise.all(urls.slice(0,10).map(function(u){return fetch(u,{headers:{'User-Agent':'Crawl4AI/1.0'},redirect:'follow'}).then(function(r){return r.text()}).then(function(h){var t=h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,5000);var tm=h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return{url:u,status:'success',title:tm?tm[1].trim():'',content_length:t.length}}).catch(function(e){return{url:u,status:'error',error:e.message}})}));return json({results:results})}
  // === NOTION VIA CLAWLINK ===
  if(path.startsWith('/notion/')&&request.method==='POST'){var action=path.replace('/notion/','');var bd=await request.json().catch(function(){return{}});try{var r=await fetch(LINK+'/tools/notion_'+action+'/execute',{method:'POST',headers:{'Authorization':'Bearer '+CLK,'Content-Type':'application/json'},body:JSON.stringify({params:bd})});return json(await r.json())}catch(e){return json({error:e.message},502)}}

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
  // Enforce minimum max_tokens for models that need it
  var mt=max_tokens;
  if(info.p==='gemini'&&mt<256)mt=256;
  if(model.indexOf('r1')>=0||model.indexOf('gpt-oss')>=0||model.indexOf('compound')>=0||model.indexOf('pro-preview')>=0||model.indexOf('pro')>=0){if(mt<2048)mt=2048}
  if(info.p==='gemini'){aiUrl='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';aiKey=GEM}
  else if(info.p==='openrouter'){aiUrl='https://openrouter.ai/api/v1/chat/completions';aiKey=OK}
  else{aiUrl='https://api.groq.com/openai/v1/chat/completions';aiKey=GK}
  var msgs=messages.slice();
  if(model.indexOf('qwen')>=0&&model.indexOf('qwen3')>=0){if(!msgs.length||msgs[0].role!=='system'){msgs.unshift({role:'system',content:'/no_think'})}else{msgs[0].content='/no_think '+msgs[0].content}}
  var body={model:model,messages:msgs,max_tokens:mt,stream:stream};
  return fetch(aiUrl,{method:'POST',headers:{'Authorization':'Bearer '+aiKey,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){if(stream)return new Response(r.body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization'}});return r.text().then(function(t){
    // Fix empty content: extract from reasoning field if content is empty
    try{var j=JSON.parse(t);if(j.choices&&j.choices[0]&&j.choices[0].message){var m=j.choices[0].message;if((!m.content||m.content.trim()==='')&&m.reasoning){m.content='[Reasoning]: '+m.reasoning}if(!m.content&&j.choices[0].finish_reason==='length'){m.content='[Model needs more tokens - try a shorter question]'}}t=JSON.stringify(j)}catch(ex){}
    return new Response(t,{status:r.status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}})})}).catch(function(e){return json({error:e.message},502)});
}

function solaceEmit(topic,data){if(!SOU)return;fetch(SOU+'/topic/'+topic,{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':'direct'},body:JSON.stringify(data)}).catch(function(){})}

function json(d,s){return new Response(JSON.stringify(d,null,2),{status:s||200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin'}})}
function cors(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}}
function secHTML(){return{'Content-Type':'text/html;charset=utf-8','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','X-XSS-Protection':'1; mode=block','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:"}}


var CHAT_HTML=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Solace Hermes AI</title>
<script defer crossorigin="anonymous" data-clerk-publishable-key="pk_test_YXdha2UtY2hpY2tlbi05NS5jbGVyay5hY2NvdW50cy5kZXYk" src="https://awake-chicken-95.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js" type="text/javascript"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#09090b;--sf:#111113;--cd:#18181b;--bd:#27272a;--tx:#fafafa;--dm:#71717a;--ac:#3b82f6;--ac2:#8b5cf6;--gn:#22c55e;--rd:#ef4444;--or:#f97316;--cy:#06b6d4}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--tx);height:100dvh;display:flex;flex-direction:column;overflow:hidden}
header{padding:0 12px;height:50px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:6px;background:var(--sf)}
.logo{display:flex;align-items:center;gap:6px}
.dot{width:7px;height:7px;border-radius:50%;background:var(--gn);box-shadow:0 0 6px var(--gn)}
.logo h1{font-size:15px;font-weight:700;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hb{display:flex;gap:4px;margin-left:auto;align-items:center}
.hb select{background:var(--bg);color:var(--dm);border:1px solid var(--bd);border-radius:8px;padding:4px 6px;font-size:11px;outline:none;max-width:140px}
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
.mode{display:flex;gap:4px;margin-bottom:6px;align-items:center}
.mode span{font-size:9px;color:var(--dm)}
.mode button{font-size:10px;padding:2px 8px;border-radius:5px;border:1px solid var(--bd);background:var(--bg);color:var(--dm);cursor:pointer}
.mode button.on{background:var(--ac);color:#fff;border-color:var(--ac)}
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
</style>
</head>
<body>
<header>
<div class="logo"><span class="dot"></span><h1>Solace Hermes</h1></div>
<div class="hb">
<span id="uname" style="font-size:10px;color:var(--dm);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
<button class="ib" id="authBtn" title="Login" style="font-size:10px">Login</button>
<button class="ib" id="nb" title="New">+</button>
<button class="ib" id="hb" title="History">\u{1F4AC}</button>
<button class="ib" id="kb" title="Skills">\u26A1</button>
<button class="ib" id="lb" title="Tools">\u{1F517}</button>
<select id="md">
<optgroup label="Groq \u26A1">
<option value="qwen/qwen3-32b">Qwen3 32B</option>
<option value="llama-3.3-70b-versatile">Llama 70B</option>
<option value="llama-3.1-8b-instant">Llama 8B Fast</option>
<option value="openai/gpt-oss-120b">GPT-OSS 120B</option>
<option value="meta-llama/llama-4-scout-17b-16e-instruct">Scout \u{1F441}</option>
<option value="groq/compound">Compound</option>
</optgroup>
<optgroup label="Google \u{1F535}">
<option value="gemini-2.5-flash">Gemini Flash</option>
</optgroup>
<optgroup label="OpenRouter \u2728">
<option value="deepseek/deepseek-r1">DeepSeek R1 \u{1F9E0}</option>
<option value="google/gemini-2.5-pro-preview">Gemini Pro OR</option>
</optgroup>
</select>
</div>
</header>
<div id="chat"><div class="m s">\u26A1 Select model \u2192 Type message \u2192 1 response with model badge</div></div>
<footer>
<div id="pv"><img id="pri" src=""><span class="pn" id="prn"></span><button class="pr" id="px">\u2715</button></div>
<div class="mode">
<span>Mode:</span>
<button id="mSingle" class="on" title="Selected model answers">Single</button>
<button id="mRound" title="Rotate through models each turn">Round</button>
<button id="mBest" title="Auto-pick best model for the task">Auto</button>
</div>
<div class="ir">
<button class="ab" id="fb">\u{1F4CE}</button>
<input type="file" id="fi" accept="image/*,.txt,.md,.csv,.json,.js,.py,.html,.css,.xml,.yaml,.log,.sh,.ts,.sql">
<textarea id="ti" rows="1" placeholder="Message..." autofocus></textarea>
<button class="sb" id="sb">\u25B6</button>
</div>
</footer>
<div class="info">v14 \u00B7 Solace Hermes \u00B7 Event-Driven AI</div>
<div id="pnl"><div id="pc"><h2 id="pt2">Panel<button class="cl" id="pcl">\u2715</button></h2><input class="ps" id="pq" placeholder="Search..."><div class="pt" id="ptb"></div><div id="pls"></div></div></div>
<script>
var API='';
var TK='hk-rocspace-2026';
var IMG=['image/jpeg','image/png','image/gif','image/webp'];
var hist=[],pf=null,pm='',pt='';
var SK='hermes_chats_v3';
var NOTIFIED=false;
var MODE='single';
var roundIdx=0;

var MINFO={
  'qwen/qwen3-32b':{name:'Qwen3 32B',p:'groq',good:'general,code,reasoning'},
  'llama-3.3-70b-versatile':{name:'Llama 70B',p:'groq',good:'general,creative'},
  'llama-3.1-8b-instant':{name:'Llama 8B',p:'groq',good:'fast,simple'},
  'openai/gpt-oss-120b':{name:'GPT-OSS 120B',p:'groq',good:'complex,analysis'},
  'meta-llama/llama-4-scout-17b-16e-instruct':{name:'Scout',p:'groq',good:'vision,image'},
  'groq/compound':{name:'Compound',p:'groq',good:'multi-step,tool'},
  'gemini-2.5-flash':{name:'Gemini Flash',p:'gemini',good:'fast,general,long'},
  'gemini-2.5-pro':{name:'Gemini Pro',p:'gemini',good:'complex,reasoning,code'},
  'deepseek/deepseek-r1':{name:'DeepSeek R1',p:'openrouter',good:'reasoning,math,logic'},
  'google/gemini-2.5-pro-preview':{name:'Gemini Pro OR',p:'openrouter',good:'complex,analysis'}
};

var ROUND_MODELS=['qwen/qwen3-32b','gemini-2.5-flash','llama-3.3-70b-versatile','deepseek/deepseek-r1'];

var chat=document.getElementById('chat');
var ti=document.getElementById('ti');
var sb=document.getElementById('sb');
var md=document.getElementById('md');
var fi=document.getElementById('fi');
var pv=document.getElementById('pv');
var pnl=document.getElementById('pnl');

function provClass(p){if(p==='groq')return'groq';if(p==='gemini')return'gemini';return'openrouter'}
function provIcon(p){if(p==='groq')return'\u26A1';if(p==='gemini')return'\u{1F535}';return'\u2728'}

function msg(r,h,raw,mi){
  var d=document.createElement('div');d.className='m '+r;
  var inner='';
  if(mi&&r==='a'){inner+='<div class="ml"><span class="mn '+provClass(mi.p)+'">'+provIcon(mi.p)+' '+mi.name+'</span></div>'}
  if(raw)inner+=h;else inner+=h.split('<').join('&lt;');
  d.innerHTML=inner;
  if(r==='u'||r==='a'){var c=document.createElement('button');c.className='cp';c.textContent='\u{1F4CB}';c.onclick=function(e){e.stopPropagation();navigator.clipboard.writeText(d.textContent).then(function(){c.textContent='\u2705';setTimeout(function(){c.textContent='\u{1F4CB}'},1200)})};d.appendChild(c)}
  chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;
}

function rAI(t){
  var S=String.fromCharCode(92);
  var thinkOpen='<think>';var thinkClose='<'+'/think>';
  var reThink=new RegExp(thinkOpen+'['+S+'s'+S+'S]*?'+thinkClose,'g');
  var hasOpenThink=t.indexOf(thinkOpen)>=0;
  var hasCloseThink=t.indexOf(thinkClose)>=0;
  var th=t.match(reThink);
  var c=t.replace(reThink,'').trim();
  if(hasOpenThink&&!hasCloseThink){c=c.replace(thinkOpen,'').trim();c='<span class="tk">Thinking...</span>'}
  else if(!c&&th&&th.length){var raw=th[0].replace(new RegExp('<'+'/?' + 'think>','g'),'').trim();c='<span class="tk">'+raw.split('<').join('&lt;').slice(0,200)+'</span>'}
  var BT=String.fromCharCode(96);
  c=c.replace(new RegExp(BT+BT+BT+'(['+S+'s'+S+'S]*?)'+BT+BT+BT,'g'),'<pre><code>$1</code></pre>');
  c=c.replace(new RegExp(BT+'([^'+BT+']+)'+BT,'g'),'<code>$1</code>');
  c=c.replace(new RegExp(S+'*'+S+'*(.+?)'+S+'*'+S+'*','g'),'<strong>$1</strong>');
  var h='';
  if(th&&th.length&&c.indexOf('Thinking')<0){var tx=[];for(var i=0;i<th.length;i++)tx.push(th[i].replace(new RegExp('<'+'/?' + 'think>','g'),'').trim().split('<').join('&lt;'));h+='<span class="tk">'+tx.join(String.fromCharCode(10))+'</span>'}
  return h+c;
}

function pickAutoModel(text){
  var t=text.toLowerCase();
  if(t.match(/image|gambar|foto|picture|describe this/))return'meta-llama/llama-4-scout-17b-16e-instruct';
  if(t.match(/math|hitun|kalkulasi|equation|integral|derivat|logika|logic|prove/))return'deepseek/deepseek-r1';
  if(t.match(/code|kode|program|function|class|import|debug|error|bug|python|javascript|html|css|sql|api/))return'qwen/qwen3-32b';
  if(t.match(/panjang|panjang|long|detail|analys|analis|essay|explain in detail|jelaskan/))return'gemini-2.5-pro';
  if(t.match(/cepat|fast|quick|singkat|short|simple|1 kalimat|terjemah|translate/))return'llama-3.1-8b-instant';
  if(t.match(/step|langkah|plan|rencana|multi|complex/))return'groq/compound';
  return'gemini-2.5-flash';
}

function notifyOwner(){if(NOTIFIED)return;NOTIFIED=true;fetch(API+'/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'chat_opened',user:localStorage.getItem('hermes_uid')||'visitor',clerkUser:clerkUser})}).catch(function(){})}
function getUid(){var uid=localStorage.getItem('hermes_uid');if(!uid){uid='user-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.setItem('hermes_uid',uid)}return uid}

// Mode buttons
document.getElementById('mSingle').onclick=function(){setMode('single')};
document.getElementById('mRound').onclick=function(){setMode('round')};
document.getElementById('mBest').onclick=function(){setMode('auto')};
function setMode(m){MODE=m;document.querySelectorAll('.mode button').forEach(function(b){b.classList.remove('on')});document.getElementById('m'+m.charAt(0).toUpperCase()+m.slice(1)).classList.add('on');localStorage.setItem('hermes_mode',m)}
var savedMode=localStorage.getItem('hermes_mode');if(savedMode)setMode(savedMode);

// File
document.getElementById('fb').onclick=function(){fi.click()};
document.getElementById('px').onclick=function(){pf=null;pv.classList.remove('on')};
fi.onchange=function(){var f=fi.files[0];if(!f)return;fi.value='';if(IMG.indexOf(f.type)>=0){var r=new FileReader();r.onload=function(){pf={t:'img',n:f.name,d:r.result};document.getElementById('pri').src=r.result;document.getElementById('pri').style.display='block';document.getElementById('prn').textContent=f.name;pv.classList.add('on')};r.readAsDataURL(f)}else{var r2=new FileReader();r2.onload=function(){pf={t:'txt',n:f.name,c:r2.result.slice(0,30000)};document.getElementById('pri').style.display='none';document.getElementById('prn').textContent='\u{1F4C4} '+f.name;pv.classList.add('on')};r2.readAsText(f)}};

// Input
ti.oninput=function(){ti.style.height='auto';ti.style.height=Math.min(ti.scrollHeight,120)+'px'};
ti.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};
sb.onclick=send;

async function send(){
  var text=ti.value.trim();if(!text&&!pf)return;
  ti.value='';ti.style.height='auto';sb.disabled=true;notifyOwner();
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

  // Pick model based on mode
  var model;
  if(hasI){model='meta-llama/llama-4-scout-17b-16e-instruct'}
  else if(MODE==='auto'){model=pickAutoModel(text)}
  else if(MODE==='round'){model=ROUND_MODELS[roundIdx%ROUND_MODELS.length];roundIdx++}
  else{model=md.value}
  var mi=MINFO[model]||{name:model.split('/').pop(),p:'groq'};

  var tp=document.createElement('div');tp.className='tp';tp.textContent=mi.name+' thinking';chat.appendChild(tp);chat.scrollTop=chat.scrollHeight;

  try{
    if(hasI){
      var res=await fetch(API+'/ai/chat',{method:'POST',headers:{'Authorization':'Bearer '+TK,'Content-Type':'application/json'},body:JSON.stringify({model:model,messages:hist.slice(-10),max_tokens:4096})});
      tp.remove();var d=await res.json();
      var reply=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||(d.error&&d.error.message)||'No response';
      msg('a',rAI(reply),true,mi);hist.push({role:'assistant',content:reply});
    }else{
      var res=await fetch(API+'/ai/stream',{method:'POST',headers:{'Authorization':'Bearer '+TK,'Content-Type':'application/json'},body:JSON.stringify({model:model,messages:hist.slice(-20),max_tokens:4096,stream:true})});
      tp.remove();var el=msg('a','',true,mi);var full='';
      var reader=res.body.getReader(),dec=new TextDecoder(),buf='';
      while(true){
        var rv=await reader.read();if(rv.done)break;
        buf+=dec.decode(rv.value,{stream:true});var ls=buf.split(String.fromCharCode(10));buf=ls.pop()||'';
        for(var i=0;i<ls.length;i++){var l=ls[i];if(l.indexOf('data: ')!==0)continue;var dd=l.slice(6);if(dd==='[DONE]')continue;
          try{var j=JSON.parse(dd);var ch=j.choices&&j.choices[0]&&j.choices[0].delta;var delta=(ch&&ch.content)||'';
            if(!delta&&ch&&ch.reasoning)delta=ch.reasoning;
            if(delta){full+=delta;var mlh=el.querySelector('.ml');el.innerHTML=(mlh?mlh.outerHTML:'')+rAI(full);chat.scrollTop=chat.scrollHeight}
          }catch(ex){}}
      }
      hist.push({role:'assistant',content:full});
    }
    saveChat();
  }catch(err){tp.remove();msg('s','Error: '+err.message)}
  sb.disabled=false;ti.focus();
}

// History
function saveChat(){var cs=JSON.parse(localStorage.getItem(SK)||'[]');if(!hist.length)return;var t=(typeof hist[0].content==='string')?hist[0].content.slice(0,40):'Chat';cs.unshift({id:Date.now(),title:t,messages:hist.slice(),date:new Date().toISOString().slice(0,16)});if(cs.length>50)cs.length=50;localStorage.setItem(SK,JSON.stringify(cs))}
function gChats(){return JSON.parse(localStorage.getItem(SK)||'[]')}

document.getElementById('nb').onclick=function(){if(hist.length)saveChat();hist=[];chat.innerHTML='';msg('s','New chat')};
document.getElementById('hb').onclick=function(){pm='hist';openP()};
document.getElementById('kb').onclick=function(){pm='skills';openP()};
document.getElementById('lb').onclick=function(){pm='link';openP()};
document.getElementById('pcl').onclick=function(){pnl.classList.remove('on')};
pnl.onclick=function(e){if(e.target===pnl)pnl.classList.remove('on')};
var stm;document.getElementById('pq').oninput=function(){clearTimeout(stm);stm=setTimeout(function(){if(pm==='hist')loadHist(document.getElementById('pq').value);else loadP(document.getElementById('pq').value)},300)};

function openP(){
  pnl.classList.add('on');document.getElementById('pq').value='';
  var closeBtn='<button class="cl" id="pc2">\u2715</button>';
  if(pm==='hist'){
    document.getElementById('pt2').innerHTML='\u{1F4AC} History'+closeBtn;
    document.getElementById('pc2').onclick=function(){pnl.classList.remove('on')};
    document.getElementById('ptb').innerHTML='<button class="on" data-t="saved">Saved</button><button data-t="export">Export</button>';
    document.getElementById('ptb').querySelectorAll('button').forEach(function(b){b.onclick=function(){if(b.dataset.t==='export'){exportC();return}document.getElementById('ptb').querySelectorAll('button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');loadHist()}});
    document.getElementById('pq').placeholder='Search history...';loadHist();return;
  }
  if(pm==='skills'){document.getElementById('pt2').innerHTML='\u26A1 SkillsLLM'+closeBtn;document.getElementById('ptb').innerHTML='';document.getElementById('pq').placeholder='Search skills...'}
  else{document.getElementById('pt2').innerHTML='\u{1F517} ClawLink'+closeBtn;document.getElementById('ptb').innerHTML='<button class="on" data-t="integrations">Apps</button><button data-t="tools">Tools</button>';pt='integrations'}
  document.getElementById('pc2').onclick=function(){pnl.classList.remove('on')};
  document.getElementById('ptb').querySelectorAll('button').forEach(function(b){b.onclick=function(){document.getElementById('ptb').querySelectorAll('button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');pt=b.dataset.t;loadP()}});
  loadP();
}

function loadHist(q){
  var cs=gChats();if(q)cs=cs.filter(function(c){return c.title.toLowerCase().indexOf(q.toLowerCase())>=0});
  if(!cs.length){document.getElementById('pls').innerHTML='<div style="color:var(--dm);padding:16px;text-align:center">No saved chats</div>';return}
  var h='';for(var i=0;i<cs.length;i++){var c=cs[i];h+='<div class="pi" data-idx="'+i+'"><b>'+c.title+'</b><small>'+c.date+' \u00B7 '+c.messages.length+' msgs</small><div style="margin-top:6px;display:flex;gap:4px"><button data-a="load" data-i="'+c.id+'" style="background:var(--ac);color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer">Load</button><button data-a="del" data-i="'+c.id+'" style="background:none;color:var(--rd);border:none;font-size:13px;cursor:pointer">\u2715</button></div></div>'}
  document.getElementById('pls').innerHTML=h;
  document.getElementById('pls').querySelectorAll('button[data-a]').forEach(function(b){b.onclick=function(e){e.stopPropagation();var id=parseInt(b.dataset.i);if(b.dataset.a==='load'){var ch=gChats().find(function(c){return c.id===id});if(!ch)return;hist=ch.messages.slice();chat.innerHTML='';msg('s','Loaded: '+ch.title);ch.messages.forEach(function(m){if(m.role==='user'){var t=typeof m.content==='string'?m.content:m.content.map(function(c){return c.text||'[img]'}).join(' ');msg('u',t.split('<').join('&lt;'),true)}else if(m.role==='assistant'){msg('a',rAI(m.content),true,{name:'AI',p:'groq'})}});pnl.classList.remove('on')}else if(b.dataset.a==='del'){var cs2=gChats().filter(function(c){return c.id!==id});localStorage.setItem(SK,JSON.stringify(cs2));loadHist()}}});
}
function exportC(){var cs=gChats();var txt=cs.map(function(c){return'=== '+c.title+' ('+c.date+') ==='+String.fromCharCode(10)+c.messages.map(function(m){var r=m.role==='user'?'You':'AI';var ct=typeof m.content==='string'?m.content:m.content.map(function(x){return x.text||'[img]'}).join(' ');return r+': '+ct}).join(String.fromCharCode(10,10))}).join(String.fromCharCode(10,10));var blob=new Blob([txt],{type:'text/plain'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hermes-chats.txt';a.click()}

async function loadP(q){
  document.getElementById('pls').innerHTML='<div style="color:var(--dm);padding:10px">Loading...</div>';
  var url;if(pm==='skills')url=API+'/skills'+(q?'?q='+encodeURIComponent(q):'');else url=API+'/link/'+pt;
  try{var r=await fetch(url);var d=await r.json();var items=d.items||d.results||d.integrations||d.tools||d.skills||[];if(!items.length){document.getElementById('pls').innerHTML='<div style="color:var(--dm);padding:10px">No results</div>';return}var h='';for(var i=0;i<Math.min(items.length,40);i++){var s=items[i];var nm=s.displayName||s.name||s.slug||s.integration||'?';var desc=(s.summary||s.description||s.connectionLabel||'').slice(0,60);h+='<div class="pi" data-n="'+nm+'"><b>'+nm+'</b>';if(desc)h+='<small>'+desc+'</small>';h+='</div>'}document.getElementById('pls').innerHTML=h;document.getElementById('pls').querySelectorAll('.pi').forEach(function(el){el.onclick=function(){ti.value='Tell me about "'+el.dataset.n+'"';pnl.classList.remove('on');ti.focus()}})}catch(e){document.getElementById('pls').innerHTML='<div style="color:var(--dm)">Error: '+e.message+'</div>'}
}

getUid();
var clerkUser=null;
var clerkReady=false;
function initClerk(){
  if(typeof Clerk==='undefined'){setTimeout(initClerk,500);return}
  var c=Clerk;
  if(c.loaded){onClerkLoad(c)}
  else if(c.load){c.load().then(function(){onClerkLoad(c)}).catch(function(){clerkReady=true;console.log('Clerk load failed, guest mode')})}
  else{clerkReady=true}
}
function onClerkLoad(c){
  clerkReady=true;
  if(c.user){
    clerkUser={id:c.user.id,name:c.user.firstName||c.user.username||'User',email:(c.user.emailAddresses&&c.user.emailAddresses[0])?c.user.emailAddresses[0].emailAddress:'',img:c.user.imageUrl||''};
    document.getElementById('uname').textContent=clerkUser.name;
    document.getElementById('authBtn').textContent='\u{1F464}';
    document.getElementById('authBtn').title='Profile';
    document.getElementById('authBtn').onclick=function(){c.openUserProfile()};
    notifyOwner();
  }else{
    document.getElementById('authBtn').textContent='Login';
    document.getElementById('authBtn').onclick=function(){c.openSignIn({afterSignInUrl:location.href,afterSignUpUrl:location.href})};
  }
  c.addListener(function(){
    if(c.user){
      clerkUser={id:c.user.id,name:c.user.firstName||c.user.username||'User',email:(c.user.emailAddresses&&c.user.emailAddresses[0])?c.user.emailAddresses[0].emailAddress:'',img:c.user.imageUrl||''};
      document.getElementById('uname').textContent=clerkUser.name;
      document.getElementById('authBtn').textContent='\u{1F464}';
      document.getElementById('authBtn').title='Profile';
      document.getElementById('authBtn').onclick=function(){c.openUserProfile()};
      notifyOwner();
    }else{
      clerkUser=null;
      document.getElementById('uname').textContent='';
      document.getElementById('authBtn').textContent='Login';
      document.getElementById('authBtn').onclick=function(){c.openSignIn()};
    }
  });
}
setTimeout(initClerk,800);
</script>
</body>
</html>
`;

var CREW_HTML=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>CrewAI — Solace Hermes</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#09090b;color:#fafafa;min-height:100dvh;display:flex;justify-content:center}
.pg{width:100%;max-width:520px;padding:24px 16px 40px}
.hero{text-align:center;padding:32px 0 24px}
.hero-icon{width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg,#f97316,#ef4444);display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 16px;box-shadow:0 0 40px rgba(249,115,22,.2)}
.hero h1{font-size:22px;font-weight:800;background:linear-gradient(135deg,#f97316,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:#71717a;font-size:13px;margin-top:6px;line-height:1.5}
.stats{display:flex;justify-content:center;gap:20px;margin-top:16px}
.stats div{text-align:center}
.stats .n{font-size:20px;font-weight:700;color:#f97316}
.stats .l{font-size:9px;color:#71717a;text-transform:uppercase;letter-spacing:.5px}
.agents{display:flex;flex-direction:column;gap:10px;margin-top:24px}
.agent{padding:16px;background:#18181b;border:1px solid #27272a;border-radius:14px;display:flex;gap:12px;align-items:flex-start}
.agent:hover{border-color:#f97316;transform:translateY(-1px);transition:all .2s}
.agent .av{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.agent .av.r{background:rgba(59,130,246,.1)}
.agent .av.a{background:rgba(139,92,246,.1)}
.agent .av.w{background:rgba(34,197,94,.1)}
.agent .info h3{font-size:14px;font-weight:600;margin-bottom:3px}
.agent .info p{font-size:11px;color:#71717a;line-height:1.4}
.agent .info .tag{display:inline-block;font-size:9px;padding:2px 7px;border-radius:4px;margin-top:6px;font-weight:600;letter-spacing:.3px}
.agent .info .tag.blue{background:rgba(59,130,246,.12);color:#3b82f6}
.agent .info .tag.purple{background:rgba(139,92,246,.12);color:#8b5cf6}
.agent .info .tag.green{background:rgba(34,197,94,.12);color:#22c55e}
.sc{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin:24px 0 10px 4px}
.flow{padding:16px;background:#18181b;border:1px solid #27272a;border-radius:14px;margin-bottom:10px}
.flow-step{display:flex;align-items:center;gap:10px;padding:8px 0}
.flow-step .num{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.flow-step .txt{font-size:12px;color:#a1a1aa}
.flow-step .txt b{color:#fafafa}
.flow-line{width:2px;height:16px;background:#27272a;margin-left:13px}
.try-box{margin-top:24px;padding:16px;background:linear-gradient(135deg,rgba(249,115,22,.06),rgba(239,68,68,.06));border:1px solid #27272a;border-radius:14px}
.try-box h3{font-size:14px;font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.try-input{display:flex;gap:8px}
.try-input input{flex:1;background:#09090b;color:#fafafa;border:1px solid #27272a;border-radius:8px;padding:10px 12px;font-size:13px;outline:none}
.try-input input:focus{border-color:#f97316}
.try-input button{padding:10px 18px;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}
.try-input button:hover{opacity:.9}
#result{margin-top:12px;display:none;padding:12px;background:#09090b;border:1px solid #27272a;border-radius:10px;font-size:12px;color:#a1a1aa;white-space:pre-wrap;max-height:300px;overflow-y:auto;line-height:1.5}
#result.on{display:block}
.links{display:flex;flex-direction:column;gap:6px;margin-top:16px}
.lk{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#18181b;border:1px solid #27272a;border-radius:12px;text-decoration:none;color:#fafafa;transition:all .2s}
.lk:hover{border-color:#f97316;transform:translateY(-1px)}
.lk .ic{font-size:18px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:rgba(249,115,22,.06);border-radius:8px;flex-shrink:0}
.lk .in{flex:1;min-width:0}
.lk .in h3{font-size:13px;font-weight:600}
.lk .in p{font-size:10px;color:#71717a}
.lk .ar{color:#3f3f46;font-size:12px}
.ft{text-align:center;margin-top:24px;color:#3f3f46;font-size:9px;letter-spacing:.3px}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:9px;padding:3px 8px;border-radius:5px;font-weight:700;letter-spacing:.3px;background:#f97316;color:#000}
</style>
</head>
<body>
<div class="pg">

<div class="hero">
<div class="hero-icon">&#129302;</div>
<h1>CrewAI Agents</h1>
<p>Multi-agent AI workforce &#8212; Research, Analyze, Report<br>Powered by Groq &#9889; + Solace Event Mesh</p>
<div class="stats">
<div><div class="n">3</div><div class="l">Agents</div></div>
<div><div class="n">3</div><div class="l">Tasks</div></div>
<div><div class="n">&#9889;</div><div class="l">Sequential</div></div>
</div>
</div>

<div class="sc">&#129302; AI Agents</div>
<div class="agents">
<div class="agent">
<div class="av r">&#128269;</div>
<div class="info">
<h3>Research Specialist</h3>
<p>Finds accurate, comprehensive information from multiple sources. Verifies facts and structures findings.</p>
<span class="tag blue">RESEARCHER</span>
</div>
</div>
<div class="agent">
<div class="av a">&#128202;</div>
<div class="info">
<h3>Data Analyst</h3>
<p>Analyzes research findings, identifies patterns, draws conclusions, provides actionable recommendations.</p>
<span class="tag purple">ANALYST</span>
</div>
</div>
<div class="agent">
<div class="av w">&#9997;&#65039;</div>
<div class="info">
<h3>Content Writer</h3>
<p>Creates clear, well-structured reports. Transforms complex analysis into readable markdown content.</p>
<span class="tag green">WRITER</span>
</div>
</div>
</div>

<div class="sc">&#9889; Workflow</div>
<div class="flow">
<div class="flow-step"><div class="num">1</div><div class="txt"><b>Research</b> &#8212; Specialist gathers data &amp; sources</div></div>
<div class="flow-line"></div>
<div class="flow-step"><div class="num">2</div><div class="txt"><b>Analyze</b> &#8212; Analyst finds patterns &amp; insights</div></div>
<div class="flow-line"></div>
<div class="flow-step"><div class="num">3</div><div class="txt"><b>Report</b> &#8212; Writer creates final document</div></div>
</div>

<div class="sc">&#128640; Try It</div>
<div class="try-box">
<h3>&#9889; Run Crew</h3>
<div class="try-input">
<input type="text" id="topicInput" placeholder="Enter topic... e.g. AI agents 2026" value="AI agents in 2026">
<button id="runBtn" onclick="runCrew()">Run</button>
</div>
<div id="result"></div>
</div>

<div class="sc">&#128279; Connected</div>
<div class="links">
<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/chat" target="_blank"><span class="ic">&#128172;</span><div class="in"><h3>Hermes Chat</h3><p>Multi-model AI chat with streaming</p></div><span class="ar">&#8250;</span></a>
<a class="lk" href="https://hermes-cloudflare.certveis.workers.dev/solace/status" target="_blank"><span class="ic">&#128225;</span><div class="in"><h3>Solace Event Mesh</h3><p>RoClace Cluster &#183; Singapore &#183; 5 queues</p></div><span class="ar">&#8250;</span></a>
<a class="lk" href="https://rocspace-links.certveis.workers.dev" target="_blank"><span class="ic">&#128279;</span><div class="in"><h3>AI Agent Hub</h3><p>All integrations &#183; 77 models &#183; 1019 tools</p></div><span class="ar">&#8250;</span></a>
<a class="lk" href="https://github.com/ivansslo/roadfx-ai-stack" target="_blank"><span class="ic">&#128025;</span><div class="in"><h3>GitHub</h3><p>ivansslo/roadfx-ai-stack</p></div><span class="ar">&#8250;</span></a>
</div>

<div class="ft">CrewAI &#215; Solace Hermes &#183; Groq Llama 70B &#183; v15.0<br>&#169; 2026 Ivan Ssl</div>

</div>

<script>
async function runCrew(){
  var topic=document.getElementById('topicInput').value.trim();
  if(!topic)return;
  var btn=document.getElementById('runBtn');
  var res=document.getElementById('result');
  btn.disabled=true;btn.textContent='Running...';
  res.className='on';res.textContent='Sending to Hermes Gateway → CrewAI agents...\n\nResearcher → Analyst → Writer\nPlease wait...\n';
  try{
    var r=await fetch('https://hermes-cloudflare.certveis.workers.dev/solace/task',{
      method:'POST',
      headers:{'Authorization':'Bearer hk-rocspace-2026','Content-Type':'application/json'},
      body:JSON.stringify({type:'chat',prompt:'You are a research crew. Research, analyze, and write a report about: '+topic+'. Provide a structured report with: 1) Research findings, 2) Analysis & insights, 3) Recommendations.',model:'llama-3.3-70b-versatile',max_tokens:4096})
    });
    var d=await r.json();
    var content=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||JSON.stringify(d,null,2);
    res.textContent=content;
  }catch(e){
    res.textContent='Error: '+e.message;
  }
  btn.disabled=false;btn.textContent='Run';
}
</script>
</body>
</html>
`;
