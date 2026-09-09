import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import GoogleAd from '@/components/GoogleAd';
import TopicPostList from '@/components/TopicPostList';

const topicMetaMap: Record<
  string,
  { name: string; icon: string; desc: string }
> = {
  gesp: {
    name: 'GESP 考级真题专栏',
    icon: '🏆',
    desc: '从一级到八级，包含历年官方真题推导、八方向矩阵探测、几何浮点计算、DFS递归搜索与剪枝实战。',
  },
  java: {
    name: 'Java 架构演进与实战',
    icon: '☕',
    desc: '系统梳理 Java 基础、Log 日志门面演进、Spring 核心、Netty 高性能网络通信与 JVM 字节码研究。',
  },
  csp: {
    name: 'CSP / NOIP 信奥竞赛',
    icon: '⌘',
    desc: '信息学奥赛初赛与复赛真题解析，包含数论、贪心、枚举与洪水填充算法。',
  },
  algo: {
    name: '算法专题与 LeetCode',
    icon: '🧮',
    desc: '常用数据结构、双指针滑动窗口、动态规划与二分搜索。',
  },
  'python-data': {
    name: 'Python 与数据工程',
    icon: '🐍',
    desc: 'Python 实用技术库、MySQL 高性能架构、PostgreSQL、Hadoop/Spark 大数据。',
  },
};

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
  return {
    title: `${meta.name} · OneCoder`,
    description: meta.desc,
  };
}

export default function TopicPage({ params }: { params: { topic: string } }) {
  const meta = topicMetaMap[params.topic];
  if (!meta) notFound();

  const allPosts = getAllPosts();
  const topicPosts = allPosts.filter(p => p.topic === params.topic);

  // Extract unique subtopics for filtering
  const subtopics = Array.from(new Set(topicPosts.map(p => p.subtopic))).filter(Boolean);

  return (
    <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 py-8">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-teal-500">首页</Link>
        <span>/</span>
        <span>专题专栏</span>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">{meta.name}</span>
      </nav>

      {/* Topic Header Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-3 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
          <span>{meta.icon}</span>
          <h1>{meta.name}</h1>
          <span className="text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-500/20">
            {topicPosts.length} 篇
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {meta.desc}
        </p>
      </div>

      {/* Main Content & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        <div>
          <TopicPostList posts={topicPosts} subtopics={subtopics} />
        </div>

        <aside className="sticky top-20 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              其他核心专题
            </h4>
            <div className="space-y-1 text-xs">
              {Object.entries(topicMetaMap).map(([key, item]) => {
                if (key === params.topic) return null;
                return (
                  <Link
                    key={key}
                    href={`/topics/${key}/`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                  >
                    <span>{item.icon} {item.name}</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400">
                      {allPosts.filter(p => p.topic === key).length} 篇
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <GoogleAd
            slot="6734143049"
            minHeight={250}
            label="广告位 4 · 侧边栏吸顶"
          />
        </aside>
      </div>
    </div>
  );
}
