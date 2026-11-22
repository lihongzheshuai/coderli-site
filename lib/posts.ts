import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
import type { PostMeta, PostCardMeta, PostDetail } from '../types/post';
import { GESP_LEVELS, type WorkbenchSidebarStats } from './workbench';

export function toPostCardMeta(post: PostMeta): PostCardMeta {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags.slice(0, 6),
    readTime: post.readTime,
    excerpt: post.excerpt,
    topic: post.topic,
    topicName: post.topicName,
    subtopic: post.subtopic,
    previewImg: post.previewImg,
    previewGraphic: {
      symbol: post.previewGraphic.symbol,
      title: post.previewGraphic.title,
    },
  };
}

const postsDirectory = path.join(process.cwd(), '_posts');
const postCacheDir = path.join(process.cwd(), '.next', 'cache', 'post-html-cache-v5');

// Convert inline LaTeX and HTML fragments into clean plain text for SEO meta descriptions, TOC labels & GEO summaries
export function stripHtmlAndLatexForPlainText(input: string): string {
  let text = input
    // Decode common HTML entities first so escaped HTML tags in legacy posts get stripped too
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  // Remove HTML comments and actual HTML tags only (never eat C++ comparisons like `i <= n ... n > 1`)
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s+[^<>]*)?\/?>/g, ' ');

  const convertLatexExpr = (expr: string) =>
    expr
      .replace(/\\times\b/g, '×')
      .replace(/\\cdot\b/g, '·')
      .replace(/\\div\b/g, '÷')
      .replace(/\\le(?:q)?\b/g, '≤')
      .replace(/\\ge(?:q)?\b/g, '≥')
      .replace(/\\ne(?:q)?\b/g, '≠')
      .replace(/\\approx\b/g, '≈')
      .replace(/\\pm\b/g, '±')
      .replace(/\\infty\b/g, '∞')
      .replace(/\\sigma\b/g, 'σ')
      .replace(/\\Sigma\b/g, 'Σ')
      .replace(/\\pi\b/g, 'π')
      .replace(/\\phi\b|\\varphi\b/g, 'φ')
      .replace(/\\alpha\b/g, 'α')
      .replace(/\\beta\b/g, 'β')
      .replace(/\\theta\b/g, 'θ')
      .replace(/\\Omega\b/g, 'Ω')
      .replace(/\\(?:c|l|v)?dots\b/g, '...')
      .replace(/\\to\b|\\rightarrow\b/g, '→')
      .replace(/\\log\b/g, 'log')
      .replace(/\\min\b/g, 'min')
      .replace(/\\max\b/g, 'max')
      .replace(/\\gcd\b/g, 'gcd')
      .replace(/\\lcm\b/g, 'lcm')
      .replace(/\\bmod\b|\\mod\b/g, ' mod ')
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1/$2)')
      .replace(/\\sqrt\{([^{}]+)\}/g, (_, inner: string) => (inner.length <= 2 ? `√${inner}` : `√(${inner})`))
      .replace(/\\(?:text|mathrm|mathbf|mathit|texttt)\{([^{}]+)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '');

  // Convert display & inline math $...$ into readable plain symbols
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr: string) => ` ${convertLatexExpr(expr)} `);
  text = text.replace(/\$([^$\n]+)\$/g, (_, expr: string) => convertLatexExpr(expr));

  return text;
}

// Helper to strip markdown symbols for excerpts
function cleanExcerpt(
  content: string,
  fallbackTitle = '',
  categories: string[] = [],
  tags: string[] = [],
  explicitSummary?: string
): string {
  if (explicitSummary && explicitSummary.trim().length >= 25) {
    return stripHtmlAndLatexForPlainText(explicitSummary).replace(/\s+/g, ' ').trim().slice(0, 150);
  }

  // If <!--more--> exists, take the part before it; if too short, fall back to full content
  let text = content;
  if (text.includes('<!--more-->')) {
    const head = text.split('<!--more-->')[0];
    if (head.trim().length >= 35) text = head;
  } else if (text.includes('<!-- more -->')) {
    const head = text.split('<!-- more -->')[0];
    if (head.trim().length >= 35) text = head;
  }

  // Remove Jekyll Liquid tags like {% include ... %} and Kramdown prompt IAL
  text = text.replace(/{%.*?%}/g, '');
  text = text.replace(/{{.*?}}/g, '');
  text = text.replace(/\{:.*?prompt-.*?\}|\{:\s*\..*?\}/g, '');

  // Remove markdown code blocks, images, links, headers (preserve * and > inside inline code/math!)
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = stripHtmlAndLatexForPlainText(text);
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^\s*>\s*/gm, '');
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '$1');
  text = text.replace(/__([^_\n]+)__/g, '$1');
  text = text.replace(/~~([^~\n]+)~~/g, '$1');
  text = text.replace(/`([^`\n]+)`/g, '$1');
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length < 25 && fallbackTitle) {
    const metaKeywords = Array.from(new Set([...categories, ...tags])).filter(Boolean).slice(0, 4).join('、');
    const prefix = `OneCoder 技术详解：${fallbackTitle}`;
    text = text
      ? `${prefix}。${text}${metaKeywords ? `（涉及考点与技术栈：${metaKeywords}）` : ''}`
      : `${prefix}${metaKeywords ? `，涵盖 ${metaKeywords} 核心原理、代码实战与易错点复盘。` : '，包含原理剖析与实战代码总结。'}`;
  }

  const MAX_LEN = 135;
  if (text.length <= MAX_LEN) return text;

  const truncated = text.slice(0, MAX_LEN).trim();
  return truncated + '...';
}

export function resolveSeoCoverImage(post: Pick<PostMeta, 'previewImg' | 'topic' | 'subtopic' | 'slug' | 'title'>): string {
  if (post.previewImg) {
    if (post.previewImg.startsWith('http://') || post.previewImg.startsWith('https://')) {
      return post.previewImg;
    }
    return post.previewImg.startsWith('/') ? post.previewImg : `/${post.previewImg}`;
  }
  const slugAndTitle = `${post.slug} ${post.title}`.toLowerCase();
  if (slugAndTitle.includes('knowledge') || post.title.includes('考点') || post.title.includes('考纲')) {
    return '/images/gesp_csp_knowledge_default_cover.png';
  }
  if (post.topic === 'gesp') {
    return '/images/gesp_exam_default_cover.png';
  }
  if (post.topic === 'csp') {
    return post.subtopic === 'NOIP'
      ? '/images/noip_exam_default_cover.png'
      : '/images/csp_exam_default_cover.png';
  }
  return '/images/gesp_csp_default_cover.png';
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

export { getCategoryLink } from './categories';

// 5 Core Topic Classifier
export function resolveTopic(categories: string[] = [], tags: string[] = [], title: string = '') {
  const cat0 = categories[0] || '';
  const cat1 = categories[1] || '';
  const titleLower = title.toLowerCase();
  const tagsLower = tags.map(t => String(t).toLowerCase());

  // 1. CSP / NOIP
  const isCspNoipCategory = cat0 === 'CSP/NOIP' || cat0 === 'NOIP' || cat0 === 'CSP';
  const hasNoip = titleLower.includes('noip') || titleLower.includes('noi-p') || tagsLower.some(t => t.includes('noip'));
  const hasCsp = titleLower.includes('csp') || tagsLower.some(t => t.includes('csp'));

  if (isCspNoipCategory || (!titleLower.includes('gesp') && (hasNoip || hasCsp || tagsLower.some(t => t.includes('信奥'))))) {
    let sub = 'CSP-J';
    if (cat1 === 'NOIP' || (hasNoip && !hasCsp)) {
      sub = 'NOIP';
    } else if (cat1 === 'CSP-S' || titleLower.includes('csp-s') || tagsLower.some(t => t.includes('csp-s')) || titleLower.includes('提高组')) {
      sub = 'CSP-S';
    } else if (cat1 === 'CSP-J' || titleLower.includes('csp-j') || tagsLower.some(t => t.includes('csp-j')) || titleLower.includes('普及组')) {
      sub = 'CSP-J';
    }

    return {
      topic: 'csp' as const,
      topicName: 'CSP / NOIP 信奥竞赛',
      subtopic: sub,
      previewGraphic: {
        symbol: sub === 'NOIP' ? '⌘ NOIP' : sub === 'CSP-S' ? '⌘ CSP-S' : '⌘ CSP-J',
        title: sub === 'NOIP' ? 'NOIP 全国联赛真题' : sub === 'CSP-S' ? 'CSP-S 提高级题解' : 'CSP-J 入门级题解',
        desc: '历年 CSP-J/S 与 NOIP 经典真题推导与专项强化',
      },
    };
  }

  const combined = [...categories, ...tags, title].map(s => String(s).toLowerCase());
  const combinedStr = combined.join(' ');

  // 2. GESP
  if (combinedStr.includes('gesp')) {
    const levelMatch = categories.find(c => ['一级', '二级', '三级', '四级', '五级', '六级', '七级', '八级'].includes(c)) ||
      (title.includes('一级') ? '一级' : title.includes('二级') ? '二级' : title.includes('三级') ? '三级' : title.includes('四级') ? '四级' : title.includes('五级') ? '五级' : title.includes('六级') ? '六级' : title.includes('七级') ? '七级' : title.includes('八级') ? '八级' : '考级精选题解');
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
let cachedTags: { tag: string; count: number }[] | null = null;
const postDetailCache = new Map<string, PostDetail>();
const relatedPostsCache = new Map<string, PostMeta[]>();

export function clearPostCache(slug?: string) {
  cachedPosts = null;
  cachedTags = null;
  if (slug) {
    postDetailCache.delete(slug);
    relatedPostsCache.delete(slug);
  } else {
    postDetailCache.clear();
    relatedPostsCache.clear();
  }
  try {
    if (slug) {
      const cacheFilePath = path.join(postCacheDir, `${slug}.json`);
      if (fs.existsSync(cacheFilePath)) {
        fs.unlinkSync(cacheFilePath);
      }
    } else if (fs.existsSync(postCacheDir)) {
      fs.rmSync(postCacheDir, { recursive: true, force: true });
    }
  } catch {}
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

    // Format date string (YYYY-MM-DD) & optional updated/lastmod date
    let postDate = fileDate;
    if (data.date) {
      if (typeof data.date === 'string') {
        postDate = data.date.slice(0, 10);
      } else if (data.date instanceof Date) {
        postDate = data.date.toISOString().slice(0, 10);
      }
    }

    let updatedDate: string | undefined;
    const rawUpdated = data.updated ?? data.lastmod ?? data.last_modified ?? data.modified;
    if (rawUpdated) {
      if (typeof rawUpdated === 'string') {
        updatedDate = rawUpdated.slice(0, 10);
      } else if (rawUpdated instanceof Date) {
        updatedDate = rawUpdated.toISOString().slice(0, 10);
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

    const plainLength = content.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, '').length;
    const wordCount = Math.max(120, plainLength);
    const readMinutes = Math.max(2, Math.ceil(content.length / 450));
    const readTime = `${readMinutes} 分钟`;
    const explicitDesc =
      typeof data.description === 'string'
        ? data.description
        : typeof data.summary === 'string'
        ? data.summary
        : undefined;
    const excerpt = cleanExcerpt(content, title, categories, tags, explicitDesc);

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
      updatedDate,
      author: data.author ? String(data.author) : 'OneCoder',
      categories,
      tags: tags.slice(0, 6),
      readTime,
      readMinutes,
      wordCount,
      excerpt,
      topic,
      topicName,
      subtopic,
      previewImg,
      previewGraphic: {
        symbol: previewGraphic.symbol,
        title: previewGraphic.title,
        desc: '',
      },
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
  if (cachedTags) return cachedTags;
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
  cachedTags = Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  return cachedTags;
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
    return parent === targetParent || child === targetParent;
  });
}

export function getWorkbenchStats(postsInput?: PostMeta[]): WorkbenchSidebarStats {
  const posts = postsInput || getAllPosts();
  const gespLevels: Record<string, number> = {};
  for (const spec of GESP_LEVELS) {
    gespLevels[spec.level] = 0;
  }

  let gespTotal = 0;
  let gespOther = 0;
  let cspCount = 0;
  let noipCount = 0;
  let algoCount = 0;
  let javaCount = 0;
  let pythonDataCount = 0;

  for (const p of posts) {
    if (p.topic === 'gesp') {
      gespTotal++;
      if (p.subtopic && p.subtopic in gespLevels) {
        gespLevels[p.subtopic]++;
      } else {
        gespOther++;
      }
    } else if (p.topic === 'csp') {
      if (p.subtopic === 'NOIP') noipCount++;
      else cspCount++;
    } else if (p.topic === 'algo') {
      algoCount++;
    } else if (p.topic === 'java') {
      javaCount++;
    } else {
      pythonDataCount++;
    }
  }

  return {
    total: posts.length,
    gespTotal,
    gespLevels,
    gespOther,
    contestTotal: cspCount + noipCount + algoCount,
    cspCount,
    noipCount,
    algoCount,
    engTotal: javaCount + pythonDataCount,
    javaCount,
    pythonDataCount,
  };
}

export interface SiblingPostItem {
  slug: string;
  title: string;
  subtopic: string;
  date: string;
}

export function getSiblingSeriesPosts(
  current: PostMeta,
  allPostsInput?: PostMeta[],
  limit = 10
): { heading: string; totalInSeries: number; items: SiblingPostItem[] } {
  const allPosts = allPostsInput || getAllPosts();
  let pool = allPosts.filter(p => p.topic === current.topic && p.subtopic === current.subtopic);
  let heading = current.topic === 'gesp' && current.subtopic?.includes('级')
    ? `GESP ${current.subtopic} · 同级连读`
    : `${current.subtopic || current.topicName} · 同栏连读`;

  if (pool.length < 3) {
    pool = allPosts.filter(p => p.topic === current.topic);
    heading = `${current.topicName} · 同栏连读`;
  }

  const idx = pool.findIndex(p => p.slug === current.slug);
  let start = 0;
  if (idx !== -1 && pool.length > limit) {
    start = Math.max(0, Math.min(idx - Math.floor(limit / 2), pool.length - limit));
  }
  const sliced = pool.slice(start, start + limit).map(p => ({
    slug: p.slug,
    title: p.title,
    subtopic: p.subtopic,
    date: p.date,
  }));

  return {
    heading,
    totalInSeries: pool.length,
    items: sliced,
  };
}

export async function getPostBySlug(rawSlug: string): Promise<PostDetail | null> {
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {}
  const normalizedPlus = decoded.replace(/\s+/g, '+');

  const allPosts = getAllPosts();
  const meta = allPosts.find(
    p => p.slug === rawSlug || p.slug === decoded || p.slug === normalizedPlus
  );
  if (!meta) return null;

  const slug = meta.slug;
  if (postDetailCache.has(slug)) {
    return postDetailCache.get(slug)!;
  }

  const fullPath = path.join(postsDirectory, meta.filename);
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const fileHash = crypto.createHash('md5').update(fileContents).digest('hex');

  const cacheFilePath = path.join(postCacheDir, `${slug}.json`);
  let html: string | null = null;
  let toc: { id: string; title: string; depth: number }[] | null = null;
  let faqItems: { question: string; answer: string }[] | null = null;

  // 1. Check incremental build cache: if file content hash has not changed, reuse cached HTML, TOC & FAQ
  try {
    if (fs.existsSync(cacheFilePath)) {
      const cached = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
      if (
        cached.hash === fileHash &&
        cached.contentHtml &&
        Array.isArray(cached.toc) &&
        Array.isArray(cached.faqItems)
      ) {
        html = cached.contentHtml;
        toc = cached.toc;
        faqItems = cached.faqItems;
      }
    }
  } catch {}

  // 2. If not in cache or file was modified, parse Markdown, KaTeX and run Shiki highlighting
  if (!html || !toc || !faqItems) {
    let { content } = safeMatter(fileContents);

    // Clean Jekyll liquid tags and Kramdown prompt syntax before rendering markdown
    content = content.replace(/{%\s*include\s+.*?%}/g, '');
    content = content.replace(/{{.*?}}/g, '');
    content = content.replace(/^\s*(?:>\s*)?\{:\s*\.prompt-[^}]+\}\s*$/gm, '');

    // Extract TOC headings (h2 and h3) with clean plain/Unicode math labels
    toc = [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const depth = match[1].length;
      const rawHeading = match[2].trim();
      const id = rawHeading
        .replace(/[*_`]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5\-]/g, '');
      const cleanTitle = stripHtmlAndLatexForPlainText(rawHeading)
        .replace(/\*\*([^*\n]+)\*\*/g, '$1')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      toc.push({ id, title: cleanTitle, depth });
    }

    // Extract genuine Q&A / exam-pitfall pairs for FAQPage Schema (GEO & rich snippets)
    faqItems = [];
    const sectionBlocks = content.split(/\n(?=###\s+)/);
    for (const block of sectionBlocks) {
      const hMatch = block.match(/^###\s+(.+)\n([\s\S]+)/);
      if (!hMatch) continue;
      const rawQ = stripHtmlAndLatexForPlainText(hMatch[1])
        .replace(/\*\*([^*\n]+)\*\*/g, '$1')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/^[❌⚠️💡🎯🔍📌✅🔥\d.\s]+/, '')
        .replace(/\s+/g, ' ')
        .trim();
      const isQuestionOrPitfall =
        /[？?]$/.test(rawQ) ||
        /^(?:易错点|常见错误|避坑|为什么|如何|怎么|区别)/.test(rawQ);
      if (!isQuestionOrPitfall || rawQ.length < 8 || rawQ.length > 90) continue;

      const bodyWithoutSub = hMatch[2].split(/\n##\s+/)[0];
      const cleanAns = cleanExcerpt(bodyWithoutSub, rawQ).slice(0, 260).trim();
      if (cleanAns.length >= 35) {
        const cleanBaseQ = rawQ.replace(/[！!。.,，:：;；]+$/g, '').trim();
        const questionText = /[？?]$/.test(rawQ)
          ? rawQ
          : `${cleanBaseQ}，在 C++ 考场中该如何避免？`;
        faqItems.push({ question: questionText, answer: cleanAns });
        if (faqItems.length >= 4) break;
      }
    }

    // Process Markdown to HTML with Unified, KaTeX & Shiki
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, { output: 'html', strict: false, throwOnError: false } as any)
      .use(rehypeSlug)
      .use(rehypeStringify, { allowDangerousHtml: true });

    const file = await processor.process(content);
    html = String(file);

    // Apply Shiki Code Highlighting to <pre><code class="language-xyz"> blocks
    html = await highlightCodeBlocks(html);

    // Write to persistent incremental cache
    try {
      if (!fs.existsSync(postCacheDir)) {
        fs.mkdirSync(postCacheDir, { recursive: true });
      }
      fs.writeFileSync(
        cacheFilePath,
        JSON.stringify({
          hash: fileHash,
          contentHtml: html,
          toc,
          faqItems,
        }),
        'utf8'
      );
    } catch {}
  }

  // Calculate Previous and Next Posts chronologically
  const currentIndex = allPosts.findIndex(p => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  // Calculate intelligent Related Posts based on topic, subtopic and tags
  const relatedPosts = getRelatedPosts(meta, allPosts, 3);

  const detail: PostDetail = {
    ...meta,
    contentHtml: html,
    toc,
    faqItems,
    prevPost,
    nextPost,
    relatedPosts,
  };
  postDetailCache.set(slug, detail);
  return detail;
}

function getRelatedPosts(current: PostMeta, allPosts: PostMeta[], limit = 3): PostMeta[] {
  if (relatedPostsCache.has(current.slug)) {
    return relatedPostsCache.get(current.slug)!;
  }

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

  const result = scored.slice(0, limit).map(s => s.post);
  relatedPostsCache.set(current.slug, result);
  return result;
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
      const highlighted = await codeToHtml(normalizedCode, {
        lang: lang as any,
        theme: 'one-dark-pro',
        transformers: [lineNumbersTransformer],
      });

      // Wrap with Workbench Pro code container (clean status dot, crisp SVG buttons, zero emojis, ligatures off)
      const enhanced = `<div class="code-block" style="--ln-gutter-width:${gutterWidth}"><div class="code-header flex items-center justify-between px-3.5 py-2 text-xs font-mono select-none"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-[#2DD4BF] inline-block" aria-hidden="true"></span><span class="text-[11.5px] font-medium text-slate-200">${langDisplay}</span><span class="text-[11px] text-slate-400 tnum">· ${lineCount} 行</span></div><div class="flex items-center gap-1.5"><button type="button" class="code-action-btn toggle-lines-btn px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-100 hover:bg-white/10 transition flex items-center gap-1" title="显示/隐藏行号"><span class="btn-text"># 行号</span></button><button type="button" class="code-action-btn copy-code-btn px-2.5 py-1 rounded text-[11px] text-slate-200 hover:text-white bg-white/5 hover:bg-white/15 border border-white/15 transition flex items-center gap-1.5" title="复制代码"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span class="copy-label">复制代码</span></button></div></div>${highlighted}</div>`;

      result = result.replace(fullMatch, enhanced);
    } catch {
      // Fallback: keep original if language is not supported
    }
  }

  return result;
}
