export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        version: '3.0-integrated',
        owner: 'ivansslo',
        domain: 'app.certveis.space'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path === '/v1/models') {
      return new Response(JSON.stringify({ object: 'list', data: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('AI-Vitality Gateway v3.0', { status: 200 });
  }
};
