// Reads the Ministry's public English pages and writes src/content/knowledge/site.json.
// Run `npm run knowledge` to refresh it. The chat's knowledge base (src/content/knowledge.en.js) is built on this file.
// Nothing is rewritten here: text is cleaned (tags, entities) and structured, never paraphrased.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.alusra.gov.ae';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/knowledge/site.json');

const get = async (url) => {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (MoFam knowledge builder)' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};

// The sitemap lists a placeholder host; the paths are the real ones.
const sitemap = await get(`${ORIGIN}/sitemap.xml`);
const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => new URL(m[1]).pathname))]
  .filter((p) => p.startsWith('/en/'))
  .sort();

const decode = (s) =>
  s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '') // entity-encoded markup inside the source text
    .replace(/[ \t]+/g, ' ').trim();

// One page → lines: "## heading", "- bullet", plain text, "LINK|href|label".
function lines(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const main = t.match(/<main[\s\S]*<\/main>/);
  t = main ? main[0] : t;
  t = t
    .replace(/<(h[1-6])[^>]*>/g, '\n## ')
    .replace(/<\/(h[1-6]|p|li|div|section|tr)>/g, '\n')
    .replace(/<li[^>]*>/g, '\n- ')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, label) => `\nLINK|${href}|${label.replace(/<[^>]+>/g, ' ')}\n`)
    .replace(/<[^>]+>/g, '');
  return t.split('\n').map(decode).filter(Boolean);
}

const FACTS = {
  'target audience': 'audience',
  'service fees': 'fees',
  'application (processing) time': 'processing',
  'service delivery time': 'delivery',
};

function parseService(slug, url, ls) {
  const svc = { slug, url, title: '', description: '', applyUrl: '', audience: '', fees: '', processing: '', delivery: '', terms: [], documents: [], extra: [] };
  let section = null;
  let started = false;
  for (const l of ls) {
    if (l.startsWith('## ')) {
      const h = l.slice(3).trim();
      if (!started) {
        svc.title = h;
        started = true;
        section = 'intro';
      } else if (/^terms and conditions$/i.test(h)) section = 'terms';
      else if (/^required documents$/i.test(h)) section = 'documents';
      else if (/^contact us$/i.test(h)) section = 'end';
      else {
        section = 'extra';
        svc.extra.push({ title: h, items: [] });
      }
      continue;
    }
    if (!started || section === 'end') continue;
    if (l.startsWith('LINK|')) {
      const [, href, label] = l.split('|');
      if (/apply for service/i.test(label)) svc.applyUrl = href;
      continue;
    }
    const fact = l.match(/^([^:]{3,40}):\s*(.+)$/);
    if (section === 'intro' && fact && FACTS[fact[1].trim().toLowerCase()]) {
      svc[FACTS[fact[1].trim().toLowerCase()]] = fact[2].trim();
      continue;
    }
    const item = l.startsWith('- ') ? l.slice(2).trim() : null;
    if (section === 'intro' && !item && !svc.description) svc.description = l;
    else if (section === 'terms' && item) svc.terms.push(item);
    else if (section === 'documents' && item) svc.documents.push(item);
    else if (section === 'extra' && item) svc.extra.at(-1).items.push(item);
    else if (section === 'extra') svc.extra.at(-1).items.push(l);
  }
  return svc;
}

// "## 7. Question?" followed by answer paragraphs; "## Category 3: ..." headings are skipped.
function parseFaq(ls) {
  const out = [];
  let cur = null;
  for (const l of ls) {
    const q = l.match(/^## (\d+)\.\s+(.+\?)\s*$/);
    if (q) {
      cur = { n: Number(q[1]), question: q[2], answer: [] };
      out.push(cur);
    } else if (l.startsWith('## ')) cur = null;
    else if (cur && !l.startsWith('LINK|') && !l.startsWith('- ')) cur.answer.push(l);
  }
  return out;
}

const site = { scrapedAt: new Date().toISOString().slice(0, 10), origin: ORIGIN, services: [], news: [], pages: {} };
for (const path of urls) {
  const html = await get(ORIGIN + path);
  const ls = lines(html);
  const slug = path.replace(/^\/en\//, '').replace(/\/$/, '') || 'home';
  if (path.startsWith('/en/services/') && slug !== 'services') {
    site.services.push(parseService(slug.replace('services/', ''), ORIGIN + path, ls));
  } else if (path.startsWith('/en/news/')) {
    const title = (ls.find((l) => l.startsWith('## ')) ?? '').slice(3);
    const date = (ls.find((l) => /^\d{1,2} \w+ \d{4}/.test(l)) ?? '').match(/^\d{1,2} \w+ \d{4}/)?.[0] ?? '';
    const brief = ls.filter((l) => !l.startsWith('## ') && !l.startsWith('LINK|')).slice(0, 3).join(' ');
    site.news.push({ slug: slug.replace('news/', ''), url: ORIGIN + path, title, date, brief, faq: parseFaq(ls) });
  } else {
    site.pages[slug] = { url: ORIGIN + path, lines: ls };
  }
  console.log('read', path);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(site, null, 1));
console.log(`\n${site.services.length} services, ${site.news.length} news pages (${site.news.reduce((n, p) => n + p.faq.length, 0)} FAQs), ${Object.keys(site.pages).length} other pages -> ${OUT}`);
