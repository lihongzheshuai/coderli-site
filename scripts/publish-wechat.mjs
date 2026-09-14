/**
 * OneCoder 微信公众号自动排版与草稿箱发布流水线 (终极微信高保真排版版)
 * 1. 采用 mdnice 同款底层逻辑: 逐行 &nbsp; 物理缩进 + <br/> 绝对换行，彻底根除代码粘连
 * 2. 彻底消除幽灵空圆点: 列表标签之间剔除所有空白符，微信端列表 100% 严整对齐
 * 3. MathJax 全量 LaTeX 宏包支持 (AllPackages) + 像素级尺寸计算 (px)
 * 4. 移动端极简设计，自适应防溢出，阅读体验沉浸规整
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import hljs from 'highlight.js';

// MathJax SVG components (AllPackages for full LaTeX compatibility)
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({ packages: AllPackages });
const svgJax = new SVG({ fontCache: 'none' });
const mathDoc = mathjax.document('', { InputJax: tex, OutputJax: svgJax });

function convertExToPx(svgStr) {
  return svgStr
    .replace(/(width|height)=["']([0-9\.]+)ex["']/g, (_, prop, val) => `${prop}="${(parseFloat(val) * 8.5).toFixed(1)}px"`)
    .replace(/vertical-align:\s*(-?[0-9\.]+)ex/g, (_, val) => `vertical-align: ${(parseFloat(val) * 8.5).toFixed(1)}px`);
}

function renderLatexToSvg(rawLatex, display = false) {
  try {
    let clean = rawLatex.trim();
    clean = clean.replace(/\\mathcal\{O\}/g, 'O');
    clean = clean.replace(/\\text\{([^\}]+)\}/g, '$1');
    const node = mathDoc.convert(clean, { display });
    let svg = adaptor.innerHTML(node);
    svg = convertExToPx(svg);

    if (!display) {
      if (!svg.includes('display:')) {
        svg = svg.replace('<svg style="', '<svg style="display: inline-block; margin: 0 1.5px; max-width: 100%; ');
      }
    } else {
      svg = `<section style="text-align: center; margin: 16px 0; overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 6px 0; max-width: 100%;">${svg}</section>`;
    }
    return svg;
  } catch (err) {
    console.warn(`[MathJax Error for: ${rawLatex}]:`, err.message);
    return `<code>${rawLatex}</code>`;
  }
}

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
// 1. WeChat API Request Helpers
// ---------------------------------------------------------------------------

async function getAccessToken() {
  let url = '';
  const headers = {};

  if (PROXY_URL) {
    url = `${PROXY_URL}/token?appid=${APP_ID}&secret=${APP_SECRET}`;
    headers['x-proxy-token'] = PROXY_TOKEN;
    console.log(`[WeChat] Requesting token via Proxy: ${PROXY_URL}`);
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
// 2. Upload Material / Image to WeChat CDN & Material Library
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

  console.log(`[WeChat] Image uploaded to Material Library. MediaId: ${data.media_id}, URL: ${data.url}`);
  return { mediaId: data.media_id, url: data.url };
}

const IMAGE_CACHE_FILE = path.join(process.cwd(), '.wechat_img_cache.json');

function getCachedImageUrl(src) {
  if (fs.existsSync(IMAGE_CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf8'));
      return cache[src];
    } catch {}
  }
  return null;
}

function setCachedImageUrl(src, wxUrl) {
  let cache = {};
  if (fs.existsSync(IMAGE_CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf8'));
    } catch {}
  }
  cache[src] = wxUrl;
  fs.writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function resolveAndUploadImage(token, src) {
  try {
    const cached = getCachedImageUrl(src);
    if (cached) {
      console.log(`[WeChat] Using cached WeChat CDN url for: ${src}`);
      return cached;
    }

    let fileBuffer;
    let fileName = 'image.png';

    if (src.startsWith('http://') || src.startsWith('https://')) {
      console.log(`[WeChat] Downloading external image: ${src}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(src, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.luogu.com.cn/'
        }
      });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        throw new Error(`Download failed with status: ${resp.status}`);
      }
      const ab = await resp.arrayBuffer();
      fileBuffer = Buffer.from(ab);
      const urlPath = new URL(src).pathname;
      fileName = path.basename(urlPath) || 'diagram.png';
      if (!fileName.includes('.')) fileName += '.png';
    } else {
      let localFilePath = src;
      if (!path.isAbsolute(localFilePath)) {
        const cleanPath = src.replace(/^\.?\/?/, '');
        localFilePath = path.join(process.cwd(), 'public', cleanPath);
      }
      if (!fs.existsSync(localFilePath)) {
        console.warn(`[WeChat] Local image not found: ${localFilePath}`);
        return null;
      }
      fileBuffer = fs.readFileSync(localFilePath);
      fileName = path.basename(localFilePath);
    }

    const ext = path.extname(fileName).toLowerCase().replace('.', '') || 'png';
    const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : (ext === 'gif' ? 'image/gif' : 'image/png');

    console.log(`[WeChat] Uploading article image (${fileName}) to WeChat CDN...`);
    const formCdn = new FormData();
    formCdn.append('media', new Blob([fileBuffer], { type: mime }), fileName);
    const cdnRes = await requestWechatApi(`/cgi-bin/media/uploadimg?access_token=${token}`, {
      method: 'POST',
      body: formCdn
    });

    try {
      const formMat = new FormData();
      formMat.append('media', new Blob([fileBuffer], { type: mime }), fileName);
      const matRes = await requestWechatApi(`/cgi-bin/material/add_material?access_token=${token}&type=image`, {
        method: 'POST',
        body: formMat
      });
      if (matRes && matRes.media_id) {
        console.log(`[WeChat] Registered to WeChat Material Library (MediaId: ${matRes.media_id})`);
      }
    } catch (e) {
      console.warn(`[WeChat] Material library register warning:`, e.message);
    }

    if (cdnRes && cdnRes.url) {
      console.log(`[WeChat] Image uploaded successfully -> ${cdnRes.url}`);
      setCachedImageUrl(src, cdnRes.url);
      return cdnRes.url;
    }
    return null;
  } catch (err) {
    console.warn(`[WeChat] Failed to process image (${src}):`, err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. Format Markdown into WeChat Rich HTML (mdnice Compatible Code & Lists)
// ---------------------------------------------------------------------------

async function formatMarkdownForWechat(rawContent, token, metadata = {}) {
  let content = rawContent;

  // 1. Clean Liquid tags & comments
  content = content.replace(/{%.*?%}/g, '');
  content = content.replace(/{{.*?}}/g, '');
  content = content.replace(/<!--\s*more\s*-->/g, '');

  // 2. Pre-process LaTeX Math with MathJax SVG
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return renderLatexToSvg(math, true);
  });

  content = content.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    return renderLatexToSvg(math, false);
  });

  // 3. Render Markdown to Base HTML
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await processor.process(content);
  let html = String(file);

  // 4. Transform Code Blocks using mdnice's Proven Architecture:
  // - Line-by-line syntax highlighting
  // - Leading spaces strictly preserved via &nbsp;
  // - Line breaks explicitly enforced via <br/> (WeChat can NEVER collapse <br/>)
  const codeBlockRegex = /<pre><code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code><\/pre>/g;
  const matches = Array.from(html.matchAll(codeBlockRegex));

  const hljsThemeMap = {
    'hljs-keyword': 'color: #f97583; font-weight: bold;',
    'hljs-built_in': 'color: #79b8ff;',
    'hljs-type': 'color: #b392f0; font-weight: bold;',
    'hljs-number': 'color: #79b8ff;',
    'hljs-string': 'color: #9ecbff;',
    'hljs-comment': 'color: #6a737d; font-style: italic;',
    'hljs-title': 'color: #b392f0; font-weight: bold;',
    'hljs-meta': 'color: #f97583;',
    'hljs-params': 'color: #e1e4e8;',
    'hljs-function': 'color: #e1e4e8;',
    'hljs-variable': 'color: #79b8ff;',
    'hljs-literal': 'color: #79b8ff;',
  };

  for (const match of matches) {
    const fullMatch = match[0];
    const rawLang = match[1] || 'cpp';
    let lang = rawLang.toLowerCase();

    if (['c++', 'cpp'].includes(lang)) lang = 'cpp';
    if (['c#', 'csharp'].includes(lang)) lang = 'csharp';
    if (['sh', 'bash', 'shell'].includes(lang)) lang = 'bash';

    const cleanCode = decodeHtmlEntities(match[2]).trim();
    const lines = cleanCode.split('\n');

    // Special handling for Sample Data (text / plaintext / sample / input / output)
    // Clean, GitHub-style light gray background box (#f6f8fa), strictly left-aligned
    if (['text', 'plaintext', 'output', 'input', 'sample'].includes(lang)) {
      const cleanLines = lines.map((l) => {
        if (!l || l.trim() === '') return '&nbsp;';
        return l.replace(/ /g, '&nbsp;');
      }).join('<br/>');

      const sampleBox = `
        <section style="margin: 4px 0 14px 0; padding: 8px 12px; background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 4px; text-align: left;">
          <p style="margin: 0; padding: 0; font-family: Consolas, Monaco, 'Courier New', Courier, monospace; font-size: 13.5px; line-height: 1.55; color: #24292e; text-align: left; white-space: pre-wrap; word-break: break-all;">${cleanLines}</p>
        </section>
      `;
      html = html.replace(fullMatch, sampleBox);
      continue;
    }
    const highlightedLines = lines.map((line) => {
      if (!line || line.trim() === '') {
        return '&nbsp;';
      }
      const matchSpaces = line.match(/^(\s+)/);
      const leadingSpaces = matchSpaces ? matchSpaces[1].length : 0;
      const trimmed = line.slice(leadingSpaces);

      let hl = '';
      try {
        hl = hljs.highlight(trimmed, { language: lang }).value;
      } catch {
        hl = trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      return '&nbsp;'.repeat(leadingSpaces) + hl;
    });

    let codeBody = highlightedLines.join('<br/>');

    // Inline syntax highlight styles
    for (const [cls, sty] of Object.entries(hljsThemeMap)) {
      codeBody = codeBody.replaceAll(`class="${cls}"`, `style="${sty}"`);
    }

    const macCodeCard = `
      <section style="margin: 18px 0; border-radius: 6px; overflow: hidden; background-color: #24292e; border: 1px solid #1b1f23; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; background-color: #1f2428; border-bottom: 1px solid #2f363d;">
          <div style="display: inline-block;">
            <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background-color: #ff5f56; margin-right: 4px;"></span>
            <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background-color: #ffbd2e; margin-right: 4px;"></span>
            <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background-color: #27c93f;"></span>
          </div>
          <span style="color: #8b949e; font-size: 11px; font-family: Consolas, Monaco, monospace; text-transform: uppercase; font-weight: 600;">${lang}</span>
        </div>
        <div style="padding: 12px 14px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <section style="margin: 0; padding: 0; font-family: Consolas, Monaco, 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.65; color: #e1e4e8; background: transparent; border: none; white-space: pre-wrap; word-break: break-all;">
            ${codeBody}
          </section>
        </div>
      </section>
    `;

    html = html.replace(fullMatch, macCodeCard);
  }

  // 5. Transform Images: upload both local & remote images to WeChat CDN & Material Library
  const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
  const imgMatches = Array.from(html.matchAll(imgRegex));

  for (const match of imgMatches) {
    const fullImg = match[0];
    let src = match[2];

    if (src.includes('mmbiz.qpic.cn')) {
      continue;
    }

    if (token) {
      const wxUrl = await resolveAndUploadImage(token, src);
      if (wxUrl) {
        html = html.replace(fullImg, `<p style="text-align: center; margin: 16px 0;"><img src="${wxUrl}" style="max-width: 100%; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); display: inline-block;" /></p>`);
        continue;
      }
    }

    html = html.replace(fullImg, `<p style="text-align: center; margin: 16px 0;"><img src="${src}" style="max-width: 100%; border-radius: 6px;" /></p>`);
  }

  // 6. Typography Styling optimized for Mobile WeChat
  html = html.replace(/<h2>(.*?)<\/h2>/g, '<h2 style="font-size: 16.5px; font-weight: bold; color: #0d9488; border-left: 4px solid #0d9488; padding-left: 9px; margin: 26px 0 12px 0; line-height: 1.4; letter-spacing: 0.3px;">$1</h2>');
  html = html.replace(/<h3>(.*?)<\/h3>/g, '<h3 style="font-size: 15px; font-weight: bold; color: #1e293b; margin: 20px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #f1f5f9;">🔹 $1</h3>');
  html = html.replace(/<h4>(.*?)<\/h4>/g, '<h4 style="font-size: 14px; font-weight: 600; color: #334155; margin: 14px 0 6px 0;">$1</h4>');
  html = html.replace(/<h5>(.*?)<\/h5>/g, '<p style="font-size: 14px; font-weight: bold; color: #334155; margin: 14px 0 4px 0; text-align: left;">$1</p>');

  html = html.replace(/<p>(.*?)<\/p>/g, '<p style="font-size: 15px; line-height: 1.8; color: #334155; margin: 12px 0; letter-spacing: 0.5px; text-align: justify; word-break: break-word;">$1</p>');
  html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, '<blockquote style="border-left: 3.5px solid #0d9488; background-color: #f0fdfa; padding: 10px 14px; margin: 14px 0; color: #0f766e; font-size: 14px; border-radius: 0 4px 4px 0; line-height: 1.7;">$1</blockquote>');

  // 7. CRITICAL FIX: Eliminate phantom bullets in lists
  html = html.replace(/<ul([^>]*)>[\s\r\n]*/gi, '<ul$1 style="padding-left: 20px; margin: 10px 0; font-size: 14.5px; color: #334155; line-height: 1.75;">');
  html = html.replace(/[\s\r\n]*<\/ul>/gi, '</ul>');
  html = html.replace(/<ol([^>]*)>[\s\r\n]*/gi, '<ol$1 style="padding-left: 20px; margin: 10px 0; font-size: 14.5px; color: #334155; line-height: 1.75;">');
  html = html.replace(/[\s\r\n]*<\/ol>/gi, '</ol>');
  html = html.replace(/<\/li>[\s\r\n]*<li/gi, '</li><li');
  html = html.replace(/<li([^>]*)>[\s\r\n]*/gi, '<li$1 style="margin: 4px 0;">');
  html = html.replace(/[\s\r\n]*<\/li>/gi, '</li>');

  // Tables
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, '<section style="overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 6px;"><table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background-color: #ffffff;">$1</table></section>');
  html = html.replace(/<th>(.*?)<\/th>/g, '<th style="padding: 8px 10px; background-color: #f8fafc; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">$1</th>');
  html = html.replace(/<td>(.*?)<\/td>/g, '<td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #475569;">$1</td>');

  // Inline code snippets
  html = html.replace(/<code>([^<]+)<\/code>/g, '<code style="background-color: #f1f5f9; color: #0f766e; padding: 2px 5px; border-radius: 3px; font-family: Consolas, Monaco, monospace; font-size: 13px; margin: 0 2px;">$1</code>');

  // 8. Minimal, High-Value Header Card
  const headerCard = `
    <section style="margin-bottom: 22px; padding: 14px 18px; background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%); border-radius: 6px; border: 1px solid #ccfbf1;">
      <div style="font-size: 12px; color: #0d9488; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">
        💡 GESP 考级与信奥算法精选
      </div>
      <div style="font-size: 18px; font-weight: bold; color: #0f172a; line-height: 1.4; margin-bottom: 8px;">
        ${metadata.title || ''}
      </div>
      <div style="font-size: 12px; color: #64748b;">
        <span>✍️ 作者：${metadata.author || 'OneCoder'}</span>
        <span style="margin: 0 6px;">•</span>
        <span>🏷️ 分类：${(metadata.categories || []).join(' / ')}</span>
      </div>
    </section>
  `;

  // 9. Clean Footer Call-to-Action Card
  const footerCard = `
    <section style="margin-top: 32px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center;">
      <section style="margin-bottom: 18px; padding: 14px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #0d9488; text-align: left;">
        <div style="font-size: 13.5px; font-weight: bold; color: #0f766e; margin-bottom: 5px;">📚 往期关联真题与系统化备考：</div>
        <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">
          本站已收录超 900+ 篇计算机与算法专题。由于微信公众号不支持外部链接直接跳转，建议点击左下角<strong>「阅读原文」</strong>直达个人网站，即可使用全局检索（<code>Ctrl+K</code>）、在线复制代码与浏览完整知识库！
        </p>
      </section>
      ${metadata.qrcodeUrl ? `<p style="margin: 14px 0;"><img src="${metadata.qrcodeUrl}" style="width: 130px; height: 130px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" /><br><span style="font-size: 12px; color: #94a3b8;">长按关注「OneCoder」公众号</span></p>` : ''}
    </section>
  `;

  return `
    <section style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; font-size: 15px; color: #334155; line-height: 1.8; max-width: 100%; margin: 0 auto; padding: 0 4px; box-sizing: border-box; word-break: break-word;">
      ${headerCard}
      ${html}
      ${footerCard}
    </section>
  `;
}

// ---------------------------------------------------------------------------
// 4. Main Publishing Pipeline
// ---------------------------------------------------------------------------

async function main() {
  const targetFile = process.argv[2];
  if (!targetFile) {
    console.error('Usage: node scripts/publish-wechat.mjs <path-to-markdown>');
    process.exit(1);
  }

  const filePath = path.isAbsolute(targetFile) ? targetFile : path.join(process.cwd(), targetFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`=== OneCoder WeChat Publisher ===`);
  console.log(`Reading article: ${targetFile}`);

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = safeMatter(raw);

  const filename = path.basename(filePath);
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  const slug = dateMatch ? dateMatch[2] : filename.replace(/\.md$/, '');

  const token = await getAccessToken();

  // 1. Resolve or Generate Dedicated 900x383 Cover Image
  let thumbMediaId = null;
  const coverPath = path.join(process.cwd(), 'public', 'images', 'covers', `${slug}.png`);
  
  if (!fs.existsSync(coverPath)) {
    console.log(`[WeChat] Generating dedicated cover image for ${slug}...`);
    try {
      execSync(`python3 /home/ubuntu/scripts/luogu_solver/generate_cover.py "${data.title || slug}" "${coverPath}"`, { stdio: 'inherit' });
    } catch (e) {
      console.warn(`[WeChat] Cover generation warning:`, e.message);
    }
  }

  const coverCandidates = [
    coverPath,
    path.join(process.cwd(), 'public', 'images', 'covers', 'p1002-cover.png'),
    path.join(process.cwd(), 'public', 'images', 'wechat_qrcode.jpg'),
  ];

  for (const candidate of coverCandidates) {
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

  // 2. Upload QR Code
  let qrcodeUrl = '';
  const qrcodeLocal = path.join(process.cwd(), 'public', 'images', 'wechat_qrcode.jpg');
  if (fs.existsSync(qrcodeLocal)) {
    try {
      qrcodeUrl = await resolveAndUploadImage(token, qrcodeLocal);
    } catch (e) {
      console.warn('QR code upload failed:', e.message);
    }
  }

  // 3. Format Markdown into WeChat Rich HTML
  console.log(`[WeChat] Converting Markdown & LaTeX to MathJax SVG Rich Text...`);
  const wechatHtml = await formatMarkdownForWechat(content, token, {
    title: data.title || slug,
    author: data.author || 'OneCoder',
    categories: data.categories || [],
    qrcodeUrl,
  });

  // 4. Create Draft via WeChat Official API
  console.log(`[WeChat] Submitting article to WeChat Drafts...`);
  const postUrl = `${SITE_URL}/${slug}/`;

  const draftPayload = {
    articles: [
      {
        title: data.title || slug,
        author: data.author || 'OneCoder',
        digest: data.excerpt || (data.title ? `${data.title} - C++ 完整题解与考点剖析` : ''),
        content: wechatHtml,
        content_source_url: postUrl,
        thumb_media_id: thumbMediaId,
        need_open_comment: 1,
        only_fans_can_comment: 0,
      },
    ],
  };

  const endpoint = `/cgi-bin/draft/add?access_token=${token}`;
  const draftRes = await requestWechatApi(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(draftPayload),
  });

  if (!draftRes.media_id) {
    throw new Error(`Failed to create WeChat draft: ${JSON.stringify(draftRes)}`);
  }

  console.log(`====================================================`);
  console.log(`🎉 成功推送到微信公众号草稿箱！`);
  console.log(`Article Title: ${data.title}`);
  console.log(`WeChat Media ID: ${draftRes.media_id}`);
  console.log(`Blog Permalink: ${postUrl}`);
  console.log(`请在手机“订阅号助手” App 或微信公众平台草稿箱中查看并群发！`);
  console.log(`====================================================`);
}

main().catch((err) => {
  console.error(`❌ [WeChat Publish Error]:`, err);
  process.exit(1);
});
