import type { PostCardMeta } from '@/types/post';

export type BadgeTrack = 'gesp' | 'contest' | 'arch';
export type ContentKind = 'syllabus' | 'problem' | 'arch';

export interface GespLevelSpec {
  level: string;
  label: string;
  desc: string;
}

export const GESP_LEVELS: GespLevelSpec[] = [
  { level: '一级', label: '一级 · 基础语法与分支', desc: '输入输出、变量与条件分支' },
  { level: '二级', label: '二级 · 循环与基础枚举', desc: '嵌套循环、ASCII 与多层枚举' },
  { level: '三级', label: '三级 · 数组进制与位运算', desc: '进制转换、位运算与一维数组' },
  { level: '四级', label: '四级 · 指针矩阵与排序', desc: '二维数组、结构体与基础排序' },
  { level: '五级', label: '五级 · 初等数论与二分', desc: '筛法、同余、高精度与二分' },
  { level: '六级', label: '六级 · 树、搜索与基础 DP', desc: '二叉树、DFS/BFS 与基础动规' },
  { level: '七级', label: '七级 · 图论与进阶 DP', desc: '图的遍历、最短路与状态压缩' },
  { level: '八级', label: '八级 · 组合数学与图算法', desc: '排列组合、最小生成树与倍增' },
];

export interface WorkbenchSidebarStats {
  total: number;
  gespTotal: number;
  gespLevels: Record<string, number>;
  gespOther: number;
  contestTotal: number;
  cspCount: number;
  noipCount: number;
  algoCount: number;
  engTotal: number;
  javaCount: number;
  pythonDataCount: number;
}

/**
 * Extract OJ problem ID (Luogu P/B/T/U/CF/AT/SP/UVA, LeetCode) from title or slug
 */
export function extractProblemId(title: string, slug: string): string | null {
  const src = `${title} ${slug}`;
  // Match Luogu P/B IDs like P17456, B4576, P1873, B3849
  const luogu = src.match(/\b([PB]\d{4,5})\b/i);
  if (luogu) return luogu[1].toUpperCase();

  // Match Codeforces / AtCoder / LeetCode patterns
  const cf = src.match(/\b(CF\d{3,4}[A-Z]?)\b/i);
  if (cf) return cf[1].toUpperCase();

  return null;
}

/**
 * Classify a post into syllabus (考纲精讲), problem (真题题解), or arch (架构工程)
 */
export function classifyPostKind(post: Pick<PostCardMeta, 'title' | 'slug' | 'topic' | 'tags'>): ContentKind {
  if (post.topic === 'java' || post.topic === 'python-data') {
    return 'arch';
  }
  const t = `${post.title} ${post.slug} ${(post.tags || []).join(' ')}`.toLowerCase();
  if (
    t.includes('考纲') ||
    t.includes('考点') ||
    t.includes('知识点') ||
    t.includes('knowledge') ||
    t.includes('微知识') ||
    t.includes('速记') ||
    t.includes('精讲') ||
    t.includes('心法')
  ) {
    return 'syllabus';
  }
  return 'problem';
}

/**
 * Resolve concise badge label & semantic track color
 */
export function getBadgeMeta(post: Pick<PostCardMeta, 'topic' | 'topicName' | 'subtopic'>): {
  label: string;
  track: BadgeTrack;
} {
  if (post.topic === 'gesp') {
    const sub = post.subtopic || '';
    const isLevel = ['一级', '二级', '三级', '四级', '五级', '六级', '七级', '八级'].includes(sub);
    return {
      label: isLevel ? `GESP ${sub}` : 'GESP 考级',
      track: 'gesp',
    };
  }
  if (post.topic === 'csp') {
    if (post.subtopic === 'NOIP') return { label: 'NOIP 联赛', track: 'contest' };
    if (post.subtopic === 'CSP-S') return { label: 'CSP-S', track: 'contest' };
    return { label: 'CSP-J', track: 'contest' };
  }
  if (post.topic === 'algo') {
    return { label: '经典算法', track: 'contest' };
  }
  if (post.topic === 'java') {
    return { label: 'Java 架构', track: 'arch' };
  }
  return { label: 'Python 数据', track: 'arch' };
}

/**
 * Clean read time display (e.g. "6 分钟" -> "6 min")
 */
export function formatReadTimeCompact(readTime: string): string {
  const m = String(readTime || '').match(/(\d+)/);
  return m ? `${m[1]} min` : '5 min';
}

/**
 * Strip repetitive category/exam boilerplate prefixes in dense list/sidebar/modal rows
 * (Full original title is always preserved in H1, <title>, SEO metadata, and tooltip `title` attr.)
 */
export function formatCompactTitle(title: string): string {
  if (!title) return '';
  let t = title.trim();
  // Remove leading 【...】 classification tags (e.g. 【GESP/CSP考点精讲】, 【GESP/CSP练习】)
  t = t.replace(/^【(?:GESP|CSP|NOIP|信奥|算法|考纲|真题)[^】]*】\s*/i, '');
  // Remove redundant leading level/exam prefix followed by colon (e.g. "GESP五级 / CSP-J 必背：")
  t = t.replace(
    /^(?:GESP\s*[一二三四五六七八\d]+级(?:\s*[/／、]\s*[一二三四五六七八\d]+级)?|CSP-[JS](?:\(S\))?|NOIP\s*\d{0,4})(?:\s*[/／]\s*(?:CSP-[JS](?:\(S\))?|NOIP|GESP\s*[一二三四五六七八\d]+级))*\s*(?:必背|考点精讲|真题题解|题解|练习|模拟|考纲精讲)?\s*[：:]\s*/i,
    ''
  );
  // Remove trailing applicability suffix in dense rows (e.g. "| 适用于 GESP五级 / CSP-J 练习")
  t = t.replace(/\s*\|\s*适用于\s*GESP.*$/i, '').trim();
  return t.length >= 6 ? t : title.trim();
}

/**
 * Build keyword-frontloaded HTML <title> for higher Google/Baidu/Bing CTR.
 * Preserves H1 and URL verbatim; only moves boilerplate brackets behind the core topic/problem ID.
 */
export function buildSeoPageTitle(rawTitle: string, topic: string, subtopic?: string): string {
  const original = String(rawTitle || '').trim();
  if (!original) return 'OneCoder';

  const core = formatCompactTitle(original);
  if (core !== original && core.length >= 4) {
    let suffix = '';
    if (topic === 'gesp' && subtopic && subtopic.includes('级')) {
      suffix = `GESP${subtopic}`;
      if (/CSP-J/i.test(original)) suffix += '/CSP-J';
      else if (/CSP-S/i.test(original)) suffix += '/CSP-S';
    } else if (topic === 'csp') {
      suffix = subtopic || 'CSP/NOIP';
      const lvMatch = original.match(/GESP[一二三四五六七八\d]+级(?:\s*\/\s*[一二三四五六七八\d]+级)?/i);
      if (lvMatch) suffix += ` · ${lvMatch[0].replace(/\s+/g, '')}`;
    }

    const kindHint = /考点精讲/.test(original)
      ? '考点精讲'
      : /题解|真题|练习/.test(original) && !/题解/.test(core)
      ? '题解'
      : '';

    const tail = [kindHint, suffix].filter(Boolean).join(' - ');
    return tail ? `${core} - ${tail} | OneCoder` : `${core} | OneCoder`;
  }

  return `${original} | OneCoder`;
}

const GESP_LEVEL_NUM: Record<string, string> = {
  一级: '1',
  二级: '2',
  三级: '3',
  四级: '4',
  五级: '5',
  六级: '6',
  七级: '7',
  八级: '8',
};

/**
 * Resolve exact verified deep link on wiki.coderli.com for same-level domain-cluster reinforcement.
 */
export function getWikiDeepUrl(topic: string, subtopic?: string): string {
  if (topic === 'gesp' && subtopic && GESP_LEVEL_NUM[subtopic]) {
    return `https://wiki.coderli.com/gesp/${GESP_LEVEL_NUM[subtopic]}/`;
  }
  if (topic === 'gesp') {
    return 'https://wiki.coderli.com/gesp/';
  }
  if (topic === 'csp') {
    if (subtopic === 'NOIP') return 'https://wiki.coderli.com/noirelated/noip/';
    return 'https://wiki.coderli.com/csp/j/';
  }
  return 'https://wiki.coderli.com/';
}
