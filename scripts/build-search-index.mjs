import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const postsDir = path.join(process.cwd(), '_posts');
const outputFile = path.join(process.cwd(), 'public', 'search-index.json');

function safeMatter(raw) {
  return matter(raw, {
    engines: {
      yaml: {
        parse: (str) => yaml.load(str, { json: true }),
      },
    },
  });
}

function cleanExcerpt(content) {
  let text = content;
  if (text.includes('<!--more-->')) {
    text = text.split('<!--more-->')[0];
  } else if (text.includes('<!-- more -->')) {
    text = text.split('<!-- more -->')[0];
  }
  text = text.replace(/{%.*?%}/g, '');
  text = text.replace(/{{.*?}}/g, '');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/#{1,6}\s+/g, '');
  text = text.replace(/[*_~`>]/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text.slice(0, 160);
}

function extractFirstImage(content) {
  const match = content.match(/!\[.*?\]\((.*?)(?:\s+".*?")?\)/);
  if (!match) return null;
  let url = match[1].trim();
  if (url.startsWith('../images/')) {
    url = url.replace('../images/', '/images/');
  } else if (url.startsWith('images/')) {
    url = '/' + url;
  }
  return url;
}

function resolveTopic(categories = [], tags = [], title = '') {
  const combinedStr = [...categories, ...tags, title].map(s => String(s).toLowerCase()).join(' ');

  if (combinedStr.includes('gesp')) {
    const level = categories.find(c => ['一级', '二级', '三级', '四级', '五级', '六级', '七级', '八级'].includes(c)) ||
      (title.includes('一级') ? '一级' : title.includes('二级') ? '二级' : title.includes('三级') ? '三级' : title.includes('四级') ? '四级' : title.includes('五级') ? '五级' : '考级题解');
    return {
      topic: 'gesp',
      topicName: 'GESP 编程与算法',
      subtopic: level,
      previewGraphic: { symbol: level.includes('级') ? level : 'GESP', title: 'C++ 算法考级专栏', desc: '真题分析、矩阵探测与递归回溯' },
    };
  }

  if (combinedStr.includes('csp') || combinedStr.includes('noip') || combinedStr.includes('noi') || combinedStr.includes('信奥')) {
    return {
      topic: 'csp',
      topicName: 'CSP / NOIP 信奥竞赛',
      subtopic: '真题解析',
      previewGraphic: { symbol: '⌘ CSP', title: '信息学奥赛题解', desc: '历年 CSP-J/S 与 NOIP 经典真题推导' },
    };
  }

  if (combinedStr.includes('java') || combinedStr.includes('spring') || combinedStr.includes('netty') || combinedStr.includes('log') || combinedStr.includes('junit')) {
    const sub = categories[1] || (title.includes('日志') ? '日志篇' : '架构实践');
    return {
      topic: 'java',
      topicName: 'Java 架构演进与实战',
      subtopic: sub,
      previewGraphic: { symbol: '{ } Java', title: 'Java 服务端架构', desc: 'Spring、Netty、日志框架与工程化实战' },
    };
  }

  if (combinedStr.includes('leetcode') || combinedStr.includes('算法') || combinedStr.includes('动态规划') || combinedStr.includes('贪心') || combinedStr.includes('排序')) {
    return {
      topic: 'algo',
      topicName: '算法与 LeetCode 专题',
      subtopic: '核心算法',
      previewGraphic: { symbol: '🧮 Algo', title: '数据结构与算法', desc: '双指针、回溯剪枝、图论与搜索' },
    };
  }

  return {
    topic: 'python-data',
    topicName: 'Python 与数据工程',
    subtopic: '技术实战',
    previewGraphic: { symbol: '🐍 Python', title: 'Python 与大数据', desc: 'MySQL、Hadoop、自动化与基础工具' },
  };
}

const files = fs.readdirSync(postsDir);
const items = [];

for (const file of files) {
  if (!file.endsWith('.md')) continue;
  const fullPath = path.join(postsDir, file);
  const raw = fs.readFileSync(fullPath, 'utf8');

  const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  const fileDate = dateMatch ? dateMatch[1] : '';
  const slug = dateMatch ? dateMatch[2] : file.replace(/\.md$/, '');

  const { data, content } = safeMatter(raw);

  let categories = [];
  if (Array.isArray(data.categories)) categories = data.categories.map(String);
  else if (typeof data.categories === 'string') categories = data.categories.split(',').map(s => s.trim()).filter(Boolean);

  let tags = [];
  if (Array.isArray(data.tags)) tags = data.tags.map(String);
  else if (typeof data.tags === 'string') tags = data.tags.split(',').map(s => s.trim()).filter(Boolean);

  let postDate = fileDate;
  if (data.date) {
    if (typeof data.date === 'string') postDate = data.date.slice(0, 10);
    else if (data.date instanceof Date) postDate = data.date.toISOString().slice(0, 10);
  }

  const title = data.title ? String(data.title) : slug;
  const { topic, topicName, subtopic, previewGraphic } = resolveTopic(categories, tags, title);

  let previewImg = null;
  if (data.image && typeof data.image === 'string') previewImg = data.image;
  else previewImg = extractFirstImage(content);

  items.push({
    id: slug,
    slug,
    title,
    date: postDate,
    categories,
    tags,
    topic,
    topicName,
    subtopic,
    previewImg,
    previewGraphic,
    readTime: `${Math.max(2, Math.ceil(content.length / 450))} 分钟`,
    excerpt: cleanExcerpt(content),
    pinned: !!(data.pin || data.featured || data.top),
  });
}

items.sort((a, b) => (a.date < b.date ? 1 : -1));

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(items), 'utf8');

console.log(`Successfully generated search-index.json with ${items.length} posts! File size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
