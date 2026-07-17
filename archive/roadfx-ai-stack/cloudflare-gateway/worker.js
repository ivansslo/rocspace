addEventListener('fetch', event => { event.respondWith(handleRequest(event.request)); });

var TK=(typeof TOKEN!=='undefined'?TOKEN:'');
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
var SEMP_URL=(typeof SOLACE_SEMP_URL!=='undefined'?SOLACE_SEMP_URL:'');
var SVU=(typeof SOLACE_VIEW_USER!=='undefined'?SOLACE_VIEW_USER:'');
var SVP=(typeof SOLACE_VIEW_PASS!=='undefined'?SOLACE_VIEW_PASS:'');
var CPK=(typeof CLERK_PK!=='undefined'?CLERK_PK:'');
var CSK=(typeof CLERK_SK!=='undefined'?CLERK_SK:'');
var CLERK_DOMAIN='awake-chicken-95.clerk.accounts.dev';
var FIREBASE_CFG=(typeof FIREBASE_CONFIG!=='undefined'?FIREBASE_CONFIG:null);
var GPAT=(typeof GITHUB_PAT!=='undefined'?GITHUB_PAT:'');
var GOWNER=(typeof OWNER_GITHUB!=='undefined'?OWNER_GITHUB:'ivansslo');

var CLAW='https://clawhub.ai/api/v1';
var LINK='https://claw-link.dev/api';
var TAPI='https://api.tailscale.com/api/v2';
var HAPI='https://api.honcho.dev/v3';
var HWS='rochobase';
var SAPI='https://api.solace.cloud/api/v0';
var SSVC='p37j7q6aggq';
var SVPN='roclace-cluster';
var OWNER_NOTIFY_TOPIC='hermes/notify/owner';
var VERSION='15.4';
var COMPONENTS=[
  {component:'5 CF Workers',detail:'v15.4, 25+ endpoints',status:'active',url:'https://hermes-cloudflare.certveis.workers.dev/'},
  {component:'Chat',detail:'12 models, 3 modes, Clerk auth slot',status:'active',url:'https://hermes-cloudflare.certveis.workers.dev/chat'},
  {component:'Solace',detail:'Event mesh, 5 queues, Singapore',status:'connected',url:'https://hermes-cloudflare.certveis.workers.dev/solace/status'},
  {component:'CrewAI',detail:'v1.15.1 running di Termux',status:'running',url:'https://hermes-cloudflare.certveis.workers.dev/crew'},
  {component:'Zapier',detail:'Connected ke CrewAI webhook',status:'connected',url:'https://hermes-cloudflare.certveis.workers.dev/webhook/zapier'},
  {component:'CF AI Factory',detail:'60 models public',status:'active',url:'https://cf-ai.certveis.workers.dev/'},
  {component:'Clerk',detail:'8 social logins',status:'configured',url:'https://awake-chicken-95.clerk.accounts.dev'},
  {component:'Notion',detail:'45 tools via ClawLink',status:'active',url:'https://hermes-cloudflare.certveis.workers.dev/link/tools'},
  {component:'Crawl4AI',detail:'/crawl4ai endpoint + /crawl command',status:'active',url:'https://hermes-cloudflare.certveis.workers.dev/crawl4ai'},
  {component:'20 integrations',detail:'All active through ClawLink, ClawHub, Honcho, Solace, Zapier',status:'active',url:'https://rocspace-links.certveis.workers.dev'},
  {component:'9 domains certveis.space',detail:'Custom domains mapped to workers and apps',status:'mapped',url:'https://certveis.space'},
  {component:'4 repos synced',detail:'GitHub + GitLab source mirrors',status:'synced',url:'https://github.com/ivansslo/roadfx-ai-stack'},
  {component:'Termux CLI',detail:'hermes run works',status:'running',url:'https://github.com/ivansslo/roadfx-ai-stack'}
];

function isAuthed(request,url){if(!TK)return false;var auth=request.headers.get('Authorization')||'';var qt=url?url.searchParams.get('token')||'':'';return auth==='Bearer '+TK||qt===TK}
function reqMeta(request){return{method:request.method,path:new URL(request.url).pathname,colo:request.cf?.colo||'',country:request.cf?.country||'',ip:(request.headers.get('CF-Connecting-IP')||'').replace(/(\d+\.\d+)\.\d+\.\d+$/,'$1.x.x'),ua:(request.headers.get('User-Agent')||'').slice(0,160)}}
function logEvent(type,data,request){var rec={id:'log-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),type:type,ts:new Date().toISOString(),meta:request?reqMeta(request):{},data:data||{}};try{console.log(JSON.stringify(rec))}catch(e){}try{solaceEmit('hermes/log/'+String(type).replace(/[^a-z0-9_-]/gi,'_'),rec)}catch(e){}try{if(typeof LOGS!=='undefined'&&LOGS&&LOGS.put)LOGS.put(rec.id,JSON.stringify(rec),{expirationTtl:60*60*24*14})}catch(e){}try{if(typeof DB!=='undefined'&&DB&&DB.prepare)DB.prepare('insert into logs (id,type,ts,meta,data) values (?1,?2,?3,?4,?5)').bind(rec.id,rec.type,rec.ts,JSON.stringify(rec.meta),JSON.stringify(rec.data)).run()}catch(e){}return rec}
async function listLogs(limit,type){limit=Math.min(parseInt(limit||50),200);if(typeof DB!=='undefined'&&DB&&DB.prepare){try{var q=type?DB.prepare('select id,type,ts,meta,data from logs where type=?1 order by ts desc limit ?2').bind(type,limit):DB.prepare('select id,type,ts,meta,data from logs order by ts desc limit ?1').bind(limit);var r=await q.all();var rows=(r.results||[]).map(function(x){return{id:x.id,type:x.type,ts:x.ts,meta:JSON.parse(x.meta||'{}'),data:JSON.parse(x.data||'{}')}});return{storage:'d1',count:rows.length,items:rows}}catch(e){}}if(typeof LOGS==='undefined'||!LOGS||!LOGS.list)return{storage:'not_configured',message:'KV/D1 LOGS binding not configured; logs are emitted to Cloudflare console and Solace topics hermes/log/*.',items:[]};var ls=await LOGS.list({limit:limit});var items=[];for(var i=0;i<ls.keys.length;i++){var v=await LOGS.get(ls.keys[i].name,'json');if(v&&(!type||v.type===type))items.push(v)}items.sort(function(a,b){return String(b.ts).localeCompare(String(a.ts))});return{storage:'kv',count:items.length,items:items}}
async function dashboardStatus(request){var out={version:VERSION,ts:new Date().toISOString(),workers:{primary:'hermes-cloudflare',mirror:'hermes-webhook',backup:'certve-webhook',cfAi:'cf-ai',hub:'rocspace-links'},counts:{models:MODELS.length,cf_ai_models:60,integrations:20,queues:0,components:COMPONENTS.length,endpoints:25},components:COMPONENTS,solace:{configured:!!SOU,status:'unknown'},providers:{groq:!!GK,gemini:!!GEM,openrouter:!!OK,clawhub:!!CK,clawlink:!!CLK,honcho:!!HCH,clerk:!!CPK,tailscale:!!TSK},links:{chatlive:'/chat-live',chat:'/chat-live',crew:'/crew',crawl:'/crawl4ai',zapier:'/zapier',logs:'/logs',hub:'https://rocspace-links.certveis.workers.dev'}};try{if(SOU){var r=await fetch(SOU+'/topic/hermes/dashboard-ping',{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':'direct'},body:JSON.stringify({ping:true,ts:out.ts})});out.solace.status=r.status===200?'connected':'error';out.solace.httpCode=r.status;out.solace.vpn=SVPN;out.solace.serviceId=SSVC}}catch(e){out.solace.status='disconnected';out.solace.error=e.message}try{if(SEMP_URL&&SVU&&SVP){var sempUrl=SEMP_URL.replace(/\/$/,'')+'/SEMP/v2/monitor/msgVpns/'+SVPN+'/queues';var qr=await fetch(sempUrl,{headers:{'Authorization':'Basic '+btoa(SVU+':'+SVP)}});var qd=await qr.json();var qs=(qd.data||[]).map(function(q){return{name:q.queueName,spoolUsage:q.msgSpoolUsage||0,bindCount:q.bindCount||0,msgCountIn:q.rxMsgCount||0,msgCountOut:q.txMsgCountOut||q.txMsgCount||0}});out.queues=qs;out.counts.queues=qs.length}}catch(e){out.queues_error=e.message}try{out.logs=await listLogs(10,'')}catch(e){out.logs={error:e.message}}return out}


function gatewayInfo(origin){origin=origin||'https://hermes-cloudflare.certveis.workers.dev';return json({name:'Solace Hermes Gateway',version:VERSION,home:origin+'/dashboard',live:{dashboard:origin+'/dashboard',chatlive:origin+'/chat-live',chat:origin+'/chat-live',crew:origin+'/crew',crawl:origin+'/crawl4ai',zapier:origin+'/zapier',logs:origin+'/logs',hub:'https://rocspace-links.certveis.workers.dev',api:origin+'/api'},source:{github:'https://github.com/ivansslo/roadfx-ai-stack',gitlab:'https://gitlab.com/ivanssl/solace-hermes-project'},components:COMPONENTS,endpoints:{'GET /':'Dashboard for browsers, JSON for API clients','GET /api':'Gateway JSON index','GET /dashboard':'Realtime dashboard UI','GET /dashboard/status':'Realtime dashboard JSON','GET /chat-live':'Chat-Live Multi-Model AI UI','GET /crew':'CrewAI UI','GET /crawl4ai':'Crawl4AI UI','GET /zapier':'Zapier template UI','GET /zapier/template':'Zapier template JSON','GET /logs':'Activity logs UI','GET /logs/list':'Activity logs JSON','GET /links':'Redirect to Links Hub','GET /integrations':'Component and integration descriptions','GET /v1/models':'Model list','POST /v1/chat/completions':'OpenAI-compatible Chat API','POST /ai/chat':'Chat','POST /ai/stream':'Streaming chat','POST /crawl4ai':'Crawl4AI markdown cleaner','POST /crawl':'Simple web crawl','POST /webhook/zapier':'Zapier webhook','GET /solace/status':'Broker status','GET /solace/queues':'Queue stats','GET /solace/service':'Service info','POST /solace/publish':'Publish event','POST /solace/task':'Agent task'}})}
function openApiSpec(origin){origin=origin||'https://hermes-cloudflare.certveis.workers.dev';return{openapi:'3.1.0',info:{title:'Solace Hermes Gateway',version:VERSION},servers:[{url:origin}],paths:{'/ai/chat':{post:{summary:'AI chat',security:[{bearerAuth:[]}]}},'/ai/stream':{post:{summary:'Streaming AI chat',security:[{bearerAuth:[]}]}},'/crawl4ai':{get:{summary:'Crawl4AI UI'},post:{summary:'Crawl URL to markdown',security:[{bearerAuth:[]}] }},'/webhook/zapier':{post:{summary:'Zapier webhook actions',security:[{bearerAuth:[]}] }},'/dashboard/status':{get:{summary:'Realtime status'}},'/logs/list':{get:{summary:'Activity logs',security:[{bearerAuth:[]}]}}},components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}}}}}



var MODELS=[
  {id:'qwen/qwen3-32b',p:'groq',f:true,ctx:131072},{id:'llama-3.3-70b-versatile',p:'groq',f:true,ctx:128000},
  {id:'qwen/qwen3.6-27b',p:'groq',f:true,ctx:131072},{id:'meta-llama/llama-4-scout-17b-16e-instruct',p:'groq',f:true,ctx:131072},
  {id:'openai/gpt-oss-120b',p:'groq',f:true,ctx:131072},{id:'groq/compound',p:'groq',f:true,ctx:131072},
  {id:'llama-3.1-8b-instant',p:'groq',f:true,ctx:131072},
  {id:'groq/deepseek-r1-distill-llama-70b',p:'groq',f:true,ctx:128000,owner:true},
  {id:'groq/deepseek-r1-distill-qwen-32b',p:'groq',f:true,ctx:128000,owner:true},
  {id:'groq/llama-3.3-70b-specdec',p:'groq',f:true,ctx:128000,owner:true},
  {id:'groq/qwen-2.5-coder-32b',p:'groq',f:true,ctx:128000,owner:true},
  {id:'gemini-2.5-flash',p:'gemini',f:true,ctx:1048576},
  {id:'gemini-2.5-pro',p:'gemini',f:true,ctx:2097152},
  {id:'gemini-1.5-flash',p:'gemini',f:true,ctx:1048576},
  {id:'gemini-1.5-pro',p:'gemini',f:true,ctx:2097152},
  {id:'google/gemini-2.5-pro-preview',p:'openrouter',f:false,ctx:2097152},{id:'google/gemini-2.5-flash',p:'openrouter',f:false,ctx:1048576},
  {id:'openai/gpt-4o',p:'openrouter',f:false,ctx:128000},{id:'deepseek/deepseek-r1',p:'openrouter',f:false,ctx:163840},
  {id:'qwen/qwen3-235b-a22b',p:'openrouter',f:false,ctx:131072},
];

async function handleRequest(request) {
  var url=new URL(request.url),path=url.pathname;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors()});
  if(path==='/chat-live'||path==='/chat-live/'||path==='/chat'||path==='/chat/') return new Response(CHAT_HTML,{headers:secHTML()});
  if(path==='/crew'||path==='/crew/') return new Response(CREW_HTML,{headers:secHTML()});
  if((path==='/crawl4ai'||path==='/crawl4ai/'||path==='/crawl4ai/extract'||path==='/crawl4ai/batch')&&request.method!=='POST') return new Response(CRAWL_HTML,{headers:secHTML()});
  if(path==='/zapier'||path==='/zapier/') return new Response(ZAPIER_HTML,{headers:secHTML()});
  if(path==='/zapier/template') return json(zapierTemplate(url.origin));
  if(path==='/logs'||path==='/logs/') return new Response(LOGS_HTML,{headers:secHTML()});
  if(path==='/logs/list'){if(!isAuthed(request,url))return json({error:'Unauthorized'},401);return json(await listLogs(url.searchParams.get('limit')||50,url.searchParams.get('type')||''))}
  if(path==='/dashboard'||path==='/dashboard/') return new Response(DASHBOARD_HTML,{headers:secHTML()});
  if(path==='/dashboard/status') return json(await dashboardStatus(request));
  if(path==='/links'||path==='/hub') return Response.redirect('https://rocspace-links.certveis.workers.dev',302);
  if(path==='/'||path==='') {var accept=request.headers.get('Accept')||'';if(accept.indexOf('text/html')>=0)return new Response(DASHBOARD_HTML,{headers:secHTML()});return gatewayInfo(url.origin)}
  if(path==='/api'||path==='/api/') return gatewayInfo(url.origin)
  if(path==='/auth/clerk-config') return json({publishableKey:CPK||'',domain:CLERK_DOMAIN,configured:!!CPK})
  if(path==='/auth/firebase-config') return json(FIREBASE_CFG || {configured:false});
  if(path==='/api/github/files') {
    var owner = url.searchParams.get('owner') || GOWNER;
    var repo = url.searchParams.get('repo') || 'roadfx-full-stack';
    var pat = GPAT || '';
    if(!pat) return json({error: 'GITHUB_PAT not configured in environment'}, 400);

    var headers = {
      'User-Agent': 'solace-hermes-ai',
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + pat
    };

    try {
      var repoRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo, { headers });
      if (!repoRes.ok) {
        return json({ error: 'Failed to fetch repository info: ' + await repoRes.text() }, repoRes.status);
      }
      var repoInfo = await repoRes.json();
      var branch = repoInfo.default_branch || 'main';

      var treeRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/git/trees/' + branch + '?recursive=1', { headers });
      if (!treeRes.ok) {
        return json({ error: 'Failed to fetch repository tree: ' + await treeRes.text() }, treeRes.status);
      }
      var treeData = await treeRes.json();
      
      var files = (treeData.tree || [])
        .filter(function(item) { return item.type === 'blob'; })
        .map(function(item) {
          return {
            path: item.path,
            sha: item.sha,
            size: item.size
          };
        });

      return json({ success: true, owner: owner, repo: repo, branch: branch, files: files });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
  if(path==='/api/github/file') {
    var owner = url.searchParams.get('owner') || GOWNER;
    var repo = url.searchParams.get('repo') || 'roadfx-full-stack';
    var filePath = url.searchParams.get('path');
    if(!filePath) return json({error: 'Path query parameter is required'}, 400);
    
    var pat = GPAT || '';
    if(!pat) return json({error: 'GITHUB_PAT not configured in environment'}, 400);

    var headers = {
      'User-Agent': 'solace-hermes-ai',
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + pat
    };

    try {
      var fileRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodeURIComponent(filePath), { headers });
      if (!fileRes.ok) {
        return json({ error: 'Failed to fetch file contents: ' + await fileRes.text() }, fileRes.status);
      }
      var fileData = await fileRes.json();
      return json({
        success: true,
        path: fileData.path,
        sha: fileData.sha,
        encoding: fileData.encoding,
        content: fileData.content
      });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
  if(path==='/api/github/save' && request.method==='POST') {
    var pat = GPAT || '';
    if(!pat) return json({error: 'GITHUB_PAT not configured in environment'}, 400);

    try {
      var bodyText = await request.text();
      var body = JSON.parse(bodyText);
      var owner = body.owner || GOWNER;
      var repo = body.repo || 'roadfx-full-stack';
      var filePath = body.path;
      var content = body.content || '';
      var sha = body.sha;

      if(!filePath) return json({error: 'Path is required'}, 400);

      var headers = {
        'User-Agent': 'solace-hermes-ai',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + pat,
        'Content-Type': 'application/json'
      };

      // UTF-8 base64 encoding (works in Workers and NodeJS context)
      var b64Content;
      if (typeof btoa !== 'undefined') {
        b64Content = btoa(unescape(encodeURIComponent(content)));
      } else {
        b64Content = Buffer.from(content, 'utf8').toString('base64');
      }

      var payload = {
        message: 'Update ' + filePath + ' via Solace Hermes AI Editor',
        content: b64Content
      };
      if (sha) {
        payload.sha = sha;
      }

      var saveRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodeURIComponent(filePath), {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        return json({ error: 'Failed to save file to GitHub: ' + await saveRes.text() }, saveRes.status);
      }

      var saveData = await saveRes.json();
      return json({
        success: true,
        path: filePath,
        sha: saveData.content.sha,
        commit: saveData.commit.sha
      });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
  if(path==='/api/kv/sync' || path==='/sync') {
    var hkv = (typeof HERMES_KV !== 'undefined' ? HERMES_KV : (typeof LOGS !== 'undefined' ? LOGS : null));
    if(!hkv) return json({error: 'KV binding (HERMES_KV or LOGS) not configured'}, 400);

    if(request.method==='PUT') {
      if(!isAuthed(request, url)) return json({error: 'Unauthorized'}, 401);
      try {
        var bodyText = await request.text();
        // Validate JSON
        var parsed = JSON.parse(bodyText);
        
        await hkv.put('hermes_sync_state', bodyText);
        return json({ success: true, message: 'State successfully synced to Workers KV' });
      } catch(e) {
        return json({ error: e.message }, 500);
      }
    } else if(request.method==='GET') {
      if(!isAuthed(request, url)) return json({error: 'Unauthorized'}, 401);
      try {
        var val = await hkv.get('hermes_sync_state');
        if(!val) return json({ success: true, empty: true, state: null });
        return new Response(val, { headers: { 'Content-Type': 'application/json' } });
      } catch(e) {
        return json({ error: e.message }, 500);
      }
    } else {
      return json({ error: 'Method not allowed' }, 405);
    }
  }
  if(path==='/api/drive/list') {
    var authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authorization header is required' }, 401);
    
    // Find folder Projectsecrets
    var qFolder = "name='Projectsecrets' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    var folderRes = await fetch('https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(qFolder), {
      headers: { 'Authorization': authHeader }
    });
    if (!folderRes.ok) {
      return json({ error: 'Failed to search for Projectsecrets folder: ' + await folderRes.text() }, folderRes.status);
    }
    var folderData = await folderRes.json();
    if (!folderData.files || folderData.files.length === 0) {
      return json({ folderFound: false, files: [] });
    }
    
    var folderId = folderData.files[0].id;
    // List files in that folder
    var qFiles = "'" + folderId + "' in parents and trashed=false";
    var filesRes = await fetch('https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(qFiles) + '&fields=files(id,name,mimeType,size,createdTime,webViewLink)', {
      headers: { 'Authorization': authHeader }
    });
    if (!filesRes.ok) {
      return json({ error: 'Failed to list files in Projectsecrets folder: ' + await filesRes.text() }, filesRes.status);
    }
    var filesData = await filesRes.json();
    return json({ folderFound: true, folderId: folderId, files: filesData.files || [] });
  }
  if(path.startsWith('/api/drive/download/')) {
    var authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authorization header is required' }, 401);
    
    var fileId = path.replace('/api/drive/download/', '');
    // Get metadata first to see if it's a Google Doc
    var metaRes = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?fields=name,mimeType', {
      headers: { 'Authorization': authHeader }
    });
    if (!metaRes.ok) return json({ error: 'Failed to fetch file metadata: ' + await metaRes.text() }, metaRes.status);
    var meta = await metaRes.json();
    
    var downloadUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media';
    if (meta.mimeType.startsWith('application/vnd.google-apps.')) {
      // Google Doc export
      var exportMime = 'text/plain';
      if (meta.mimeType.includes('spreadsheet')) exportMime = 'text/csv';
      downloadUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/export?mimeType=' + exportMime;
    }
    
    var fileRes = await fetch(downloadUrl, {
      headers: { 'Authorization': authHeader }
    });
    if (!fileRes.ok) return json({ error: 'Failed to download file content: ' + await fileRes.text() }, fileRes.status);
    
    return new Response(await fileRes.arrayBuffer(), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="' + encodeURIComponent(meta.name) + '"'
      }
    });
  }
  if(path==='/api/gmail/list') {
    var authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authorization header is required' }, 401);
    var q = url.searchParams.get('q') || 'label:INBOX';
    var maxResults = url.searchParams.get('maxResults') || '10';
    var gmailUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent(q) + '&maxResults=' + maxResults;
    var gmailRes = await fetch(gmailUrl, { headers: { 'Authorization': authHeader } });
    if (!gmailRes.ok) return json({ error: 'Failed to search messages: ' + await gmailRes.text() }, gmailRes.status);
    var gmailData = await gmailRes.json();
    var messages = gmailData.messages || [];
    var detailedMessages = await Promise.all(messages.map(async function(msg) {
      try {
        var detailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + msg.id + '?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date', {
          headers: { 'Authorization': authHeader }
        });
        if (detailRes.ok) {
          var detail = await detailRes.json();
          var subject = '';
          var from = '';
          var date = '';
          if (detail.payload && detail.payload.headers) {
            detail.payload.headers.forEach(function(h) {
              if (h.name.toLowerCase() === 'subject') subject = h.value;
              if (h.name.toLowerCase() === 'from') from = h.value;
              if (h.name.toLowerCase() === 'date') date = h.value;
            });
          }
          return { id: msg.id, threadId: msg.threadId, snippet: detail.snippet || '', subject: subject, from: from, date: date, labelIds: detail.labelIds || [] };
        }
      } catch (e) {}
      return { id: msg.id, threadId: msg.threadId, snippet: 'Failed to load details' };
    }));
    return json({ messages: detailedMessages });
  }
  if(path.startsWith('/api/gmail/message/')) {
    var authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authorization header is required' }, 401);
    var messageId = path.replace('/api/gmail/message/', '');
    var detailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + messageId + '?format=full', {
      headers: { 'Authorization': authHeader }
    });
    if (!detailRes.ok) return json({ error: 'Failed to fetch message details: ' + await detailRes.text() }, detailRes.status);
    return json(await detailRes.json());
  }
  if(path==='/api/gmail/send' && request.method==='POST') {
    var authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authorization header is required' }, 401);
    var body = await request.json().catch(function(){return{}});
    if (!body.to || !body.subject || !body.body) return json({ error: 'Missing required fields: to, subject, body' }, 400);
    var rfcMessage = [
      'To: ' + body.to,
      'Subject: ' + body.subject,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body.body
    ].join('\r\n');
    var encoded = btoa(unescape(encodeURIComponent(rfcMessage))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    var sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded })
    });
    if (!sendRes.ok) return json({ error: 'Failed to send email: ' + await sendRes.text() }, sendRes.status);
    return json(await sendRes.json());
  }
  if(path.startsWith('/api/gmail/delete/') && request.method==='POST') {
    var authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authorization header is required' }, 401);
    var messageId = path.replace('/api/gmail/delete/', '');
    var trashRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + messageId + '/trash', {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    });
    if (!trashRes.ok) return json({ error: 'Failed to trash message: ' + await trashRes.text() }, trashRes.status);
    return json(await trashRes.json());
  }
  if(path==='/api/openapi'||path==='/openapi.json') return json(openApiSpec(url.origin));
  if(false) return json({name:'Solace Hermes Gateway',version:VERSION,live:{chat:'https://hermes-cloudflare.certveis.workers.dev/chat',crew:'https://hermes-cloudflare.certveis.workers.dev/crew',hub:'https://rocspace-links.certveis.workers.dev',api:'https://hermes-cloudflare.certveis.workers.dev/'},source:{github:'https://github.com/ivansslo/roadfx-ai-stack',gitlab:'https://gitlab.com/ivanssl/solace-hermes-project'},components:COMPONENTS,endpoints:{'GET /chat':'Multi-agent AI Chat UI','GET /crew':'CrewAI UI','GET /crawl4ai':'Crawl4AI UI','GET /zapier':'Zapier template UI','GET /zapier/template':'Zapier template JSON','GET /logs':'Activity logs UI','GET /logs/list':'Activity logs JSON','GET /dashboard':'Realtime dashboard UI','GET /dashboard/status':'Realtime dashboard JSON','GET /links':'Redirect to Links Hub','GET /integrations':'Component and integration descriptions','GET /v1/models':'Model list','POST /v1/chat/completions':'OpenAI-compatible Chat API','POST /ai/chat':'Chat','POST /ai/stream':'Streaming chat','POST /crawl4ai':'Crawl4AI markdown cleaner','POST /crawl':'Simple web crawl','GET /hub/*':'ClawHub','GET /link/*':'ClawLink','GET /skills':'SkillsLLM','GET /tailscale/devices':'Tailscale','POST /link/tools/:name/execute':'Execute tool','POST /webhook/zapier':'Zapier','GET /honcho/peers':'Honcho peers','POST /honcho/chat':'Honcho memory-aware chat','GET /honcho/context':'Peer context','GET /health':'Health','GET /solace/status':'Broker status','GET /solace/queues':'Queue stats','GET /solace/service':'Service info','POST /solace/publish':'Publish event','POST /solace/task':'Agent task','POST /notify':'User notification'}});
  if(path==='/health') return json({status:'ok',ts:new Date().toISOString(),colo:request.cf?.colo||'?',version:VERSION,workers:5,components:COMPONENTS.length});
  if(path==='/integrations'||path==='/status') return json({name:'Solace Hermes Integrations',version:VERSION,generated:new Date().toISOString(),components:COMPONENTS,counts:{workers:5,endpoints:25,models_chat:12,models_cf_ai:60,queues:5,integrations:20,domains:9,repos:4,notion_tools:45}});

  // v1 LiteLLM-compatible
  if(path==='/v1/models') return json({object:'list',data:MODELS.map(function(m){return{id:m.id,object:'model',owned_by:m.p,context_length:m.ctx}})});
  if(path==='/v1/chat/completions'&&request.method==='POST'){logEvent('ai.v1_chat',{endpoint:path},request);var a2=request.headers.get('Authorization')||'';if(!isAuthed(request,url))return json({error:{message:'Unauthorized'}},401);var b=await request.json().catch(function(){return{}});solaceEmit('hermes/event/chat',{endpoint:'v1',model:b.model,ts:new Date().toISOString()});return aiCall(b.model||'qwen/qwen3-32b',b.messages||[],b.max_tokens||4096,b.stream||false)}

  // Honcho
  if(path==='/honcho/peers'){try{var r=await fetch(HAPI+'/workspaces/'+HWS+'/peers/list',{method:'POST',headers:{'Authorization':'Bearer '+HCH,'Content-Type':'application/json'},body:'{}'});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  if(path==='/honcho/chat'&&request.method==='POST'){logEvent('honcho.chat',{},request);var auth2=request.headers.get('Authorization')||'';if(!isAuthed(request,url))return json({error:'Unauthorized'},401);var b=await request.json().catch(function(){return{}});var peer=b.peer||'hermes-agent';try{var r=await fetch(HAPI+'/workspaces/'+HWS+'/peers/'+peer+'/chat',{method:'POST',headers:{'Authorization':'Bearer '+HCH,'Content-Type':'application/json'},body:JSON.stringify({query:b.query||b.message||''})});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  if(path==='/honcho/context'){var peer=url.searchParams.get('peer')||'hermes-agent';try{var r=await fetch(HAPI+'/workspaces/'+HWS+'/peers/'+peer+'/context',{headers:{'Authorization':'Bearer '+HCH}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // SkillsLLM
  if(path.startsWith('/skills')){try{var r=await fetch('https://skillsllm.com/api/skills'+url.search);return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // ClawHub
  if(path.startsWith('/hub/')){try{var r=await fetch(CLAW+'/'+path.replace('/hub/','')+url.search,{headers:{'Authorization':'Bearer '+CK}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // ClawLink
  if(path.startsWith('/link/')){var sub=path.replace('/link/','');if(sub.includes('/execute')){var a3=request.headers.get('Authorization')||'';if(!isAuthed(request,url))return json({error:'Unauthorized'},401);var tn=sub.replace('tools/','').replace('/execute','');var bd=await request.json().catch(function(){return{}});try{var r=await fetch(LINK+'/tools/'+tn+'/execute',{method:'POST',headers:{'Authorization':'Bearer '+CLK,'Content-Type':'application/json'},body:JSON.stringify({params:bd.params||bd})});return json(await r.json())}catch(e){return json({error:e.message},502)}}try{var r=await fetch(LINK+'/'+sub+url.search,{headers:{'Authorization':'Bearer '+CLK}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // Tailscale
  if(path==='/tailscale/devices'){try{var r=await fetch(TAPI+'/tailnet/-/devices',{headers:{'Authorization':'Basic '+btoa(TSK+':')}});return json(await r.json())}catch(e){return json({error:e.message},502)}}

  // Solace - public
  if(path==='/solace/status'){if(!SOU)return json({error:'Solace not configured'},503);try{var r=await fetch(SOU+'/topic/hermes/ping',{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':'direct'},body:JSON.stringify({ping:true,ts:new Date().toISOString()})});return json({status:r.status===200?'connected':'error',httpCode:r.status,broker:'mr-connection-mwc1f9igml1.messaging.solace.cloud',vpn:SVPN,serviceId:SSVC,ts:new Date().toISOString()})}catch(e){return json({error:e.message,status:'disconnected'},502)}}
  if(path==='/solace/queues'){if(!SEMP_URL||!SVU||!SVP)return json({error:'Solace SEMP credentials not configured'},503);try{var sempUrl=SEMP_URL.replace(/\/$/,'')+'/SEMP/v2/monitor/msgVpns/'+SVPN+'/queues';var r=await fetch(sempUrl,{headers:{'Authorization':'Basic '+btoa(SVU+':'+SVP)}});var d=await r.json();var qs=(d.data||[]).map(function(q){return{name:q.queueName,spoolUsage:q.msgSpoolUsage||0,bindCount:q.bindCount||0,msgCountIn:q.rxMsgCount||0,msgCountOut:q.txMsgCountOut||q.txMsgCount||0}});return json({queues:qs,count:qs.length,vpn:SVPN})}catch(e){return json({error:e.message},502)}}
  if(path==='/solace/service'){try{var r=await fetch(SAPI+'/services/'+SSVC,{headers:{'Authorization':'Bearer '+SAT}});var d=await r.json();var s=d.data||{};return json({name:s.name,serviceId:s.serviceId,vpn:s.msgVpnName,region:s.datacenterId,type:s.serviceTypeId,state:s.adminState+'/'+s.adminProgress,limits:s.serviceClassDisplayedAttributes||{},created:s.created})}catch(e){return json({error:e.message},502)}}

  // Clerk auth
  if(path==='/auth/verify'&&request.method==='POST'){if(!CSK)return json({error:'Clerk not configured'},503);var b=await request.json().catch(function(){return{}});if(!b.token)return json({error:'Missing token'},400);try{var r=await fetch('https://api.clerk.com/v1/sessions/verify',{method:'POST',headers:{'Authorization':'Bearer '+CSK,'Content-Type':'application/json'},body:JSON.stringify({token:b.token})});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  if(path==='/auth/user'){if(!CSK)return json({error:'Clerk not configured'},503);var uid=url.searchParams.get('id')||'';if(!uid)return json({error:'Missing id'},400);try{var r=await fetch('https://api.clerk.com/v1/users/'+uid,{headers:{'Authorization':'Bearer '+CSK}});return json(await r.json())}catch(e){return json({error:e.message},502)}}
  // Notify owner (public)
  if(path==='/notify'&&request.method==='POST'){logEvent('notify',{},request);var b=await request.json().catch(function(){return{}});solaceEmit(OWNER_NOTIFY_TOPIC,{type:'user_activity',user:b.user||'anon',clerkUser:b.clerkUser||null,action:b.action||'visit',ua:request.headers.get('User-Agent')||'?',ip:request.headers.get('CF-Connecting-IP')||'?',country:request.cf?.country||'?',ts:new Date().toISOString()});return json({status:'notified'})}

  // Auth required below
  var auth=request.headers.get('Authorization')||'',qt=url.searchParams.get('token')||'';
  if(!isAuthed(request,url)) return json({error:'Unauthorized'},401);

  // === CRAWL4AI ===
  if(path==='/crawl4ai'&&request.method==='POST'){logEvent('crawl4ai.start',{},request);var b=await request.json().catch(function(){return{}});if(!b.url)return json({error:'Missing url'},400);try{var t0=Date.now();var r=await fetch(b.url,{headers:{'User-Agent':'Crawl4AI/1.0 HermesBot'},redirect:'follow'});var h=await r.text();var titleM=h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);var title=titleM?titleM[1].trim():'';var text=h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi,'').replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi,'');var md=text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi,function(m,l,t){return'\n'+'#'.repeat(parseInt(l))+' '+t.replace(/<[^>]+>/g,'')+'\n'}).replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,'- $1\n').replace(/<p[^>]*>([\s\S]*?)<\/p>/gi,'$1\n\n').replace(/<br[^>]*>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\n{3,}/g,'\n\n').replace(/[ \t]+/g,' ').trim().slice(0,b.max_length||50000);solaceEmit('hermes/event/crawl',{url:b.url,title:title,ts:new Date().toISOString()});logEvent('crawl4ai.success',{url:b.url,title:title,content_length:md.length,response_time:Date.now()-t0},request);return json({status:'success',url:b.url,title:title,content:md,content_length:md.length,response_time:Date.now()-t0})}catch(e){return json({error:e.message},502)}}
  if(path==='/crawl4ai/extract'&&request.method==='POST'){logEvent('crawl4ai.extract',{},request);var b=await request.json().catch(function(){return{}});if(!b.url)return json({error:'Missing url'},400);try{var r=await fetch(b.url,{headers:{'User-Agent':'Crawl4AI/1.0'},redirect:'follow'});var h=await r.text();var jsonld=[];var jre=/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;var jm;while((jm=jre.exec(h))!==null){try{jsonld.push(JSON.parse(jm[1]))}catch(e){}}var og={};var ogre=/<meta[^>]+property="(og:[^"]+)"[^>]+content="([^"]+)"/gi;var om;while((om=ogre.exec(h))!==null){og[om[1]]=om[2]}return json({status:'success',url:b.url,jsonld:jsonld,opengraph:og})}catch(e){return json({error:e.message},502)}}
  if(path==='/crawl4ai/batch'&&request.method==='POST'){logEvent('crawl4ai.batch',{},request);var b=await request.json().catch(function(){return{}});var urls=b.urls||[];if(!urls.length)return json({error:'Missing urls'},400);var results=await Promise.all(urls.slice(0,10).map(function(u){return fetch(u,{headers:{'User-Agent':'Crawl4AI/1.0'},redirect:'follow'}).then(function(r){return r.text()}).then(function(h){var t=h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,5000);var tm=h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return{url:u,status:'success',title:tm?tm[1].trim():'',content_length:t.length}}).catch(function(e){return{url:u,status:'error',error:e.message}})}));return json({results:results})}
  // === NOTION VIA CLAWLINK ===
  if(path.startsWith('/notion/')&&request.method==='POST'){var action=path.replace('/notion/','');var bd=await request.json().catch(function(){return{}});try{var r=await fetch(LINK+'/tools/notion_'+action+'/execute',{method:'POST',headers:{'Authorization':'Bearer '+CLK,'Content-Type':'application/json'},body:JSON.stringify({params:bd})});return json(await r.json())}catch(e){return json({error:e.message},502)}}

  if(path==='/crawl'&&request.method==='POST'){logEvent('crawl.simple',{},request);var b=await request.json().catch(function(){return{}});if(!b.url)return json({error:'Missing url'},400);try{var t0=Date.now(),r=await fetch(b.url,{headers:{'User-Agent':'HermesBot/14'},redirect:'follow'}),h=await r.text(),x=h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,50000);return json({status:'success',url:b.url,content:x,response_time:Date.now()-t0})}catch(e){return json({error:e.message},502)}}
  if((path==='/ai/chat'||path==='/ai/stream')&&request.method==='POST'){logEvent('ai.chat',{stream:path==='/ai/stream'},request);var b=await request.json().catch(function(){return{}});solaceEmit('hermes/event/chat',{endpoint:path,model:b.model,stream:path==='/ai/stream',ts:new Date().toISOString()});return aiCall(b.model||'qwen/qwen3-32b',b.messages||[{role:'user',content:b.prompt||'hello'}],b.max_tokens||4096,path==='/ai/stream')}
  if(path==='/webhook/zapier'&&request.method==='POST'){logEvent('zapier.webhook',{},request);var b=await request.json().catch(function(){return{}});if(b.action==='crawl'){if(!b.url)return json({error:'Missing url'},400);try{var r=await fetch(b.url,{headers:{'User-Agent':'HermesBot/14'},redirect:'follow'}),h=await r.text(),x=h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,30000);return json({url:b.url,content:x,status:'success'})}catch(e){return json({error:e.message},502)}}if(b.action==='chat'){return aiCall(b.model||'qwen/qwen3-32b',[{role:'user',content:b.prompt||''}],b.max_tokens||2048,false)}if(b.action==='crew'){var prompt='CrewAI workflow: '+(b.topic||b.prompt||'General research')+'. Research, analyze, and write a concise report.';solaceEmit('hermes/event/zapier/crew',{topic:b.topic||b.prompt,source:'zapier',ts:new Date().toISOString()});return aiCall(b.model||'llama-3.3-70b-versatile',[{role:'user',content:prompt}],b.max_tokens||4096,false)}if(b.action==='clerk_event'){var evt={type:b.event_type||b.type||'clerk.event',user:b.user||b.data||{},email:b.email||'',source:'clerk-zapier',ts:new Date().toISOString()};solaceEmit('hermes/event/clerk',evt);return json({status:'received',routed:'solace',topic:'hermes/event/clerk',event:evt})}if(b.action==='notify'){solaceEmit(OWNER_NOTIFY_TOPIC,{type:'zapier_notify',message:b.message||b.text||'',payload:b,ts:new Date().toISOString()});return json({status:'notified'})}if(b.action==='tool'){try{var r=await fetch(LINK+'/tools/'+(b.tool||'')+'/execute',{method:'POST',headers:{'Authorization':'Bearer '+CLK,'Content-Type':'application/json'},body:JSON.stringify({params:b.params||{}})});return json(await r.json())}catch(e){return json({error:e.message},502)}}return json({error:'Unknown action',supported:['crawl','chat','crew','clerk_event','notify','tool']},400)}

  // Solace auth-required
  if(path==='/solace/publish'&&request.method==='POST'){logEvent('solace.publish',{},request);if(!SOU)return json({error:'Solace not configured'},503);var b=await request.json().catch(function(){return{}});var topic=b.topic||'hermes/event/custom';var payload=b.payload||b.data||b;var mode=b.persistent?'persistent':'direct';try{var r=await fetch(SOU+'/topic/'+topic,{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':mode},body:JSON.stringify(payload)});return json({status:'published',topic:topic,mode:mode,httpCode:r.status,ts:new Date().toISOString()})}catch(e){return json({error:e.message},502)}}
  if(path==='/solace/task'&&request.method==='POST'){logEvent('solace.task',{},request);if(!SOU)return json({error:'Solace not configured'},503);var b=await request.json().catch(function(){return{}});var taskType=b.type||'chat';var taskId='task-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);var topic='hermes/task/'+taskType;var taskPayload={taskId:taskId,type:taskType,model:b.model||'qwen/qwen3-32b',prompt:b.prompt||'',messages:b.messages||[],params:b.params||{},source:'gateway',ts:new Date().toISOString()};try{var r=await fetch(SOU+'/topic/'+topic,{method:'POST',headers:{'Authorization':'Basic '+btoa(SUS+':'+SPA),'Content-Type':'application/json','Solace-delivery-mode':'persistent'},body:JSON.stringify(taskPayload)});if(b.async)return json({status:'queued',taskId:taskId,topic:topic});if(taskType==='chat'){var result=await aiCall(b.model||'qwen/qwen3-32b',b.messages||[{role:'user',content:b.prompt||''}],b.max_tokens||4096,false);return result}return json({status:'queued',taskId:taskId,topic:topic})}catch(e){return json({error:e.message},502)}}

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



function zapierTemplate(origin){origin=origin||'https://hermes-cloudflare.certveis.workers.dev';return{
  name:'Solace Hermes — Clerk to AI Agent Workflow',version:VERSION,
  purpose:'Best-practice Zapier template untuk Clerk auth events, AI follow-up, Solace audit trail, CrewAI task, dan notification.',
  trigger:{app:'Clerk',event:'User Created / User Updated / Session Created'},
  actions:[
    {step:1,app:'Formatter by Zapier',event:'Normalize user payload',fields:['id','email','first_name','last_name','username','image_url','created_at']},
    {step:2,app:'Webhooks by Zapier',event:'POST Clerk event to Hermes',method:'POST',url:origin+'/webhook/zapier',headers:{Authorization:'Bearer <TOKEN>','Content-Type':'application/json'},body:{action:'clerk_event',event_type:'{{trigger.event}}',email:'{{user.email}}',user:{id:'{{user.id}}',name:'{{user.first_name}} {{user.last_name}}',username:'{{user.username}}',image:'{{user.image_url}}'}}},
    {step:3,app:'Webhooks by Zapier',event:'Optional AI welcome / profile enrichment',method:'POST',url:origin+'/webhook/zapier',headers:{Authorization:'Bearer <TOKEN>','Content-Type':'application/json'},body:{action:'chat',model:'llama-3.1-8b-instant',prompt:'Create a concise Indonesian welcome message for {{user.email}} using Solace Hermes features.'}},
    {step:4,app:'Webhooks by Zapier',event:'Optional CrewAI task',method:'POST',url:origin+'/webhook/zapier',headers:{Authorization:'Bearer <TOKEN>','Content-Type':'application/json'},body:{action:'crew',topic:'Onboard new user {{user.email}} to Solace Hermes',model:'llama-3.3-70b-versatile'}},
    {step:5,app:'Notion / Gmail / Slack / Telegram',event:'Create record or notify owner',note:'Use Zapier connected apps, or call action=notify to Hermes.'}
  ],
  endpoints:{template:origin+'/zapier/template',webhook:origin+'/webhook/zapier',chat:origin+'/chat',crew:origin+'/crew',integrations:origin+'/integrations'},
  security:['Store TOKEN in Zapier private field, never inside public pages','Use HTTPS only','Rotate token after testing','Worker credentials remain in Cloudflare Secrets']
}}

var CRAWL_HTML=`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Solace Hermes AI</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden}button,input,textarea,select{font:inherit}
:root{color-scheme:dark;--bg:#08090d;--bg2:#0d1117;--panel:#10151f;--panel2:#151b26;--elev:#1a2230;--border:#273244;--text:#f8fafc;--muted:#94a3b8;--soft:#cbd5e1;--accent:#10b981;--accent2:#f97316;--good:#10b981;--warn:#f59e0b;--bad:#ef4444;--code:#05070b;--shadow:0 24px 80px rgba(0,0,0,.35);--radius:18px;--fs:14px}
[data-theme="light"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}
@media(prefers-color-scheme:light){[data-theme="system"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}}
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at top left,rgba(16,185,129,.15),transparent 35%),radial-gradient(circle at bottom right,rgba(249,115,22,.12),transparent 38%),var(--bg);color:var(--text);font-size:var(--fs)}
.app{height:100dvh;display:grid;grid-template-columns:278px 1fr;padding:12px;gap:12px}.sidebar{background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02)),var(--panel);border:1px solid var(--border);border-radius:24px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-width:0;overflow:hidden}.brand{padding:18px 16px 14px;display:flex;align-items:center;gap:12px}.logo{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;box-shadow:0 14px 40px rgba(16,185,129,.25)}.brand h1{margin:0;font-size:16px;letter-spacing:-.02em}.brand p{margin:2px 0 0;color:var(--muted);font-size:11px}.status-dot{width:9px;height:9px;border-radius:999px;background:var(--good);box-shadow:0 0 14px var(--good);margin-left:auto}.new-chat{margin:0 14px 12px;border:0;border-radius:16px;padding:12px 14px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:700;cursor:pointer}.nav{padding:4px 10px;display:flex;flex-direction:column;gap:6px;overflow:auto}.nav button,.nav a{border:1px solid transparent;background:transparent;color:var(--muted);border-radius:16px;padding:11px 12px;text-align:left;display:flex;gap:10px;align-items:center;cursor:pointer;text-decoration:none}.nav button:hover,.nav a:hover{background:var(--panel2);color:var(--text);border-color:var(--border)}.nav button.active,.nav a.active{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(249,115,22,.14));border-color:rgba(16,185,129,.35);color:var(--text)}.nav .ico{width:24px;height:24px;border-radius:10px;background:var(--elev);display:grid;place-items:center}.side-foot{margin-top:auto;padding:14px;border-top:1px solid var(--border);display:grid;gap:10px}.mini-card{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:12px}.mini-card b{display:block;font-size:12px}.mini-card span{display:block;color:var(--muted);font-size:11px;margin-top:4px}.layout{min-width:0;display:grid;grid-template-rows:auto 1fr auto;background:rgba(16,21,31,.58);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);backdrop-filter:blur(18px)}.topbar{height:64px;padding:0 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(16,21,31,.72)}.menu-btn{display:none}.title{min-width:0}.title h2{font-size:15px;margin:0}.title p{font-size:11px;color:var(--muted);margin:3px 0 0}.spacer{flex:1}.pill,.select,select{background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:9px 10px}.select{max-width:230px}.icon-btn{border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:14px;padding:9px 11px;cursor:pointer}.main{min-height:0;overflow:hidden;position:relative}.view{height:100%;display:none;overflow:auto;padding:18px}.view.active{display:block}.chat-view{padding:0;display:none;grid-template-rows:1fr}.chat-view.active{display:grid}.messages{overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}.welcome{max-width:1050px;margin:0 auto;padding:18px 0 120px}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;margin-bottom:16px}.hero-card,.card{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025)),var(--panel);border:1px solid var(--border);border-radius:22px;padding:18px}.hero-card h2{font-size:34px;line-height:1;margin:4px 0 10px;letter-spacing:-.04em}.grad{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}.hero-card p{color:var(--muted);line-height:1.6;margin:0}.quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.quick button,.primary{border:0;border-radius:14px;padding:10px 12px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-weight:700;cursor:pointer}.secondary{border:1px solid var(--border);border-radius:14px;padding:10px 12px;background:var(--panel2);color:var(--text);cursor:pointer}.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.stat b{font-size:24px}.stat span{display:block;color:var(--muted);font-size:11px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.feature{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:15px;cursor:pointer;transition:.16s}.feature:hover{transform:translateY(-2px);border-color:rgba(79,140,255,.45)}.feature .big{font-size:26px}.feature h3{margin:10px 0 6px;font-size:14px}.feature p{margin:0;color:var(--muted);font-size:12px;line-height:1.5}.msg{max-width:min(820px,86%);padding:12px 14px;border-radius:18px;line-height:1.6;white-space:pre-wrap;word-break:break-word}.msg.user{align-self:flex-end;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border-bottom-right-radius:6px}.msg.ai{align-self:flex-start;background:var(--panel);border:1px solid var(--border);border-bottom-left-radius:6px}.msg.system{align-self:center;max-width:92%;color:var(--muted);font-size:12px;text-align:center}.msg pre{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:14px;padding:12px;overflow:auto}.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--panel2);color:var(--muted);border-radius:999px;padding:5px 9px;font-size:11px;margin-bottom:8px}.composer{border-top:1px solid var(--border);padding:10px;background:rgba(16,21,31,.78)}.cmds{display:flex;gap:6px;overflow:auto;padding:0 2px 8px}.cmds button{white-space:nowrap;border:1px solid var(--border);background:var(--panel);color:var(--muted);border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer}.input-row{display:flex;gap:8px;align-items:flex-end}.input-row textarea{flex:1;resize:none;min-height:46px;max-height:150px;background:var(--panel);border:1px solid var(--border);border-radius:18px;color:var(--text);padding:13px 14px;outline:0}.input-row textarea:focus{border-color:var(--accent)}.send{width:48px;height:46px;border:0;border-radius:16px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:900;cursor:pointer}.page{max-width:1100px;margin:0 auto}.page h2{margin:2px 0 6px;font-size:26px}.page>p{color:var(--muted);margin-top:0}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form{display:grid;gap:10px}.form input,.form textarea,.form select{width:100%;background:var(--panel2);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:12px;outline:0}.output{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:16px;padding:12px;min-height:220px;overflow:auto;white-space:pre-wrap}.code-shell{height:100%;display:grid;grid-template-columns:270px 1fr;gap:12px}.files{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:14px;overflow:auto}.editor{background:var(--panel);border:1px solid var(--border);border-radius:20px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}.editor-head{padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center}.editor textarea{width:100%;height:100%;resize:none;border:0;outline:0;background:var(--code);color:#e2e8f0;padding:14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55}.editor-foot{padding:10px;border-top:1px solid var(--border);display:flex;gap:8px}.file-item{padding:9px;border-radius:12px;color:var(--muted);cursor:pointer}.file-item:hover,.file-item.active{background:var(--panel2);color:var(--text)}
.editor-container{position:relative;width:100%;height:100%;overflow:hidden;background:var(--code)}
.editor-highlight,.editor-textarea{position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:14px;border:0;outline:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55;white-space:pre;overflow:auto;tab-size:2}
.editor-textarea{color:transparent;background:transparent;caret-color:var(--text);z-index:2;resize:none}
.editor-highlight{z-index:1;pointer-events:none;background:transparent}
.editor-highlight code{font-family:inherit;font-size:inherit;line-height:inherit;background:transparent!important;padding:0!important}
.toast{position:fixed;right:18px;bottom:18px;background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:12px 14px;box-shadow:var(--shadow);display:none;z-index:20}.toast.on{display:block}.mobile-tabs{display:none}
@media(max-width:860px){.app{grid-template-columns:1fr;padding:0;gap:0}.sidebar{position:fixed;z-index:30;left:10px;top:10px;bottom:10px;width:min(310px,86vw);transform:translateX(-115%);transition:.2s}.sidebar.open{transform:none}.layout{border-radius:0;border:0;height:100dvh}.menu-btn{display:block}.topbar{height:58px;padding:0 10px}.select{max-width:150px}.view{padding:12px}.hero{grid-template-columns:1fr}.grid,.two{grid-template-columns:1fr}.hero-card h2{font-size:28px}.code-shell{grid-template-columns:1fr;grid-template-rows:auto 1fr}.files{max-height:180px}.mobile-tabs{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:9;background:rgba(16,21,31,.92);border:1px solid var(--border);border-radius:20px;padding:6px;gap:4px;backdrop-filter:blur(12px);overflow-x:auto;-webkit-overflow-scrolling:touch}.mobile-tabs::-webkit-scrollbar{display:none}.mobile-tabs button,.mobile-tabs a{flex:1;flex-shrink:0;min-width:38px;border:0;background:transparent;color:var(--muted);border-radius:15px;padding:8px 4px;text-decoration:none;text-align:center}.mobile-tabs button.active,.mobile-tabs a.active{background:var(--panel2);color:var(--text)}.messages{padding-bottom:90px}.composer{padding-bottom:76px}.sync-text{font-size:12px;font-weight:600}@media(max-width:540px){.sync-text{display:none}}}
</style>
</head>
<body data-theme="system">
<div class="app">
  <aside class="sidebar" id="sidebar">
    <div class="brand"><div class="logo">⚡</div><div><h1>Solace Hermes</h1><p>Codex-style mobile AI hub</p></div><span class="status-dot" id="liveDot"></span></div>
    <button class="new-chat" id="newChat">＋ New Chat</button>
        <nav class="nav" id="nav">
      <a data-view="dashboard" href="/dashboard"><span class="ico">🏠</span><span>Realtime Dashboard</span></a>
      <a data-view="chat" href="/chat-live" class="active"><span class="ico">💬</span><span>Chat-Live</span></a>
      <a data-view="coding" href="/coding"><span class="ico">⌘</span><span>AI Coding</span></a>
      <a data-view="crawl" href="/crawl4ai"><span class="ico">🕷️</span><span>Crawl4AI</span></a>
      <a data-view="crew" href="/crew"><span class="ico">🤖</span><span>CrewAI</span></a>
      <a data-view="links" href="/links"><span class="ico">🔗</span><span>Links Hub</span></a>
      <a href="/integrations" target="_blank"><span class="ico">🧩</span><span>Integrations</span></a>
      <a data-view="solace" href="/solace"><span class="ico">📡</span><span>Solace Status</span></a>
      <a data-view="zapier" href="/zapier"><span class="ico">⚡</span><span>Zapier Template</span></a>
      <a data-view="logs" href="/logs"><span class="ico">📜</span><span>Activity Logs</span></a>
      <a data-view="settings" href="/settings"><span class="ico">⚙️</span><span>Settings</span></a>
      <a data-view="profile" href="/profile"><span class="ico">👤</span><span>Profile</span></a>
    </nav>
    <div class="side-foot"><div class="mini-card"><b>Command cepat</b><span>/crawl URL · /code task · /crew topic · /help</span></div><div class="mini-card"><b>Theme</b><span>System, dark, light + ukuran font</span></div></div>
  </aside>
  <section class="layout">
    <header class="topbar"><button class="icon-btn menu-btn" id="menuBtn">☰</button><div class="title"><h2 id="viewTitle">Chat-Live</h2><p id="viewDesc">Tanya AI, crawl URL, jalankan chat live, dan tools dari satu halaman.</p></div><div class="spacer"></div><select class="select" id="model"><optgroup label="Groq AI (Fastest)"><option value="llama-3.3-70b-versatile">Llama 3.3 70B</option><option value="qwen/qwen3-32b">Qwen 3 32B</option><option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout</option><option value="openai/gpt-oss-120b">GPT OSS 120B</option><option value="deepseek-r1-distill-llama-70b">DeepSeek R1 70B</option><option value="llama-3.1-8b-instant">Llama 8B Fast</option></optgroup><optgroup label="Google Gemini (Big Context)"><option value="gemini-2.5-flash">Gemini 2.5 Flash</option><option value="gemini-2.5-pro">Gemini 2.5 Pro</option><option value="gemini-2.0-flash">Gemini 2.0 Flash</option><option value="gemini-1.5-pro">Gemini 1.5 Pro</option></optgroup><optgroup label="OpenRouter (Multi-Provider)"><option value="deepseek/deepseek-r1">DeepSeek R1 (Full)</option><option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option><option value="openai/gpt-4o">GPT-4o</option><option value="google/gemini-2.5-flash">Gemini 2.5 (OR)</option></optgroup></select><button class="icon-btn" id="syncNowBtn" title="Sync Now" style="display:flex;align-items:center;gap:6px;"><span style="font-size:14px;">☁️</span><span class="sync-text">Sync Now</span></button><button class="icon-btn" id="themeBtn">🌓</button></header>
    <main class="main">
      <section class="view chat-view active" id="view-chat"><div class="messages" id="messages"></div></section>
      <section class="view" id="view-coding"><div class="code-shell"><aside class="files"><h3>GitHub Workspace</h3><div class="form" style="gap:6px;margin:8px 0;display:grid;"><select id="githubRepo" class="select" style="width:100%;font-size:12px;padding:6px 8px;border-radius:10px;"><option value="roadfx-full-stack">ivansslo/roadfx-full-stack (Private)</option><option value="hermes-agent-cli">ivansslo/hermes-agent-cli (Public)</option><option value="ai-vitality">ivansslo/ai-vitality (Public)</option><option value="roadfx-ai-stack">ivansslo/roadfx-ai-stack (Main)</option><option value="custom">-- Custom Repo --</option></select><div id="customGithubForm" style="display:none;gap:4px;grid-template-columns:1fr 1fr;margin-bottom:2px;"><input id="customGithubOwner" class="pill" placeholder="Owner (ivansslo)" style="font-size:11px;padding:5px;border-radius:8px;background:var(--panel2);"><input id="customGithubRepo" class="pill" placeholder="Repo Name" style="font-size:11px;padding:5px;border-radius:8px;background:var(--panel2);"></div><button class="secondary" id="syncGithub" style="width:100%;font-size:12px;padding:6px;border-radius:10px;font-weight:600;">🔄 Sync Files</button><input id="fileSearch" class="pill" placeholder="🔍 Cari file..." style="width:100%;font-size:12px;padding:6px 10px;border-radius:10px;background:var(--panel2);"></div><div id="fileList"></div></aside>
<div class="editor">
  <div class="editor-head"><input id="fileName" class="pill" value="app.js"><button class="secondary" id="saveFile">Save</button><button class="primary" id="askCode">Generate</button></div>
  <div class="editor-container">
    <pre class="editor-highlight" id="highlightLayer"><code class="language-javascript" id="highlightCode">// AI Coding workspace
// Klik Sync Files untuk load dari repository GitHub Anda.</code></pre>
    <textarea class="editor-textarea" id="codeEditor" spellcheck="false" oninput="updateHighlight()" onscroll="syncScroll()">// AI Coding workspace
// Klik Sync Files untuk load dari repository GitHub Anda.</textarea>
  </div>
  <div class="editor-foot"><input id="codePrompt" class="pill" placeholder="Contoh: buat component sidebar responsive"><button class="primary" id="sendCodePrompt">Ask AI</button></div>
</div>
</div></section>
      <section class="view" id="view-crawl"><div class="page"><h2>🕷️ Crawl4AI</h2><p>Status: endpoint tersedia di gateway. Gunakan form ini atau command <b>/crawl https://contoh.com</b> di chat.</p><div class="two"><div class="card form"><label>URL</label><input id="crawlUrl" placeholder="https://example.com"><label>Mode</label><select id="crawlMode"><option value="crawl4ai">Crawl4AI markdown cleaner</option><option value="crawl">Simple crawl text</option><option value="extract">Extract JSON-LD/OpenGraph</option></select><label>Max length</label><input id="crawlMax" type="number" value="50000"><button class="primary" id="runCrawl">Run Crawl</button></div><pre class="output" id="crawlOutput">Hasil crawl akan muncul di sini.</pre></div></div></section>
      <section class="view" id="view-crew"><div class="page"><h2>🤖 CrewAI</h2><p>Jalankan task agent berurutan lewat Solace task endpoint.</p><div class="card form"><input id="crewTopic" value="AI agents in 2026"><button class="primary" id="runCrew">Run Crew</button><pre class="output" id="crewOutput">Researcher → Analyst → Writer</pre></div></div></section>
      <section class="view" id="view-links"><div class="page"><h2>🔗 Links Hub</h2><p>Sidebar untuk menu page link: Apps, Tools, Skills, dan ClawHub.</p><div class="quick"><button class="secondary" data-link="integrations">Apps</button><button class="secondary" data-link="tools">Tools</button><button class="secondary" data-link="skills">Skills</button><button class="secondary" data-link="hub/plugins">Hub Plugins</button></div><div class="grid" id="linksGrid"></div></div></section>
      <section class="view" id="view-solace"><div class="page"><h2>📡 Solace Status</h2><p>Monitor broker, queues, dan service.</p><div class="quick"><button class="primary" id="refreshSolace">Refresh</button></div><pre class="output" id="solaceOutput">Klik Refresh untuk cek status.</pre></div></section>
      <section class="view" id="view-settings"><div class="page"><h2>⚙️ Settings</h2><p>Tema bawaan sudah tersedia: System, Dark, Light.</p><div class="two"><div class="card form"><label>Theme</label><select id="themeSelect"><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select><label>Font size</label><select id="fontSelect"><option value="13px">Small</option><option value="14px">Normal</option><option value="16px">Large</option></select><label>Gateway API URL</label><input id="apiUrl" placeholder="kosong = current origin"><label>Bearer token</label><input id="tokenInput" type="password" placeholder="Worker token"><button class="primary" id="saveSettings">Save Settings</button></div><div><div class="card"><h3>Catatan keamanan</h3><p style="color:var(--muted);line-height:1.6">Untuk production, simpan token di Cloudflare Worker Secrets dan gunakan auth session. UI ini mendukung token via localStorage agar tidak perlu hardcode di file.</p></div><div class="card" style="margin-top:12px"><h3>Backup & Sinkronisasi KV</h3><p style="color:var(--muted);line-height:1.6;font-size:12px;margin-bottom:12px">Cadangkan semua data lokal (file, riwayat chat, pengaturan) langsung ke Cloudflare Workers KV. Anda dapat memulihkannya kapan saja di perangkat lain.</p><div class="quick" style="display:flex;gap:8px;"><button class="primary" id="btnSyncPush" style="flex:1;">📤 Backup (Push)</button><button class="secondary" id="btnSyncPull" style="flex:1;">📥 Restore (Pull)</button></div><p id="syncStatus" style="font-size:11px;color:var(--muted);margin-top:10px;text-align:center;">Belum disinkronkan.</p></div></div></div></div></section>
      <section class="view" id="view-profile"><div class="page"><h2>👤 Profile</h2><p>Clerk auth + Zapier connected. Login sosial GitHub, GitLab, Google, HuggingFace, Linear, LinkedIn, Notion, X.</p><div class="card"><h3>Identity</h3><p id="profileId" style="color:var(--muted)"></p><div class="quick"><button class="primary" id="clerkLogin">Login with Clerk</button><button class="secondary" id="clerkProfile">Open Profile</button><a class="secondary" href="/zapier" style="text-decoration:none">Zapier Template</a></div><pre class="output" id="clerkStatus">Clerk status loading...</pre></div></div></section>
    
      <section class="view" id="view-dashboard">
        <div class="page">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:20px;">⚡</div>
            <div>
              <h2 style="margin:0;">Realtime Dashboard</h2>
              <div class="muted">Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh.</div>
            </div>
          </div>
          <div class="quick">
            <button class="primary" onclick="window.location.href='/dashboard'">Buka Dashboard Penuh</button>
            <button class="secondary" onclick="window.open('/api', '_blank')">API Base</button>
            <button class="secondary" onclick="window.open('/integrations', '_blank')">Integrations</button>
            <button class="secondary" onclick="window.open('https://rocspace-links.certveis.workers.dev', '_blank')">Hub</button>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Informasi</h3>
            <p class="muted">Halaman Dashboard penuh memiliki layout khusus dan auto-refresh. Klik tombol di atas untuk membuka versi penuh.</p>
          </div>
        </div>
      </section>

      <section class="view" id="view-zapier">
        <div class="page">
          <h2>⚡ Zapier Template Terbaik</h2>
          <p class="muted">Clerk → Zapier → Solace Hermes: user event masuk ke Solace, optional AI welcome, optional CrewAI onboarding.</p>
          <div class="two">
            <div class="card">
              <h3>Trigger</h3>
              <p class="muted">App: Clerk<br>Event: User Created / User Updated / Session Created</p>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>1. Normalize</b><p class="muted">Formatter by Zapier: id, email, name, username, image_url.</p>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>2. POST to Hermes</b>
                <pre class="output">POST /webhook/zapier
Authorization: Bearer &lt;TOKEN&gt;
{"action":"clerk_event","event_type":"user.created","email":"...","user":{...}}</pre>
              </div>
            </div>
            <div class="card">
              <h3>Actions</h3>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>AI Welcome</b><pre class="output">{"action":"chat","model":"llama-3.1-8b-instant","prompt":"Create welcome message..."}</pre>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>CrewAI Onboarding</b><pre class="output">{"action":"crew","topic":"Onboard new user to Solace Hermes"}</pre>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>Notify / Notion</b><p class="muted">Gunakan Zapier connected apps atau action notify ke Hermes.</p>
              </div>
            </div>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Webhook URL</h3>
            <pre class="output">/webhook/zapier</pre>
            <p class="muted">Credential tetap di Zapier private fields dan Cloudflare Worker Secrets.</p>
            <div class="quick"><a class="secondary" href="/zapier/template" target="_blank" style="text-decoration:none">JSON Template</a></div>
          </div>
        </div>
      </section>

      <section class="view" id="view-logs">
        <div class="page">
          <h2>📜 Activity Logs</h2>
          <p class="muted">Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client.</p>
          <div class="quick">
            <button class="primary" onclick="window.location.href='/logs'">Buka Logs Viewer Penuh</button>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Server Logs</h3>
            <p class="muted">Server logs dikirim ke Cloudflare console + Solace topics <code>hermes/log/*</code>. Halaman Logs penuh memiliki fitur auto-tail dan filtering dari KV/D1 binding.</p>
          </div>
        </div>
      </section>

    </main>
    <footer class="composer"><div class="cmds"><button data-cmd="/help">/help</button><button data-cmd="/crawl https://">/crawl URL</button><button data-cmd="/code ">/code</button><button data-cmd="/crew ">/crew</button><button data-cmd="Jelaskan fungsi page chat ini">fungsi page chat</button></div><div class="input-row"><textarea id="input" rows="1" placeholder="Message... /crawl https://url, /code buat UI, /crew topic"></textarea><button class="send" id="send">➤</button></div></footer>
  </section>
</div>
<div class="mobile-tabs" id="mobileTabs"><a data-view="dashboard" href="/chat-live#dashboard">🏠</a><a data-view="chat" href="/chat-live" class="active">💬</a><a data-view="coding" href="/chat-live#coding">⌘</a><a data-view="crawl" href="/chat-live#crawl">🕷️</a><a data-view="crew" href="/chat-live#crew">🤖</a><a data-view="links" href="/chat-live#links">🔗</a><a href="/integrations" target="_blank">🧩</a><a data-view="solace" href="/chat-live#solace">📡</a><a data-view="zapier" href="/chat-live#zapier">⚡</a><a data-view="logs" href="/chat-live#logs">📜</a><a data-view="settings" href="/chat-live#settings">⚙️</a><a data-view="profile" href="/chat-live#profile">👤</a></div>
<div class="toast" id="toast"></div>
<script>
var DEFAULT_TOKEN='';
var API_DEFAULT='';
var state={view:'chat',messages:[],files:{'app.js':['// AI Coding workspace','function helloHermes(){','  return "Build UI like codex-mobile-web";','}',''].join(String.fromCharCode(10))},currentFile:'app.js',isGithub:false,githubFilesList:[],githubShas:{}};
var titles={chat:['Chat-Live','Tanya AI, crawl URL, jalankan chat live, dan tools dari satu halaman.'],coding:['AI Coding','Editor mini untuk generate, edit, dan simpan file lokal.'],crawl:['Crawl4AI','Crawl URL menjadi markdown/text lalu kirim ke chat.'],crew:['CrewAI','Jalankan workflow agent.'],links:['Links Hub','Menu page link untuk Apps, Tools, Skills, Hub.'],solace:['Solace Status','Monitor event mesh dan queues.'],settings:['Settings','Theme system/dark/light, font, API, token.'],profile:['Profile','Identitas user dan slot Clerk auth.'],dashboard:['Realtime Dashboard','Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh.'],zapier:['Zapier Template','Clerk → Zapier → Solace Hermes integration.'],logs:['Activity Logs','Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client.']};
function $(id){return document.getElementById(id)}function api(){return localStorage.getItem('hermes_api')||API_DEFAULT}function token(ask){var t=localStorage.getItem('hermes_token')||DEFAULT_TOKEN;if(!t&&ask!==false){t=prompt('Masukkan TOKEN Worker untuk endpoint protected')||'';if(t)localStorage.setItem('hermes_token',t)}return t}function clientLog(type,data){try{var k='hermes_client_logs';var a=JSON.parse(localStorage.getItem(k)||'[]');a.unshift({type:type,ts:new Date().toISOString(),data:data||{}});if(a.length>300)a.length=300;localStorage.setItem(k,JSON.stringify(a))}catch(e){}}function toast(t){$('toast').textContent=t;$('toast').classList.add('on');setTimeout(function(){$('toast').classList.remove('on')},2400)}
function setTheme(t){document.body.setAttribute('data-theme',t);localStorage.setItem('hermes_theme',t);$('themeSelect').value=t}function cycleTheme(){var a=['system','dark','light'];var c=document.body.getAttribute('data-theme')||'system';setTheme(a[(a.indexOf(c)+1)%a.length])}
function updateHighlight(){
  var editor=$('codeEditor');
  var code=$('highlightCode');
  var layer=$('highlightLayer');
  if(!editor||!code)return;
  var val=editor.value;
  if(val.endsWith('\\n')) val+=' ';
  code.innerHTML=escapeHtml(val);
  var ext=($('fileName').value||'').split('.').pop();
  var lang='javascript';
  if(ext==='py')lang='python';else if(ext==='css')lang='css';else if(ext==='html')lang='html';else if(ext==='json')lang='json';else if(ext==='md')lang='markdown';
  code.className='language-'+lang;
  if(window.Prism) Prism.highlightElement(code);
}
function syncScroll(){
  var editor=$('codeEditor');
  var layer=$('highlightLayer');
  if(!editor||!layer)return;
  layer.scrollTop=editor.scrollTop;
  layer.scrollLeft=editor.scrollLeft;
}
function initSettings(){setTheme(localStorage.getItem('hermes_theme')||'system');var fs=localStorage.getItem('hermes_font')||'14px';document.documentElement.style.setProperty('--fs',fs);$('fontSelect').value=fs;$('apiUrl').value=localStorage.getItem('hermes_api')||'';$('tokenInput').value=localStorage.getItem('hermes_token')||'';$('profileId').textContent='Visitor ID: '+getUid();var sm=localStorage.getItem('hermes_model');if(sm&&$('model'))$('model').value=sm}
function getUid(){var u=localStorage.getItem('hermes_uid');if(!u){u='user-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.setItem('hermes_uid',u)}return u}
function nav(v){
  clientLog('ui.nav',{view:v});
  state.view=v;
  document.querySelectorAll('[data-view]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-view')===v)});
  document.querySelectorAll('.view').forEach(function(x){x.classList.remove('active')});
  if($('view-'+v)) $('view-'+v).classList.add('active');
  if(titles[v]){
    $('viewTitle').textContent=titles[v][0];
    $('viewDesc').textContent=titles[v][1];
  }
  $('sidebar').classList.remove('open');
  if(v==='links')loadLinks('integrations');
  var p='/'+v;
  if(v==='chat') p='/chat-live';
  else if(v==='crawl') p='/crawl4ai';
  if(history.pushState && location.pathname!==p) history.pushState(null,null,p);
}
function escapeHtml(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function renderMessages(){var box=$('messages');box.innerHTML='';if(!state.messages.length){box.appendChild(welcomeNode());return}state.messages.forEach(function(m){var d=document.createElement('div');d.className='msg '+m.role;d.innerHTML=(m.badge?'<span class="badge">'+m.badge+'</span>':'')+format(m.content);box.appendChild(d)});box.scrollTop=box.scrollHeight}
function welcomeNode(){var w=document.createElement('div');w.className='welcome';w.innerHTML='<div class="hero"><div class="hero-card"><span class="badge">✨ Solace Hermes v5.0.0 "Omni"</span><h2>AI Agent Hub: Chat, CrewAI, Crawl4AI, Solace, dan integrasi aktif.</h2><p>Dashboard ini berisi keterangan fungsi dan koneksi semua komponen: Cloudflare Workers, Chat, CrewAI Termux, Zapier, CF AI Factory, Clerk, Notion/ClawLink, Crawl4AI, domain certveis.space, GitHub/GitLab, dan Termux CLI.</p><div class="quick"><a class="secondary" href="/dashboard" style="text-decoration:none">Dashboard</a><button data-go="chat">Chat</button><button data-go="crew">CrewAI</button><button data-go="crawl">Crawl4AI</button><button data-go="links">Hub</button><button data-go="solace">Solace</button></div></div><div class="hero-card"><div class="stats"><div class="stat"><b>5</b><span>CF Workers</span></div><div class="stat"><b>25+</b><span>Endpoints</span></div><div class="stat"><b>20</b><span>Integrations</span></div><div class="stat"><b>9</b><span>Domains</span></div></div></div></div><div class="grid"><div class="feature" data-go="chat"><div class="big">💬</div><h3>Chat</h3><p>20+ models, 3 modes, Clerk auth slot, streaming, command /crawl /code /crew.</p></div><div class="feature" data-go="solace"><div class="big">📡</div><h3>Solace</h3><p>Event mesh connected, 5 queues, Singapore RoClace cluster.</p></div><div class="feature" data-go="crew"><div class="big">🤖</div><h3>CrewAI</h3><p>v1.15.1 running di Termux, workflow Researcher → Analyst → Writer.</p></div><div class="feature" data-go="chat"><div class="big">⚡</div><h3>Zapier</h3><p>Connected ke CrewAI dan webhook endpoint /webhook/zapier.</p></div><div class="feature" data-go="links"><div class="big">🎨</div><h3>CF AI Factory</h3><p>60 public models untuk chat, image, TTS, STT, embeddings, translate, vision.</p></div><div class="feature" data-go="profile"><div class="big">🔐</div><h3>Clerk</h3><p>8 social logins: GitHub, GitLab, Google, HuggingFace, Linear, LinkedIn, Notion, X.</p></div><div class="feature" data-go="links"><div class="big">📝</div><h3>Notion</h3><p>45 tools via ClawLink, siap dipanggil dari Links Hub/tool execute.</p></div><div class="feature" data-go="crawl"><div class="big">🕷️</div><h3>Crawl4AI</h3><p>/crawl4ai endpoint aktif dan command /crawl URL di chat.</p></div><div class="feature" data-go="links"><div class="big">🔗</div><h3>20 integrations</h3><p>ClawHub, ClawLink, Honcho, Solace, Zapier, Tailscale, Clerk dan lainnya.</p></div><div class="feature" data-go="settings"><div class="big">🌐</div><h3>9 domains</h3><p>certveis.space domains mapped untuk app, AI gateway, webhook, factory, hub.</p></div><div class="feature" data-go="coding"><div class="big">📦</div><h3>4 repos synced</h3><p>Source GitHub + GitLab dengan UI, Worker, docs, dan scripts.</p></div><div class="feature" data-go="coding"><div class="big">📱</div><h3>Termux CLI</h3><p>hermes run works; CrewAI dan CLI operasional dari Termux.</p></div></div>';setTimeout(function(){w.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){nav(b.getAttribute('data-go'))}})},0);return w}
function format(s){s=escapeHtml(s);s=s.replace(/\n/g,'<br>');return s}
function add(role,content,badge){state.messages.push({role:role,content:content,badge:badge});renderMessages()}
async function send(){var text=$('input').value.trim();clientLog('chat.send',{text:text.slice(0,120)});if(!text)return;$('input').value='';autoSize();add('user',text);if(text==='/help'){add('ai','Perintah:\\n/crawl https://url = crawl halaman\\n/code task = kirim task coding ke AI\\n/crew topic = jalankan crew task\\nTema ada di Settings: System, Dark, Light.','Help');return}if(text.indexOf('/crawl ')===0){runCrawlFromChat(text.replace('/crawl ','').trim());return}if(text.indexOf('/code ')===0){nav('coding');$('codePrompt').value=text.replace('/code ','').trim();askCoding();return}if(text.indexOf('/crew ')===0){nav('crew');$('crewTopic').value=text.replace('/crew ','').trim();runCrew();return}await aiChat(text)}
async function aiChat(text){
  add('system','Thinking...');
  var max=3,delay=1000;
  for(var attempt=0;attempt<=max;attempt++){
    try{
      var msgs=state.messages.filter(function(m){return m.role==='user'||m.role==='ai'}).slice(-12).map(function(m){return{role:m.role==='ai'?'assistant':'user',content:m.content}});
      if(msgs.length>0&&msgs[0].role!=='system'){
        msgs.unshift({role:'system',content:'You are Solace Hermes AI, a highly capable multi-model assistant. Respond concisely and effectively.'});
      }
      var res=await fetch(api()+'/ai/stream',{
        method:'POST',
        headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},
        body:JSON.stringify({model:$('model').value,messages:msgs,max_tokens:4096,stream:true})
      });
      if(!res.ok){
        if(attempt<max&&(res.status===401||res.status>=500)){
          await new Promise(function(r){setTimeout(r,delay)});
          delay*=2;
          continue
        }
        state.messages.pop();renderMessages();
        var er=await res.text();
        add('ai','Error '+res.status+': '+er,'Gateway');
        return
      }
      state.messages.pop();renderMessages();
      var full='';
      var reader=res.body.getReader();
      var dec=new TextDecoder();
      var buf='';
      add('ai','',$('model').value);
      while(true){
        var rv=await reader.read();
        if(rv.done)break;
        buf+=dec.decode(rv.value,{stream:true});
        var lines=buf.split('\n');
        buf=lines.pop()||'';
        for(var i=0;i<lines.length;i++){
          var l=lines[i];
          if(l.indexOf('data: ')!==0)continue;
          var dd=l.slice(6);
          if(dd==='[DONE]')continue;
          try{
            var j=JSON.parse(dd);
            var delta=j.choices&&j.choices[0]&&j.choices[0].delta&&(j.choices[0].delta.content||j.choices[0].delta.reasoning||j.choices[0].delta.reasoning_content)||'';
            if(delta){
              full+=delta;
              state.messages[state.messages.length-1].content=full;
              renderMessages();
            }
          }catch(e){}
        }
      }
      return
    }catch(e){
      if(attempt<max){
        await new Promise(function(r){setTimeout(r,delay)});
        delay*=2;
        continue
      }
      state.messages.pop();renderMessages();
      add('ai','Error: '+e.message,'Gateway');
      return
    }
  }
}
async function runCrawlFromChat(url){if(!url){add('ai','Format: /crawl https://example.com','Crawl4AI');return}add('system','Crawling '+url+' ...');try{var r=await fetch(api()+'/crawl4ai',{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({url:url,max_length:30000})});var d=await r.json();state.messages.pop();renderMessages();if(d.error){add('ai','Crawl error: '+d.error,'Crawl4AI');return}add('ai','Title: '+(d.title||'-')+'\\nURL: '+d.url+'\\nLength: '+d.content_length+'\\n\\n'+(d.content||'').slice(0,6000),'Crawl4AI')}catch(e){state.messages.pop();renderMessages();add('ai','Crawl error: '+e.message,'Crawl4AI')}} 
async function runCrawl(){var url=$('crawlUrl').value.trim();clientLog('crawl.run',{url:url,mode:$('crawlMode').value});if(!url)return toast('Masukkan URL');$('crawlOutput').textContent='Crawling...';var mode=$('crawlMode').value;var path=mode==='extract'?'/crawl4ai/extract':(mode==='crawl'?'/crawl':'/crawl4ai');try{var r=await fetch(api()+path,{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({url:url,max_length:parseInt($('crawlMax').value||'50000')})});var d=await r.json();$('crawlOutput').textContent=JSON.stringify(d,null,2)}catch(e){$('crawlOutput').textContent='Error: '+e.message}}
async function runCrew(){var topic=$('crewTopic').value.trim();clientLog('crew.run',{topic:topic});$('crewOutput').textContent='Running crew task...';try{var r=await fetch(api()+'/solace/task',{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({type:'chat',prompt:'You are a research crew. Research, analyze, and write a report about: '+topic,model:'llama-3.3-70b-versatile',max_tokens:4096})});var d=await r.json();$('crewOutput').textContent=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||JSON.stringify(d,null,2)}catch(e){$('crewOutput').textContent='Error: '+e.message}}
function renderFiles(){
  var list=$('fileList');
  if(!list) return;
  list.innerHTML='';
  var keyword=($('fileSearch')?$('fileSearch').value.trim().toLowerCase():'');
  if(state.isGithub){
    var items=state.githubFilesList||[];
    if(keyword){
      items=items.filter(function(x){return x.path.toLowerCase().indexOf(keyword)>=0});
    }
    if(!items.length){
      var empty=document.createElement('div');
      empty.className='file-item';
      empty.style.color='var(--muted)';
      empty.style.fontSize='12px';
      empty.textContent='Tidak ada file ditemukan';
      list.appendChild(empty);
      return;
    }
    items.forEach(function(item){
      var n=item.path;
      var d=document.createElement('div');
      d.className='file-item '+(n===state.currentFile?'active':'');
      var isLoaded=state.files[n]!==undefined;
      d.textContent=(isLoaded?'🟢 ':'📄 ')+n;
      d.onclick=async function(){
        saveCurrent();
        state.currentFile=n;
        $('fileName').value=n;
        if(state.files[n]!==undefined){
          $('codeEditor').value=state.files[n];
          renderFiles();
          updateHighlight();
        }else{
          $('codeEditor').value='// Loading content dari GitHub...';
          try{
            var r=await fetch('/api/github/file?owner=ivansslo&repo='+$('githubRepo').value+'&path='+encodeURIComponent(n));
            if(!r.ok){var er=await r.json();throw new Error(er.error||'Failed to load')};
            var fd=await r.json();
            var decoded='';
            if(fd.encoding==='base64'){
              decoded=decodeURIComponent(escape(atob(fd.content.replace(/s/g,''))));
            }else{
              decoded=fd.content||'';
            }
            state.files[n]=decoded;
            state.githubShas[n]=fd.sha;
            if(state.currentFile===n){
              $('codeEditor').value=decoded;
              updateHighlight();
            }
            renderFiles();
          }catch(e){
            if(state.currentFile===n){
              $('codeEditor').value='// Gagal load file: '+e.message;
            }
            toast('Gagal load file: '+e.message);
          }
        }
      };
      list.appendChild(d);
    });
  }else{
    var keys=Object.keys(state.files);
    if(keyword){
      keys=keys.filter(function(x){return x.toLowerCase().indexOf(keyword)>=0});
    }
    keys.forEach(function(n){
      var d=document.createElement('div');
      d.className='file-item '+(n===state.currentFile?'active':'');
      d.textContent='📄 '+n;
      d.onclick=function(){
        saveCurrent();
        state.currentFile=n;
        $('fileName').value=n;
        $('codeEditor').value=state.files[n];
        renderFiles();
        updateHighlight();
      };
      list.appendChild(d);
    });
  }
}
function saveCurrent(){
  clientLog('coding.save',{file:$('fileName').value||state.currentFile});
  var n=$('fileName').value||state.currentFile;
  state.files[n]=$('codeEditor').value;
  state.currentFile=n;
  if(!state.isGithub){
    localStorage.setItem('hermes_files',JSON.stringify(state.files));
  }
  renderFiles();
}
async function saveGithubFile(){
  saveCurrent();
  if(!state.isGithub){
    toast('File saved local');
    return;
  }
  var n=state.currentFile;
  var content=state.files[n]||'';
  var sha=state.githubShas[n];
  var selectedRepo=$('githubRepo').value;
  toast('Mengirim commit ke GitHub...');
  try{
    var r=await fetch('/api/github/save',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        owner:'ivansslo',
        repo:selectedRepo,
        path:n,
        content:content,
        sha:sha
      })
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error||'Failed to save');
    state.githubShas[n]=d.sha;
    toast('Berhasil commit ke GitHub!');
    renderFiles();
  }catch(e){
    toast('Gagal commit: '+e.message);
  }
}
async function syncGithubFiles(){
  var selectedRepo=$('githubRepo').value;
  var list=$('fileList');
  list.innerHTML='<div class="file-item" style="color:var(--muted)">🔄 Syncing file tree...</div>';
  try{
    var r=await fetch('/api/github/files?owner=ivansslo&repo='+selectedRepo);
    if(!r.ok){var er=await r.json();throw new Error(er.error||'Failed to sync')};
    var d=await r.json();
    state.isGithub=true;
    state.githubFilesList=d.files||[];
    state.githubShas={};
    (d.files||[]).forEach(function(item){
      state.githubShas[item.path]=item.sha;
    });
    if(d.files&&d.files.length>0){
      var first=d.files[0].path;
      state.currentFile=first;
      $('fileName').value=first;
      $('codeEditor').value='// Loading content...';
      renderFiles();
      var fr=await fetch('/api/github/file?owner=ivansslo&repo='+selectedRepo+'&path='+encodeURIComponent(first));
      if(fr.ok){
        var fd=await fr.json();
        var decoded='';
        if(fd.encoding==='base64'){
          decoded=decodeURIComponent(escape(atob(fd.content.replace(/s/g,''))));
        }else{
          decoded=fd.content||'';
        }
        state.files[first]=decoded;
        state.githubShas[first]=fd.sha;
        if(state.currentFile===first){
          $('codeEditor').value=decoded;
        }
      }else{
        $('codeEditor').value='// Click file to load content';
      }
    }else{
      $('codeEditor').value='// No files found';
    }
    renderFiles();
    toast('Sync success!');
  }catch(e){
    list.innerHTML='<div class="file-item" style="color:var(--bad)">⚠️ Error: '+escapeHtml(e.message)+'</div>';
    toast('Sync failed: '+e.message);
  }
}
async function askCoding(){var p=$('codePrompt').value.trim()||'Review dan tingkatkan kode ini';var code=$('codeEditor').value;nav('chat');$('input').value='';add('user','/code '+p);await aiChat('Anda adalah AI coding assistant. Task: '+p+'\\n\\nFile: '+$('fileName').value+'\\nKode saat ini:\\n'+code)}
async function syncAllData() {
  saveCurrent();
  var filesData = null;
  try {
    filesData = JSON.parse(localStorage.getItem('hermes_files') || 'null');
  } catch(e) {}
  if (!filesData) filesData = state.files || {};

  var payload = {
    files: filesData,
    messages: state.messages || [],
    currentFile: state.currentFile || '',
    settings: {
      theme: localStorage.getItem('hermes_theme'),
      font: localStorage.getItem('hermes_font'),
      api: localStorage.getItem('hermes_api'),
      token: localStorage.getItem('hermes_token') || '',
      model: localStorage.getItem('hermes_model')
    },
    ts: new Date().toISOString()
  };

  var syncStatus = $('syncStatus');
  if (syncStatus) syncStatus.textContent = 'Menghubungkan ke Workers KV...';

  try {
    var r = await fetch('/sync', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token()
      },
      body: JSON.stringify(payload)
    });
    var d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Sync failed');
    toast('Data berhasil disinkronkan ke Cloudflare KV!');
    if (syncStatus) syncStatus.textContent = 'Terakhir disinkronkan: ' + new Date().toLocaleTimeString();
    return d;
  } catch(e) {
    toast('Gagal sinkronisasi: ' + e.message);
    if (syncStatus) syncStatus.textContent = 'Gagal syncAllData: ' + e.message;
    throw e;
  }
}
async function pushSync(){
  var btnSyncPush=$('btnSyncPush');
  if(btnSyncPush) btnSyncPush.disabled=true;
  try{
    await syncAllData();
  }catch(e){}finally{
    if(btnSyncPush) btnSyncPush.disabled=false;
  }
}
async function pullSync(){
  var btnSyncPull=$('btnSyncPull');
  var syncStatus=$('syncStatus');
  if(!confirm('Apakah Anda yakin ingin me-restore data? Ini akan menimpa file, chat history, dan pengaturan saat ini.')) return;
  if(btnSyncPull) btnSyncPull.disabled=true;
  if(syncStatus) syncStatus.textContent='Mengunduh data dari KV...';
  try{
    var r=await fetch('/sync',{
      method:'GET',
      headers:{
        'Authorization':'Bearer '+token()
      }
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error||'Restore failed');
    if(d.empty){
      toast('Tidak ada data cadangan di KV.');
      if(syncStatus) syncStatus.textContent='Belum ada cadangan di KV.';
      return;
    }
    if(d.files)state.files=d.files;
    if(d.messages)state.messages=d.messages;
    if(d.currentFile)state.currentFile=d.currentFile;
    localStorage.setItem('hermes_files',JSON.stringify(state.files));
    if(d.settings){
      if(d.settings.theme){
        localStorage.setItem('hermes_theme',d.settings.theme);
        setTheme(d.settings.theme);
      }
      if(d.settings.font){
        localStorage.setItem('hermes_font',d.settings.font);
        document.documentElement.style.setProperty('--fs',d.settings.font);
        $('fontSelect').value=d.settings.font;
      }
      if(d.settings.api){
        localStorage.setItem('hermes_api',d.settings.api);
        $('apiUrl').value=d.settings.api;
      }
      if(d.settings.token){
        localStorage.setItem('hermes_token',d.settings.token);
        $('tokenInput').value=d.settings.token;
      }
      if(d.settings.model&&$('model')){
        localStorage.setItem('hermes_model',d.settings.model);
        $('model').value=d.settings.model;
      }
    }
    renderFiles();
    renderMessages();
    if($('fileName')&&$('codeEditor')){
      $('fileName').value=state.currentFile;
      $('codeEditor').value=state.files[state.currentFile]||'';
    }
    toast('Berhasil memulihkan data dari Workers KV!');
    if(syncStatus) syncStatus.textContent='Dipulihkan pada: '+new Date().toLocaleTimeString();
  }catch(e){
    toast('Gagal memulihkan: '+e.message);
    if(syncStatus) syncStatus.textContent='Gagal restore: '+e.message;
  }finally{
    if(btnSyncPull) btnSyncPull.disabled=false;
  }
}
async function loadLinks(kind){$('linksGrid').innerHTML='<div class="card">Loading...</div>';var path=kind==='skills'?'/skills':(kind.indexOf('hub/')===0?'/'+kind:'/link/'+kind);try{var r=await fetch(api()+path);var d=await r.json();var items=d.items||d.results||d.integrations||d.tools||d.skills||[];$('linksGrid').innerHTML='';items.slice(0,36).forEach(function(x){var name=x.displayName||x.name||x.slug||x.integration||'Item';var desc=x.summary||x.description||x.connectionLabel||'';var c=document.createElement('div');c.className='feature';c.innerHTML='<div class="big">🔹</div><h3>'+escapeHtml(name)+'</h3><p>'+escapeHtml(desc).slice(0,120)+'</p>';c.onclick=function(){nav('chat');$('input').value='Tell me about '+name;$('input').focus()};$('linksGrid').appendChild(c)});if(!items.length)$('linksGrid').innerHTML='<div class="card">No result.</div>'}catch(e){$('linksGrid').innerHTML='<div class="card">Error: '+escapeHtml(e.message)+'</div>'}}
async function refreshSolace(){$('solaceOutput').textContent='Loading...';try{var all=await Promise.all(['/solace/status','/solace/queues','/solace/service'].map(function(p){return fetch(api()+p).then(function(r){return r.json()}).catch(function(e){return{error:e.message}})}));$('solaceOutput').textContent=JSON.stringify({status:all[0],queues:all[1],service:all[2]},null,2)}catch(e){$('solaceOutput').textContent='Error: '+e.message}}
function autoSize(){$('input').style.height='auto';$('input').style.height=Math.min($('input').scrollHeight,150)+'px'}

var clerkObj=null;
async function initClerkLite(){try{var cfg=await fetch('/auth/clerk-config').then(function(r){return r.json()});if(!cfg.configured){$('clerkStatus').textContent='Clerk publishable key not configured';return}var sc=document.createElement('script');sc.async=true;sc.crossOrigin='anonymous';sc.setAttribute('data-clerk-publishable-key',cfg.publishableKey);sc.src='https://'+cfg.domain+'/npm/@clerk/clerk-js@5/dist/clerk.browser.js';sc.onload=function(){if(!window.Clerk){$('clerkStatus').textContent='Clerk script loaded but unavailable';return}window.Clerk.load().then(function(){clerkObj=window.Clerk;updateClerkUi();clerkObj.addListener(updateClerkUi)}).catch(function(e){$('clerkStatus').textContent='Clerk load error: '+e.message})};document.head.appendChild(sc)}catch(e){try{$('clerkStatus').textContent='Clerk init error: '+e.message}catch(_){}}}
function updateClerkUi(){try{var c=window.Clerk;if(!c||!$('clerkStatus'))return;if(c.user){var u=c.user;var email=(u.emailAddresses&&u.emailAddresses[0])?u.emailAddresses[0].emailAddress:'';var username=u.username||u.firstName||'';$('clerkStatus').textContent=JSON.stringify({signedIn:true,id:u.id,name:u.firstName||u.username||'User',email:email},null,2);
  var sel=$('model');
  if(sel&&(username==='ivansslo'||email==='ivansuselo@gmail.com')){
    if(!sel.querySelector('option[value="groq/deepseek-r1-distill-llama-70b"]')){
      var g1=document.createElement('option');g1.value='groq/deepseek-r1-distill-llama-70b';g1.textContent='Groq DeepSeek R1 70B';sel.appendChild(g1);
      var g2=document.createElement('option');g2.value='groq/deepseek-r1-distill-qwen-32b';g2.textContent='Groq DeepSeek R1 32B';sel.appendChild(g2);
      var g3=document.createElement('option');g3.value='groq/llama-3.3-70b-specdec';g3.textContent='Groq Llama 3.3 SpecDec';sel.appendChild(g3);
      var g4=document.createElement('option');g4.value='groq/qwen-2.5-coder-32b';g4.textContent='Groq Qwen 2.5 Coder 32B';sel.appendChild(g4);
    }
  }
  fetch('/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'clerk_signed_in',clerkUser:{id:u.id,email:email,name:u.firstName||u.username||''}})}).catch(function(){})}else{$('clerkStatus').textContent='Guest mode. Klik Login with Clerk untuk social login.'}}catch(e){}}
document.querySelectorAll('[data-view]').forEach(function(b){
  b.onclick=function(e){
    if(e.ctrlKey||e.metaKey||e.shiftKey) return;
    e.preventDefault();
    nav(b.getAttribute('data-view'));
  }
});
document.querySelectorAll('[data-cmd]').forEach(function(b){b.onclick=function(){$('input').value=b.getAttribute('data-cmd');$('input').focus();autoSize()}});document.querySelectorAll('[data-link]').forEach(function(b){b.onclick=function(){loadLinks(b.getAttribute('data-link'))}});
$('menuBtn').onclick=function(){$('sidebar').classList.toggle('open')};$('newChat').onclick=function(){state.messages=[];nav('chat');renderMessages()};$('themeBtn').onclick=cycleTheme;$('syncNowBtn').onclick=async function(){var btn=$('syncNowBtn');btn.disabled=true;var origText=btn.innerHTML;btn.innerHTML='<span style="font-size:14px;">🔄</span><span class="sync-text">Syncing...</span>';try{await syncAllData()}catch(e){}finally{btn.disabled=false;btn.innerHTML=origText}};$('send').onclick=send;$('input').oninput=autoSize;$('input').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};$('runCrawl').onclick=runCrawl;$('runCrew').onclick=runCrew;$('refreshSolace').onclick=refreshSolace;$('saveSettings').onclick=async function(){setTheme($('themeSelect').value);localStorage.setItem('hermes_font',$('fontSelect').value);document.documentElement.style.setProperty('--fs',$('fontSelect').value);localStorage.setItem('hermes_api',$('apiUrl').value.trim());if($('tokenInput').value.trim())localStorage.setItem('hermes_token',$('tokenInput').value.trim());toast('Settings tersimpan');try{await syncAllData()}catch(e){}};$('themeSelect').onchange=function(){setTheme(this.value)};$('fontSelect').onchange=function(){document.documentElement.style.setProperty('--fs',this.value);localStorage.setItem('hermes_font',this.value)};if($('model'))$('model').onchange=function(){localStorage.setItem('hermes_model',this.value)};$('syncGithub').onclick=syncGithubFiles;$('fileSearch').oninput=renderFiles;$('saveFile').onclick=saveGithubFile;$('btnSyncPush').onclick=pushSync;$('btnSyncPull').onclick=pullSync;$('askCode').onclick=askCoding;$('sendCodePrompt').onclick=askCoding;if($('clerkLogin'))$('clerkLogin').onclick=function(){if(clerkObj)clerkObj.openSignIn();else toast('Clerk loading...')};if($('clerkProfile'))$('clerkProfile').onclick=function(){if(clerkObj&&clerkObj.user)clerkObj.openUserProfile();else if(clerkObj)clerkObj.openSignIn();else toast('Clerk loading...')};
function routeFromHash(){
  var h=(location.hash||'').replace('#','');
  if(!h){
    var p=location.pathname.replace('/','');
    if(p==='crawl4ai') h='crawl';
    else if(p==='chat-live'||p==='chat') h='chat';
    else if(document.getElementById('view-'+p)) h=p;
  }
  if(h&&document.getElementById('view-'+h))nav(h);
}
window.addEventListener('hashchange',routeFromHash);
window.addEventListener('popstate',routeFromHash);
initSettings();try{var saved=JSON.parse(localStorage.getItem('hermes_files')||'null');if(saved)state.files=saved}catch(e){}renderFiles();renderMessages();routeFromHash();initClerkLite();updateHighlight();
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markdown.min.js"></script>
</body>
</html>
`;

var ZAPIER_HTML=`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zapier Template — Solace Hermes</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:#09090b;color:#fafafa;font-family:system-ui,sans-serif}.pg{max-width:980px;margin:0 auto;padding:22px}.hero,.card{background:#111827;border:1px solid #273244;border-radius:18px;padding:18px;margin-bottom:12px}.hero{background:linear-gradient(135deg,rgba(249,115,22,.14),rgba(139,92,246,.12)),#111827}h1{margin:0 0 6px}.muted{color:#94a3b8;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.step{border-left:3px solid #f97316;padding-left:12px;margin:12px 0}code,pre{background:#05070b;border:1px solid #273244;border-radius:12px;padding:10px;display:block;overflow:auto;color:#e2e8f0}.btn{border:0;border-radius:12px;background:linear-gradient(135deg,#f97316,#8b5cf6);color:white;padding:11px 14px;font-weight:700;text-decoration:none;display:inline-flex;margin-right:8px}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style></head><body><div class="pg"><div class="hero"><h1>⚡ Zapier Template Terbaik</h1><p class="muted">Clerk → Zapier → Solace Hermes: user event masuk ke Solace, optional AI welcome, optional CrewAI onboarding, lalu Notion/Gmail/Slack/Telegram notification.</p><a class="btn" href="/zapier/template" target="_blank">JSON Template</a><a class="btn" href="/chat">Chat</a><a class="btn" href="/integrations" target="_blank">Integrations</a></div><div class="grid"><div class="card"><h3>Trigger</h3><p class="muted">App: Clerk<br>Event: User Created / User Updated / Session Created</p><div class="step"><b>1. Normalize</b><p class="muted">Formatter by Zapier: id, email, name, username, image_url.</p></div><div class="step"><b>2. POST to Hermes</b><pre>POST /webhook/zapier
Authorization: Bearer &lt;TOKEN&gt;
{"action":"clerk_event","event_type":"user.created","email":"...","user":{...}}</pre></div></div><div class="card"><h3>Actions</h3><div class="step"><b>AI Welcome</b><pre>{"action":"chat","model":"llama-3.1-8b-instant","prompt":"Create welcome message..."}</pre></div><div class="step"><b>CrewAI Onboarding</b><pre>{"action":"crew","topic":"Onboard new user to Solace Hermes"}</pre></div><div class="step"><b>Notify / Notion</b><p class="muted">Gunakan Zapier connected apps atau action notify ke Hermes.</p></div></div></div><div class="card"><h3>Webhook URL</h3><pre>https://hermes-cloudflare.certveis.workers.dev/webhook/zapier</pre><p class="muted">Credential tetap di Zapier private fields dan Cloudflare Worker Secrets.</p></div></div></body></html>`;



var DASHBOARD_HTML=`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Realtime Dashboard — Solace Hermes</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden}
button,input,textarea,select{font:inherit}
:root{color-scheme:dark;--bg:#08090d;--bg2:#0d1117;--panel:#10151f;--panel2:#151b26;--elev:#1a2230;--border:#273244;--text:#f8fafc;--muted:#94a3b8;--soft:#cbd5e1;--accent:#10b981;--accent2:#f97316;--good:#10b981;--warn:#f59e0b;--bad:#ef4444;--code:#05070b;--shadow:0 24px 80px rgba(0,0,0,.35);--radius:18px;--fs:14px}
[data-theme="light"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}
@media(prefers-color-scheme:light){[data-theme="system"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}}
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at top left,rgba(16,185,129,.15),transparent 35%),radial-gradient(circle at bottom right,rgba(249,115,22,.12),transparent 38%),var(--bg);color:var(--text);font-size:var(--fs)}
.app{height:100dvh;display:grid;grid-template-columns:278px 1fr;padding:12px;gap:12px}
.sidebar{background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02)),var(--panel);border:1px solid var(--border);border-radius:24px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-width:0;overflow:hidden}
.brand{padding:18px 16px 14px;display:flex;align-items:center;gap:12px}
.logo{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;box-shadow:0 14px 40px rgba(16,185,129,.25)}
.brand h1{margin:0;font-size:16px;letter-spacing:-.02em}
.brand p{margin:2px 0 0;color:var(--muted);font-size:11px}
.status-dot{width:9px;height:9px;border-radius:999px;background:var(--good);box-shadow:0 0 14px var(--good);margin-left:auto}
.new-chat{margin:0 14px 12px;border:0;border-radius:16px;padding:12px 14px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:700;cursor:pointer}
.nav{padding:4px 10px;display:flex;flex-direction:column;gap:6px;overflow:auto}
.nav button,.nav a{border:1px solid transparent;background:transparent;color:var(--muted);border-radius:16px;padding:11px 12px;text-align:left;display:flex;gap:10px;align-items:center;cursor:pointer;text-decoration:none}
.nav button:hover,.nav a:hover{background:var(--panel2);color:var(--text);border-color:var(--border)}
.nav button.active,.nav a.active{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(249,115,22,.14));border-color:rgba(16,185,129,.35);color:var(--text)}
.nav .ico{width:24px;height:24px;border-radius:10px;background:var(--elev);display:grid;place-items:center}
.side-foot{margin-top:auto;padding:14px;border-top:1px solid var(--border);display:grid;gap:10px}
.mini-card{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:12px}
.mini-card b{display:block;font-size:12px}
.mini-card span{display:block;color:var(--muted);font-size:11px;margin-top:4px}
.layout{min-width:0;display:grid;grid-template-rows:auto 1fr auto;background:rgba(16,21,31,.58);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);backdrop-filter:blur(18px)}
.topbar{height:64px;padding:0 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(16,21,31,.72)}
.menu-btn{display:none}
.title{min-width:0}
.title h2{font-size:15px;margin:0}
.title p{font-size:11px;color:var(--muted);margin:3px 0 0}
.spacer{flex:1}
.pill,.select,select{background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:9px 10px}
.select{max-width:230px}
.icon-btn{border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:14px;padding:9px 11px;cursor:pointer}
.main{min-height:0;overflow:hidden;position:relative}
.toast{position:fixed;right:18px;bottom:18px;background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:12px 14px;box-shadow:var(--shadow);display:none;z-index:20}
.toast.on{display:block}
.mobile-tabs{display:none}
@media(max-width:860px){
  .app{grid-template-columns:1fr;padding:0;gap:0}
  .sidebar{position:fixed;z-index:30;left:10px;top:10px;bottom:10px;width:min(310px,86vw);transform:translateX(-115%);transition:.2s}
  .sidebar.open{transform:none}
  .layout{border-radius:0;border:0;height:100dvh}
  .menu-btn{display:block}
  .topbar{height:58px;padding:0 10px}
  .select{max-width:150px}
  .mobile-tabs{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:9;background:rgba(16,21,31,.92);border:1px solid var(--border);border-radius:20px;padding:6px;gap:4px;backdrop-filter:blur(12px);overflow-x:auto;-webkit-overflow-scrolling:touch}.mobile-tabs::-webkit-scrollbar{display:none}
  .mobile-tabs button,.mobile-tabs a{flex:1;flex-shrink:0;min-width:38px;border:0;background:transparent;color:var(--muted);border-radius:15px;padding:8px 4px;text-decoration:none;text-align:center}
  .mobile-tabs button.active,.mobile-tabs a.active{background:var(--panel2);color:var(--text)}
}

/* Dashboard specific styles below */
.hero,.card{background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01)),var(--panel);border:1px solid var(--border);border-radius:20px;padding:18px;margin-bottom:12px;box-shadow:0 18px 60px rgba(0,0,0,.25)}
.pg{max-width:1220px;margin:0 auto;padding:22px}
.hero{display:flex;gap:16px;align-items:center;justify-content:space-between;background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(249,115,22,.1)),var(--panel)}
.logo-dash{width:54px;height:54px;border-radius:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:26px}
.muted{color:var(--muted);line-height:1.55}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.stat b{font-size:28px}
.stat span{display:block;color:var(--muted);font-size:12px}
.ok{color:var(--good)}
.bad{color:var(--bad)}
.warn{color:var(--warn)}
.btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;padding:10px 13px;text-decoration:none;font-weight:700;display:inline-flex;margin:4px;cursor:pointer}
.btn2{background:var(--panel2);border:1px solid var(--border);color:var(--text)}
.item{padding:10px;border-radius:12px;background:var(--panel2);border:1px solid var(--border);margin:7px 0}
.item b{display:block}
.pill{font-size:11px;border-radius:999px;padding:3px 8px;background:var(--elev);color:var(--text)}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
pre{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:14px;padding:12px;overflow:auto;white-space:pre-wrap;max-height:360px}
.qgrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
@media(max-width:900px){.grid,.grid2,.qgrid{grid-template-columns:1fr}.hero{display:block}}
</style>
</head>
<body data-theme="system">
<div class="app">
  <aside class="sidebar" id="sidebar">
    <div class="brand"><div class="logo">⚡</div><div><h1>Solace Hermes</h1><p>Codex-style mobile AI hub</p></div><span class="status-dot" id="liveDot"></span></div>
    <button class="new-chat" onclick="location.href='/chat-live'">＋ New Chat</button>
        <nav class="nav" id="nav">
      <a data-view="dashboard" href="/dashboard"><span class="ico">🏠</span><span>Realtime Dashboard</span></a>
      <a data-view="chat" href="/chat-live"><span class="ico">💬</span><span>Chat-Live</span></a>
      <a data-view="coding" href="/coding"><span class="ico">⌘</span><span>AI Coding</span></a>
      <a data-view="crawl" href="/crawl4ai"><span class="ico">🕷️</span><span>Crawl4AI</span></a>
      <a data-view="crew" href="/crew"><span class="ico">🤖</span><span>CrewAI</span></a>
      <a data-view="links" href="/links"><span class="ico">🔗</span><span>Links Hub</span></a>
      <a href="/integrations" target="_blank"><span class="ico">🧩</span><span>Integrations</span></a>
      <a data-view="solace" href="/solace"><span class="ico">📡</span><span>Solace Status</span></a>
      <a data-view="zapier" href="/zapier"><span class="ico">⚡</span><span>Zapier Template</span></a>
      <a data-view="logs" href="/logs"><span class="ico">📜</span><span>Activity Logs</span></a>
      <a data-view="settings" href="/settings"><span class="ico">⚙️</span><span>Settings</span></a>
      <a data-view="profile" href="/profile"><span class="ico">👤</span><span>Profile</span></a>
    </nav>
    <div class="side-foot"><div class="mini-card"><b>Command cepat</b><span>/crawl URL · /code task · /crew topic · /help</span></div><div class="mini-card"><b>Theme</b><span>System, dark, light + ukuran font</span></div></div>
  </aside>
  <section class="layout">
    <header class="topbar">
      <button class="icon-btn menu-btn" id="menuBtn" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
      <div class="title">
        <h2 id="viewTitle">Realtime Dashboard</h2>
        <p id="viewDesc">Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh.</p>
      </div>
      <div class="spacer"></div>
      <button class="icon-btn" id="syncNowBtn" title="Sync Now" style="display:flex;align-items:center;gap:6px;"><span style="font-size:14px;">☁️</span><span class="sync-text">Sync Now</span></button>
      <button class="icon-btn" id="themeBtn" onclick="cycleTheme()">🌓</button>
    </header>
    <main class="main" style="overflow: auto;">
      <div class="pg">
        <div class="hero">
          <div class="row">
            <div class="logo-dash">⚡</div>
            <div>
              <h1 style="margin:0">Solace Hermes Realtime Dashboard</h1>
              <div class="muted">Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh, dan semua integrasi.</div>
            </div>
          </div>
          <div>
            <button class="btn" onclick="load()">Refresh</button>
            <a class="btn btn2" href="/chat-live">Chat-Live</a>
          </div>
        </div>
        <div class="qgrid">
          <a class="btn" href="/chat-live">💬 Chat-Live</a>
          <a class="btn" href="/crawl4ai">🕷️ Crawl4AI</a>
          <a class="btn" href="/crew">🤖 CrewAI</a>
          <a class="btn" href="/zapier">⚡ Zapier</a>
          <a class="btn" href="/logs">📜 Logs</a>
          <a class="btn btn2" href="/api" target="_blank">🔌 API</a>
          <a class="btn btn2" href="/integrations" target="_blank">🧩 Integrations</a>
          <a class="btn btn2" href="https://rocspace-links.certveis.workers.dev" target="_blank">🔗 Hub</a>
          <a class="btn btn2" href="/solace/status" target="_blank">📡 Solace</a>
          <a class="btn btn2" href="https://cf-ai.certveis.workers.dev" target="_blank">🎨 CF AI</a>
          <a class="btn btn2" href="https://github.com/ivansslo/roadfx-ai-stack" target="_blank">📦 GitHub</a>
        </div>
        <div class="grid" id="stats"></div>
        <div class="grid2">
          <div class="card">
            <h3>Components</h3>
            <div id="components" class="muted">Loading...</div>
          </div>
          <div class="card">
            <h3>Providers</h3>
            <div id="providers" class="muted">Loading...</div>
          </div>
        </div>
        <div class="grid2">
          <div class="card">
            <h3>Solace Queues</h3>
            <div id="queues" class="muted">Loading...</div>
          </div>
          <div class="card">
            <h3>Recent Server Logs</h3>
            <div class="row">
              <input id="token" type="password" placeholder="TOKEN Worker" style="background:var(--panel2);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:9px">
              <button class="btn btn2" onclick="loadLogs()">Load Protected Logs</button>
            </div>
            <pre id="logs">Loading public status...</pre>
          </div>
        </div>
        <div class="card">
          <h3>Raw Dashboard Status</h3>
          <pre id="raw">Loading...</pre>
        </div>
      </div>
    </main>
  </section>
</div>
<div class="mobile-tabs" id="mobileTabs"><a data-view="dashboard" href="/chat-live#dashboard" class="active">🏠</a><a data-view="chat" href="/chat-live">💬</a><a data-view="coding" href="/chat-live#coding">⌘</a><a data-view="crawl" href="/chat-live#crawl">🕷️</a><a data-view="crew" href="/chat-live#crew">🤖</a><a data-view="links" href="/chat-live#links">🔗</a><a href="/integrations" target="_blank">🧩</a><a data-view="solace" href="/chat-live#solace">📡</a><a data-view="zapier" href="/chat-live#zapier">⚡</a><a data-view="logs" href="/chat-live#logs">📜</a><a data-view="settings" href="/chat-live#settings">⚙️</a><a data-view="profile" href="/chat-live#profile">👤</a></div>
<script>
var state={files:{},currentFile:'',messages:[]};
function cls(s){return s==='connected'||s==='active'||s==='running'||s===true?'ok':(s==='unknown'?'warn':'bad')}
function stat(k,v){return '<div class="card stat"><b>'+v+'</b><span>'+k+'</span></div>'}
async function load(){
  try{
    var d=await fetch('/dashboard/status').then(r=>r.json());
    window.last=d;
    document.getElementById('stats').innerHTML=stat('Version',d.version)+stat('Models',d.counts.models+' + '+d.counts.cf_ai_models)+stat('Integrations',d.counts.integrations)+stat('Queues',d.counts.queues)+stat('Workers',Object.keys(d.workers).length)+stat('Components',d.counts.components)+stat('Endpoints',d.counts.endpoints)+stat('Solace',d.solace.status);
    document.getElementById('components').innerHTML=d.components.map(x=>'<div class="item"><b>'+x.component+' <span class="pill '+cls(x.status)+'">'+x.status+'</span></b><span>'+x.detail+'</span></div>').join('');
    document.getElementById('providers').innerHTML=Object.keys(d.providers).map(k=>'<div class="item"><b>'+k+' <span class="pill '+cls(d.providers[k])+'">'+(d.providers[k]?'configured':'missing')+'</span></b></div>').join('');
    document.getElementById('queues').innerHTML=(d.queues||[]).map(q=>'<div class="item"><b>'+q.name+'</b><span>spool '+q.spoolUsage+' · binds '+q.bindCount+' · in '+q.msgCountIn+' · out '+q.msgCountOut+'</span></div>').join('')||'<span class="muted">No queue data</span>';
    document.getElementById('logs').textContent=JSON.stringify(d.logs||{},null,2);
    document.getElementById('raw').textContent=JSON.stringify(d,null,2)
  }catch(e){
    document.getElementById('raw').textContent='Error: '+e.message
  }
}
function t(){
  var v=document.getElementById('token').value||localStorage.getItem('hermes_token')||prompt('TOKEN Worker')||'';
  if(v)localStorage.setItem('hermes_token',v);
  return v
}
async function loadLogs(){
  var out=document.getElementById('logs');
  out.textContent='Loading...';
  try{
    var r=await fetch('/logs/list?limit=25',{headers:{Authorization:'Bearer '+t()}});
    out.textContent=JSON.stringify(await r.json(),null,2)
  }catch(e){
    out.textContent='Error: '+e.message
  }
}
function setTheme(t){document.body.setAttribute('data-theme',t);localStorage.setItem('hermes_theme',t)}
function cycleTheme(){var a=['system','dark','light'];var c=document.body.getAttribute('data-theme')||'system';setTheme(a[(a.indexOf(c)+1)%a.length])}
function updateHighlight(){
  var editor=$('codeEditor');
  var code=$('highlightCode');
  var layer=$('highlightLayer');
  if(!editor||!code)return;
  var val=editor.value;
  if(val.endsWith('\\n')) val+=' ';
  code.innerHTML=escapeHtml(val);
  var ext=($('fileName').value||'').split('.').pop();
  var lang='javascript';
  if(ext==='py')lang='python';else if(ext==='css')lang='css';else if(ext==='html')lang='html';else if(ext==='json')lang='json';else if(ext==='md')lang='markdown';
  code.className='language-'+lang;
  if(window.Prism) Prism.highlightElement(code);
}
function syncScroll(){
  var editor=$('codeEditor');
  var layer=$('highlightLayer');
  if(!editor||!layer)return;
  layer.scrollTop=editor.scrollTop;
  layer.scrollLeft=editor.scrollLeft;
}
function toast(m){console.log('Toast:',m)}
async function syncAllData() {
  var filesData = null;
  try {
    filesData = JSON.parse(localStorage.getItem('hermes_files') || 'null');
  } catch(e) {}
  if (!filesData) filesData = state.files || {};

  var payload = {
    files: filesData,
    messages: state.messages || [],
    currentFile: state.currentFile || '',
    settings: {
      theme: localStorage.getItem('hermes_theme'),
      font: localStorage.getItem('hermes_font'),
      api: localStorage.getItem('hermes_api'),
      token: localStorage.getItem('hermes_token') || '',
      model: localStorage.getItem('hermes_model')
    },
    ts: new Date().toISOString()
  };

  try {
    var r = await fetch('/sync', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + t()
      },
      body: JSON.stringify(payload)
    });
    var d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Sync failed');
    toast('Data disinkronkan!');
    return d;
  } catch(e) {
    toast('Gagal sinkronisasi: ' + e.message);
    throw e;
  }
}
async function initClerkLite(){try{var cfg=await fetch('/auth/clerk-config').then(function(r){return r.json()});if(!cfg.configured)return;var sc=document.createElement('script');sc.async=true;sc.crossOrigin='anonymous';sc.setAttribute('data-clerk-publishable-key',cfg.publishableKey);sc.src='https://'+cfg.domain+'/npm/@clerk/clerk-js@5/dist/clerk.browser.js';sc.onload=function(){if(!window.Clerk)return;window.Clerk.load().then(function(){clerkObj=window.Clerk}).catch(function(e){})};document.head.appendChild(sc)}catch(e){}}

document.getElementById('syncNowBtn').onclick=async function(){
  var btn=this;
  btn.disabled=true;
  var origText=btn.innerHTML;
  btn.innerHTML='<span style="font-size:14px;">🔄</span><span class="sync-text">Syncing...</span>';
  try{await syncAllData()}catch(e){}finally{btn.disabled=false;btn.innerHTML=origText}
};

setTheme(localStorage.getItem('hermes_theme')||'system');
load();
initClerkLite();
setInterval(load,15000);
</script>
</body>
</html>`;

var LOGS_HTML=`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Activity Logs — Solace Hermes</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden}
button,input,textarea,select{font:inherit}
:root{color-scheme:dark;--bg:#08090d;--bg2:#0d1117;--panel:#10151f;--panel2:#151b26;--elev:#1a2230;--border:#273244;--text:#f8fafc;--muted:#94a3b8;--soft:#cbd5e1;--accent:#10b981;--accent2:#f97316;--good:#10b981;--warn:#f59e0b;--bad:#ef4444;--code:#05070b;--shadow:0 24px 80px rgba(0,0,0,.35);--radius:18px;--fs:14px}
[data-theme="light"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}
@media(prefers-color-scheme:light){[data-theme="system"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}}
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at top left,rgba(16,185,129,.15),transparent 35%),radial-gradient(circle at bottom right,rgba(249,115,22,.12),transparent 38%),var(--bg);color:var(--text);font-size:var(--fs)}
.app{height:100dvh;display:grid;grid-template-columns:278px 1fr;padding:12px;gap:12px}
.sidebar{background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02)),var(--panel);border:1px solid var(--border);border-radius:24px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-width:0;overflow:hidden}
.brand{padding:18px 16px 14px;display:flex;align-items:center;gap:12px}
.logo{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;box-shadow:0 14px 40px rgba(16,185,129,.25)}
.brand h1{margin:0;font-size:16px;letter-spacing:-.02em}
.brand p{margin:2px 0 0;color:var(--muted);font-size:11px}
.status-dot{width:9px;height:9px;border-radius:999px;background:var(--good);box-shadow:0 0 14px var(--good);margin-left:auto}
.new-chat{margin:0 14px 12px;border:0;border-radius:16px;padding:12px 14px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:700;cursor:pointer}
.nav{padding:4px 10px;display:flex;flex-direction:column;gap:6px;overflow:auto}
.nav button,.nav a{border:1px solid transparent;background:transparent;color:var(--muted);border-radius:16px;padding:11px 12px;text-align:left;display:flex;gap:10px;align-items:center;cursor:pointer;text-decoration:none}
.nav button:hover,.nav a:hover{background:var(--panel2);color:var(--text);border-color:var(--border)}
.nav button.active,.nav a.active{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(249,115,22,.14));border-color:rgba(16,185,129,.35);color:var(--text)}
.nav .ico{width:24px;height:24px;border-radius:10px;background:var(--elev);display:grid;place-items:center}
.side-foot{margin-top:auto;padding:14px;border-top:1px solid var(--border);display:grid;gap:10px}
.mini-card{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:12px}
.mini-card b{display:block;font-size:12px}
.mini-card span{display:block;color:var(--muted);font-size:11px;margin-top:4px}
.layout{min-width:0;display:grid;grid-template-rows:auto 1fr auto;background:rgba(16,21,31,.58);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);backdrop-filter:blur(18px)}
.topbar{height:64px;padding:0 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(16,21,31,.72)}
.menu-btn{display:none}
.title{min-width:0}
.title h2{font-size:15px;margin:0}
.title p{font-size:11px;color:var(--muted);margin:3px 0 0}
.spacer{flex:1}
.pill,.select,select{background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:9px 10px}
.select{max-width:230px}
.icon-btn{border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:14px;padding:9px 11px;cursor:pointer}
.main{min-height:0;overflow:hidden;position:relative}
.toast{position:fixed;right:18px;bottom:18px;background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:12px 14px;box-shadow:var(--shadow);display:none;z-index:20}
.toast.on{display:block}
.mobile-tabs{display:none}
@media(max-width:860px){
  .app{grid-template-columns:1fr;padding:0;gap:0}
  .sidebar{position:fixed;z-index:30;left:10px;top:10px;bottom:10px;width:min(310px,86vw);transform:translateX(-115%);transition:.2s}
  .sidebar.open{transform:none}
  .layout{border-radius:0;border:0;height:100dvh}
  .menu-btn{display:block}
  .topbar{height:58px;padding:0 10px}
  .select{max-width:150px}
  .mobile-tabs{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:9;background:rgba(16,21,31,.92);border:1px solid var(--border);border-radius:20px;padding:6px;gap:4px;backdrop-filter:blur(12px);overflow-x:auto;-webkit-overflow-scrolling:touch}.mobile-tabs::-webkit-scrollbar{display:none}
  .mobile-tabs button,.mobile-tabs a{flex:1;flex-shrink:0;min-width:38px;border:0;background:transparent;color:var(--muted);border-radius:15px;padding:8px 4px;text-decoration:none;text-align:center}
  .mobile-tabs button.active,.mobile-tabs a.active{background:var(--panel2);color:var(--text)}
}

/* Logs specific styles below */
.pg{max-width:1100px;margin:0 auto;padding:22px}
.hero-logs,.card-logs{background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:18px;margin-bottom:12px}
.hero-logs{background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(249,115,22,.1)),var(--panel)}
.muted{color:var(--muted);line-height:1.6}
.btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;padding:10px 13px;text-decoration:none;font-weight:700;display:inline-flex;margin:4px;cursor:pointer}
input,select{background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:12px;padding:10px}
pre{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:14px;padding:12px;overflow:auto;white-space:pre-wrap}
.log{border-left:3px solid var(--accent);padding:10px;margin:8px 0;background:var(--panel2);border-radius:10px}
.log b{color:var(--accent2)}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
</style>
</head>
<body data-theme="system">
<div class="app">
  <aside class="sidebar" id="sidebar">
    <div class="brand"><div class="logo">⚡</div><div><h1>Solace Hermes</h1><p>Codex-style mobile AI hub</p></div><span class="status-dot" id="liveDot"></span></div>
    <button class="new-chat" onclick="location.href='/chat-live'">＋ New Chat</button>
        <nav class="nav" id="nav">
      <a data-view="dashboard" href="/chat-live#dashboard"><span class="ico">🏠</span><span>Realtime Dashboard</span></a>
      <a data-view="chat" href="/chat-live"><span class="ico">💬</span><span>Chat-Live</span></a>
      <a data-view="coding" href="/chat-live#coding"><span class="ico">⌘</span><span>AI Coding</span></a>
      <a data-view="crawl" href="/chat-live#crawl"><span class="ico">🕷️</span><span>Crawl4AI Page</span></a>
      <a data-view="crew" href="/chat-live#crew"><span class="ico">🤖</span><span>CrewAI Page</span></a>
      <a data-view="links" href="/chat-live#links"><span class="ico">🔗</span><span>Links Hub</span></a>
      <a href="/integrations" target="_blank"><span class="ico">🧩</span><span>Integrations JSON</span></a>
      <a data-view="solace" href="/chat-live#solace"><span class="ico">📡</span><span>Solace Status</span></a>
      <a data-view="zapier" href="/chat-live#zapier"><span class="ico">⚡</span><span>Zapier Template</span></a>
      <a href="/logs" class="active"><span class="ico">📜</span><span>Activity Logs</span></a>
      <a data-view="settings" href="/chat-live#settings"><span class="ico">⚙️</span><span>Settings</span></a>
      <a data-view="profile" href="/chat-live#profile"><span class="ico">👤</span><span>Profile</span></a>
    </nav>
    <div class="side-foot"><div class="mini-card"><b>Command cepat</b><span>/crawl URL · /code task · /crew topic · /help</span></div><div class="mini-card"><b>Theme</b><span>System, dark, light + ukuran font</span></div></div>
  </aside>
  <section class="layout">
    <header class="topbar">
      <button class="icon-btn menu-btn" id="menuBtn" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
      <div class="title">
        <h2 id="viewTitle">Activity Logs</h2>
        <p id="viewDesc">Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client.</p>
      </div>
      <div class="spacer"></div>
      <button class="icon-btn" id="themeBtn" onclick="cycleTheme()">🌓</button>
    </header>
    <main class="main" style="overflow: auto;">
      <div class="pg">
        <div class="hero-logs">
          <h1>📜 Solace Hermes Activity Logs</h1>
          <p class="muted">Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client. Server logs dikirim ke Cloudflare console + Solace topics <code>hermes/log/*</code>. Jika KV binding <code>LOGS</code> tersedia, endpoint /logs/list juga menampilkan server logs.</p>
          <a class="btn" href="/chat-live">Chat-Live</a>
          <a class="btn" href="/crawl4ai">Crawl4AI</a>
          <a class="btn" href="/zapier">Zapier</a>
          <a class="btn" href="/integrations" target="_blank">Integrations</a>
        </div>
        <div class="card-logs">
          <h3>Server Logs</h3>
          <div class="row">
            <input id="token" type="password" placeholder="TOKEN Worker">
            <input id="type" placeholder="filter type: crawl4ai.success">
            <button class="btn" onclick="loadServer()">Load /logs/list</button>
            <button class="btn" onclick="tailHint()">Tail command</button>
          </div>
          <pre id="server">Klik Load untuk mencoba membaca KV logs. Tanpa KV, gunakan Cloudflare Workers Logs atau Solace queue hermes/events.</pre>
        </div>
        <div class="card-logs">
          <h3>Client Logs Browser Ini</h3>
          <div class="row">
            <button class="btn" onclick="loadClient()">Refresh Client Logs</button>
            <button class="btn" onclick="localStorage.removeItem('hermes_client_logs');loadClient()">Clear Client Logs</button>
          </div>
          <div id="client"></div>
        </div>
      </div>
    </main>
  </section>
</div>
<div class="mobile-tabs" id="mobileTabs"><a data-view="dashboard" href="/chat-live#dashboard">🏠</a><a data-view="chat" href="/chat-live">💬</a><a data-view="coding" href="/chat-live#coding">⌘</a><a data-view="crawl" href="/chat-live#crawl">🕷️</a><a data-view="crew" href="/chat-live#crew">🤖</a><a data-view="links" href="/chat-live#links">🔗</a><a href="/integrations" target="_blank">🧩</a><a data-view="solace" href="/chat-live#solace">📡</a><a data-view="zapier" href="/chat-live#zapier">⚡</a><a data-view="logs" href="/chat-live#logs" class="active">📜</a><a data-view="settings" href="/chat-live#settings">⚙️</a><a data-view="profile" href="/chat-live#profile">👤</a></div>
<script>
function t(){
  var v=document.getElementById('token').value||localStorage.getItem('hermes_token')||prompt('TOKEN Worker')||'';
  if(v)localStorage.setItem('hermes_token',v);
  return v
}
async function loadServer(){
  var out=document.getElementById('server');
  out.textContent='Loading...';
  try{
    var type=document.getElementById('type').value;
    var r=await fetch('/logs/list?limit=100'+(type?'&type='+encodeURIComponent(type):''),{headers:{Authorization:'Bearer '+t()}});
    out.textContent=JSON.stringify(await r.json(),null,2)
  }catch(e){
    out.textContent='Error: '+e.message
  }
}
function tailHint(){
  document.getElementById('server').textContent='wrangler tail hermes-cloudflare --format pretty\\n\\nSolace topic prefix: hermes/log/*\\nImportant types: crawl4ai.start, crawl4ai.success, ai.chat, zapier.webhook, solace.task, notify, ui.nav, chat.send'
}
function loadClient(){
  var el=document.getElementById('client');
  var a=[];
  try{
    a=JSON.parse(localStorage.getItem('hermes_client_logs')||'[]')
  }catch(e){}
  el.innerHTML=a.length?a.slice(0,100).map(function(x){
    return '<div class="log"><b>'+x.type+'</b> <span class="muted">'+x.ts+'</span><pre>'+JSON.stringify(x.data,null,2)+'</pre></div>'
  }).join(''):'<p class="muted">Belum ada client logs di browser ini.</p>'
}
function setTheme(t){document.body.setAttribute('data-theme',t);localStorage.setItem('hermes_theme',t)}
function cycleTheme(){var a=['system','dark','light'];var c=document.body.getAttribute('data-theme')||'system';setTheme(a[(a.indexOf(c)+1)%a.length])}
setTheme(localStorage.getItem('hermes_theme')||'system');
loadClient();
</script>
</body>
</html>`;

var CHAT_HTML=`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Solace Hermes AI</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden}button,input,textarea,select{font:inherit}
:root{color-scheme:dark;--bg:#08090d;--bg2:#0d1117;--panel:#10151f;--panel2:#151b26;--elev:#1a2230;--border:#273244;--text:#f8fafc;--muted:#94a3b8;--soft:#cbd5e1;--accent:#10b981;--accent2:#f97316;--good:#10b981;--warn:#f59e0b;--bad:#ef4444;--code:#05070b;--shadow:0 24px 80px rgba(0,0,0,.35);--radius:18px;--fs:14px}
[data-theme="light"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}
@media(prefers-color-scheme:light){[data-theme="system"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}}
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at top left,rgba(16,185,129,.15),transparent 35%),radial-gradient(circle at bottom right,rgba(249,115,22,.12),transparent 38%),var(--bg);color:var(--text);font-size:var(--fs)}
.app{height:100dvh;display:grid;grid-template-columns:278px 1fr;padding:12px;gap:12px}.sidebar{background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02)),var(--panel);border:1px solid var(--border);border-radius:24px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-width:0;overflow:hidden}.brand{padding:18px 16px 14px;display:flex;align-items:center;gap:12px}.logo{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;box-shadow:0 14px 40px rgba(16,185,129,.25)}.brand h1{margin:0;font-size:16px;letter-spacing:-.02em}.brand p{margin:2px 0 0;color:var(--muted);font-size:11px}.status-dot{width:9px;height:9px;border-radius:999px;background:var(--good);box-shadow:0 0 14px var(--good);margin-left:auto}.new-chat{margin:0 14px 12px;border:0;border-radius:16px;padding:12px 14px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:700;cursor:pointer}.nav{padding:4px 10px;display:flex;flex-direction:column;gap:6px;overflow:auto}.nav button,.nav a{border:1px solid transparent;background:transparent;color:var(--muted);border-radius:16px;padding:11px 12px;text-align:left;display:flex;gap:10px;align-items:center;cursor:pointer;text-decoration:none}.nav button:hover,.nav a:hover{background:var(--panel2);color:var(--text);border-color:var(--border)}.nav button.active,.nav a.active{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(249,115,22,.14));border-color:rgba(16,185,129,.35);color:var(--text)}.nav .ico{width:24px;height:24px;border-radius:10px;background:var(--elev);display:grid;place-items:center}.side-foot{margin-top:auto;padding:14px;border-top:1px solid var(--border);display:grid;gap:10px}.mini-card{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:12px}.mini-card b{display:block;font-size:12px}.mini-card span{display:block;color:var(--muted);font-size:11px;margin-top:4px}.layout{min-width:0;display:grid;grid-template-rows:auto 1fr auto;background:rgba(16,21,31,.58);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);backdrop-filter:blur(18px)}.topbar{height:64px;padding:0 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(16,21,31,.72)}.menu-btn{display:none}.title{min-width:0}.title h2{font-size:15px;margin:0}.title p{font-size:11px;color:var(--muted);margin:3px 0 0}.spacer{flex:1}.pill,.select,select{background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:9px 10px}.select{max-width:230px}.icon-btn{border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:14px;padding:9px 11px;cursor:pointer}.main{min-height:0;overflow:hidden;position:relative}.view{height:100%;display:none;overflow:auto;padding:18px}.view.active{display:block}.chat-view{padding:0;display:none;grid-template-rows:1fr}.chat-view.active{display:grid}.messages{overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}.welcome{max-width:1050px;margin:0 auto;padding:18px 0 120px}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;margin-bottom:16px}.hero-card,.card{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025)),var(--panel);border:1px solid var(--border);border-radius:22px;padding:18px}.hero-card h2{font-size:34px;line-height:1;margin:4px 0 10px;letter-spacing:-.04em}.grad{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}.hero-card p{color:var(--muted);line-height:1.6;margin:0}.quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.quick button,.primary{border:0;border-radius:14px;padding:10px 12px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-weight:700;cursor:pointer}.secondary{border:1px solid var(--border);border-radius:14px;padding:10px 12px;background:var(--panel2);color:var(--text);cursor:pointer}.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.stat b{font-size:24px}.stat span{display:block;color:var(--muted);font-size:11px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.feature{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:15px;cursor:pointer;transition:.16s}.feature:hover{transform:translateY(-2px);border-color:rgba(79,140,255,.45)}.feature .big{font-size:26px}.feature h3{margin:10px 0 6px;font-size:14px}.feature p{margin:0;color:var(--muted);font-size:12px;line-height:1.5}.msg{max-width:min(820px,86%);padding:12px 14px;border-radius:18px;line-height:1.6;white-space:pre-wrap;word-break:break-word}.msg.user{align-self:flex-end;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border-bottom-right-radius:6px}.msg.ai{align-self:flex-start;background:var(--panel);border:1px solid var(--border);border-bottom-left-radius:6px}.msg.system{align-self:center;max-width:92%;color:var(--muted);font-size:12px;text-align:center}.msg pre{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:14px;padding:12px;overflow:auto}.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--panel2);color:var(--muted);border-radius:999px;padding:5px 9px;font-size:11px;margin-bottom:8px}.composer{border-top:1px solid var(--border);padding:10px;background:rgba(16,21,31,.78)}.cmds{display:flex;gap:6px;overflow:auto;padding:0 2px 8px}.cmds button{white-space:nowrap;border:1px solid var(--border);background:var(--panel);color:var(--muted);border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer}.input-row{display:flex;gap:8px;align-items:flex-end}.input-row textarea{flex:1;resize:none;min-height:46px;max-height:150px;background:var(--panel);border:1px solid var(--border);border-radius:18px;color:var(--text);padding:13px 14px;outline:0}.input-row textarea:focus{border-color:var(--accent)}.send{width:48px;height:46px;border:0;border-radius:16px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:900;cursor:pointer}.page{max-width:1100px;margin:0 auto}.page h2{margin:2px 0 6px;font-size:26px}.page>p{color:var(--muted);margin-top:0}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form{display:grid;gap:10px}.form input,.form textarea,.form select{width:100%;background:var(--panel2);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:12px;outline:0}.output{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:16px;padding:12px;min-height:220px;overflow:auto;white-space:pre-wrap}.code-shell{height:100%;display:grid;grid-template-columns:270px 1fr;gap:12px}.files{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:14px;overflow:auto}.editor{background:var(--panel);border:1px solid var(--border);border-radius:20px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}.editor-head{padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center}.editor textarea{width:100%;height:100%;resize:none;border:0;outline:0;background:var(--code);color:#e2e8f0;padding:14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55}.editor-foot{padding:10px;border-top:1px solid var(--border);display:flex;gap:8px}.file-item{padding:9px;border-radius:12px;color:var(--muted);cursor:pointer}.file-item:hover,.file-item.active{background:var(--panel2);color:var(--text)}
.editor-container{position:relative;width:100%;height:100%;overflow:hidden;background:var(--code)}
.editor-highlight,.editor-textarea{position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:14px;border:0;outline:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55;white-space:pre;overflow:auto;tab-size:2}
.editor-textarea{color:transparent;background:transparent;caret-color:var(--text);z-index:2;resize:none}
.editor-highlight{z-index:1;pointer-events:none;background:transparent}
.editor-highlight code{font-family:inherit;font-size:inherit;line-height:inherit;background:transparent!important;padding:0!important}
.toast{position:fixed;right:18px;bottom:18px;background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:12px 14px;box-shadow:var(--shadow);display:none;z-index:20}.toast.on{display:block}.mobile-tabs{display:none}
@media(max-width:860px){.app{grid-template-columns:1fr;padding:0;gap:0}.sidebar{position:fixed;z-index:30;left:10px;top:10px;bottom:10px;width:min(310px,86vw);transform:translateX(-115%);transition:.2s}.sidebar.open{transform:none}.layout{border-radius:0;border:0;height:100dvh}.menu-btn{display:block}.topbar{height:58px;padding:0 10px}.select{max-width:150px}.view{padding:12px}.hero{grid-template-columns:1fr}.grid,.two{grid-template-columns:1fr}.hero-card h2{font-size:28px}.code-shell{grid-template-columns:1fr;grid-template-rows:auto 1fr}.files{max-height:180px}.mobile-tabs{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:9;background:rgba(16,21,31,.92);border:1px solid var(--border);border-radius:20px;padding:6px;gap:4px;backdrop-filter:blur(12px);overflow-x:auto;-webkit-overflow-scrolling:touch}.mobile-tabs::-webkit-scrollbar{display:none}.mobile-tabs button,.mobile-tabs a{flex:1;flex-shrink:0;min-width:38px;border:0;background:transparent;color:var(--muted);border-radius:15px;padding:8px 4px;text-decoration:none;text-align:center}.mobile-tabs button.active,.mobile-tabs a.active{background:var(--panel2);color:var(--text)}.messages{padding-bottom:90px}.composer{padding-bottom:76px}.sync-text{font-size:12px;font-weight:600}@media(max-width:540px){.sync-text{display:none}}}
</style>
</head>
<body data-theme="system">
<div class="app">
  <aside class="sidebar" id="sidebar">
    <div class="brand"><div class="logo">⚡</div><div><h1>Solace Hermes</h1><p>Codex-style mobile AI hub</p></div><span class="status-dot" id="liveDot"></span></div>
    <button class="new-chat" id="newChat">＋ New Chat</button>
        <nav class="nav" id="nav">
      <a data-view="dashboard" href="/dashboard"><span class="ico">🏠</span><span>Realtime Dashboard</span></a>
      <a data-view="chat" href="/chat-live" class="active"><span class="ico">💬</span><span>Chat-Live</span></a>
      <a data-view="coding" href="/coding"><span class="ico">⌘</span><span>AI Coding</span></a>
      <a data-view="crawl" href="/crawl4ai"><span class="ico">🕷️</span><span>Crawl4AI</span></a>
      <a data-view="crew" href="/crew"><span class="ico">🤖</span><span>CrewAI</span></a>
      <a data-view="links" href="/links"><span class="ico">🔗</span><span>Links Hub</span></a>
      <a href="/integrations" target="_blank"><span class="ico">🧩</span><span>Integrations</span></a>
      <a data-view="solace" href="/solace"><span class="ico">📡</span><span>Solace Status</span></a>
      <a data-view="zapier" href="/zapier"><span class="ico">⚡</span><span>Zapier Template</span></a>
      <a data-view="logs" href="/logs"><span class="ico">📜</span><span>Activity Logs</span></a>
      <a data-view="settings" href="/settings"><span class="ico">⚙️</span><span>Settings</span></a>
      <a data-view="profile" href="/profile"><span class="ico">👤</span><span>Profile</span></a>
    </nav>
    <div class="side-foot"><div class="mini-card"><b>Command cepat</b><span>/crawl URL · /code task · /crew topic · /help</span></div><div class="mini-card"><b>Theme</b><span>System, dark, light + ukuran font</span></div></div>
  </aside>
  <section class="layout">
    <header class="topbar"><button class="icon-btn menu-btn" id="menuBtn">☰</button><div class="title"><h2 id="viewTitle">Chat-Live</h2><p id="viewDesc">Tanya AI, crawl URL, jalankan chat live, dan tools dari satu halaman.</p></div><div class="spacer"></div><select class="select" id="model"><optgroup label="Groq AI (Fastest)"><option value="llama-3.3-70b-versatile">Llama 3.3 70B</option><option value="qwen/qwen3-32b">Qwen 3 32B</option><option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout</option><option value="openai/gpt-oss-120b">GPT OSS 120B</option><option value="deepseek-r1-distill-llama-70b">DeepSeek R1 70B</option><option value="llama-3.1-8b-instant">Llama 8B Fast</option></optgroup><optgroup label="Google Gemini (Big Context)"><option value="gemini-2.5-flash">Gemini 2.5 Flash</option><option value="gemini-2.5-pro">Gemini 2.5 Pro</option><option value="gemini-2.0-flash">Gemini 2.0 Flash</option><option value="gemini-1.5-pro">Gemini 1.5 Pro</option></optgroup><optgroup label="OpenRouter (Multi-Provider)"><option value="deepseek/deepseek-r1">DeepSeek R1 (Full)</option><option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option><option value="openai/gpt-4o">GPT-4o</option><option value="google/gemini-2.5-flash">Gemini 2.5 (OR)</option></optgroup></select><button class="icon-btn" id="syncNowBtn" title="Sync Now" style="display:flex;align-items:center;gap:6px;"><span style="font-size:14px;">☁️</span><span class="sync-text">Sync Now</span></button><button class="icon-btn" id="themeBtn">🌓</button></header>
    <main class="main">
      <section class="view chat-view active" id="view-chat"><div class="messages" id="messages"></div></section>
      <section class="view" id="view-coding"><div class="code-shell"><aside class="files"><h3>GitHub Workspace</h3><div class="form" style="gap:6px;margin:8px 0;display:grid;"><select id="githubRepo" class="select" style="width:100%;font-size:12px;padding:6px 8px;border-radius:10px;"><option value="roadfx-full-stack">ivansslo/roadfx-full-stack (Private)</option><option value="hermes-agent-cli">ivansslo/hermes-agent-cli (Public)</option><option value="ai-vitality">ivansslo/ai-vitality (Public)</option><option value="roadfx-ai-stack">ivansslo/roadfx-ai-stack (Main)</option><option value="custom">-- Custom Repo --</option></select><div id="customGithubForm" style="display:none;gap:4px;grid-template-columns:1fr 1fr;margin-bottom:2px;"><input id="customGithubOwner" class="pill" placeholder="Owner (ivansslo)" style="font-size:11px;padding:5px;border-radius:8px;background:var(--panel2);"><input id="customGithubRepo" class="pill" placeholder="Repo Name" style="font-size:11px;padding:5px;border-radius:8px;background:var(--panel2);"></div><button class="secondary" id="syncGithub" style="width:100%;font-size:12px;padding:6px;border-radius:10px;font-weight:600;">🔄 Sync Files</button><input id="fileSearch" class="pill" placeholder="🔍 Cari file..." style="width:100%;font-size:12px;padding:6px 10px;border-radius:10px;background:var(--panel2);"></div><div id="fileList"></div></aside>
<div class="editor">
  <div class="editor-head"><input id="fileName" class="pill" value="app.js"><button class="secondary" id="saveFile">Save</button><button class="primary" id="askCode">Generate</button></div>
  <div class="editor-container">
    <pre class="editor-highlight" id="highlightLayer"><code class="language-javascript" id="highlightCode">// AI Coding workspace
// Klik Sync Files untuk load dari repository GitHub Anda.</code></pre>
    <textarea class="editor-textarea" id="codeEditor" spellcheck="false" oninput="updateHighlight()" onscroll="syncScroll()">// AI Coding workspace
// Klik Sync Files untuk load dari repository GitHub Anda.</textarea>
  </div>
  <div class="editor-foot"><input id="codePrompt" class="pill" placeholder="Contoh: buat component sidebar responsive"><button class="primary" id="sendCodePrompt">Ask AI</button></div>
</div>
</div></section>
      <section class="view" id="view-crawl"><div class="page"><h2>🕷️ Crawl4AI</h2><p>Status: endpoint tersedia di gateway. Gunakan form ini atau command <b>/crawl https://contoh.com</b> di chat.</p><div class="two"><div class="card form"><label>URL</label><input id="crawlUrl" placeholder="https://example.com"><label>Mode</label><select id="crawlMode"><option value="crawl4ai">Crawl4AI markdown cleaner</option><option value="crawl">Simple crawl text</option><option value="extract">Extract JSON-LD/OpenGraph</option></select><label>Max length</label><input id="crawlMax" type="number" value="50000"><button class="primary" id="runCrawl">Run Crawl</button></div><pre class="output" id="crawlOutput">Hasil crawl akan muncul di sini.</pre></div></div></section>
      <section class="view" id="view-crew"><div class="page"><h2>🤖 CrewAI</h2><p>Jalankan task agent berurutan lewat Solace task endpoint.</p><div class="card form"><input id="crewTopic" value="AI agents in 2026"><button class="primary" id="runCrew">Run Crew</button><pre class="output" id="crewOutput">Researcher → Analyst → Writer</pre></div></div></section>
      <section class="view" id="view-links"><div class="page"><h2>🔗 Links Hub</h2><p>Sidebar untuk menu page link: Apps, Tools, Skills, dan ClawHub.</p><div class="quick"><button class="secondary" data-link="integrations">Apps</button><button class="secondary" data-link="tools">Tools</button><button class="secondary" data-link="skills">Skills</button><button class="secondary" data-link="hub/plugins">Hub Plugins</button></div><div class="grid" id="linksGrid"></div></div></section>
      <section class="view" id="view-solace"><div class="page"><h2>📡 Solace Status</h2><p>Monitor broker, queues, dan service.</p><div class="quick"><button class="primary" id="refreshSolace">Refresh</button></div><pre class="output" id="solaceOutput">Klik Refresh untuk cek status.</pre></div></section>
      <section class="view" id="view-settings"><div class="page"><h2>⚙️ Settings</h2><p>Tema bawaan sudah tersedia: System, Dark, Light.</p><div class="two"><div class="card form"><label>Theme</label><select id="themeSelect"><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select><label>Font size</label><select id="fontSelect"><option value="13px">Small</option><option value="14px">Normal</option><option value="16px">Large</option></select><label>Gateway API URL</label><input id="apiUrl" placeholder="kosong = current origin"><label>Bearer token</label><input id="tokenInput" type="password" placeholder="Worker token"><button class="primary" id="saveSettings">Save Settings</button></div><div><div class="card"><h3>Catatan keamanan</h3><p style="color:var(--muted);line-height:1.6">Untuk production, simpan token di Cloudflare Worker Secrets dan gunakan auth session. UI ini mendukung token via localStorage agar tidak perlu hardcode di file.</p></div><div class="card" style="margin-top:12px"><h3>Backup & Sinkronisasi KV</h3><p style="color:var(--muted);line-height:1.6;font-size:12px;margin-bottom:12px">Cadangkan semua data lokal (file, riwayat chat, pengaturan) langsung ke Cloudflare Workers KV. Anda dapat memulihkannya kapan saja di perangkat lain.</p><div class="quick" style="display:flex;gap:8px;"><button class="primary" id="btnSyncPush" style="flex:1;">📤 Backup (Push)</button><button class="secondary" id="btnSyncPull" style="flex:1;">📥 Restore (Pull)</button></div><p id="syncStatus" style="font-size:11px;color:var(--muted);margin-top:10px;text-align:center;">Belum disinkronkan.</p></div></div></div></div></section>
      <section class="view" id="view-profile"><div class="page"><h2>👤 Profile</h2><p>Clerk auth + Zapier connected. Login sosial GitHub, GitLab, Google, HuggingFace, Linear, LinkedIn, Notion, X.</p><div class="card"><h3>Identity</h3><p id="profileId" style="color:var(--muted)"></p><div class="quick"><button class="primary" id="clerkLogin">Login with Clerk</button><button class="secondary" id="clerkProfile">Open Profile</button><a class="secondary" href="/zapier" style="text-decoration:none">Zapier Template</a></div><pre class="output" id="clerkStatus">Clerk status loading...</pre></div></div></section>
    
      <section class="view" id="view-dashboard">
        <div class="page">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:20px;">⚡</div>
            <div>
              <h2 style="margin:0;">Realtime Dashboard</h2>
              <div class="muted">Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh.</div>
            </div>
          </div>
          <div class="quick">
            <button class="primary" onclick="window.location.href='/dashboard'">Buka Dashboard Penuh</button>
            <button class="secondary" onclick="window.open('/api', '_blank')">API Base</button>
            <button class="secondary" onclick="window.open('/integrations', '_blank')">Integrations</button>
            <button class="secondary" onclick="window.open('https://rocspace-links.certveis.workers.dev', '_blank')">Hub</button>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Informasi</h3>
            <p class="muted">Halaman Dashboard penuh memiliki layout khusus dan auto-refresh. Klik tombol di atas untuk membuka versi penuh.</p>
          </div>
        </div>
      </section>

      <section class="view" id="view-zapier">
        <div class="page">
          <h2>⚡ Zapier Template Terbaik</h2>
          <p class="muted">Clerk → Zapier → Solace Hermes: user event masuk ke Solace, optional AI welcome, optional CrewAI onboarding.</p>
          <div class="two">
            <div class="card">
              <h3>Trigger</h3>
              <p class="muted">App: Clerk<br>Event: User Created / User Updated / Session Created</p>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>1. Normalize</b><p class="muted">Formatter by Zapier: id, email, name, username, image_url.</p>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>2. POST to Hermes</b>
                <pre class="output">POST /webhook/zapier
Authorization: Bearer &lt;TOKEN&gt;
{"action":"clerk_event","event_type":"user.created","email":"...","user":{...}}</pre>
              </div>
            </div>
            <div class="card">
              <h3>Actions</h3>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>AI Welcome</b><pre class="output">{"action":"chat","model":"llama-3.1-8b-instant","prompt":"Create welcome message..."}</pre>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>CrewAI Onboarding</b><pre class="output">{"action":"crew","topic":"Onboard new user to Solace Hermes"}</pre>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>Notify / Notion</b><p class="muted">Gunakan Zapier connected apps atau action notify ke Hermes.</p>
              </div>
            </div>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Webhook URL</h3>
            <pre class="output">/webhook/zapier</pre>
            <p class="muted">Credential tetap di Zapier private fields dan Cloudflare Worker Secrets.</p>
            <div class="quick"><a class="secondary" href="/zapier/template" target="_blank" style="text-decoration:none">JSON Template</a></div>
          </div>
        </div>
      </section>

      <section class="view" id="view-logs">
        <div class="page">
          <h2>📜 Activity Logs</h2>
          <p class="muted">Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client.</p>
          <div class="quick">
            <button class="primary" onclick="window.location.href='/logs'">Buka Logs Viewer Penuh</button>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Server Logs</h3>
            <p class="muted">Server logs dikirim ke Cloudflare console + Solace topics <code>hermes/log/*</code>. Halaman Logs penuh memiliki fitur auto-tail dan filtering dari KV/D1 binding.</p>
          </div>
        </div>
      </section>

    </main>
    <footer class="composer"><div class="cmds"><button data-cmd="/help">/help</button><button data-cmd="/crawl https://">/crawl URL</button><button data-cmd="/code ">/code</button><button data-cmd="/crew ">/crew</button><button data-cmd="Jelaskan fungsi page chat ini">fungsi page chat</button></div><div class="input-row"><textarea id="input" rows="1" placeholder="Message... /crawl https://url, /code buat UI, /crew topic"></textarea><button class="send" id="send">➤</button></div></footer>
  </section>
</div>
<div class="mobile-tabs" id="mobileTabs"><a data-view="dashboard" href="/chat-live#dashboard">🏠</a><a data-view="chat" href="/chat-live" class="active">💬</a><a data-view="coding" href="/chat-live#coding">⌘</a><a data-view="crawl" href="/chat-live#crawl">🕷️</a><a data-view="crew" href="/chat-live#crew">🤖</a><a data-view="links" href="/chat-live#links">🔗</a><a href="/integrations" target="_blank">🧩</a><a data-view="solace" href="/chat-live#solace">📡</a><a data-view="zapier" href="/chat-live#zapier">⚡</a><a data-view="logs" href="/chat-live#logs">📜</a><a data-view="settings" href="/chat-live#settings">⚙️</a><a data-view="profile" href="/chat-live#profile">👤</a></div>
<div class="toast" id="toast"></div>
<script>
var DEFAULT_TOKEN='';
var API_DEFAULT='';
var state={view:'chat',messages:[],files:{'app.js':['// AI Coding workspace','function helloHermes(){','  return "Build UI like codex-mobile-web";','}',''].join(String.fromCharCode(10))},currentFile:'app.js',isGithub:false,githubFilesList:[],githubShas:{}};
var titles={chat:['Chat-Live','Tanya AI, crawl URL, jalankan chat live, dan tools dari satu halaman.'],coding:['AI Coding','Editor mini untuk generate, edit, dan simpan file lokal.'],crawl:['Crawl4AI','Crawl URL menjadi markdown/text lalu kirim ke chat.'],crew:['CrewAI','Jalankan workflow agent.'],links:['Links Hub','Menu page link untuk Apps, Tools, Skills, Hub.'],solace:['Solace Status','Monitor event mesh dan queues.'],settings:['Settings','Theme system/dark/light, font, API, token.'],profile:['Profile','Identitas user dan slot Clerk auth.'],dashboard:['Realtime Dashboard','Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh.'],zapier:['Zapier Template','Clerk → Zapier → Solace Hermes integration.'],logs:['Activity Logs','Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client.']};
function $(id){return document.getElementById(id)}function api(){return localStorage.getItem('hermes_api')||API_DEFAULT}function token(ask){var t=localStorage.getItem('hermes_token')||DEFAULT_TOKEN;if(!t&&ask!==false){t=prompt('Masukkan TOKEN Worker untuk endpoint protected')||'';if(t)localStorage.setItem('hermes_token',t)}return t}function clientLog(type,data){try{var k='hermes_client_logs';var a=JSON.parse(localStorage.getItem(k)||'[]');a.unshift({type:type,ts:new Date().toISOString(),data:data||{}});if(a.length>300)a.length=300;localStorage.setItem(k,JSON.stringify(a))}catch(e){}}function toast(t){$('toast').textContent=t;$('toast').classList.add('on');setTimeout(function(){$('toast').classList.remove('on')},2400)}
function setTheme(t){document.body.setAttribute('data-theme',t);localStorage.setItem('hermes_theme',t);$('themeSelect').value=t}function cycleTheme(){var a=['system','dark','light'];var c=document.body.getAttribute('data-theme')||'system';setTheme(a[(a.indexOf(c)+1)%a.length])}
function updateHighlight(){
  var editor=$('codeEditor');
  var code=$('highlightCode');
  var layer=$('highlightLayer');
  if(!editor||!code)return;
  var val=editor.value;
  if(val.endsWith('\\n')) val+=' ';
  code.innerHTML=escapeHtml(val);
  var ext=($('fileName').value||'').split('.').pop();
  var lang='javascript';
  if(ext==='py')lang='python';else if(ext==='css')lang='css';else if(ext==='html')lang='html';else if(ext==='json')lang='json';else if(ext==='md')lang='markdown';
  code.className='language-'+lang;
  if(window.Prism) Prism.highlightElement(code);
}
function syncScroll(){
  var editor=$('codeEditor');
  var layer=$('highlightLayer');
  if(!editor||!layer)return;
  layer.scrollTop=editor.scrollTop;
  layer.scrollLeft=editor.scrollLeft;
}
function initSettings(){setTheme(localStorage.getItem('hermes_theme')||'system');var fs=localStorage.getItem('hermes_font')||'14px';document.documentElement.style.setProperty('--fs',fs);$('fontSelect').value=fs;$('apiUrl').value=localStorage.getItem('hermes_api')||'';$('tokenInput').value=localStorage.getItem('hermes_token')||'';$('profileId').textContent='Visitor ID: '+getUid();var sm=localStorage.getItem('hermes_model');if(sm&&$('model'))$('model').value=sm}
function getUid(){var u=localStorage.getItem('hermes_uid');if(!u){u='user-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.setItem('hermes_uid',u)}return u}
function nav(v){
  clientLog('ui.nav',{view:v});
  state.view=v;
  document.querySelectorAll('[data-view]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-view')===v)});
  document.querySelectorAll('.view').forEach(function(x){x.classList.remove('active')});
  if($('view-'+v)) $('view-'+v).classList.add('active');
  if(titles[v]){
    $('viewTitle').textContent=titles[v][0];
    $('viewDesc').textContent=titles[v][1];
  }
  $('sidebar').classList.remove('open');
  if(v==='links')loadLinks('integrations');
  var p='/'+v;
  if(v==='chat') p='/chat-live';
  else if(v==='crawl') p='/crawl4ai';
  if(history.pushState && location.pathname!==p) history.pushState(null,null,p);
}
function escapeHtml(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function renderMessages(){var box=$('messages');box.innerHTML='';if(!state.messages.length){box.appendChild(welcomeNode());return}state.messages.forEach(function(m){var d=document.createElement('div');d.className='msg '+m.role;d.innerHTML=(m.badge?'<span class="badge">'+m.badge+'</span>':'')+format(m.content);box.appendChild(d)});box.scrollTop=box.scrollHeight}
function welcomeNode(){var w=document.createElement('div');w.className='welcome';w.innerHTML='<div class="hero"><div class="hero-card"><span class="badge">✨ Solace Hermes v5.0.0 "Omni"</span><h2>AI Agent Hub: Chat, CrewAI, Crawl4AI, Solace, dan integrasi aktif.</h2><p>Dashboard ini berisi keterangan fungsi dan koneksi semua komponen: Cloudflare Workers, Chat, CrewAI Termux, Zapier, CF AI Factory, Clerk, Notion/ClawLink, Crawl4AI, domain certveis.space, GitHub/GitLab, dan Termux CLI.</p><div class="quick"><a class="secondary" href="/dashboard" style="text-decoration:none">Dashboard</a><button data-go="chat">Chat</button><button data-go="crew">CrewAI</button><button data-go="crawl">Crawl4AI</button><button data-go="links">Hub</button><button data-go="solace">Solace</button></div></div><div class="hero-card"><div class="stats"><div class="stat"><b>5</b><span>CF Workers</span></div><div class="stat"><b>25+</b><span>Endpoints</span></div><div class="stat"><b>20</b><span>Integrations</span></div><div class="stat"><b>9</b><span>Domains</span></div></div></div></div><div class="grid"><div class="feature" data-go="chat"><div class="big">💬</div><h3>Chat</h3><p>20+ models, 3 modes, Clerk auth slot, streaming, command /crawl /code /crew.</p></div><div class="feature" data-go="solace"><div class="big">📡</div><h3>Solace</h3><p>Event mesh connected, 5 queues, Singapore RoClace cluster.</p></div><div class="feature" data-go="crew"><div class="big">🤖</div><h3>CrewAI</h3><p>v1.15.1 running di Termux, workflow Researcher → Analyst → Writer.</p></div><div class="feature" data-go="chat"><div class="big">⚡</div><h3>Zapier</h3><p>Connected ke CrewAI dan webhook endpoint /webhook/zapier.</p></div><div class="feature" data-go="links"><div class="big">🎨</div><h3>CF AI Factory</h3><p>60 public models untuk chat, image, TTS, STT, embeddings, translate, vision.</p></div><div class="feature" data-go="profile"><div class="big">🔐</div><h3>Clerk</h3><p>8 social logins: GitHub, GitLab, Google, HuggingFace, Linear, LinkedIn, Notion, X.</p></div><div class="feature" data-go="links"><div class="big">📝</div><h3>Notion</h3><p>45 tools via ClawLink, siap dipanggil dari Links Hub/tool execute.</p></div><div class="feature" data-go="crawl"><div class="big">🕷️</div><h3>Crawl4AI</h3><p>/crawl4ai endpoint aktif dan command /crawl URL di chat.</p></div><div class="feature" data-go="links"><div class="big">🔗</div><h3>20 integrations</h3><p>ClawHub, ClawLink, Honcho, Solace, Zapier, Tailscale, Clerk dan lainnya.</p></div><div class="feature" data-go="settings"><div class="big">🌐</div><h3>9 domains</h3><p>certveis.space domains mapped untuk app, AI gateway, webhook, factory, hub.</p></div><div class="feature" data-go="coding"><div class="big">📦</div><h3>4 repos synced</h3><p>Source GitHub + GitLab dengan UI, Worker, docs, dan scripts.</p></div><div class="feature" data-go="coding"><div class="big">📱</div><h3>Termux CLI</h3><p>hermes run works; CrewAI dan CLI operasional dari Termux.</p></div></div>';setTimeout(function(){w.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){nav(b.getAttribute('data-go'))}})},0);return w}
function format(s){s=escapeHtml(s);s=s.replace(/\n/g,'<br>');return s}
function add(role,content,badge){state.messages.push({role:role,content:content,badge:badge});renderMessages()}
async function send(){var text=$('input').value.trim();clientLog('chat.send',{text:text.slice(0,120)});if(!text)return;$('input').value='';autoSize();add('user',text);if(text==='/help'){add('ai','Perintah:\\n/crawl https://url = crawl halaman\\n/code task = kirim task coding ke AI\\n/crew topic = jalankan crew task\\nTema ada di Settings: System, Dark, Light.','Help');return}if(text.indexOf('/crawl ')===0){runCrawlFromChat(text.replace('/crawl ','').trim());return}if(text.indexOf('/code ')===0){nav('coding');$('codePrompt').value=text.replace('/code ','').trim();askCoding();return}if(text.indexOf('/crew ')===0){nav('crew');$('crewTopic').value=text.replace('/crew ','').trim();runCrew();return}await aiChat(text)}
async function aiChat(text){
  add('system','Thinking...');
  var max=3,delay=1000;
  for(var attempt=0;attempt<=max;attempt++){
    try{
      var msgs=state.messages.filter(function(m){return m.role==='user'||m.role==='ai'}).slice(-12).map(function(m){return{role:m.role==='ai'?'assistant':'user',content:m.content}});
      if(msgs.length>0&&msgs[0].role!=='system'){
        msgs.unshift({role:'system',content:'You are Solace Hermes AI, a highly capable multi-model assistant. Respond concisely and effectively.'});
      }
      var res=await fetch(api()+'/ai/stream',{
        method:'POST',
        headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},
        body:JSON.stringify({model:$('model').value,messages:msgs,max_tokens:4096,stream:true})
      });
      if(!res.ok){
        if(attempt<max&&(res.status===401||res.status>=500)){
          await new Promise(function(r){setTimeout(r,delay)});
          delay*=2;
          continue
        }
        state.messages.pop();renderMessages();
        var er=await res.text();
        add('ai','Error '+res.status+': '+er,'Gateway');
        return
      }
      state.messages.pop();renderMessages();
      var full='';
      var reader=res.body.getReader();
      var dec=new TextDecoder();
      var buf='';
      add('ai','',$('model').value);
      while(true){
        var rv=await reader.read();
        if(rv.done)break;
        buf+=dec.decode(rv.value,{stream:true});
        var lines=buf.split('\n');
        buf=lines.pop()||'';
        for(var i=0;i<lines.length;i++){
          var l=lines[i];
          if(l.indexOf('data: ')!==0)continue;
          var dd=l.slice(6);
          if(dd==='[DONE]')continue;
          try{
            var j=JSON.parse(dd);
            var delta=j.choices&&j.choices[0]&&j.choices[0].delta&&(j.choices[0].delta.content||j.choices[0].delta.reasoning||j.choices[0].delta.reasoning_content)||'';
            if(delta){
              full+=delta;
              state.messages[state.messages.length-1].content=full;
              renderMessages();
            }
          }catch(e){}
        }
      }
      return
    }catch(e){
      if(attempt<max){
        await new Promise(function(r){setTimeout(r,delay)});
        delay*=2;
        continue
      }
      state.messages.pop();renderMessages();
      add('ai','Error: '+e.message,'Gateway');
      return
    }
  }
}
async function runCrawlFromChat(url){if(!url){add('ai','Format: /crawl https://example.com','Crawl4AI');return}add('system','Crawling '+url+' ...');try{var r=await fetch(api()+'/crawl4ai',{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({url:url,max_length:30000})});var d=await r.json();state.messages.pop();renderMessages();if(d.error){add('ai','Crawl error: '+d.error,'Crawl4AI');return}add('ai','Title: '+(d.title||'-')+'\\nURL: '+d.url+'\\nLength: '+d.content_length+'\\n\\n'+(d.content||'').slice(0,6000),'Crawl4AI')}catch(e){state.messages.pop();renderMessages();add('ai','Crawl error: '+e.message,'Crawl4AI')}} 
async function runCrawl(){var url=$('crawlUrl').value.trim();clientLog('crawl.run',{url:url,mode:$('crawlMode').value});if(!url)return toast('Masukkan URL');$('crawlOutput').textContent='Crawling...';var mode=$('crawlMode').value;var path=mode==='extract'?'/crawl4ai/extract':(mode==='crawl'?'/crawl':'/crawl4ai');try{var r=await fetch(api()+path,{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({url:url,max_length:parseInt($('crawlMax').value||'50000')})});var d=await r.json();$('crawlOutput').textContent=JSON.stringify(d,null,2)}catch(e){$('crawlOutput').textContent='Error: '+e.message}}
async function runCrew(){var topic=$('crewTopic').value.trim();clientLog('crew.run',{topic:topic});$('crewOutput').textContent='Running crew task...';try{var r=await fetch(api()+'/solace/task',{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({type:'chat',prompt:'You are a research crew. Research, analyze, and write a report about: '+topic,model:'llama-3.3-70b-versatile',max_tokens:4096})});var d=await r.json();$('crewOutput').textContent=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||JSON.stringify(d,null,2)}catch(e){$('crewOutput').textContent='Error: '+e.message}}
function renderFiles(){
  var list=$('fileList');
  if(!list) return;
  list.innerHTML='';
  var keyword=($('fileSearch')?$('fileSearch').value.trim().toLowerCase():'');
  if(state.isGithub){
    var items=state.githubFilesList||[];
    if(keyword){
      items=items.filter(function(x){return x.path.toLowerCase().indexOf(keyword)>=0});
    }
    if(!items.length){
      var empty=document.createElement('div');
      empty.className='file-item';
      empty.style.color='var(--muted)';
      empty.style.fontSize='12px';
      empty.textContent='Tidak ada file ditemukan';
      list.appendChild(empty);
      return;
    }
    items.forEach(function(item){
      var n=item.path;
      var d=document.createElement('div');
      d.className='file-item '+(n===state.currentFile?'active':'');
      var isLoaded=state.files[n]!==undefined;
      d.textContent=(isLoaded?'🟢 ':'📄 ')+n;
      d.onclick=async function(){
        saveCurrent();
        state.currentFile=n;
        $('fileName').value=n;
        if(state.files[n]!==undefined){
          $('codeEditor').value=state.files[n];
          renderFiles();
          updateHighlight();
        }else{
          $('codeEditor').value='// Loading content dari GitHub...';
          try{
            var r=await fetch('/api/github/file?owner=ivansslo&repo='+$('githubRepo').value+'&path='+encodeURIComponent(n));
            if(!r.ok){var er=await r.json();throw new Error(er.error||'Failed to load')};
            var fd=await r.json();
            var decoded='';
            if(fd.encoding==='base64'){
              decoded=decodeURIComponent(escape(atob(fd.content.replace(/s/g,''))));
            }else{
              decoded=fd.content||'';
            }
            state.files[n]=decoded;
            state.githubShas[n]=fd.sha;
            if(state.currentFile===n){
              $('codeEditor').value=decoded;
              updateHighlight();
            }
            renderFiles();
          }catch(e){
            if(state.currentFile===n){
              $('codeEditor').value='// Gagal load file: '+e.message;
            }
            toast('Gagal load file: '+e.message);
          }
        }
      };
      list.appendChild(d);
    });
  }else{
    var keys=Object.keys(state.files);
    if(keyword){
      keys=keys.filter(function(x){return x.toLowerCase().indexOf(keyword)>=0});
    }
    keys.forEach(function(n){
      var d=document.createElement('div');
      d.className='file-item '+(n===state.currentFile?'active':'');
      d.textContent='📄 '+n;
      d.onclick=function(){
        saveCurrent();
        state.currentFile=n;
        $('fileName').value=n;
        $('codeEditor').value=state.files[n];
        renderFiles();
        updateHighlight();
      };
      list.appendChild(d);
    });
  }
}
function saveCurrent(){
  clientLog('coding.save',{file:$('fileName').value||state.currentFile});
  var n=$('fileName').value||state.currentFile;
  state.files[n]=$('codeEditor').value;
  state.currentFile=n;
  if(!state.isGithub){
    localStorage.setItem('hermes_files',JSON.stringify(state.files));
  }
  renderFiles();
}
async function saveGithubFile(){
  saveCurrent();
  if(!state.isGithub){
    toast('File saved local');
    return;
  }
  var n=state.currentFile;
  var content=state.files[n]||'';
  var sha=state.githubShas[n];
  var selectedRepo=$('githubRepo').value;
  toast('Mengirim commit ke GitHub...');
  try{
    var r=await fetch('/api/github/save',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        owner:'ivansslo',
        repo:selectedRepo,
        path:n,
        content:content,
        sha:sha
      })
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error||'Failed to save');
    state.githubShas[n]=d.sha;
    toast('Berhasil commit ke GitHub!');
    renderFiles();
  }catch(e){
    toast('Gagal commit: '+e.message);
  }
}
async function syncGithubFiles(){
  var selectedRepo=$('githubRepo').value;
  var list=$('fileList');
  list.innerHTML='<div class="file-item" style="color:var(--muted)">🔄 Syncing file tree...</div>';
  try{
    var r=await fetch('/api/github/files?owner=ivansslo&repo='+selectedRepo);
    if(!r.ok){var er=await r.json();throw new Error(er.error||'Failed to sync')};
    var d=await r.json();
    state.isGithub=true;
    state.githubFilesList=d.files||[];
    state.githubShas={};
    (d.files||[]).forEach(function(item){
      state.githubShas[item.path]=item.sha;
    });
    if(d.files&&d.files.length>0){
      var first=d.files[0].path;
      state.currentFile=first;
      $('fileName').value=first;
      $('codeEditor').value='// Loading content...';
      renderFiles();
      var fr=await fetch('/api/github/file?owner=ivansslo&repo='+selectedRepo+'&path='+encodeURIComponent(first));
      if(fr.ok){
        var fd=await fr.json();
        var decoded='';
        if(fd.encoding==='base64'){
          decoded=decodeURIComponent(escape(atob(fd.content.replace(/s/g,''))));
        }else{
          decoded=fd.content||'';
        }
        state.files[first]=decoded;
        state.githubShas[first]=fd.sha;
        if(state.currentFile===first){
          $('codeEditor').value=decoded;
        }
      }else{
        $('codeEditor').value='// Click file to load content';
      }
    }else{
      $('codeEditor').value='// No files found';
    }
    renderFiles();
    toast('Sync success!');
  }catch(e){
    list.innerHTML='<div class="file-item" style="color:var(--bad)">⚠️ Error: '+escapeHtml(e.message)+'</div>';
    toast('Sync failed: '+e.message);
  }
}
async function askCoding(){var p=$('codePrompt').value.trim()||'Review dan tingkatkan kode ini';var code=$('codeEditor').value;nav('chat');$('input').value='';add('user','/code '+p);await aiChat('Anda adalah AI coding assistant. Task: '+p+'\\n\\nFile: '+$('fileName').value+'\\nKode saat ini:\\n'+code)}
async function syncAllData() {
  saveCurrent();
  var filesData = null;
  try {
    filesData = JSON.parse(localStorage.getItem('hermes_files') || 'null');
  } catch(e) {}
  if (!filesData) filesData = state.files || {};

  var payload = {
    files: filesData,
    messages: state.messages || [],
    currentFile: state.currentFile || '',
    settings: {
      theme: localStorage.getItem('hermes_theme'),
      font: localStorage.getItem('hermes_font'),
      api: localStorage.getItem('hermes_api'),
      token: localStorage.getItem('hermes_token') || '',
      model: localStorage.getItem('hermes_model')
    },
    ts: new Date().toISOString()
  };

  var syncStatus = $('syncStatus');
  if (syncStatus) syncStatus.textContent = 'Menghubungkan ke Workers KV...';

  try {
    var r = await fetch('/sync', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token()
      },
      body: JSON.stringify(payload)
    });
    var d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Sync failed');
    toast('Data berhasil disinkronkan ke Cloudflare KV!');
    if (syncStatus) syncStatus.textContent = 'Terakhir disinkronkan: ' + new Date().toLocaleTimeString();
    return d;
  } catch(e) {
    toast('Gagal sinkronisasi: ' + e.message);
    if (syncStatus) syncStatus.textContent = 'Gagal syncAllData: ' + e.message;
    throw e;
  }
}
async function pushSync(){
  var btnSyncPush=$('btnSyncPush');
  if(btnSyncPush) btnSyncPush.disabled=true;
  try{
    await syncAllData();
  }catch(e){}finally{
    if(btnSyncPush) btnSyncPush.disabled=false;
  }
}
async function pullSync(){
  var btnSyncPull=$('btnSyncPull');
  var syncStatus=$('syncStatus');
  if(!confirm('Apakah Anda yakin ingin me-restore data? Ini akan menimpa file, chat history, dan pengaturan saat ini.')) return;
  if(btnSyncPull) btnSyncPull.disabled=true;
  if(syncStatus) syncStatus.textContent='Mengunduh data dari KV...';
  try{
    var r=await fetch('/sync',{
      method:'GET',
      headers:{
        'Authorization':'Bearer '+token()
      }
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error||'Restore failed');
    if(d.empty){
      toast('Tidak ada data cadangan di KV.');
      if(syncStatus) syncStatus.textContent='Belum ada cadangan di KV.';
      return;
    }
    if(d.files)state.files=d.files;
    if(d.messages)state.messages=d.messages;
    if(d.currentFile)state.currentFile=d.currentFile;
    localStorage.setItem('hermes_files',JSON.stringify(state.files));
    if(d.settings){
      if(d.settings.theme){
        localStorage.setItem('hermes_theme',d.settings.theme);
        setTheme(d.settings.theme);
      }
      if(d.settings.font){
        localStorage.setItem('hermes_font',d.settings.font);
        document.documentElement.style.setProperty('--fs',d.settings.font);
        $('fontSelect').value=d.settings.font;
      }
      if(d.settings.api){
        localStorage.setItem('hermes_api',d.settings.api);
        $('apiUrl').value=d.settings.api;
      }
      if(d.settings.token){
        localStorage.setItem('hermes_token',d.settings.token);
        $('tokenInput').value=d.settings.token;
      }
      if(d.settings.model&&$('model')){
        localStorage.setItem('hermes_model',d.settings.model);
        $('model').value=d.settings.model;
      }
    }
    renderFiles();
    renderMessages();
    if($('fileName')&&$('codeEditor')){
      $('fileName').value=state.currentFile;
      $('codeEditor').value=state.files[state.currentFile]||'';
    }
    toast('Berhasil memulihkan data dari Workers KV!');
    if(syncStatus) syncStatus.textContent='Dipulihkan pada: '+new Date().toLocaleTimeString();
  }catch(e){
    toast('Gagal memulihkan: '+e.message);
    if(syncStatus) syncStatus.textContent='Gagal restore: '+e.message;
  }finally{
    if(btnSyncPull) btnSyncPull.disabled=false;
  }
}
async function loadLinks(kind){$('linksGrid').innerHTML='<div class="card">Loading...</div>';var path=kind==='skills'?'/skills':(kind.indexOf('hub/')===0?'/'+kind:'/link/'+kind);try{var r=await fetch(api()+path);var d=await r.json();var items=d.items||d.results||d.integrations||d.tools||d.skills||[];$('linksGrid').innerHTML='';items.slice(0,36).forEach(function(x){var name=x.displayName||x.name||x.slug||x.integration||'Item';var desc=x.summary||x.description||x.connectionLabel||'';var c=document.createElement('div');c.className='feature';c.innerHTML='<div class="big">🔹</div><h3>'+escapeHtml(name)+'</h3><p>'+escapeHtml(desc).slice(0,120)+'</p>';c.onclick=function(){nav('chat');$('input').value='Tell me about '+name;$('input').focus()};$('linksGrid').appendChild(c)});if(!items.length)$('linksGrid').innerHTML='<div class="card">No result.</div>'}catch(e){$('linksGrid').innerHTML='<div class="card">Error: '+escapeHtml(e.message)+'</div>'}}
async function refreshSolace(){$('solaceOutput').textContent='Loading...';try{var all=await Promise.all(['/solace/status','/solace/queues','/solace/service'].map(function(p){return fetch(api()+p).then(function(r){return r.json()}).catch(function(e){return{error:e.message}})}));$('solaceOutput').textContent=JSON.stringify({status:all[0],queues:all[1],service:all[2]},null,2)}catch(e){$('solaceOutput').textContent='Error: '+e.message}}
function autoSize(){$('input').style.height='auto';$('input').style.height=Math.min($('input').scrollHeight,150)+'px'}

var clerkObj=null;
async function initClerkLite(){try{var cfg=await fetch('/auth/clerk-config').then(function(r){return r.json()});if(!cfg.configured){$('clerkStatus').textContent='Clerk publishable key not configured';return}var sc=document.createElement('script');sc.async=true;sc.crossOrigin='anonymous';sc.setAttribute('data-clerk-publishable-key',cfg.publishableKey);sc.src='https://'+cfg.domain+'/npm/@clerk/clerk-js@5/dist/clerk.browser.js';sc.onload=function(){if(!window.Clerk){$('clerkStatus').textContent='Clerk script loaded but unavailable';return}window.Clerk.load().then(function(){clerkObj=window.Clerk;updateClerkUi();clerkObj.addListener(updateClerkUi)}).catch(function(e){$('clerkStatus').textContent='Clerk load error: '+e.message})};document.head.appendChild(sc)}catch(e){try{$('clerkStatus').textContent='Clerk init error: '+e.message}catch(_){}}}
function updateClerkUi(){try{var c=window.Clerk;if(!c||!$('clerkStatus'))return;if(c.user){var u=c.user;var email=(u.emailAddresses&&u.emailAddresses[0])?u.emailAddresses[0].emailAddress:'';var username=u.username||u.firstName||'';$('clerkStatus').textContent=JSON.stringify({signedIn:true,id:u.id,name:u.firstName||u.username||'User',email:email},null,2);
  var sel=$('model');
  if(sel&&(username==='ivansslo'||email==='ivansuselo@gmail.com')){
    if(!sel.querySelector('option[value="groq/deepseek-r1-distill-llama-70b"]')){
      var g1=document.createElement('option');g1.value='groq/deepseek-r1-distill-llama-70b';g1.textContent='Groq DeepSeek R1 70B';sel.appendChild(g1);
      var g2=document.createElement('option');g2.value='groq/deepseek-r1-distill-qwen-32b';g2.textContent='Groq DeepSeek R1 32B';sel.appendChild(g2);
      var g3=document.createElement('option');g3.value='groq/llama-3.3-70b-specdec';g3.textContent='Groq Llama 3.3 SpecDec';sel.appendChild(g3);
      var g4=document.createElement('option');g4.value='groq/qwen-2.5-coder-32b';g4.textContent='Groq Qwen 2.5 Coder 32B';sel.appendChild(g4);
    }
  }
  fetch('/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'clerk_signed_in',clerkUser:{id:u.id,email:email,name:u.firstName||u.username||''}})}).catch(function(){})}else{$('clerkStatus').textContent='Guest mode. Klik Login with Clerk untuk social login.'}}catch(e){}}
document.querySelectorAll('[data-view]').forEach(function(b){
  b.onclick=function(e){
    if(e.ctrlKey||e.metaKey||e.shiftKey) return;
    e.preventDefault();
    nav(b.getAttribute('data-view'));
  }
});
document.querySelectorAll('[data-cmd]').forEach(function(b){b.onclick=function(){$('input').value=b.getAttribute('data-cmd');$('input').focus();autoSize()}});document.querySelectorAll('[data-link]').forEach(function(b){b.onclick=function(){loadLinks(b.getAttribute('data-link'))}});
$('menuBtn').onclick=function(){$('sidebar').classList.toggle('open')};$('newChat').onclick=function(){state.messages=[];nav('chat');renderMessages()};$('themeBtn').onclick=cycleTheme;$('syncNowBtn').onclick=async function(){var btn=$('syncNowBtn');btn.disabled=true;var origText=btn.innerHTML;btn.innerHTML='<span style="font-size:14px;">🔄</span><span class="sync-text">Syncing...</span>';try{await syncAllData()}catch(e){}finally{btn.disabled=false;btn.innerHTML=origText}};$('send').onclick=send;$('input').oninput=autoSize;$('input').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};$('runCrawl').onclick=runCrawl;$('runCrew').onclick=runCrew;$('refreshSolace').onclick=refreshSolace;$('saveSettings').onclick=async function(){setTheme($('themeSelect').value);localStorage.setItem('hermes_font',$('fontSelect').value);document.documentElement.style.setProperty('--fs',$('fontSelect').value);localStorage.setItem('hermes_api',$('apiUrl').value.trim());if($('tokenInput').value.trim())localStorage.setItem('hermes_token',$('tokenInput').value.trim());toast('Settings tersimpan');try{await syncAllData()}catch(e){}};$('themeSelect').onchange=function(){setTheme(this.value)};$('fontSelect').onchange=function(){document.documentElement.style.setProperty('--fs',this.value);localStorage.setItem('hermes_font',this.value)};if($('model'))$('model').onchange=function(){localStorage.setItem('hermes_model',this.value)};$('syncGithub').onclick=syncGithubFiles;$('fileSearch').oninput=renderFiles;$('saveFile').onclick=saveGithubFile;$('btnSyncPush').onclick=pushSync;$('btnSyncPull').onclick=pullSync;$('askCode').onclick=askCoding;$('sendCodePrompt').onclick=askCoding;if($('clerkLogin'))$('clerkLogin').onclick=function(){if(clerkObj)clerkObj.openSignIn();else toast('Clerk loading...')};if($('clerkProfile'))$('clerkProfile').onclick=function(){if(clerkObj&&clerkObj.user)clerkObj.openUserProfile();else if(clerkObj)clerkObj.openSignIn();else toast('Clerk loading...')};
function routeFromHash(){
  var h=(location.hash||'').replace('#','');
  if(!h){
    var p=location.pathname.replace('/','');
    if(p==='crawl4ai') h='crawl';
    else if(p==='chat-live'||p==='chat') h='chat';
    else if(document.getElementById('view-'+p)) h=p;
  }
  if(h&&document.getElementById('view-'+h))nav(h);
}
window.addEventListener('hashchange',routeFromHash);
window.addEventListener('popstate',routeFromHash);
initSettings();try{var saved=JSON.parse(localStorage.getItem('hermes_files')||'null');if(saved)state.files=saved}catch(e){}renderFiles();renderMessages();routeFromHash();initClerkLite();updateHighlight();
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markdown.min.js"></script>
</body>
</html>
`;
var CREW_HTML=`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Solace Hermes AI</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden}button,input,textarea,select{font:inherit}
:root{color-scheme:dark;--bg:#08090d;--bg2:#0d1117;--panel:#10151f;--panel2:#151b26;--elev:#1a2230;--border:#273244;--text:#f8fafc;--muted:#94a3b8;--soft:#cbd5e1;--accent:#10b981;--accent2:#f97316;--good:#10b981;--warn:#f59e0b;--bad:#ef4444;--code:#05070b;--shadow:0 24px 80px rgba(0,0,0,.35);--radius:18px;--fs:14px}
[data-theme="light"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}
@media(prefers-color-scheme:light){[data-theme="system"]{color-scheme:light;--bg:#f4f7fb;--bg2:#eef3f9;--panel:#ffffff;--panel2:#f8fafc;--elev:#eef4ff;--border:#d9e2ef;--text:#0f172a;--muted:#64748b;--soft:#334155;--accent:#059669;--accent2:#ea580c;--code:#0f172a;--shadow:0 24px 70px rgba(15,23,42,.14)}}
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at top left,rgba(16,185,129,.15),transparent 35%),radial-gradient(circle at bottom right,rgba(249,115,22,.12),transparent 38%),var(--bg);color:var(--text);font-size:var(--fs)}
.app{height:100dvh;display:grid;grid-template-columns:278px 1fr;padding:12px;gap:12px}.sidebar{background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02)),var(--panel);border:1px solid var(--border);border-radius:24px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-width:0;overflow:hidden}.brand{padding:18px 16px 14px;display:flex;align-items:center;gap:12px}.logo{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;box-shadow:0 14px 40px rgba(16,185,129,.25)}.brand h1{margin:0;font-size:16px;letter-spacing:-.02em}.brand p{margin:2px 0 0;color:var(--muted);font-size:11px}.status-dot{width:9px;height:9px;border-radius:999px;background:var(--good);box-shadow:0 0 14px var(--good);margin-left:auto}.new-chat{margin:0 14px 12px;border:0;border-radius:16px;padding:12px 14px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:700;cursor:pointer}.nav{padding:4px 10px;display:flex;flex-direction:column;gap:6px;overflow:auto}.nav button,.nav a{border:1px solid transparent;background:transparent;color:var(--muted);border-radius:16px;padding:11px 12px;text-align:left;display:flex;gap:10px;align-items:center;cursor:pointer;text-decoration:none}.nav button:hover,.nav a:hover{background:var(--panel2);color:var(--text);border-color:var(--border)}.nav button.active,.nav a.active{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(249,115,22,.14));border-color:rgba(16,185,129,.35);color:var(--text)}.nav .ico{width:24px;height:24px;border-radius:10px;background:var(--elev);display:grid;place-items:center}.side-foot{margin-top:auto;padding:14px;border-top:1px solid var(--border);display:grid;gap:10px}.mini-card{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:12px}.mini-card b{display:block;font-size:12px}.mini-card span{display:block;color:var(--muted);font-size:11px;margin-top:4px}.layout{min-width:0;display:grid;grid-template-rows:auto 1fr auto;background:rgba(16,21,31,.58);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);backdrop-filter:blur(18px)}.topbar{height:64px;padding:0 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(16,21,31,.72)}.menu-btn{display:none}.title{min-width:0}.title h2{font-size:15px;margin:0}.title p{font-size:11px;color:var(--muted);margin:3px 0 0}.spacer{flex:1}.pill,.select,select{background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:9px 10px}.select{max-width:230px}.icon-btn{border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:14px;padding:9px 11px;cursor:pointer}.main{min-height:0;overflow:hidden;position:relative}.view{height:100%;display:none;overflow:auto;padding:18px}.view.active{display:block}.chat-view{padding:0;display:none;grid-template-rows:1fr}.chat-view.active{display:grid}.messages{overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}.welcome{max-width:1050px;margin:0 auto;padding:18px 0 120px}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;margin-bottom:16px}.hero-card,.card{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025)),var(--panel);border:1px solid var(--border);border-radius:22px;padding:18px}.hero-card h2{font-size:34px;line-height:1;margin:4px 0 10px;letter-spacing:-.04em}.grad{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}.hero-card p{color:var(--muted);line-height:1.6;margin:0}.quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.quick button,.primary{border:0;border-radius:14px;padding:10px 12px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-weight:700;cursor:pointer}.secondary{border:1px solid var(--border);border-radius:14px;padding:10px 12px;background:var(--panel2);color:var(--text);cursor:pointer}.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.stat b{font-size:24px}.stat span{display:block;color:var(--muted);font-size:11px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.feature{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:15px;cursor:pointer;transition:.16s}.feature:hover{transform:translateY(-2px);border-color:rgba(79,140,255,.45)}.feature .big{font-size:26px}.feature h3{margin:10px 0 6px;font-size:14px}.feature p{margin:0;color:var(--muted);font-size:12px;line-height:1.5}.msg{max-width:min(820px,86%);padding:12px 14px;border-radius:18px;line-height:1.6;white-space:pre-wrap;word-break:break-word}.msg.user{align-self:flex-end;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border-bottom-right-radius:6px}.msg.ai{align-self:flex-start;background:var(--panel);border:1px solid var(--border);border-bottom-left-radius:6px}.msg.system{align-self:center;max-width:92%;color:var(--muted);font-size:12px;text-align:center}.msg pre{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:14px;padding:12px;overflow:auto}.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--panel2);color:var(--muted);border-radius:999px;padding:5px 9px;font-size:11px;margin-bottom:8px}.composer{border-top:1px solid var(--border);padding:10px;background:rgba(16,21,31,.78)}.cmds{display:flex;gap:6px;overflow:auto;padding:0 2px 8px}.cmds button{white-space:nowrap;border:1px solid var(--border);background:var(--panel);color:var(--muted);border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer}.input-row{display:flex;gap:8px;align-items:flex-end}.input-row textarea{flex:1;resize:none;min-height:46px;max-height:150px;background:var(--panel);border:1px solid var(--border);border-radius:18px;color:var(--text);padding:13px 14px;outline:0}.input-row textarea:focus{border-color:var(--accent)}.send{width:48px;height:46px;border:0;border-radius:16px;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));font-weight:900;cursor:pointer}.page{max-width:1100px;margin:0 auto}.page h2{margin:2px 0 6px;font-size:26px}.page>p{color:var(--muted);margin-top:0}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form{display:grid;gap:10px}.form input,.form textarea,.form select{width:100%;background:var(--panel2);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:12px;outline:0}.output{background:var(--code);color:#e2e8f0;border:1px solid var(--border);border-radius:16px;padding:12px;min-height:220px;overflow:auto;white-space:pre-wrap}.code-shell{height:100%;display:grid;grid-template-columns:270px 1fr;gap:12px}.files{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:14px;overflow:auto}.editor{background:var(--panel);border:1px solid var(--border);border-radius:20px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}.editor-head{padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center}.editor textarea{width:100%;height:100%;resize:none;border:0;outline:0;background:var(--code);color:#e2e8f0;padding:14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55}.editor-foot{padding:10px;border-top:1px solid var(--border);display:flex;gap:8px}.file-item{padding:9px;border-radius:12px;color:var(--muted);cursor:pointer}.file-item:hover,.file-item.active{background:var(--panel2);color:var(--text)}
.editor-container{position:relative;width:100%;height:100%;overflow:hidden;background:var(--code)}
.editor-highlight,.editor-textarea{position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:14px;border:0;outline:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55;white-space:pre;overflow:auto;tab-size:2}
.editor-textarea{color:transparent;background:transparent;caret-color:var(--text);z-index:2;resize:none}
.editor-highlight{z-index:1;pointer-events:none;background:transparent}
.editor-highlight code{font-family:inherit;font-size:inherit;line-height:inherit;background:transparent!important;padding:0!important}
.toast{position:fixed;right:18px;bottom:18px;background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:12px 14px;box-shadow:var(--shadow);display:none;z-index:20}.toast.on{display:block}.mobile-tabs{display:none}
@media(max-width:860px){.app{grid-template-columns:1fr;padding:0;gap:0}.sidebar{position:fixed;z-index:30;left:10px;top:10px;bottom:10px;width:min(310px,86vw);transform:translateX(-115%);transition:.2s}.sidebar.open{transform:none}.layout{border-radius:0;border:0;height:100dvh}.menu-btn{display:block}.topbar{height:58px;padding:0 10px}.select{max-width:150px}.view{padding:12px}.hero{grid-template-columns:1fr}.grid,.two{grid-template-columns:1fr}.hero-card h2{font-size:28px}.code-shell{grid-template-columns:1fr;grid-template-rows:auto 1fr}.files{max-height:180px}.mobile-tabs{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:9;background:rgba(16,21,31,.92);border:1px solid var(--border);border-radius:20px;padding:6px;gap:4px;backdrop-filter:blur(12px);overflow-x:auto;-webkit-overflow-scrolling:touch}.mobile-tabs::-webkit-scrollbar{display:none}.mobile-tabs button,.mobile-tabs a{flex:1;flex-shrink:0;min-width:38px;border:0;background:transparent;color:var(--muted);border-radius:15px;padding:8px 4px;text-decoration:none;text-align:center}.mobile-tabs button.active,.mobile-tabs a.active{background:var(--panel2);color:var(--text)}.messages{padding-bottom:90px}.composer{padding-bottom:76px}.sync-text{font-size:12px;font-weight:600}@media(max-width:540px){.sync-text{display:none}}}
</style>
</head>
<body data-theme="system">
<div class="app">
  <aside class="sidebar" id="sidebar">
    <div class="brand"><div class="logo">⚡</div><div><h1>Solace Hermes</h1><p>Codex-style mobile AI hub</p></div><span class="status-dot" id="liveDot"></span></div>
    <button class="new-chat" id="newChat">＋ New Chat</button>
        <nav class="nav" id="nav">
      <a data-view="dashboard" href="/dashboard"><span class="ico">🏠</span><span>Realtime Dashboard</span></a>
      <a data-view="chat" href="/chat-live" class="active"><span class="ico">💬</span><span>Chat-Live</span></a>
      <a data-view="coding" href="/coding"><span class="ico">⌘</span><span>AI Coding</span></a>
      <a data-view="crawl" href="/crawl4ai"><span class="ico">🕷️</span><span>Crawl4AI</span></a>
      <a data-view="crew" href="/crew"><span class="ico">🤖</span><span>CrewAI</span></a>
      <a data-view="links" href="/links"><span class="ico">🔗</span><span>Links Hub</span></a>
      <a href="/integrations" target="_blank"><span class="ico">🧩</span><span>Integrations</span></a>
      <a data-view="solace" href="/solace"><span class="ico">📡</span><span>Solace Status</span></a>
      <a data-view="zapier" href="/zapier"><span class="ico">⚡</span><span>Zapier Template</span></a>
      <a data-view="logs" href="/logs"><span class="ico">📜</span><span>Activity Logs</span></a>
      <a data-view="settings" href="/settings"><span class="ico">⚙️</span><span>Settings</span></a>
      <a data-view="profile" href="/profile"><span class="ico">👤</span><span>Profile</span></a>
    </nav>
    <div class="side-foot"><div class="mini-card"><b>Command cepat</b><span>/crawl URL · /code task · /crew topic · /help</span></div><div class="mini-card"><b>Theme</b><span>System, dark, light + ukuran font</span></div></div>
  </aside>
  <section class="layout">
    <header class="topbar"><button class="icon-btn menu-btn" id="menuBtn">☰</button><div class="title"><h2 id="viewTitle">Chat-Live</h2><p id="viewDesc">Tanya AI, crawl URL, jalankan chat live, dan tools dari satu halaman.</p></div><div class="spacer"></div><select class="select" id="model"><optgroup label="Groq AI (Fastest)"><option value="llama-3.3-70b-versatile">Llama 3.3 70B</option><option value="qwen/qwen3-32b">Qwen 3 32B</option><option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout</option><option value="openai/gpt-oss-120b">GPT OSS 120B</option><option value="deepseek-r1-distill-llama-70b">DeepSeek R1 70B</option><option value="llama-3.1-8b-instant">Llama 8B Fast</option></optgroup><optgroup label="Google Gemini (Big Context)"><option value="gemini-2.5-flash">Gemini 2.5 Flash</option><option value="gemini-2.5-pro">Gemini 2.5 Pro</option><option value="gemini-2.0-flash">Gemini 2.0 Flash</option><option value="gemini-1.5-pro">Gemini 1.5 Pro</option></optgroup><optgroup label="OpenRouter (Multi-Provider)"><option value="deepseek/deepseek-r1">DeepSeek R1 (Full)</option><option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option><option value="openai/gpt-4o">GPT-4o</option><option value="google/gemini-2.5-flash">Gemini 2.5 (OR)</option></optgroup></select><button class="icon-btn" id="syncNowBtn" title="Sync Now" style="display:flex;align-items:center;gap:6px;"><span style="font-size:14px;">☁️</span><span class="sync-text">Sync Now</span></button><button class="icon-btn" id="themeBtn">🌓</button></header>
    <main class="main">
      <section class="view chat-view active" id="view-chat"><div class="messages" id="messages"></div></section>
      <section class="view" id="view-coding"><div class="code-shell"><aside class="files"><h3>GitHub Workspace</h3><div class="form" style="gap:6px;margin:8px 0;display:grid;"><select id="githubRepo" class="select" style="width:100%;font-size:12px;padding:6px 8px;border-radius:10px;"><option value="roadfx-full-stack">ivansslo/roadfx-full-stack (Private)</option><option value="hermes-agent-cli">ivansslo/hermes-agent-cli (Public)</option><option value="ai-vitality">ivansslo/ai-vitality (Public)</option><option value="roadfx-ai-stack">ivansslo/roadfx-ai-stack (Main)</option><option value="custom">-- Custom Repo --</option></select><div id="customGithubForm" style="display:none;gap:4px;grid-template-columns:1fr 1fr;margin-bottom:2px;"><input id="customGithubOwner" class="pill" placeholder="Owner (ivansslo)" style="font-size:11px;padding:5px;border-radius:8px;background:var(--panel2);"><input id="customGithubRepo" class="pill" placeholder="Repo Name" style="font-size:11px;padding:5px;border-radius:8px;background:var(--panel2);"></div><button class="secondary" id="syncGithub" style="width:100%;font-size:12px;padding:6px;border-radius:10px;font-weight:600;">🔄 Sync Files</button><input id="fileSearch" class="pill" placeholder="🔍 Cari file..." style="width:100%;font-size:12px;padding:6px 10px;border-radius:10px;background:var(--panel2);"></div><div id="fileList"></div></aside>
<div class="editor">
  <div class="editor-head"><input id="fileName" class="pill" value="app.js"><button class="secondary" id="saveFile">Save</button><button class="primary" id="askCode">Generate</button></div>
  <div class="editor-container">
    <pre class="editor-highlight" id="highlightLayer"><code class="language-javascript" id="highlightCode">// AI Coding workspace
// Klik Sync Files untuk load dari repository GitHub Anda.</code></pre>
    <textarea class="editor-textarea" id="codeEditor" spellcheck="false" oninput="updateHighlight()" onscroll="syncScroll()">// AI Coding workspace
// Klik Sync Files untuk load dari repository GitHub Anda.</textarea>
  </div>
  <div class="editor-foot"><input id="codePrompt" class="pill" placeholder="Contoh: buat component sidebar responsive"><button class="primary" id="sendCodePrompt">Ask AI</button></div>
</div>
</div></section>
      <section class="view" id="view-crawl"><div class="page"><h2>🕷️ Crawl4AI</h2><p>Status: endpoint tersedia di gateway. Gunakan form ini atau command <b>/crawl https://contoh.com</b> di chat.</p><div class="two"><div class="card form"><label>URL</label><input id="crawlUrl" placeholder="https://example.com"><label>Mode</label><select id="crawlMode"><option value="crawl4ai">Crawl4AI markdown cleaner</option><option value="crawl">Simple crawl text</option><option value="extract">Extract JSON-LD/OpenGraph</option></select><label>Max length</label><input id="crawlMax" type="number" value="50000"><button class="primary" id="runCrawl">Run Crawl</button></div><pre class="output" id="crawlOutput">Hasil crawl akan muncul di sini.</pre></div></div></section>
      <section class="view" id="view-crew"><div class="page"><h2>🤖 CrewAI</h2><p>Jalankan task agent berurutan lewat Solace task endpoint.</p><div class="card form"><input id="crewTopic" value="AI agents in 2026"><button class="primary" id="runCrew">Run Crew</button><pre class="output" id="crewOutput">Researcher → Analyst → Writer</pre></div></div></section>
      <section class="view" id="view-links"><div class="page"><h2>🔗 Links Hub</h2><p>Sidebar untuk menu page link: Apps, Tools, Skills, dan ClawHub.</p><div class="quick"><button class="secondary" data-link="integrations">Apps</button><button class="secondary" data-link="tools">Tools</button><button class="secondary" data-link="skills">Skills</button><button class="secondary" data-link="hub/plugins">Hub Plugins</button></div><div class="grid" id="linksGrid"></div></div></section>
      <section class="view" id="view-solace"><div class="page"><h2>📡 Solace Status</h2><p>Monitor broker, queues, dan service.</p><div class="quick"><button class="primary" id="refreshSolace">Refresh</button></div><pre class="output" id="solaceOutput">Klik Refresh untuk cek status.</pre></div></section>
      <section class="view" id="view-settings"><div class="page"><h2>⚙️ Settings</h2><p>Tema bawaan sudah tersedia: System, Dark, Light.</p><div class="two"><div class="card form"><label>Theme</label><select id="themeSelect"><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select><label>Font size</label><select id="fontSelect"><option value="13px">Small</option><option value="14px">Normal</option><option value="16px">Large</option></select><label>Gateway API URL</label><input id="apiUrl" placeholder="kosong = current origin"><label>Bearer token</label><input id="tokenInput" type="password" placeholder="Worker token"><button class="primary" id="saveSettings">Save Settings</button></div><div><div class="card"><h3>Catatan keamanan</h3><p style="color:var(--muted);line-height:1.6">Untuk production, simpan token di Cloudflare Worker Secrets dan gunakan auth session. UI ini mendukung token via localStorage agar tidak perlu hardcode di file.</p></div><div class="card" style="margin-top:12px"><h3>Backup & Sinkronisasi KV</h3><p style="color:var(--muted);line-height:1.6;font-size:12px;margin-bottom:12px">Cadangkan semua data lokal (file, riwayat chat, pengaturan) langsung ke Cloudflare Workers KV. Anda dapat memulihkannya kapan saja di perangkat lain.</p><div class="quick" style="display:flex;gap:8px;"><button class="primary" id="btnSyncPush" style="flex:1;">📤 Backup (Push)</button><button class="secondary" id="btnSyncPull" style="flex:1;">📥 Restore (Pull)</button></div><p id="syncStatus" style="font-size:11px;color:var(--muted);margin-top:10px;text-align:center;">Belum disinkronkan.</p></div></div></div></div></section>
      <section class="view" id="view-profile"><div class="page"><h2>👤 Profile</h2><p>Clerk auth + Zapier connected. Login sosial GitHub, GitLab, Google, HuggingFace, Linear, LinkedIn, Notion, X.</p><div class="card"><h3>Identity</h3><p id="profileId" style="color:var(--muted)"></p><div class="quick"><button class="primary" id="clerkLogin">Login with Clerk</button><button class="secondary" id="clerkProfile">Open Profile</button><a class="secondary" href="/zapier" style="text-decoration:none">Zapier Template</a></div><pre class="output" id="clerkStatus">Clerk status loading...</pre></div></div></section>
    
      <section class="view" id="view-dashboard">
        <div class="page">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:20px;">⚡</div>
            <div>
              <h2 style="margin:0;">Realtime Dashboard</h2>
              <div class="muted">Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh.</div>
            </div>
          </div>
          <div class="quick">
            <button class="primary" onclick="window.location.href='/dashboard'">Buka Dashboard Penuh</button>
            <button class="secondary" onclick="window.open('/api', '_blank')">API Base</button>
            <button class="secondary" onclick="window.open('/integrations', '_blank')">Integrations</button>
            <button class="secondary" onclick="window.open('https://rocspace-links.certveis.workers.dev', '_blank')">Hub</button>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Informasi</h3>
            <p class="muted">Halaman Dashboard penuh memiliki layout khusus dan auto-refresh. Klik tombol di atas untuk membuka versi penuh.</p>
          </div>
        </div>
      </section>

      <section class="view" id="view-zapier">
        <div class="page">
          <h2>⚡ Zapier Template Terbaik</h2>
          <p class="muted">Clerk → Zapier → Solace Hermes: user event masuk ke Solace, optional AI welcome, optional CrewAI onboarding.</p>
          <div class="two">
            <div class="card">
              <h3>Trigger</h3>
              <p class="muted">App: Clerk<br>Event: User Created / User Updated / Session Created</p>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>1. Normalize</b><p class="muted">Formatter by Zapier: id, email, name, username, image_url.</p>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>2. POST to Hermes</b>
                <pre class="output">POST /webhook/zapier
Authorization: Bearer &lt;TOKEN&gt;
{"action":"clerk_event","event_type":"user.created","email":"...","user":{...}}</pre>
              </div>
            </div>
            <div class="card">
              <h3>Actions</h3>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>AI Welcome</b><pre class="output">{"action":"chat","model":"llama-3.1-8b-instant","prompt":"Create welcome message..."}</pre>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>CrewAI Onboarding</b><pre class="output">{"action":"crew","topic":"Onboard new user to Solace Hermes"}</pre>
              </div>
              <div style="border-left:3px solid #f97316;padding-left:12px;margin:12px 0">
                <b>Notify / Notion</b><p class="muted">Gunakan Zapier connected apps atau action notify ke Hermes.</p>
              </div>
            </div>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Webhook URL</h3>
            <pre class="output">/webhook/zapier</pre>
            <p class="muted">Credential tetap di Zapier private fields dan Cloudflare Worker Secrets.</p>
            <div class="quick"><a class="secondary" href="/zapier/template" target="_blank" style="text-decoration:none">JSON Template</a></div>
          </div>
        </div>
      </section>

      <section class="view" id="view-logs">
        <div class="page">
          <h2>📜 Activity Logs</h2>
          <p class="muted">Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client.</p>
          <div class="quick">
            <button class="primary" onclick="window.location.href='/logs'">Buka Logs Viewer Penuh</button>
          </div>
          <div class="card" style="margin-top:12px">
            <h3>Server Logs</h3>
            <p class="muted">Server logs dikirim ke Cloudflare console + Solace topics <code>hermes/log/*</code>. Halaman Logs penuh memiliki fitur auto-tail dan filtering dari KV/D1 binding.</p>
          </div>
        </div>
      </section>

    </main>
    <footer class="composer"><div class="cmds"><button data-cmd="/help">/help</button><button data-cmd="/crawl https://">/crawl URL</button><button data-cmd="/code ">/code</button><button data-cmd="/crew ">/crew</button><button data-cmd="Jelaskan fungsi page chat ini">fungsi page chat</button></div><div class="input-row"><textarea id="input" rows="1" placeholder="Message... /crawl https://url, /code buat UI, /crew topic"></textarea><button class="send" id="send">➤</button></div></footer>
  </section>
</div>
<div class="mobile-tabs" id="mobileTabs"><a data-view="dashboard" href="/chat-live#dashboard">🏠</a><a data-view="chat" href="/chat-live" class="active">💬</a><a data-view="coding" href="/chat-live#coding">⌘</a><a data-view="crawl" href="/chat-live#crawl">🕷️</a><a data-view="crew" href="/chat-live#crew">🤖</a><a data-view="links" href="/chat-live#links">🔗</a><a href="/integrations" target="_blank">🧩</a><a data-view="solace" href="/chat-live#solace">📡</a><a data-view="zapier" href="/chat-live#zapier">⚡</a><a data-view="logs" href="/chat-live#logs">📜</a><a data-view="settings" href="/chat-live#settings">⚙️</a><a data-view="profile" href="/chat-live#profile">👤</a></div>
<div class="toast" id="toast"></div>
<script>
var DEFAULT_TOKEN='';
var API_DEFAULT='';
var state={view:'chat',messages:[],files:{'app.js':['// AI Coding workspace','function helloHermes(){','  return "Build UI like codex-mobile-web";','}',''].join(String.fromCharCode(10))},currentFile:'app.js',isGithub:false,githubFilesList:[],githubShas:{}};
var titles={chat:['Chat-Live','Tanya AI, crawl URL, jalankan chat live, dan tools dari satu halaman.'],coding:['AI Coding','Editor mini untuk generate, edit, dan simpan file lokal.'],crawl:['Crawl4AI','Crawl URL menjadi markdown/text lalu kirim ke chat.'],crew:['CrewAI','Jalankan workflow agent.'],links:['Links Hub','Menu page link untuk Apps, Tools, Skills, Hub.'],solace:['Solace Status','Monitor event mesh dan queues.'],settings:['Settings','Theme system/dark/light, font, API, token.'],profile:['Profile','Identitas user dan slot Clerk auth.'],dashboard:['Realtime Dashboard','Control center untuk Chat, CrewAI, Crawl4AI, Zapier, Logs, Solace Event Mesh.'],zapier:['Zapier Template','Clerk → Zapier → Solace Hermes integration.'],logs:['Activity Logs','Logs untuk Crawl4AI, Chat, Zapier, CrewAI/Solace task, Notify, dan UI client.']};
function $(id){return document.getElementById(id)}function api(){return localStorage.getItem('hermes_api')||API_DEFAULT}function token(ask){var t=localStorage.getItem('hermes_token')||DEFAULT_TOKEN;if(!t&&ask!==false){t=prompt('Masukkan TOKEN Worker untuk endpoint protected')||'';if(t)localStorage.setItem('hermes_token',t)}return t}function clientLog(type,data){try{var k='hermes_client_logs';var a=JSON.parse(localStorage.getItem(k)||'[]');a.unshift({type:type,ts:new Date().toISOString(),data:data||{}});if(a.length>300)a.length=300;localStorage.setItem(k,JSON.stringify(a))}catch(e){}}function toast(t){$('toast').textContent=t;$('toast').classList.add('on');setTimeout(function(){$('toast').classList.remove('on')},2400)}
function setTheme(t){document.body.setAttribute('data-theme',t);localStorage.setItem('hermes_theme',t);$('themeSelect').value=t}function cycleTheme(){var a=['system','dark','light'];var c=document.body.getAttribute('data-theme')||'system';setTheme(a[(a.indexOf(c)+1)%a.length])}
function updateHighlight(){
  var editor=$('codeEditor');
  var code=$('highlightCode');
  var layer=$('highlightLayer');
  if(!editor||!code)return;
  var val=editor.value;
  if(val.endsWith('\\n')) val+=' ';
  code.innerHTML=escapeHtml(val);
  var ext=($('fileName').value||'').split('.').pop();
  var lang='javascript';
  if(ext==='py')lang='python';else if(ext==='css')lang='css';else if(ext==='html')lang='html';else if(ext==='json')lang='json';else if(ext==='md')lang='markdown';
  code.className='language-'+lang;
  if(window.Prism) Prism.highlightElement(code);
}
function syncScroll(){
  var editor=$('codeEditor');
  var layer=$('highlightLayer');
  if(!editor||!layer)return;
  layer.scrollTop=editor.scrollTop;
  layer.scrollLeft=editor.scrollLeft;
}
function initSettings(){setTheme(localStorage.getItem('hermes_theme')||'system');var fs=localStorage.getItem('hermes_font')||'14px';document.documentElement.style.setProperty('--fs',fs);$('fontSelect').value=fs;$('apiUrl').value=localStorage.getItem('hermes_api')||'';$('tokenInput').value=localStorage.getItem('hermes_token')||'';$('profileId').textContent='Visitor ID: '+getUid();var sm=localStorage.getItem('hermes_model');if(sm&&$('model'))$('model').value=sm}
function getUid(){var u=localStorage.getItem('hermes_uid');if(!u){u='user-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.setItem('hermes_uid',u)}return u}
function nav(v){
  clientLog('ui.nav',{view:v});
  state.view=v;
  document.querySelectorAll('[data-view]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-view')===v)});
  document.querySelectorAll('.view').forEach(function(x){x.classList.remove('active')});
  if($('view-'+v)) $('view-'+v).classList.add('active');
  if(titles[v]){
    $('viewTitle').textContent=titles[v][0];
    $('viewDesc').textContent=titles[v][1];
  }
  $('sidebar').classList.remove('open');
  if(v==='links')loadLinks('integrations');
  var p='/'+v;
  if(v==='chat') p='/chat-live';
  else if(v==='crawl') p='/crawl4ai';
  if(history.pushState && location.pathname!==p) history.pushState(null,null,p);
}
function escapeHtml(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function renderMessages(){var box=$('messages');box.innerHTML='';if(!state.messages.length){box.appendChild(welcomeNode());return}state.messages.forEach(function(m){var d=document.createElement('div');d.className='msg '+m.role;d.innerHTML=(m.badge?'<span class="badge">'+m.badge+'</span>':'')+format(m.content);box.appendChild(d)});box.scrollTop=box.scrollHeight}
function welcomeNode(){var w=document.createElement('div');w.className='welcome';w.innerHTML='<div class="hero"><div class="hero-card"><span class="badge">✨ Solace Hermes v5.0.0 "Omni"</span><h2>AI Agent Hub: Chat, CrewAI, Crawl4AI, Solace, dan integrasi aktif.</h2><p>Dashboard ini berisi keterangan fungsi dan koneksi semua komponen: Cloudflare Workers, Chat, CrewAI Termux, Zapier, CF AI Factory, Clerk, Notion/ClawLink, Crawl4AI, domain certveis.space, GitHub/GitLab, dan Termux CLI.</p><div class="quick"><a class="secondary" href="/dashboard" style="text-decoration:none">Dashboard</a><button data-go="chat">Chat</button><button data-go="crew">CrewAI</button><button data-go="crawl">Crawl4AI</button><button data-go="links">Hub</button><button data-go="solace">Solace</button></div></div><div class="hero-card"><div class="stats"><div class="stat"><b>5</b><span>CF Workers</span></div><div class="stat"><b>25+</b><span>Endpoints</span></div><div class="stat"><b>20</b><span>Integrations</span></div><div class="stat"><b>9</b><span>Domains</span></div></div></div></div><div class="grid"><div class="feature" data-go="chat"><div class="big">💬</div><h3>Chat</h3><p>20+ models, 3 modes, Clerk auth slot, streaming, command /crawl /code /crew.</p></div><div class="feature" data-go="solace"><div class="big">📡</div><h3>Solace</h3><p>Event mesh connected, 5 queues, Singapore RoClace cluster.</p></div><div class="feature" data-go="crew"><div class="big">🤖</div><h3>CrewAI</h3><p>v1.15.1 running di Termux, workflow Researcher → Analyst → Writer.</p></div><div class="feature" data-go="chat"><div class="big">⚡</div><h3>Zapier</h3><p>Connected ke CrewAI dan webhook endpoint /webhook/zapier.</p></div><div class="feature" data-go="links"><div class="big">🎨</div><h3>CF AI Factory</h3><p>60 public models untuk chat, image, TTS, STT, embeddings, translate, vision.</p></div><div class="feature" data-go="profile"><div class="big">🔐</div><h3>Clerk</h3><p>8 social logins: GitHub, GitLab, Google, HuggingFace, Linear, LinkedIn, Notion, X.</p></div><div class="feature" data-go="links"><div class="big">📝</div><h3>Notion</h3><p>45 tools via ClawLink, siap dipanggil dari Links Hub/tool execute.</p></div><div class="feature" data-go="crawl"><div class="big">🕷️</div><h3>Crawl4AI</h3><p>/crawl4ai endpoint aktif dan command /crawl URL di chat.</p></div><div class="feature" data-go="links"><div class="big">🔗</div><h3>20 integrations</h3><p>ClawHub, ClawLink, Honcho, Solace, Zapier, Tailscale, Clerk dan lainnya.</p></div><div class="feature" data-go="settings"><div class="big">🌐</div><h3>9 domains</h3><p>certveis.space domains mapped untuk app, AI gateway, webhook, factory, hub.</p></div><div class="feature" data-go="coding"><div class="big">📦</div><h3>4 repos synced</h3><p>Source GitHub + GitLab dengan UI, Worker, docs, dan scripts.</p></div><div class="feature" data-go="coding"><div class="big">📱</div><h3>Termux CLI</h3><p>hermes run works; CrewAI dan CLI operasional dari Termux.</p></div></div>';setTimeout(function(){w.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){nav(b.getAttribute('data-go'))}})},0);return w}
function format(s){s=escapeHtml(s);s=s.replace(/\n/g,'<br>');return s}
function add(role,content,badge){state.messages.push({role:role,content:content,badge:badge});renderMessages()}
async function send(){var text=$('input').value.trim();clientLog('chat.send',{text:text.slice(0,120)});if(!text)return;$('input').value='';autoSize();add('user',text);if(text==='/help'){add('ai','Perintah:\\n/crawl https://url = crawl halaman\\n/code task = kirim task coding ke AI\\n/crew topic = jalankan crew task\\nTema ada di Settings: System, Dark, Light.','Help');return}if(text.indexOf('/crawl ')===0){runCrawlFromChat(text.replace('/crawl ','').trim());return}if(text.indexOf('/code ')===0){nav('coding');$('codePrompt').value=text.replace('/code ','').trim();askCoding();return}if(text.indexOf('/crew ')===0){nav('crew');$('crewTopic').value=text.replace('/crew ','').trim();runCrew();return}await aiChat(text)}
async function aiChat(text){
  add('system','Thinking...');
  var max=3,delay=1000;
  for(var attempt=0;attempt<=max;attempt++){
    try{
      var msgs=state.messages.filter(function(m){return m.role==='user'||m.role==='ai'}).slice(-12).map(function(m){return{role:m.role==='ai'?'assistant':'user',content:m.content}});
      if(msgs.length>0&&msgs[0].role!=='system'){
        msgs.unshift({role:'system',content:'You are Solace Hermes AI, a highly capable multi-model assistant. Respond concisely and effectively.'});
      }
      var res=await fetch(api()+'/ai/stream',{
        method:'POST',
        headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},
        body:JSON.stringify({model:$('model').value,messages:msgs,max_tokens:4096,stream:true})
      });
      if(!res.ok){
        if(attempt<max&&(res.status===401||res.status>=500)){
          await new Promise(function(r){setTimeout(r,delay)});
          delay*=2;
          continue
        }
        state.messages.pop();renderMessages();
        var er=await res.text();
        add('ai','Error '+res.status+': '+er,'Gateway');
        return
      }
      state.messages.pop();renderMessages();
      var full='';
      var reader=res.body.getReader();
      var dec=new TextDecoder();
      var buf='';
      add('ai','',$('model').value);
      while(true){
        var rv=await reader.read();
        if(rv.done)break;
        buf+=dec.decode(rv.value,{stream:true});
        var lines=buf.split('\n');
        buf=lines.pop()||'';
        for(var i=0;i<lines.length;i++){
          var l=lines[i];
          if(l.indexOf('data: ')!==0)continue;
          var dd=l.slice(6);
          if(dd==='[DONE]')continue;
          try{
            var j=JSON.parse(dd);
            var delta=j.choices&&j.choices[0]&&j.choices[0].delta&&(j.choices[0].delta.content||j.choices[0].delta.reasoning||j.choices[0].delta.reasoning_content)||'';
            if(delta){
              full+=delta;
              state.messages[state.messages.length-1].content=full;
              renderMessages();
            }
          }catch(e){}
        }
      }
      return
    }catch(e){
      if(attempt<max){
        await new Promise(function(r){setTimeout(r,delay)});
        delay*=2;
        continue
      }
      state.messages.pop();renderMessages();
      add('ai','Error: '+e.message,'Gateway');
      return
    }
  }
}
async function runCrawlFromChat(url){if(!url){add('ai','Format: /crawl https://example.com','Crawl4AI');return}add('system','Crawling '+url+' ...');try{var r=await fetch(api()+'/crawl4ai',{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({url:url,max_length:30000})});var d=await r.json();state.messages.pop();renderMessages();if(d.error){add('ai','Crawl error: '+d.error,'Crawl4AI');return}add('ai','Title: '+(d.title||'-')+'\\nURL: '+d.url+'\\nLength: '+d.content_length+'\\n\\n'+(d.content||'').slice(0,6000),'Crawl4AI')}catch(e){state.messages.pop();renderMessages();add('ai','Crawl error: '+e.message,'Crawl4AI')}} 
async function runCrawl(){var url=$('crawlUrl').value.trim();clientLog('crawl.run',{url:url,mode:$('crawlMode').value});if(!url)return toast('Masukkan URL');$('crawlOutput').textContent='Crawling...';var mode=$('crawlMode').value;var path=mode==='extract'?'/crawl4ai/extract':(mode==='crawl'?'/crawl':'/crawl4ai');try{var r=await fetch(api()+path,{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({url:url,max_length:parseInt($('crawlMax').value||'50000')})});var d=await r.json();$('crawlOutput').textContent=JSON.stringify(d,null,2)}catch(e){$('crawlOutput').textContent='Error: '+e.message}}
async function runCrew(){var topic=$('crewTopic').value.trim();clientLog('crew.run',{topic:topic});$('crewOutput').textContent='Running crew task...';try{var r=await fetch(api()+'/solace/task',{method:'POST',headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({type:'chat',prompt:'You are a research crew. Research, analyze, and write a report about: '+topic,model:'llama-3.3-70b-versatile',max_tokens:4096})});var d=await r.json();$('crewOutput').textContent=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||JSON.stringify(d,null,2)}catch(e){$('crewOutput').textContent='Error: '+e.message}}
function renderFiles(){
  var list=$('fileList');
  if(!list) return;
  list.innerHTML='';
  var keyword=($('fileSearch')?$('fileSearch').value.trim().toLowerCase():'');
  if(state.isGithub){
    var items=state.githubFilesList||[];
    if(keyword){
      items=items.filter(function(x){return x.path.toLowerCase().indexOf(keyword)>=0});
    }
    if(!items.length){
      var empty=document.createElement('div');
      empty.className='file-item';
      empty.style.color='var(--muted)';
      empty.style.fontSize='12px';
      empty.textContent='Tidak ada file ditemukan';
      list.appendChild(empty);
      return;
    }
    items.forEach(function(item){
      var n=item.path;
      var d=document.createElement('div');
      d.className='file-item '+(n===state.currentFile?'active':'');
      var isLoaded=state.files[n]!==undefined;
      d.textContent=(isLoaded?'🟢 ':'📄 ')+n;
      d.onclick=async function(){
        saveCurrent();
        state.currentFile=n;
        $('fileName').value=n;
        if(state.files[n]!==undefined){
          $('codeEditor').value=state.files[n];
          renderFiles();
          updateHighlight();
        }else{
          $('codeEditor').value='// Loading content dari GitHub...';
          try{
            var r=await fetch('/api/github/file?owner=ivansslo&repo='+$('githubRepo').value+'&path='+encodeURIComponent(n));
            if(!r.ok){var er=await r.json();throw new Error(er.error||'Failed to load')};
            var fd=await r.json();
            var decoded='';
            if(fd.encoding==='base64'){
              decoded=decodeURIComponent(escape(atob(fd.content.replace(/s/g,''))));
            }else{
              decoded=fd.content||'';
            }
            state.files[n]=decoded;
            state.githubShas[n]=fd.sha;
            if(state.currentFile===n){
              $('codeEditor').value=decoded;
              updateHighlight();
            }
            renderFiles();
          }catch(e){
            if(state.currentFile===n){
              $('codeEditor').value='// Gagal load file: '+e.message;
            }
            toast('Gagal load file: '+e.message);
          }
        }
      };
      list.appendChild(d);
    });
  }else{
    var keys=Object.keys(state.files);
    if(keyword){
      keys=keys.filter(function(x){return x.toLowerCase().indexOf(keyword)>=0});
    }
    keys.forEach(function(n){
      var d=document.createElement('div');
      d.className='file-item '+(n===state.currentFile?'active':'');
      d.textContent='📄 '+n;
      d.onclick=function(){
        saveCurrent();
        state.currentFile=n;
        $('fileName').value=n;
        $('codeEditor').value=state.files[n];
        renderFiles();
        updateHighlight();
      };
      list.appendChild(d);
    });
  }
}
function saveCurrent(){
  clientLog('coding.save',{file:$('fileName').value||state.currentFile});
  var n=$('fileName').value||state.currentFile;
  state.files[n]=$('codeEditor').value;
  state.currentFile=n;
  if(!state.isGithub){
    localStorage.setItem('hermes_files',JSON.stringify(state.files));
  }
  renderFiles();
}
async function saveGithubFile(){
  saveCurrent();
  if(!state.isGithub){
    toast('File saved local');
    return;
  }
  var n=state.currentFile;
  var content=state.files[n]||'';
  var sha=state.githubShas[n];
  var selectedRepo=$('githubRepo').value;
  toast('Mengirim commit ke GitHub...');
  try{
    var r=await fetch('/api/github/save',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        owner:'ivansslo',
        repo:selectedRepo,
        path:n,
        content:content,
        sha:sha
      })
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error||'Failed to save');
    state.githubShas[n]=d.sha;
    toast('Berhasil commit ke GitHub!');
    renderFiles();
  }catch(e){
    toast('Gagal commit: '+e.message);
  }
}
async function syncGithubFiles(){
  var selectedRepo=$('githubRepo').value;
  var list=$('fileList');
  list.innerHTML='<div class="file-item" style="color:var(--muted)">🔄 Syncing file tree...</div>';
  try{
    var r=await fetch('/api/github/files?owner=ivansslo&repo='+selectedRepo);
    if(!r.ok){var er=await r.json();throw new Error(er.error||'Failed to sync')};
    var d=await r.json();
    state.isGithub=true;
    state.githubFilesList=d.files||[];
    state.githubShas={};
    (d.files||[]).forEach(function(item){
      state.githubShas[item.path]=item.sha;
    });
    if(d.files&&d.files.length>0){
      var first=d.files[0].path;
      state.currentFile=first;
      $('fileName').value=first;
      $('codeEditor').value='// Loading content...';
      renderFiles();
      var fr=await fetch('/api/github/file?owner=ivansslo&repo='+selectedRepo+'&path='+encodeURIComponent(first));
      if(fr.ok){
        var fd=await fr.json();
        var decoded='';
        if(fd.encoding==='base64'){
          decoded=decodeURIComponent(escape(atob(fd.content.replace(/s/g,''))));
        }else{
          decoded=fd.content||'';
        }
        state.files[first]=decoded;
        state.githubShas[first]=fd.sha;
        if(state.currentFile===first){
          $('codeEditor').value=decoded;
        }
      }else{
        $('codeEditor').value='// Click file to load content';
      }
    }else{
      $('codeEditor').value='// No files found';
    }
    renderFiles();
    toast('Sync success!');
  }catch(e){
    list.innerHTML='<div class="file-item" style="color:var(--bad)">⚠️ Error: '+escapeHtml(e.message)+'</div>';
    toast('Sync failed: '+e.message);
  }
}
async function askCoding(){var p=$('codePrompt').value.trim()||'Review dan tingkatkan kode ini';var code=$('codeEditor').value;nav('chat');$('input').value='';add('user','/code '+p);await aiChat('Anda adalah AI coding assistant. Task: '+p+'\\n\\nFile: '+$('fileName').value+'\\nKode saat ini:\\n'+code)}
async function syncAllData() {
  saveCurrent();
  var filesData = null;
  try {
    filesData = JSON.parse(localStorage.getItem('hermes_files') || 'null');
  } catch(e) {}
  if (!filesData) filesData = state.files || {};

  var payload = {
    files: filesData,
    messages: state.messages || [],
    currentFile: state.currentFile || '',
    settings: {
      theme: localStorage.getItem('hermes_theme'),
      font: localStorage.getItem('hermes_font'),
      api: localStorage.getItem('hermes_api'),
      token: localStorage.getItem('hermes_token') || '',
      model: localStorage.getItem('hermes_model')
    },
    ts: new Date().toISOString()
  };

  var syncStatus = $('syncStatus');
  if (syncStatus) syncStatus.textContent = 'Menghubungkan ke Workers KV...';

  try {
    var r = await fetch('/sync', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token()
      },
      body: JSON.stringify(payload)
    });
    var d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Sync failed');
    toast('Data berhasil disinkronkan ke Cloudflare KV!');
    if (syncStatus) syncStatus.textContent = 'Terakhir disinkronkan: ' + new Date().toLocaleTimeString();
    return d;
  } catch(e) {
    toast('Gagal sinkronisasi: ' + e.message);
    if (syncStatus) syncStatus.textContent = 'Gagal syncAllData: ' + e.message;
    throw e;
  }
}
async function pushSync(){
  var btnSyncPush=$('btnSyncPush');
  if(btnSyncPush) btnSyncPush.disabled=true;
  try{
    await syncAllData();
  }catch(e){}finally{
    if(btnSyncPush) btnSyncPush.disabled=false;
  }
}
async function pullSync(){
  var btnSyncPull=$('btnSyncPull');
  var syncStatus=$('syncStatus');
  if(!confirm('Apakah Anda yakin ingin me-restore data? Ini akan menimpa file, chat history, dan pengaturan saat ini.')) return;
  if(btnSyncPull) btnSyncPull.disabled=true;
  if(syncStatus) syncStatus.textContent='Mengunduh data dari KV...';
  try{
    var r=await fetch('/sync',{
      method:'GET',
      headers:{
        'Authorization':'Bearer '+token()
      }
    });
    var d=await r.json();
    if(!r.ok)throw new Error(d.error||'Restore failed');
    if(d.empty){
      toast('Tidak ada data cadangan di KV.');
      if(syncStatus) syncStatus.textContent='Belum ada cadangan di KV.';
      return;
    }
    if(d.files)state.files=d.files;
    if(d.messages)state.messages=d.messages;
    if(d.currentFile)state.currentFile=d.currentFile;
    localStorage.setItem('hermes_files',JSON.stringify(state.files));
    if(d.settings){
      if(d.settings.theme){
        localStorage.setItem('hermes_theme',d.settings.theme);
        setTheme(d.settings.theme);
      }
      if(d.settings.font){
        localStorage.setItem('hermes_font',d.settings.font);
        document.documentElement.style.setProperty('--fs',d.settings.font);
        $('fontSelect').value=d.settings.font;
      }
      if(d.settings.api){
        localStorage.setItem('hermes_api',d.settings.api);
        $('apiUrl').value=d.settings.api;
      }
      if(d.settings.token){
        localStorage.setItem('hermes_token',d.settings.token);
        $('tokenInput').value=d.settings.token;
      }
      if(d.settings.model&&$('model')){
        localStorage.setItem('hermes_model',d.settings.model);
        $('model').value=d.settings.model;
      }
    }
    renderFiles();
    renderMessages();
    if($('fileName')&&$('codeEditor')){
      $('fileName').value=state.currentFile;
      $('codeEditor').value=state.files[state.currentFile]||'';
    }
    toast('Berhasil memulihkan data dari Workers KV!');
    if(syncStatus) syncStatus.textContent='Dipulihkan pada: '+new Date().toLocaleTimeString();
  }catch(e){
    toast('Gagal memulihkan: '+e.message);
    if(syncStatus) syncStatus.textContent='Gagal restore: '+e.message;
  }finally{
    if(btnSyncPull) btnSyncPull.disabled=false;
  }
}
async function loadLinks(kind){$('linksGrid').innerHTML='<div class="card">Loading...</div>';var path=kind==='skills'?'/skills':(kind.indexOf('hub/')===0?'/'+kind:'/link/'+kind);try{var r=await fetch(api()+path);var d=await r.json();var items=d.items||d.results||d.integrations||d.tools||d.skills||[];$('linksGrid').innerHTML='';items.slice(0,36).forEach(function(x){var name=x.displayName||x.name||x.slug||x.integration||'Item';var desc=x.summary||x.description||x.connectionLabel||'';var c=document.createElement('div');c.className='feature';c.innerHTML='<div class="big">🔹</div><h3>'+escapeHtml(name)+'</h3><p>'+escapeHtml(desc).slice(0,120)+'</p>';c.onclick=function(){nav('chat');$('input').value='Tell me about '+name;$('input').focus()};$('linksGrid').appendChild(c)});if(!items.length)$('linksGrid').innerHTML='<div class="card">No result.</div>'}catch(e){$('linksGrid').innerHTML='<div class="card">Error: '+escapeHtml(e.message)+'</div>'}}
async function refreshSolace(){$('solaceOutput').textContent='Loading...';try{var all=await Promise.all(['/solace/status','/solace/queues','/solace/service'].map(function(p){return fetch(api()+p).then(function(r){return r.json()}).catch(function(e){return{error:e.message}})}));$('solaceOutput').textContent=JSON.stringify({status:all[0],queues:all[1],service:all[2]},null,2)}catch(e){$('solaceOutput').textContent='Error: '+e.message}}
function autoSize(){$('input').style.height='auto';$('input').style.height=Math.min($('input').scrollHeight,150)+'px'}

var clerkObj=null;
async function initClerkLite(){try{var cfg=await fetch('/auth/clerk-config').then(function(r){return r.json()});if(!cfg.configured){$('clerkStatus').textContent='Clerk publishable key not configured';return}var sc=document.createElement('script');sc.async=true;sc.crossOrigin='anonymous';sc.setAttribute('data-clerk-publishable-key',cfg.publishableKey);sc.src='https://'+cfg.domain+'/npm/@clerk/clerk-js@5/dist/clerk.browser.js';sc.onload=function(){if(!window.Clerk){$('clerkStatus').textContent='Clerk script loaded but unavailable';return}window.Clerk.load().then(function(){clerkObj=window.Clerk;updateClerkUi();clerkObj.addListener(updateClerkUi)}).catch(function(e){$('clerkStatus').textContent='Clerk load error: '+e.message})};document.head.appendChild(sc)}catch(e){try{$('clerkStatus').textContent='Clerk init error: '+e.message}catch(_){}}}
function updateClerkUi(){try{var c=window.Clerk;if(!c||!$('clerkStatus'))return;if(c.user){var u=c.user;var email=(u.emailAddresses&&u.emailAddresses[0])?u.emailAddresses[0].emailAddress:'';var username=u.username||u.firstName||'';$('clerkStatus').textContent=JSON.stringify({signedIn:true,id:u.id,name:u.firstName||u.username||'User',email:email},null,2);
  var sel=$('model');
  if(sel&&(username==='ivansslo'||email==='ivansuselo@gmail.com')){
    if(!sel.querySelector('option[value="groq/deepseek-r1-distill-llama-70b"]')){
      var g1=document.createElement('option');g1.value='groq/deepseek-r1-distill-llama-70b';g1.textContent='Groq DeepSeek R1 70B';sel.appendChild(g1);
      var g2=document.createElement('option');g2.value='groq/deepseek-r1-distill-qwen-32b';g2.textContent='Groq DeepSeek R1 32B';sel.appendChild(g2);
      var g3=document.createElement('option');g3.value='groq/llama-3.3-70b-specdec';g3.textContent='Groq Llama 3.3 SpecDec';sel.appendChild(g3);
      var g4=document.createElement('option');g4.value='groq/qwen-2.5-coder-32b';g4.textContent='Groq Qwen 2.5 Coder 32B';sel.appendChild(g4);
    }
  }
  fetch('/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'clerk_signed_in',clerkUser:{id:u.id,email:email,name:u.firstName||u.username||''}})}).catch(function(){})}else{$('clerkStatus').textContent='Guest mode. Klik Login with Clerk untuk social login.'}}catch(e){}}
document.querySelectorAll('[data-view]').forEach(function(b){
  b.onclick=function(e){
    if(e.ctrlKey||e.metaKey||e.shiftKey) return;
    e.preventDefault();
    nav(b.getAttribute('data-view'));
  }
});
document.querySelectorAll('[data-cmd]').forEach(function(b){b.onclick=function(){$('input').value=b.getAttribute('data-cmd');$('input').focus();autoSize()}});document.querySelectorAll('[data-link]').forEach(function(b){b.onclick=function(){loadLinks(b.getAttribute('data-link'))}});
$('menuBtn').onclick=function(){$('sidebar').classList.toggle('open')};$('newChat').onclick=function(){state.messages=[];nav('chat');renderMessages()};$('themeBtn').onclick=cycleTheme;$('syncNowBtn').onclick=async function(){var btn=$('syncNowBtn');btn.disabled=true;var origText=btn.innerHTML;btn.innerHTML='<span style="font-size:14px;">🔄</span><span class="sync-text">Syncing...</span>';try{await syncAllData()}catch(e){}finally{btn.disabled=false;btn.innerHTML=origText}};$('send').onclick=send;$('input').oninput=autoSize;$('input').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};$('runCrawl').onclick=runCrawl;$('runCrew').onclick=runCrew;$('refreshSolace').onclick=refreshSolace;$('saveSettings').onclick=async function(){setTheme($('themeSelect').value);localStorage.setItem('hermes_font',$('fontSelect').value);document.documentElement.style.setProperty('--fs',$('fontSelect').value);localStorage.setItem('hermes_api',$('apiUrl').value.trim());if($('tokenInput').value.trim())localStorage.setItem('hermes_token',$('tokenInput').value.trim());toast('Settings tersimpan');try{await syncAllData()}catch(e){}};$('themeSelect').onchange=function(){setTheme(this.value)};$('fontSelect').onchange=function(){document.documentElement.style.setProperty('--fs',this.value);localStorage.setItem('hermes_font',this.value)};if($('model'))$('model').onchange=function(){localStorage.setItem('hermes_model',this.value)};$('syncGithub').onclick=syncGithubFiles;$('fileSearch').oninput=renderFiles;$('saveFile').onclick=saveGithubFile;$('btnSyncPush').onclick=pushSync;$('btnSyncPull').onclick=pullSync;$('askCode').onclick=askCoding;$('sendCodePrompt').onclick=askCoding;if($('clerkLogin'))$('clerkLogin').onclick=function(){if(clerkObj)clerkObj.openSignIn();else toast('Clerk loading...')};if($('clerkProfile'))$('clerkProfile').onclick=function(){if(clerkObj&&clerkObj.user)clerkObj.openUserProfile();else if(clerkObj)clerkObj.openSignIn();else toast('Clerk loading...')};
function routeFromHash(){
  var h=(location.hash||'').replace('#','');
  if(!h){
    var p=location.pathname.replace('/','');
    if(p==='crawl4ai') h='crawl';
    else if(p==='chat-live'||p==='chat') h='chat';
    else if(document.getElementById('view-'+p)) h=p;
  }
  if(h&&document.getElementById('view-'+h))nav(h);
}
window.addEventListener('hashchange',routeFromHash);
window.addEventListener('popstate',routeFromHash);
initSettings();try{var saved=JSON.parse(localStorage.getItem('hermes_files')||'null');if(saved)state.files=saved}catch(e){}renderFiles();renderMessages();routeFromHash();initClerkLite();updateHighlight();
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markdown.min.js"></script>
</body>
</html>
`;
