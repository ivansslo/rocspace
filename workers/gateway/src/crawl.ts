// workers/gateway/src/crawl.ts
import { json } from './utils';
export async function crawl4ai(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.url) return json({ error: "Missing url" }, 400);
  try {
    const t0 = Date.now();
    const r = await fetch(body.url, {
      headers: { "User-Agent": "Crawl4AI/1.0 HermesBot" },
      redirect: "follow"
    });
    const h = await r.text();
    const titleM = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleM ? titleM[1].trim() : "";
    const text = h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "").replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
    const md = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, l, t) => "\n" + "#".repeat(parseInt(l)) + " " + t.replace(/<[^>]+>/g, "") + "\n").replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n").replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n").replace(/<br[^>]*>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim().slice(0, body.max_length || 5e4);
    return json({
      status: "success",
      url: body.url,
      title,
      content: md,
      content_length: md.length,
      response_time: Date.now() - t0
    });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
export async function simpleCrawl(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.url) return json({ error: "Missing url" }, 400);
  try {
    const t0 = Date.now();
    const r = await fetch(body.url, {
      headers: { "User-Agent": "Crawl4AI/1.0 HermesBot" },
      redirect: "follow"
    });
    const h = await r.text();
    const text = h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, body.max_length || 5e4);
    return json({
      status: "success",
      url: body.url,
      content: text,
      content_length: text.length,
      response_time: Date.now() - t0
    });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

