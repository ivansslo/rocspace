addEventListener('fetch', event => { event.respondWith(handleRequest(event.request)); });

var CF_AI_TOKEN = (typeof CF_AI_KEY !== 'undefined' ? CF_AI_KEY : '');
var CF_ACCOUNT = '37c44b4d3f192a627d20e46bdf910e79';
var TK = (typeof TOKEN !== 'undefined' ? TOKEN : '');
var CF_AI_URL = 'https://api.cloudflare.com/client/v4/accounts/' + CF_ACCOUNT + '/ai/run/';

async function handleRequest(request) {
  var url = new URL(request.url);
  var path = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:cors()});

  if (path === '/' || path === '') return json({
    name: 'Solace Hermes AI Factory',
    version: '1.0',
    engine: 'Cloudflare Workers AI',
    models: {
      'Text Generation': ['llama-3.3-70b', 'llama-3.2-3b', 'gemma-4-26b', 'deepseek-r1-32b', 'qwen3-30b', 'gpt-oss-120b'],
      'Image Generation': ['flux-1-schnell', 'flux-2-klein-9b', 'stable-diffusion-xl'],
      'Speech': ['whisper (STT)', 'melotts (TTS)', 'aura-2-en'],
      'Embeddings': ['bge-m3', 'qwen3-embedding', 'bge-small-en'],
      'Translation': ['m2m100-1.2b'],
      'Vision': ['llava-1.5-7b']
    },
    endpoints: {
      'POST /chat': 'AI chat (text generation)',
      'POST /image': 'Generate image (Flux/SD)',
      'POST /speech/tts': 'Text to speech',
      'POST /speech/stt': 'Speech to text',
      'POST /embed': 'Text embeddings',
      'POST /translate': 'Translation',
      'POST /vision': 'Image analysis',
      'GET /models': 'List models',
      'GET /health': 'Health check',
    },
    auth: 'Set TOKEN as a Cloudflare Worker Secret; send Authorization: Bearer <token>'
  });

  if (path === '/health') return json({status:'ok', engine:'cloudflare-ai', ts:new Date().toISOString()});

  if (request.method === 'GET' && ['/chat','/image','/speech/tts','/speech/stt','/embed','/translate','/vision'].indexOf(path) >= 0) {
    return json({name:'Solace Hermes CF AI Factory',endpoint:path,method:'POST',auth:'Authorization: Bearer <TOKEN>',examples:{chat:{url:'/chat',body:{prompt:'Hello',model:'@cf/meta/llama-3.3-70b-instruct-fp8-fast'}},image:{url:'/image',body:{prompt:'futuristic AI hub',model:'@cf/black-forest-labs/flux-1-schnell'}},translate:{url:'/translate',body:{text:'Hello',from:'en',to:'id'}},embed:{url:'/embed',body:{text:'Solace Hermes'}},vision:{url:'/vision',body:{image:[],prompt:'Describe this image'}}}});
  }

  if (path === '/models') {
    try {
      var r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + CF_ACCOUNT + '/ai/models/search', {headers:{'Authorization':'Bearer '+CF_AI_TOKEN}});
      return json(await r.json());
    } catch(e) { return json({error:e.message},502); }
  }

  // Auth required below
  var auth = request.headers.get('Authorization') || '';
  var qt = url.searchParams.get('token') || '';
  if (!TK || (auth !== 'Bearer ' + TK && qt !== TK)) return json({error:'Unauthorized'}, 401);

  // Chat
  if (path === '/chat' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    var model = b.model || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    if (model.indexOf('@cf/') !== 0) model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    var messages = b.messages || [{role:'user',content:b.prompt||'hello'}];
    try {
      var r = await fetch(CF_AI_URL + model, {method:'POST', headers:{'Authorization':'Bearer '+CF_AI_TOKEN,'Content-Type':'application/json'}, body:JSON.stringify({messages:messages,stream:false})});
      var d = await r.json();
      if (d.success) return json({choices:[{message:{role:'assistant',content:d.result.response}}],model:model});
      return json(d, 500);
    } catch(e) { return json({error:e.message},502); }
  }

  // Image generation
  if (path === '/image' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    var prompt = b.prompt || 'a beautiful landscape';
    var model = b.model || '@cf/black-forest-labs/flux-1-schnell';
    try {
      var r = await fetch(CF_AI_URL + model, {method:'POST', headers:{'Authorization':'Bearer '+CF_AI_TOKEN,'Content-Type':'application/json'}, body:JSON.stringify({prompt:prompt,num_steps:b.steps||4})});
      var img = await r.arrayBuffer();
      return new Response(img, {headers:{'Content-Type':'image/png','Access-Control-Allow-Origin':'*'}});
    } catch(e) { return json({error:e.message},502); }
  }

  // TTS
  if (path === '/speech/tts' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    try {
      var r = await fetch(CF_AI_URL + '@cf/myshell-ai/melotts', {method:'POST', headers:{'Authorization':'Bearer '+CF_AI_TOKEN,'Content-Type':'application/json'}, body:JSON.stringify({prompt:b.text||'Hello'})});
      var audio = await r.arrayBuffer();
      return new Response(audio, {headers:{'Content-Type':'audio/wav','Access-Control-Allow-Origin':'*'}});
    } catch(e) { return json({error:e.message},502); }
  }

  // Embeddings
  if (path === '/embed' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    var text = b.text || b.input || '';
    try {
      var r = await fetch(CF_AI_URL + '@cf/baai/bge-m3', {method:'POST', headers:{'Authorization':'Bearer '+CF_AI_TOKEN,'Content-Type':'application/json'}, body:JSON.stringify({text:[text]})});
      return json(await r.json());
    } catch(e) { return json({error:e.message},502); }
  }

  // Translate
  if (path === '/translate' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    try {
      var r = await fetch(CF_AI_URL + '@cf/meta/m2m100-1.2b', {method:'POST', headers:{'Authorization':'Bearer '+CF_AI_TOKEN,'Content-Type':'application/json'}, body:JSON.stringify({text:b.text||'',source_lang:b.from||'en',target_lang:b.to||'id'})});
      return json(await r.json());
    } catch(e) { return json({error:e.message},502); }
  }

  // Vision
  if (path === '/vision' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    try {
      var r = await fetch(CF_AI_URL + '@cf/llava-hf/llava-1.5-7b-hf', {method:'POST', headers:{'Authorization':'Bearer '+CF_AI_TOKEN,'Content-Type':'application/json'}, body:JSON.stringify({image:b.image||[],prompt:b.prompt||'Describe this image'})});
      return json(await r.json());
    } catch(e) { return json({error:e.message},502); }
  }

  return json({error:'Not found'},404);
}

function json(d,s){return new Response(JSON.stringify(d,null,2),{status:s||200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}})}
function cors(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}}
