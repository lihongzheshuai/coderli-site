/**
 * OneCoder 微信公众号自动排版与草稿箱发布流水线
 * 支持直接调用或通过腾讯云固定 IP 代理网关转发
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { codeToHtml } from 'shiki';

const APP_ID = process.env.WECHAT_APP_ID;
const APP_SECRET = process.env.WECHAT_APP_SECRET;
const PROXY_URL = process.env.WECHAT_PROXY_URL ? process.env.WECHAT_PROXY_URL.replace(/\/$/, '') : '';
const PROXY_TOKEN = process.env.WECHAT_PROXY_TOKEN || 'onecoder-wechat-proxy-secret';
const SITE_URL = process.env.SITE_URL || 'https://www.coderli.com';

function safeMatter(raw) {
  return matter(raw, {
    engines: {
      yaml: {
        parse: (str) => yaml.load(str, { json: true }),
      },
    },
  });
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// ---------------------------------------------------------------------------
// 1. WeChat API Request Helpers (With Proxy Support)
// ---------------------------------------------------------------------------

async function getAccessToken() {
  let url = '';
  const headers = {};

  if (PROXY_URL) {
    url = `${PROXY_URL}/token?appid=${APP_ID}&secret=${APP_SECRET}`;
    headers['x-proxy-token'] = PROXY_TOKEN;
    console.log(`[WeChat] Requesting token via Tencent Cloud Proxy: ${PROXY_URL}`);
  } else {
    url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`;
    console.log(`[WeChat] Requesting token directly from api.weixin.qq.com`);
  }

  const res = await fetch(url, { headers });
  const data = await res.json();

  if (!data.access_token) {
    throw new Error(`Failed to get access_token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function requestWechatApi(endpoint, options = {}) {
  let url = '';
  const headers = options.headers || {};

  if (PROXY_URL) {
    url = `${PROXY_URL}/wechat/api${endpoint}`;
    headers['x-proxy-token'] = PROXY_TOKEN;
  } else {
    url = `https://api.weixin.qq.com${endpoint}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json') || contentType.includes('text/plain')) {
    return await res.json();
  }
  return await res.text();
}

// ---------------------------------------------------------------------------
// 2. Upload Material / Image to WeChat CDN
// ---------------------------------------------------------------------------

async function uploadPermanentImage(token, filePath) {
  console.log(`[WeChat] Uploading permanent image to WeChat: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const formData = new FormData();
  formData.append('media', new Blob([fileBuffer]), fileName);

  const endpoint = `/cgi-bin/material/add_material?access_token=${token}&type=image`;
  const data = await requestWechatApi(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!data.media_id) {
    throw new Error(`Failed to upload permanent image: ${JSON.stringify(data)}`);
  }

  console.log(`[WeChat] Image uploaded. MediaId: ${data.media_id}, URL: ${data.url}`);
  return { mediaId: data.media_id, url: data.url };
}

async function uploadArticleImage(token, filePath) {
  console.log(`[WeChat] Uploading inline article image to WeChat CDN: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const formData = new FormData();
  formData.append('media', new Blob([fileBuffer]), fileName);

  const endpoint = `/cgi-bin/media/uploadimg?access_token=${token}`;
  const data = await requestWechatApi(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!data.url) {
    throw new Error(`Failed to upload article image: ${JSON.stringify(data)}`);
  }

  return data.url;
}

// ---------------------------------------------------------------------------
// 3. WeChat Inline CSS Formatting Engine
// ---------------------------------------------------------------------------

async function formatMarkdownForWechat(rawContent, token, articleMeta) {
  let content = rawContent;

  // 1. Clean Liquid tags & comments
  content = content.replace(/{%.*?%}/g, '');
  content = content.replace(/{{.*?}}/g, '');
  content = content.replace(/<!--\s*more\s*-->/g, '');

  // 2. Pre-process LaTeX Math Formulas
  // Replace block math $$...$$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const cleanMath = math.trim();
    const encoded = encodeURIComponent(cleanMath);
    return `\n\n<div style="text-align:center;margin:18px 0;overflow-x:auto;"><img src="https://latex.codecogs.com/png.image?\\dpi{150}\\color{darkslategray}${encoded}" style="max-width:100%;vertical-align:middle;" alt="${cleanMath}" /></div>\n\n`;
  });

  // Replace inline math $...$
  content = content.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    const cleanMath = math.trim();
    const encoded = encodeURIComponent(cleanMath);
    return `<img src="https://latex.codecogs.com/png.image?\\dpi{150}\\color{teal}${encoded}" style="vertical-align:-3px;display:inline-block;max-height:22px;margin:0 2px;" alt="${cleanMath}" />`;
  });

  // 3. Render Markdown to Base HTML
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await processor.process(content);
  let html = String(file);

  // 4. Transform Code Blocks with Shiki and Mac-style Shell
  const codeBlockRegex = /<pre><code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code><\/pre>/g;
  const matches = Array.from(html.matchAll(codeBlockRegex));

  for (const match of matches) {
    const fullMatch = match[0];
    const rawLang = match[1] || 'text';
    let lang = rawLang.toLowerCase();

    if (['c++', 'cpp'].includes(lang)) lang = 'cpp';
    if (['c#', 'csharp'].includes(lang)) lang = 'csharp';
    if (['sh', 'bash', 'shell'].includes(lang)) lang = 'bash';
    if (['yml', 'yaml'].includes(lang)) lang = 'yaml';
    if (['py', 'python'].includes(lang)) lang = 'python';

    const cleanCode = decodeHtmlEntities(match[2]);

    let highlightedHtml = '';
    try {
      highlightedHtml = await codeToHtml(cleanCode, {
        lang: lang,
        theme: 'github-dark',
      });
      // Extract inner <pre> content
      const preContentMatch = highlightedHtml.match(/<pre[\s\S]*?>([\s\S]*?)<\/pre>/);
      if (preContentMatch) {
        highlightedHtml = preContentMatch[1];
      }
    } catch {
      highlightedHtml = `<code>${match[2]}</code>`;
    }

    const macCodeCard = `
      <section style="margin: 22px 0; border-radius: 8px; overflow: hidden; background-color: #1e1e1e; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15); border: 1px solid #333333;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 14px; background-color: #282828; border-bottom: 1px solid #383838;">
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background-color: #ff5f56; display: inline-block;"></span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background-color: #ffbd2e; display: inline-block;"></span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background-color: #27c93f; display: inline-block;"></span>
            <span style="margin-left: 8px; color: #94a3b8; font-size: 11px; font-family: Menlo, Consolas, Monaco, monospace; text-transform: uppercase; font-weight: 600;">${lang}</span>
          </div>
          <span style="color: #64748b; font-size: 11px; font-family: Menlo, monospace;">OneCoder Code</span>
        </div>
        <div style="padding: 14px 16px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <pre style="margin: 0; padding: 0; font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 12.5px; line-height: 1.65; color: #e2e8f0; white-space: pre; overflow-x: auto; background: transparent; border: none;">${highlightedHtml}</pre>
        </div>
      </section>
    `;

    html = html.replace(fullMatch, macCodeCard);
  }

  // 5. Transform Images: upload local images to WeChat CDN if token available
  const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
  const imgMatches = Array.from(html.matchAll(imgRegex));

  for (const match of imgMatches) {
    const fullImg = match[0];
    let src = match[2];

    if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
      const cleanPath = src.replace(/^\.?\/?/, '');
      const localFilePath = path.join(process.cwd(), 'public', cleanPath);

      if (fs.existsSync(localFilePath) && token) {
        try {
          const wxCdnUrl = await uploadArticleImage(token, localFilePath);
          html = html.replace(fullImg, `<p style="text-align: center; margin: 18px 0;"><img src="${wxCdnUrl}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);" /></p>`);
          continue;
        } catch (e) {
          console.warn(`[WeChat Image Upload Failed for ${src}]:`, e.message);
        }
      }
    }

    html = html.replace(fullImg, `<p style="text-align: center; margin: 18px 0;"><img src="${src}" style="max-width: 100%; border-radius: 8px;" /></p>`);
  }

  // 6. Inline CSS Styling for Typography
  // Headings
  html = html.replace(/<h2>(.*?)<\/h2>/g, '<h2 style="font-size: 17.5px; font-weight: bold; color: #0d9488; border-left: 4.5px solid #0d9488; padding-left: 10px; margin: 30px 0 14px 0; line-height: 1.45; letter-spacing: 0.5px;">$1</h2>');
  html = html.replace(/<h3>(.*?)<\/h3>/g, '<h3 style="font-size: 15.5px; font-weight: 600; color: #1e293b; margin: 22px 0 10px 0; line-height: 1.45;">$1</h3>');
  html = html.replace(/<h4>(.*?)<\/h4>/g, '<h4 style="font-size: 14.5px; font-weight: 600; color: #334155; margin: 16px 0 8px 0; line-height: 1.4;">$1</h4>');

  // Paragraphs
  html = html.replace(/<p>(.*?)<\/p>/g, '<p style="font-size: 15px; line-height: 1.8; color: #334155; margin-bottom: 16px; text-align: justify; word-break: break-word;">$1</p>');

  // Blockquotes
  html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, '<blockquote style="border-left: 4px solid #14b8a6; background-color: #f0fdfa; padding: 12px 16px; margin: 18px 0; color: #0f766e; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.75;">$1</blockquote>');

  // Strong & Emphasis
  html = html.replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: #0f766e; font-weight: 600;">$1</strong>');

  // Lists
  html = html.replace(/<ul>([\s\S]*?)<\/ul>/g, '<ul style="margin: 12px 0 18px 20px; padding: 0; color: #334155; font-size: 15px; line-height: 1.8;">$1</ul>');
  html = html.replace(/<ol>([\s\S]*?)<\/ol>/g, '<ol style="margin: 12px 0 18px 20px; padding: 0; color: #334155; font-size: 15px; line-height: 1.8;">$1</ol>');
  html = html.replace(/<li>(.*?)<\/li>/g, '<li style="margin-bottom: 6px;">$1</li>');

  // Tables
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, '<div style="overflow-x: auto; margin: 18px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left; border: 1px solid #cbd5e1;">$1</table></div>');
  html = html.replace(/<th>(.*?)<\/th>/g, '<th style="background-color: #f8fafc; color: #1e293b; padding: 9px 12px; border: 1px solid #cbd5e1; font-weight: 600;">$1</th>');
  html = html.replace(/<td>(.*?)<\/td>/g, '<td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #334155;">$1</td>');

  // Links
  html = html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>(.*?)<\/a>/g, '<span style="color: #0d9488; text-decoration: underline;">$4</span>');

  // 7. Elegant Top Banner & Bottom Signature Footer
  const tagsBadge = (articleMeta.tags || []).slice(0, 4).map(t => `<span style="display:inline-block;padding:2px 8px;margin-right:6px;margin-bottom:4px;border-radius:4px;background-color:#f0fdfa;color:#0d9488;font-size:12px;font-weight:500;">#${t}</span>`).join('');

  const topBanner = `
    <section style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
      <div style="margin-bottom: 10px;">${tagsBadge}</div>
      <p style="font-size: 12.5px; color: #94a3b8; font-family: -apple-system, monospace; margin: 0;">
        OneCoder · ${articleMeta.date || ''} · ${articleMeta.topicName || '技术分享'}
      </p>
    </section>
  `;

  const bottomFooter = `
    <section style="margin-top: 40px; padding: 20px; border-radius: 12px; background-color: #f8fafc; border: 1px dashed #cbd5e1; text-align: center;">
      <p style="font-size: 14.5px; font-weight: bold; color: #0d9488; margin-bottom: 6px;">OneCoder · 慢慢学，认真写</p>
      <p style="font-size: 12.5px; color: #64748b; line-height: 1.7; margin-bottom: 12px;">
        始于 2012，记录 C++、信奥算法、Java 与架构实战心得。<br />
        点击文末左下角【阅读原文】可直接访问博客主站原版页面与代码交互。
      </p>
      <p style="font-size: 11.5px; color: #94a3b8; font-family: monospace; margin: 0;">
        博客主站：coderli.com
      </p>
    </section>
  `;

  // Wrap in outer container
  return `
    <section style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; font-size: 15px; line-height: 1.8; color: #334155; letter-spacing: 0.5px; word-break: break-word; padding: 0 2px;">
      ${topBanner}
      ${html}
      ${bottomFooter}
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4. Main Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/publish-wechat.mjs <path-to-post-markdown>');
    process.exit(1);
  }

  if (!APP_ID || !APP_SECRET) {
    console.error('Error: WECHAT_APP_ID and WECHAT_APP_SECRET environment variables are required.');
    process.exit(1);
  }

  console.log(`=== OneCoder WeChat Publisher ===`);
  console.log(`Reading article: ${filePath}`);

  const rawFile = fs.readFileSync(filePath, 'utf8');
  const { data, content } = safeMatter(rawFile);

  const filename = path.basename(filePath);
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  const slug = dateMatch ? dateMatch[2] : filename.replace(/\.md$/, '');
  const postDate = dateMatch ? dateMatch[1] : '';

  const title = data.title ? String(data.title).replace(/^【.*?】\s*/, '') : slug;
  const excerpt = data.excerpt || content.slice(0, 60).replace(/[#*`\n]/g, ' ').trim();

  // 1. Get Access Token (via Proxy or Direct)
  const token = await getAccessToken();

  // 2. Resolve or Upload Cover Image (thumb_media_id)
  let thumbMediaId = null;
  const defaultCoverCandidates = [
    path.join(process.cwd(), 'public', 'images', 'wechat_qrcode.jpg'),
    path.join(process.cwd(), 'public', 'images', 'onecoder', 'avatar.png'),
  ];

  for (const candidate of defaultCoverCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        const coverRes = await uploadPermanentImage(token, candidate);
        thumbMediaId = coverRes.mediaId;
        break;
      } catch (e) {
        console.warn(`Failed to upload cover ${candidate}:`, e.message);
      }
    }
  }

  if (!thumbMediaId) {
    throw new Error('Could not upload any cover image for WeChat article.');
  }

  // 3. Format Markdown into WeChat Rich HTML
  console.log(`[WeChat] Converting Markdown to WeChat Rich Text...`);
  const wechatHtml = await formatMarkdownForWechat(content, token, {
    title,
    date: postDate,
    tags: data.tags || [],
    topicName: data.categories ? data.categories[0] : '信奥与算法',
  });

  // 4. Create Draft in WeChat Official Account
  console.log(`[WeChat] Submitting article to WeChat Drafts...`);
  const draftEndpoint = `/cgi-bin/draft/add?access_token=${token}`;
  const draftPayload = {
    articles: [
      {
        title: data.title || title,
        author: data.author || 'OneCoder',
        digest: excerpt,
        content: wechatHtml,
        content_source_url: `${SITE_URL}/${slug}/`,
        thumb_media_id: thumbMediaId,
        need_open_comment: 1,
        only_fans_can_comment: 0,
      },
    ],
  };

  const draftRes = await requestWechatApi(draftEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftPayload),
  });

  if (draftRes.errcode && draftRes.errcode !== 0) {
    console.error(`[WeChat API Error]:`, draftRes);
    process.exit(1);
  }

  console.log(`====================================================`);
  console.log(`🎉 成功推送到微信公众号草稿箱！`);
  console.log(`Article Title: ${data.title || title}`);
  console.log(`WeChat Media ID: ${draftRes.media_id}`);
  console.log(`Blog Permalink: ${SITE_URL}/${slug}/`);
  console.log(`请在手机“订阅号助手” App 或微信公众平台草稿箱中查看并群发！`);
  console.log(`====================================================`);
}

main().catch(err => {
  console.error(`Fatal error:`, err);
  process.exit(1);
});
