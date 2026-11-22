#!/usr/bin/env node
/**
 * Submit updated URLs to IndexNow (Bing, ChatGPT Search, Yandex, Seznam, Naver).
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs --latest 50
 *   node scripts/submit-indexnow.mjs --all
 *   node scripts/submit-indexnow.mjs https://www.coderli.com/ https://www.coderli.com/gesp-5-knowledge-unique-factorization-divisors/
 */
import fs from 'fs';
import path from 'path';

const HOST = 'www.coderli.com';
const KEY = '6f9c2a4d8e1b7a3f5c0d9e2b4a8f1c7e';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function readSitemapUrls() {
  const candidates = [
    path.join(process.cwd(), 'out', 'sitemap.xml'),
    path.join(process.cwd(), 'public', 'sitemap.xml'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const xml = fs.readFileSync(p, 'utf8');
      const entries = [];
      const urlBlockRe = /<url>([\s\S]*?)<\/url>/g;
      let m;
      while ((m = urlBlockRe.exec(xml)) !== null) {
        const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
        const lastmod = m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() || '';
        if (loc) entries.push({ loc, lastmod });
      }
      return entries;
    }
  }
  return [];
}

async function submitBatch(urlList) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await res.text();
    console.log(`[IndexNow] Submitted ${urlList.length} URLs -> HTTP ${res.status}${text ? ` (${text.slice(0, 120)})` : ''}`);
    return res.status >= 200 && res.status < 300;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let urls = [];

  if (args.includes('--all')) {
    urls = readSitemapUrls().map(e => e.loc);
  } else if (args.includes('--latest')) {
    const idx = args.indexOf('--latest');
    const limit = Math.max(1, parseInt(args[idx + 1] || '50', 10) || 50);
    const entries = readSitemapUrls();
    // Always prioritize core hubs + most recently modified posts
    const hubs = [
      `https://${HOST}/`,
      `https://${HOST}/topics/gesp/`,
      `https://${HOST}/topics/csp/`,
      `https://${HOST}/topics/algo/`,
      `https://${HOST}/topics/java/`,
      `https://${HOST}/topics/python-data/`,
      `https://${HOST}/archives/`,
      `https://${HOST}/categories/`,
    ];
    entries.sort((a, b) => (a.lastmod < b.lastmod ? 1 : -1));
    const merged = Array.from(new Set([...hubs, ...entries.map(e => e.loc)]));
    urls = merged.slice(0, limit);
  } else {
    urls = args.filter(a => a.startsWith('http://') || a.startsWith('https://'));
  }

  if (urls.length === 0) {
    console.log('Usage: node scripts/submit-indexnow.mjs [--latest N | --all | <url> ...]');
    process.exit(1);
  }

  // IndexNow accepts up to 10,000 URLs per POST; chunk at 500 for safety
  let allOk = true;
  for (let i = 0; i < urls.length; i += 500) {
    const ok = await submitBatch(urls.slice(i, i + 500));
    if (!ok) allOk = false;
  }
  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  console.error('[IndexNow] Error:', err?.message || err);
  process.exit(1);
});
