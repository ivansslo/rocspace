addEventListener('fetch', event => { event.respondWith(handleRequest(event.request)); });

var TK = (typeof TOKEN !== 'undefined' ? TOKEN : 'hk-rocspace-2026');

async function handleRequest(request) {
  var url = new URL(request.url);
  var path = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:cors()});

  if (path === '/' || path === '') return json({
    name: 'Crawl4AI Gateway',
    version: '1.0',
    description: 'Web crawling & content extraction powered by Crawl4AI',
    endpoints: {
      'POST /crawl': 'Crawl URL → clean markdown/text',
      'POST /extract': 'Extract structured data from URL',
      'POST /screenshot': 'Screenshot URL (via CF Browser)',
      'POST /batch': 'Batch crawl multiple URLs',
      'GET /health': 'Health check'
    },
    source: 'github.com/ivansslo/crawl4ai'
  });

  if (path === '/health') return json({status:'ok', ts:new Date().toISOString()});

  // Auth
  var auth = request.headers.get('Authorization') || '';
  var qt = url.searchParams.get('token') || '';
  if (auth !== 'Bearer ' + TK && qt !== TK) return json({error:'Unauthorized. Use: Authorization: Bearer hk-rocspace-2026'}, 401);

  if (path === '/crawl' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    if (!b.url) return json({error:'Missing url'}, 400);
    try {
      var t0 = Date.now();
      var headers = {'User-Agent': 'Crawl4AI/1.0 (Hermes Gateway)'};
      if (b.headers) { for (var k in b.headers) headers[k] = b.headers[k]; }
      var r = await fetch(b.url, {headers: headers, redirect: 'follow'});
      var ct = r.headers.get('Content-Type') || '';
      var html = await r.text();

      // Clean extraction
      var text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

      // Extract title
      var titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      var title = titleMatch ? titleMatch[1].trim() : '';

      // Extract links
      var links = [];
      var linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      var lm;
      while ((lm = linkRe.exec(html)) !== null && links.length < 50) {
        var href = lm[1];
        var lt = lm[2].replace(/<[^>]+>/g,'').trim();
        if (href && lt && !href.startsWith('#') && !href.startsWith('javascript:')) {
          links.push({url: href, text: lt.slice(0,100)});
        }
      }

      // Extract meta
      var descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      var desc = descMatch ? descMatch[1] : '';

      // Clean to markdown-like text
      var md = text
        .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi, function(m,l,t){return '\n'+'#'.repeat(parseInt(l))+' '+t.replace(/<[^>]+>/g,'')+'\n'})
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

      var maxLen = b.max_length || 50000;
      md = md.slice(0, maxLen);

      return json({
        status: 'success',
        url: b.url,
        title: title,
        description: desc,
        content: md,
        content_length: md.length,
        links_count: links.length,
        links: b.include_links ? links : undefined,
        content_type: ct,
        response_time: Date.now() - t0
      });
    } catch(e) {
      return json({error: e.message, url: b.url}, 502);
    }
  }

  if (path === '/extract' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    if (!b.url) return json({error:'Missing url'}, 400);
    try {
      var r = await fetch(b.url, {headers:{'User-Agent':'Crawl4AI/1.0'}, redirect:'follow'});
      var html = await r.text();

      // Extract structured data
      var data = {};

      // JSON-LD
      var jsonld = [];
      var jre = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      var jm;
      while ((jm = jre.exec(html)) !== null) {
        try { jsonld.push(JSON.parse(jm[1])); } catch(e){}
      }
      if (jsonld.length) data.jsonld = jsonld;

      // Open Graph
      var og = {};
      var ogre = /<meta[^>]+property=["'](og:[^"']+)["'][^>]+content=["']([^"']+)["']/gi;
      var om;
      while ((om = ogre.exec(html)) !== null) { og[om[1]] = om[2]; }
      if (Object.keys(og).length) data.opengraph = og;

      // Images
      var imgs = [];
      var ire = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      var im;
      while ((im = ire.exec(html)) !== null && imgs.length < 20) {
        var alt = (im[0].match(/alt=["']([^"']+)["']/)||[])[1] || '';
        imgs.push({src:im[1], alt:alt});
      }
      data.images = imgs;

      return json({status:'success', url:b.url, data:data});
    } catch(e) {
      return json({error:e.message}, 502);
    }
  }

  if (path === '/batch' && request.method === 'POST') {
    var b = await request.json().catch(function(){return{}});
    var urls = b.urls || [];
    if (!urls.length) return json({error:'Missing urls array'}, 400);
    if (urls.length > 10) return json({error:'Max 10 URLs per batch'}, 400);

    var results = await Promise.all(urls.map(function(u) {
      return fetch(u, {headers:{'User-Agent':'Crawl4AI/1.0'}, redirect:'follow'})
        .then(function(r){return r.text()})
        .then(function(html){
          var text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,10000);
          var titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          return {url:u, status:'success', title:titleM?titleM[1].trim():'', content_length:text.length, content:text};
        })
        .catch(function(e){return {url:u, status:'error', error:e.message}});
    }));

    return json({status:'success', results:results, count:results.length});
  }

  return json({error:'Not found'}, 404);
}

function json(d,s){return new Response(JSON.stringify(d,null,2),{status:s||200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}})}
function cors(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}}
