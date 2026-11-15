import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const BASE_URL = 'https://www.coderli.com';
const postsDir = path.join(process.cwd(), '_posts');
const publicDir = path.join(process.cwd(), 'public');

function safeMatter(raw) {
  return matter(raw, {
    engines: {
      yaml: {
        parse: str => yaml.load(str, { json: true }),
      },
    },
  });
}

function stripHtmlAndLatex(input) {
  let text = String(input || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ');
  text = text.replace(/\$([^$\n]+)\$/g, (_, expr) =>
    expr
      .replace(/\\times\b/g, '×')
      .replace(/\\div\b/g, '÷')
      .replace(/\\le(?:q)?\b/g, '≤')
      .replace(/\\ge(?:q)?\b/g, '≥')
      .replace(/\\ne(?:q)?\b/g, '≠')
      .replace(/\\approx\b/g, '≈')
      .replace(/\\(?:c|l|v)?dots\b/g, '...')
      .replace(/\\to\b|\\rightarrow\b/g, '→')
      .replace(/\\log\b/g, 'log')
      .replace(/\\min\b/g, 'min')
      .replace(/\\max\b/g, 'max')
      .replace(/\\gcd\b/g, 'gcd')
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1/$2)')
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
      .replace(/\\(?:text|mathrm|mathbf|mathit|texttt)\{([^{}]+)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
  );
  return text;
}

function cleanPlainSummary(content, title, categories = [], tags = [], explicitSummary = '') {
  if (explicitSummary && explicitSummary.trim().length >= 25) {
    return stripHtmlAndLatex(explicitSummary).replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  let text = content;
  if (text.includes('<!--more-->')) {
    const head = text.split('<!--more-->')[0];
    if (head.trim().length >= 35) text = head;
  } else if (text.includes('<!-- more -->')) {
    const head = text.split('<!-- more -->')[0];
    if (head.trim().length >= 35) text = head;
  }
  text = text
    .replace(/{%.*?%}/g, '')
    .replace(/{{.*?}}/g, '')
    .replace(/\{:.*?prompt-.*?\}|\{:\s*\..*?\}/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = stripHtmlAndLatex(text)
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 25) {
    const kw = Array.from(new Set([...categories, ...tags])).filter(Boolean).slice(0, 4).join('、');
    text = `OneCoder 技术详解：${title}${kw ? `（涉及：${kw}）` : ''}`;
  }
  return text.length > 135 ? text.slice(0, 135).trim() + '...' : text;
}

function resolveTopic(categories = [], tags = [], title = '') {
  const cat0 = categories[0] || '';
  const cat1 = categories[1] || '';
  const titleLower = title.toLowerCase();
  const tagsLower = tags.map(t => String(t).toLowerCase());
  const isCspNoipCategory = cat0 === 'CSP/NOIP' || cat0 === 'NOIP' || cat0 === 'CSP';
  const hasNoip = titleLower.includes('noip') || titleLower.includes('noi-p') || tagsLower.some(t => t.includes('noip'));
  const hasCsp = titleLower.includes('csp') || tagsLower.some(t => t.includes('csp'));

  if (isCspNoipCategory || (!titleLower.includes('gesp') && (hasNoip || hasCsp || tagsLower.some(t => t.includes('信奥'))))) {
    let sub = 'CSP-J';
    if (cat1 === 'NOIP' || (hasNoip && !hasCsp)) sub = 'NOIP';
    else if (cat1 === 'CSP-S' || titleLower.includes('csp-s') || tagsLower.some(t => t.includes('csp-s'))) sub = 'CSP-S';
    return { topic: 'csp', topicName: 'CSP / NOIP 信奥竞赛', subtopic: sub };
  }
  const combinedStr = [...categories, ...tags, title].map(s => String(s).toLowerCase()).join(' ');
  if (combinedStr.includes('gesp')) {
    const level =
      categories.find(c => ['一级', '二级', '三级', '四级', '五级', '六级', '七级', '八级'].includes(c)) ||
      '考级精选题解';
    return { topic: 'gesp', topicName: 'GESP C++ 编程考级', subtopic: level };
  }
  if (combinedStr.includes('java') || combinedStr.includes('spring') || combinedStr.includes('netty') || combinedStr.includes('log') || combinedStr.includes('junit')) {
    return { topic: 'java', topicName: 'Java 架构演进与实战', subtopic: categories[1] || '架构实践' };
  }
  if (combinedStr.includes('leetcode') || combinedStr.includes('算法') || combinedStr.includes('动态规划') || combinedStr.includes('贪心') || combinedStr.includes('排序')) {
    return { topic: 'algo', topicName: '算法与 LeetCode 专题', subtopic: '核心算法' };
  }
  return { topic: 'python-data', topicName: 'Python 与数据工程', subtopic: '技术实战' };
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const files = fs.existsSync(postsDir) ? fs.readdirSync(postsDir).filter(f => f.endsWith('.md')) : [];
const posts = [];

for (const filename of files) {
  const raw = fs.readFileSync(path.join(postsDir, filename), 'utf8');
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  const fileDate = dateMatch ? dateMatch[1] : '2026-01-01';
  const fileSlug = dateMatch ? dateMatch[2] : filename.replace(/\.md$/, '');
  const { data, content } = safeMatter(raw);

  const slug = data.slug ? String(data.slug).trim() : fileSlug;
  const title = stripHtmlAndLatex(data.title ? String(data.title) : slug).replace(/\s+/g, ' ').trim();
  const categories = Array.isArray(data.categories)
    ? data.categories.map(String)
    : typeof data.categories === 'string'
    ? data.categories.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const tags = Array.isArray(data.tags)
    ? data.tags.map(String)
    : typeof data.tags === 'string'
    ? data.tags.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  let postDate = fileDate;
  if (data.date) {
    if (typeof data.date === 'string') postDate = data.date.slice(0, 10);
    else if (data.date instanceof Date) postDate = data.date.toISOString().slice(0, 10);
  }

  const explicitDesc = typeof data.description === 'string' ? data.description : typeof data.summary === 'string' ? data.summary : '';
  const summary = cleanPlainSummary(content, title, categories, tags, explicitDesc);
  const { topic, topicName, subtopic } = resolveTopic(categories, tags, title);
  const pinned = !!(data.pin === true || data.featured === true || data.top);

  posts.push({ slug, title, date: postDate, categories, tags, summary, topic, topicName, subtopic, pinned });
}

posts.sort((a, b) => (a.date < b.date ? 1 : -1));

// 1. Generate /public/llms.txt (Concise high-signal entry point for LLM Search & RAG engines)
const latestPosts = posts.slice(0, 50);
const pinnedPosts = posts.filter(p => p.pinned).slice(0, 10);

const llmsLines = [
  '# OneCoder 技术与信奥算法知识库 (coderli.com)',
  '',
  '> OneCoder（李宏哲）独立技术博客，始于 2012 年，累计沉淀 ' + posts.length + '+ 篇原创技术文章。核心聚焦：CCF GESP C++ 编程能力等级认证（1～8级）考纲微知识点精讲与历年真题题解、CSP-J/S 与 NOIP 信息学奥赛算法推导、Java 服务端架构演进（Spring / Netty / JVM / 日志体系）以及 Python 数据工程实战。所有 C++ 题解代码严格遵循 C++11 标准与考场实战规范。',
  '',
  '## 权威导航与关联生态 (Core Hubs & Ecosystem)',
  '',
  `- [OneCoder 博客首页](${BASE_URL}/): 最新技术文章与信奥考点精讲更新流`,
  `- [全站博文归档总目录](${BASE_URL}/archives/): 2012 年至今全部 ${posts.length} 篇文章静态索引`,
  `- [GESP C++ 1-8级考级专栏](${BASE_URL}/topics/gesp/): 覆盖一级至八级考纲考点拆解、易错陷阱与洛谷/官方真题题解`,
  `- [CSP-J/S & NOIP 信奥竞赛专栏](${BASE_URL}/topics/csp/): 初赛客观题/阅读程序考点与复赛算法真题推导`,
  `- [算法与数据结构专题](${BASE_URL}/topics/algo/): 排序、二分、前缀和差分、DFS/BFS搜索、动态规划与图论`,
  `- [Java 架构演进专栏](${BASE_URL}/topics/java/): Netty 网络通信、Spring 生态、并发编程与架构设计`,
  `- [Python 与数据工程专栏](${BASE_URL}/topics/python-data/): Python 工具链、MySQL/PostgreSQL 与大数据实战`,
  `- [GESP / CSP 体系化知识百科 (Wiki)](https://wiki.coderli.com/): 按等级结构化编排的 GESP/CSP/NOIP 知识库`,
  `- [OneCoder 信奥远征互动闯关平台](https://oi.coderli.com/): GESP 1-8级 240 关在线训练、考纲心法与全真模考系统`,
  `- [全量知识目录 (LLMs Full Index)](${BASE_URL}/llms-full.txt): 包含全站所有 ${posts.length} 篇文章的完整标题、URL 与摘要清单`,
  `- [RSS 订阅源](${BASE_URL}/rss.xml): 最新 50 篇文章标准 RSS 2.0 增量源`,
  '',
];

if (pinnedPosts.length > 0) {
  llmsLines.push('## 核心置顶与高频参考指南 (Featured Guides)', '');
  for (const p of pinnedPosts) {
    llmsLines.push(`- [${p.title}](${BASE_URL}/${p.slug}/): ${p.summary}`);
  }
  llmsLines.push('');
}

llmsLines.push('## 最新更新文章 (Latest 50 Articles)', '');
for (const p of latestPosts) {
  llmsLines.push(`- [${p.title}](${BASE_URL}/${p.slug}/) (${p.date}): ${p.summary}`);
}
llmsLines.push('');

fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsLines.join('\n'), 'utf8');

// 2. Generate /public/llms-full.txt (Complete structured catalog grouped by Topic)
const topicOrder = [
  { key: 'gesp', title: 'GESP C++ 编程考级（1～8级考纲精讲与真题题解）' },
  { key: 'csp', title: 'CSP-J/S 与 NOIP 信息学奥赛专栏' },
  { key: 'algo', title: '数据结构、核心算法与 LeetCode 专题' },
  { key: 'java', title: 'Java 服务端架构演进与工程实战' },
  { key: 'python-data', title: 'Python、数据库与大数据工程' },
];

const fullLines = [
  '# OneCoder 全量文章索引目录 (llms-full.txt)',
  '',
  `> 站点：${BASE_URL} | 总篇数：${posts.length} | 最新更新：${posts[0]?.date || ''}`,
  '',
];

for (const grp of topicOrder) {
  const grpPosts = posts.filter(p => p.topic === grp.key);
  fullLines.push(`## ${grp.title} (${grpPosts.length} 篇)`, '');
  for (const p of grpPosts) {
    const badge = p.subtopic ? `[${p.subtopic}] ` : '';
    fullLines.push(`- ${badge}[${p.title}](${BASE_URL}/${p.slug}/) (${p.date}): ${p.summary}`);
  }
  fullLines.push('');
}

fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), fullLines.join('\n'), 'utf8');

// 3. Generate /public/rss.xml (RSS 2.0 Feed for Search Engines, Aggregators & AI Crawlers)
const rssPosts = posts.slice(0, 50);
const lastBuildDate = rssPosts[0]?.date ? new Date(`${rssPosts[0].date}T08:00:00+08:00`).toUTCString() : new Date().toUTCString();

const rssItems = rssPosts
  .map(p => {
    const link = `${BASE_URL}/${p.slug}/`;
    const pubDate = new Date(`${p.date}T08:00:00+08:00`).toUTCString();
    const cats = Array.from(new Set([p.topicName, ...p.categories, ...p.tags]))
      .filter(Boolean)
      .map(c => `      <category>${escapeXml(c)}</category>`)
      .join('\n');
    return [
      '    <item>',
      `      <title>${escapeXml(p.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${pubDate}</pubDate>`,
      `      <description>${escapeXml(p.summary)}</description>`,
      cats,
      '    </item>',
    ]
      .filter(Boolean)
      .join('\n');
  })
  .join('\n');

const rssXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  '  <channel>',
  '    <title>OneCoder · C++ GESP/CSP信奥题解与Java后端架构知识库</title>',
  `    <link>${BASE_URL}/</link>`,
  '    <description>始于2012年的独立技术知识库：涵盖 GESP 1-8级考纲精讲与真题题解、CSP-J/S &amp; NOIP 信奥算法、Java 架构与 Python 工程实战。</description>',
  '    <language>zh-CN</language>',
  `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
  `    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>`,
  rssItems,
  '  </channel>',
  '</rss>',
  '',
].join('\n');

fs.writeFileSync(path.join(publicDir, 'rss.xml'), rssXml, 'utf8');

console.log(
  `[SEO/GEO] Built llms.txt (${latestPosts.length} recent), llms-full.txt (${posts.length} total), and rss.xml (${rssPosts.length} items).`
);
