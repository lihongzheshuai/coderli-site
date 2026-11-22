import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BookOpen, Trophy, Code2, Monitor, Database } from 'lucide-react';
import { getAllPosts, toPostCardMeta } from '@/lib/posts';
import GoogleAd from '@/components/GoogleAd';
import TopicPostList from '@/components/TopicPostList';
import PopularTagsCard from '@/components/PopularTagsCard';
import OiGamePromo from '@/components/OiGamePromo';

const topicMetaMap: Record<
  string,
  { name: string; desc: string }
> = {
  gesp: {
    name: 'GESP 考级真题专栏',
    desc: '从一级到八级，包含历年官方真题推导、八方向矩阵探测、几何浮点计算、DFS 递归搜索与剪枝实战。',
  },
  java: {
    name: 'Java 架构演进与实战',
    desc: '系统梳理 Java 基础、Log 日志门面演进、Spring 核心、Netty 高性能网络通信与 JVM 字节码研究。',
  },
  csp: {
    name: 'CSP / NOIP 信奥竞赛',
    desc: '信息学奥赛初赛与复赛真题解析，包含数论、贪心、枚举与搜索图论算法。',
  },
  algo: {
    name: '算法专题与 LeetCode',
    desc: '常用数据结构、双指针滑动窗口、动态规划与二分搜索。',
  },
  'python-data': {
    name: 'Python 与数据工程',
    desc: 'Python 实用技术库、MySQL 高性能架构、PostgreSQL、Hadoop/Spark 大数据。',
  },
};

function renderTopicIcon(key: string, className = 'w-4 h-4') {
  switch (key) {
    case 'gesp':
      return <BookOpen className={className} />;
    case 'csp':
      return <Trophy className={className} />;
    case 'algo':
      return <Code2 className={className} />;
    case 'java':
      return <Monitor className={className} />;
    default:
      return <Database className={className} />;
  }
}

export async function generateStaticParams() {
  return [
    { topic: 'gesp' },
    { topic: 'java' },
    { topic: 'csp' },
    { topic: 'algo' },
    { topic: 'python-data' },
  ];
}

export async function generateMetadata({ params }: { params: { topic: string } }): Promise<Metadata> {
  const meta = topicMetaMap[params.topic];
  if (!meta) return { title: '专题 · OneCoder' };
  const canonicalPath = `/topics/${params.topic}/`;
  return {
    title: `${meta.name} · OneCoder`,
    description: meta.desc,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${meta.name} · OneCoder`,
      description: meta.desc,
      url: `https://www.coderli.com${canonicalPath}`,
      siteName: 'OneCoder',
      locale: 'zh_CN',
      type: 'website',
    },
  };
}

export default function TopicPage({ params }: { params: { topic: string } }) {
  const meta = topicMetaMap[params.topic];
  if (!meta) notFound();

  const allPosts = getAllPosts();
  const topicPosts = allPosts.filter(p => p.topic === params.topic);

  const subtopics = Array.from(new Set(topicPosts.map(p => p.subtopic))).filter(Boolean);
  if (params.topic === 'csp') {
    const desiredOrder = ['CSP-J', 'CSP-S', 'NOIP'];
    subtopics.sort((a, b) => {
      const ia = desiredOrder.indexOf(a);
      const ib = desiredOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  } else if (params.topic === 'gesp') {
    const levelOrder = ['一级', '二级', '三级', '四级', '五级', '六级', '七级', '八级'];
    subtopics.sort((a, b) => {
      const ia = levelOrder.indexOf(a);
      const ib = levelOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-7 py-6">
      <nav
        aria-label="面包屑导航"
        className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--ink-muted)] mb-4"
      >
        <Link href="/" prefetch={false} className="hover:text-[var(--brand)]">
          首页
        </Link>
        <span>/</span>
        <span>专题专栏</span>
        <span>/</span>
        <span className="text-[var(--ink-primary)] font-medium">{meta.name}</span>
      </nav>

      {/* Topic Header */}
      <div className="wb-card p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span
            className="w-8 h-8 rounded-[7px] grid place-items-center text-[var(--brand)]"
            style={{
              backgroundColor: 'var(--brand-surface)',
              boxShadow: 'inset 0 0 0 1px var(--brand-border)',
            }}
          >
            {renderTopicIcon(params.topic, 'w-4 h-4')}
          </span>
          <h1 className="text-[20px] sm:text-[23px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
            {meta.name}
          </h1>
          <span className="wb-pill wb-pill-gesp font-mono tnum">
            {topicPosts.length} 篇
          </span>
        </div>
        <p className="text-[13.5px] text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          {meta.desc}
        </p>
      </div>

      {/* Main Content & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div>
          <TopicPostList posts={topicPosts.map(toPostCardMeta)} subtopics={subtopics} />
        </div>

        <aside className="lg:sticky lg:top-[68px] space-y-4">
          <div className="wb-card p-4">
            <h4
              className="text-[13px] font-semibold text-[var(--ink-primary)] mb-2.5 pb-2 border-b"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              其他核心专题
            </h4>
            <div className="space-y-0.5">
              {Object.entries(topicMetaMap).map(([key, item]) => {
                if (key === params.topic) return null;
                return (
                  <Link
                    key={key}
                    href={`/topics/${key}/`}
                    prefetch={false}
                    className="wb-sb-item"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-[var(--ink-muted)] flex-shrink-0">
                        {renderTopicIcon(key, 'w-3.5 h-3.5')}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                      {allPosts.filter(p => p.topic === key).length}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <OiGamePromo variant="sidebar" />

          <GoogleAd
            slot="6734143049"
            minHeight={220}
            label="广告位 4 · 侧边栏吸顶"
          />

          <PopularTagsCard limit={20} />
        </aside>
      </div>
    </div>
  );
}
