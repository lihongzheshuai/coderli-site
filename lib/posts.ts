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
import { codeToHtml } from 'shiki';
import { PostMeta, PostDetail } from '../types/post';

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

  // Remove Jekyll Liquid tags like {% include ... %}
  text = text.replace(/{%.*?%}/g, '');
  text = text.replace(/{{.*?}}/g, '');

  // Remove markdown code blocks, images, links, headers
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/#{1,6}\s+/g, '');
  text = text.replace(/[*_~`>]/g, '');
  text = text.replace(/\s+/g, ' ').trim();

  return text.slice(0, 160) + (text.length > 160 ? '...' : '');
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

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const allPosts = getAllPosts();
  const meta = allPosts.find(p => p.slug === slug);
  if (!meta) return null;

  const fullPath = path.join(postsDirectory, meta.filename);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  let { content } = safeMatter(fileContents);

  // Clean Jekyll liquid tags before rendering markdown
  content = content.replace(/{%\s*include\s+.*?%}/g, '');
  content = content.replace(/{{.*?}}/g, '');

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

  return {
    ...meta,
    contentHtml: html,
    toc,
  };
}

async function highlightCodeBlocks(html: string): Promise<string> {
  const codeBlockRegex = /<pre><code class="language-([a-zA-Z0-9_-]+)">([\s\S]*?)<\/code><\/pre>/g;
  const matches = Array.from(html.matchAll(codeBlockRegex));

  if (matches.length === 0) {
    return html;
  }

  let result = html;
  for (const match of matches) {
    const fullMatch = match[0];
    const rawLang = match[1];
    let lang = rawLang.toLowerCase();

    // Map common aliases
    if (['c++', 'cpp'].includes(lang)) lang = 'cpp';
    if (['c#', 'csharp'].includes(lang)) lang = 'csharp';
    if (['sh', 'bash', 'shell', 'console'].includes(lang)) lang = 'bash';
    if (['yml', 'yaml'].includes(lang)) lang = 'yaml';
    if (['py', 'python'].includes(lang)) lang = 'python';

    // Decode HTML entities before sending to Shiki
    const rawCode = match[2]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    try {
      const highlighted = await codeToHtml(rawCode, {
        lang: lang as any,
        theme: 'github-dark',
      });

      // Wrap with custom UI container (dots, title, copy button)
      const enhanced = `
        <div class="code-block my-6 rounded-lg overflow-hidden border border-slate-700 shadow-md">
          <div class="code-header flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
              <span class="ml-2">${lang.toUpperCase()}</span>
            </div>
            <button class="copy-code-btn px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800 text-slate-300 transition text-xs flex items-center gap-1" data-code="${encodeURIComponent(rawCode)}">
              📋 复制代码
            </button>
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
