import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

function safeMatter(raw: string) {
  return matter(raw, {
    engines: {
      yaml: {
        parse: (str: string) => yaml.load(str, { json: true }) as Record<string, any>,
      },
    },
  });
}
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { codeToHtml, bundledLanguages, isPlainLang, isSpecialLang } from 'shiki';
import type { PostMeta, PostDetail } from '../types/post';

const postsDirectory = path.join(process.cwd(), '_posts');

// Helper to strip markdown symbols for excerpts
function cleanExcerpt(content: string): string {
  // If <!--more--> exists, take the part before it
  let text = content;
  if (text.includes('<!--more-->')) {
    text = text.split('<!--more-->')[0];
  } else if (text.includes('<!-- more -->')) {
    text = text.split('<!-- more -->')[0];
  }

  // Remove Jekyll Liquid tags like {% include ... %} and Kramdown prompt IAL
  text = text.replace(/{%.*?%}/g, '');
  text = text.replace(/{{.*?}}/g, '');
  text = text.replace(/\{:.*?prompt-.*?\}|\{:\s*\..*?\}/g, '');

  // Remove markdown code blocks, images, links, headers
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/#{1,6}\s+/g, '');
  text = text.replace(/[*_~`>]/g, '');
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length <= 160) return text;

  let truncated = text.slice(0, 160);
  // Ensure we don't truncate inside an inline LaTeX formula $...$
  const dollarCount = (truncated.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    const remainder = text.slice(160);
    const closingIndex = remainder.indexOf('$');
    if (closingIndex !== -1 && closingIndex < 40) {
      truncated += remainder.slice(0, closingIndex + 1);
    } else {
      const lastDollar = truncated.lastIndexOf('$');
      if (lastDollar !== -1) {
        truncated = truncated.slice(0, lastDollar).trim();
      }
    }
  }

  return truncated.trim() + (text.length > truncated.length ? '...' : '');
}

// Extract first markdown image
function extractFirstImage(content: string): string | null {
  const match = content.match(/!\[.*?\]\((.*?)(?:\s+".*?")?\)/);
  if (!match) return null;
  let url = match[1].trim();

  // Normalize relative image paths: ../images/ -> /images/
  if (url.startsWith('../images/')) {
    url = url.replace('../images/', '/images/');
  } else if (url.startsWith('images/')) {
    url = '/' + url;
  }
  return url;
}

// 5 Core Topic Classifier
export function resolveTopic(categories: string[] = [], tags: string[] = [], title: string = '') {
  const combined = [...categories, ...tags, title].map(s => String(s).toLowerCase());
  const combinedStr = combined.join(' ');

  // 1. GESP
  if (combinedStr.includes('gesp')) {
    const levelMatch = categories.find(c => ['一级', '二级', '三级', '四级', '五级', '六级', '七级', '八级'].includes(c)) ||
      (title.includes('一级') ? '一级' : title.includes('二级') ? '二级' : title.includes('三级') ? '三级' : title.includes('四级') ? '四级' : title.includes('五级') ? '五级' : '考级精选题解');
    return {
      topic: 'gesp' as const,
      topicName: 'GESP 编程与算法',
      subtopic: levelMatch,
      previewGraphic: {
        symbol: levelMatch.includes('级') ? levelMatch : 'GESP',
        title: 'C++ 算法考级专栏',
        desc: '真题分析、矩阵探测、递归回溯与基础语法',
      },
    };
  }

  // 2. CSP / NOIP
  if (combinedStr.includes('csp') || combinedStr.includes('noip') || combinedStr.includes('noi') || combinedStr.includes('信奥')) {
    return {
      topic: 'csp' as const,
      topicName: 'CSP / NOIP 信奥竞赛',
      subtopic: '真题解析',
      previewGraphic: {
        symbol: '⌘ CSP',
        title: '信息学奥赛题解',
        desc: '历年 CSP-J/S 与 NOIP 经典真题推导',
      },
    };
  }

  // 3. Java
  if (combinedStr.includes('java') || combinedStr.includes('spring') || combinedStr.includes('netty') || combinedStr.includes('log') || combinedStr.includes('junit')) {
    const sub = categories[1] || (title.includes('日志') ? '日志篇' : '架构实践');
    return {
      topic: 'java' as const,
      topicName: 'Java 架构演进与实战',
      subtopic: sub,
      previewGraphic: {
        symbol: '{ } Java',
        title: 'Java 服务端架构',
        desc: 'Spring、Netty、日志框架与工程化实战',
      },
    };
  }

  // 4. Algorithms / LeetCode
  if (combinedStr.includes('leetcode') || combinedStr.includes('算法') || combinedStr.includes('动态规划') || combinedStr.includes('贪心') || combinedStr.includes('排序')) {
    return {
      topic: 'algo' as const,
      topicName: '算法与 LeetCode 专题',
      subtopic: '核心算法',
      previewGraphic: {
        symbol: '🧮 Algo',
        title: '数据结构与算法',
        desc: '双指针、回溯剪枝、图论与搜索',
      },
    };
  }

  // 5. Python, Database, Big Data
  return {
    topic: 'python-data' as const,
    topicName: 'Python 与数据工程',
    subtopic: '技术实战',
    previewGraphic: {
      symbol: '🐍 Python',
      title: 'Python 与大数据',
      desc: 'MySQL、Hadoop、自动化与基础工具',
    },
  };
}

// In-memory cache for all post metadata
let cachedPosts: PostMeta[] | null = null;

export function clearPostCache() {
  cachedPosts = null;
}

export function getAllPosts(): PostMeta[] {
  if (cachedPosts) {
    return cachedPosts;
  }

  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const filenames = fs.readdirSync(postsDirectory);
  const posts: PostMeta[] = [];

  for (const filename of filenames) {
    if (!filename.endsWith('.md')) continue;

    const fullPath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Extract slug and date from filename: YYYY-MM-DD-<slug>.md
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    const fileDate = dateMatch ? dateMatch[1] : '';
    const slug = dateMatch ? dateMatch[2] : filename.replace(/\.md$/, '');

    const { data, content } = safeMatter(fileContents);

    // Parse categories and tags (could be array or comma-separated string)
    let categories: string[] = [];
    if (Array.isArray(data.categories)) {
      categories = data.categories.map(String);
    } else if (typeof data.categories === 'string') {
      categories = data.categories.split(',').map(s => s.trim()).filter(Boolean);
    }

    let tags: string[] = [];
    if (Array.isArray(data.tags)) {
      tags = data.tags.map(String);
    } else if (typeof data.tags === 'string') {
      tags = data.tags.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Format date string (YYYY-MM-DD)
    let postDate = fileDate;
    if (data.date) {
      if (typeof data.date === 'string') {
        postDate = data.date.slice(0, 10);
      } else if (data.date instanceof Date) {
        postDate = data.date.toISOString().slice(0, 10);
      }
    }

    const title = data.title ? String(data.title) : slug;
    const { topic, topicName, subtopic, previewGraphic } = resolveTopic(categories, tags, title);

    // Preview Image resolution
    let previewImg: string | null = null;
    if (data.image && typeof data.image === 'string') {
      previewImg = data.image;
    } else {
      previewImg = extractFirstImage(content);
    }

    const readMinutes = Math.max(2, Math.ceil(content.length / 450));
    const readTime = `${readMinutes} 分钟`;
    const excerpt = cleanExcerpt(content);

    // Pinning / Featured metadata detection (pin: true, featured: true, or top: 1)
    const pinned = !!(
      data.pin === true ||
      data.featured === true ||
      data.top === true ||
      (typeof data.top === 'number' && data.top > 0)
    );
    const pinOrder = typeof data.top === 'number'
      ? data.top
      : typeof data.pin === 'number'
      ? data.pin
      : pinned
      ? 1
      : 0;

    posts.push({
      id: slug,
      slug,
      filename,
      title,
      date: postDate,
      author: data.author ? String(data.author) : 'OneCoder',
      categories,
      tags,
      readTime,
      excerpt,
      topic,
      topicName,
      subtopic,
      previewImg,
      previewGraphic,
      hasMath: !!data.math,
      pinned,
      pinOrder,
    });
  }

  // Sort descending by date
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  cachedPosts = posts;
  return posts;
}

export function getFeaturedPost(): PostMeta | null {
  const posts = getAllPosts();
  // Find highest priority pinned post, or fallback to latest post
  const pinnedPosts = posts.filter(p => p.pinned);
  if (pinnedPosts.length > 0) {
    pinnedPosts.sort((a, b) => (b.pinOrder || 0) - (a.pinOrder || 0));
    return pinnedPosts[0];
  }
  return posts[0] || null;
}

export function getAllTags(): { tag: string; count: number }[] {
  const posts = getAllPosts();
  const counts: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      if (tag && tag.trim()) {
        const t = tag.trim();
        counts[t] = (counts[t] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByTag(tag: string): PostMeta[] {
  const allPosts = getAllPosts();
  const target = tag.trim().toLowerCase();
  return allPosts.filter(p =>
    p.tags.some(t => t.trim().toLowerCase() === target)
  );
}

export interface CategoryChild {
  name: string;
  count: number;
}

export interface CategoryNode {
  name: string;
  count: number;
  children: CategoryChild[];
}

export function getCategoryTree(): CategoryNode[] {
  const posts = getAllPosts();
  const treeMap: Record<string, { count: number; children: Record<string, number> }> = {};

  for (const post of posts) {
    const cats = post.categories && post.categories.length > 0 ? post.categories : ['未分类'];
    const parent = cats[0].trim();
    const child = cats[1] ? cats[1].trim() : null;

    if (!treeMap[parent]) {
      treeMap[parent] = { count: 0, children: {} };
    }
    treeMap[parent].count++;

    if (child) {
      treeMap[parent].children[child] = (treeMap[parent].children[child] || 0) + 1;
    }
  }

  return Object.entries(treeMap)
    .map(([name, info]) => ({
      name,
      count: info.count,
      children: Object.entries(info.children)
        .map(([cName, cCount]) => ({ name: cName, count: cCount }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByCategory(parentCategory: string, subCategory?: string): PostMeta[] {
  const posts = getAllPosts();
  const targetParent = parentCategory.trim().toLowerCase();
  const targetSub = subCategory ? subCategory.trim().toLowerCase() : null;

  return posts.filter(post => {
    const cats = post.categories && post.categories.length > 0 ? post.categories : ['未分类'];
    const parent = cats[0]?.trim()?.toLowerCase();
    const child = cats[1]?.trim()?.toLowerCase();

    if (targetSub) {
      return parent === targetParent && child === targetSub;
    }
    return parent === targetParent;
  });
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const allPosts = getAllPosts();
  const meta = allPosts.find(p => p.slug === slug);
  if (!meta) return null;

  const fullPath = path.join(postsDirectory, meta.filename);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  let { content } = safeMatter(fileContents);

  // Clean Jekyll liquid tags and Kramdown prompt syntax before rendering markdown
  content = content.replace(/{%\s*include\s+.*?%}/g, '');
  content = content.replace(/{{.*?}}/g, '');
  content = content.replace(/^\s*(?:>\s*)?\{:\s*\.prompt-[^}]+\}\s*$/gm, '');

  // Extract TOC headings (h2 and h3)
  const toc: { id: string; title: string; depth: number }[] = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const titleText = match[2].trim().replace(/[*_`]/g, '');
    const id = titleText
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5\-]/g, '');
    toc.push({ id, title: titleText, depth });
  }

  // Process Markdown to HTML with Unified, KaTeX & Shiki
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await processor.process(content);
  let html = String(file);

  // Apply Shiki Code Highlighting to <pre><code class="language-xyz"> blocks
  html = await highlightCodeBlocks(html);

  // Calculate Previous and Next Posts chronologically
  const currentIndex = allPosts.findIndex(p => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  // Calculate intelligent Related Posts based on topic, subtopic and tags
  const relatedPosts = getRelatedPosts(meta, allPosts, 3);

  return {
    ...meta,
    contentHtml: html,
    toc,
    prevPost,
    nextPost,
    relatedPosts,
  };
}

function getRelatedPosts(current: PostMeta, allPosts: PostMeta[], limit = 3): PostMeta[] {
  const candidates = allPosts.filter(p => p.slug !== current.slug);

  const scored = candidates.map(p => {
    let score = 0;
    // Same subtopic gets top priority (e.g. both are GESP 三级 or Java 日志篇)
    if (p.subtopic && current.subtopic && p.subtopic === current.subtopic) {
      score += 6;
    }
    // Same topic
    if (p.topic === current.topic) {
      score += 3;
    }
    // Shared tags
    const sharedTags = p.tags.filter(t => current.tags.includes(t));
    score += sharedTags.length * 2;
    // Shared categories
    const sharedCategories = p.categories.filter(c => current.categories.includes(c));
    score += sharedCategories.length * 1.5;

    return { post: p, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.post.date < a.post.date ? 1 : -1;
  });

  return scored.slice(0, limit).map(s => s.post);
}

function decodeHtmlEntities(text: string): string {
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

function getLangDisplayName(lang: string): string {
  const map: Record<string, string> = {
    cpp: 'C++',
    csharp: 'C#',
    cs: 'C#',
    c: 'C',
    java: 'Java',
    python: 'Python',
    py: 'Python',
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    bash: 'Bash',
    sh: 'Bash',
    shell: 'Shell',
    zsh: 'Zsh',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    markdown: 'Markdown',
    md: 'Markdown',
    go: 'Go',
    rust: 'Rust',
    text: 'Code',
  };
  return map[lang.toLowerCase()] || lang.toUpperCase();
}

function resolveLanguage(rawLang?: string): string {
  const normalized = (rawLang || 'text').toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    'c++': 'cpp',
    'c#': 'csharp',
    cs: 'csharp',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    console: 'bash',
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    yml: 'yaml',
    md: 'markdown',
    txt: 'text',
    plaintext: 'text',
  };
  const target = aliasMap[normalized] || normalized;
  if (target in bundledLanguages || isPlainLang(target) || isSpecialLang(target)) {
    return target;
  }
  return 'text';
}

const lineNumbersTransformer = {
  name: 'code-line-numbers',
  line(node: any, line: number) {
    const lineNumNode = {
      type: 'element',
      tagName: 'span',
      properties: {
        className: ['line-number'],
        'aria-hidden': 'true',
      },
      children: [{ type: 'text', value: String(line) }],
    };
    const lineContentNode = {
      type: 'element',
      tagName: 'span',
      properties: { className: ['line-content'] },
      children: node.children,
    };
    node.children = [lineNumNode, lineContentNode];
  },
};

async function highlightCodeBlocks(html: string): Promise<string> {
  const codeBlockRegex = /<pre\b[^>]*><code(?:\s+class="language-([^"\s>]+)"[^>]*)?>([\s\S]*?)<\/code><\/pre>/gi;
  const matches = Array.from(html.matchAll(codeBlockRegex));

  if (matches.length === 0) {
    return html;
  }

  let result = html;
  for (const match of matches) {
    const fullMatch = match[0];
    const rawLang = match[1] || 'text';
    const lang = resolveLanguage(rawLang);
    const langDisplay = getLangDisplayName(rawLang || lang);

    // Thoroughly decode all HTML entities before sending to Shiki
    const rawCode = decodeHtmlEntities(match[2]);
    const normalizedCode = rawCode.replace(/\r\n/g, '\n').replace(/\n$/, '');
    const lines = normalizedCode.split('\n');
    const lineCount = lines.length;
    const digits = String(lineCount).length;
    const gutterWidth = `${Math.max(2, digits) * 0.65 + 1.25}rem`;

    try {
      const highlighted = await codeToHtml(rawCode, {
        lang: lang as any,
        theme: 'one-dark-pro',
        transformers: [lineNumbersTransformer],
      });

      // Wrap with custom UI container (macOS dots, language, line count, line number & wrap toggles, copy button)
      const enhanced = `
        <div class="code-block my-6 rounded-xl overflow-hidden border border-slate-700/60 dark:border-slate-800 shadow-lg shadow-black/10" style="--ln-gutter-width: ${gutterWidth};">
          <div class="code-header flex items-center justify-between px-3.5 py-2.5 bg-[#21252b] border-b border-[#181a1f] text-xs font-mono select-none">
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1.5" aria-hidden="true">
                <span class="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block shadow-sm"></span>
                <span class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block shadow-sm"></span>
                <span class="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block shadow-sm"></span>
              </div>
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-teal-500/10 text-teal-400 border border-teal-500/25">
                ${langDisplay}
              </span>
              <span class="text-[11px] text-slate-400 font-mono">
                ${lineCount} 行
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" class="code-action-btn toggle-lines-btn px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/5 transition flex items-center gap-1" title="显示/隐藏行号" aria-label="切换行号">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="10" y1="6" x2="21" y2="6"></line>
                  <line x1="10" y1="12" x2="21" y2="12"></line>
                  <line x1="10" y1="18" x2="21" y2="18"></line>
                  <path d="M4 6h1v4"></path>
                  <path d="M4 10h2"></path>
                  <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                </svg>
                <span class="btn-text hidden sm:inline">行号</span>
              </button>
              <button type="button" class="code-action-btn copy-code-btn px-2.5 py-1 rounded text-[11px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5 active:scale-95" data-code="${encodeURIComponent(rawCode)}" title="复制代码" aria-label="复制代码">
                <svg class="copy-icon w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span class="copy-label">复制</span>
              </button>
            </div>
          </div>
          ${highlighted}
        </div>
      `;

      result = result.replace(fullMatch, enhanced);
    } catch {
      // Fallback: keep original if language is not supported
    }
  }

  return result;
}
