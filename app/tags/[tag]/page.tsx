import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllTags, getPostsByTag } from '@/lib/posts';
import HomePostStream from '@/components/HomePostStream';
import GoogleAd from '@/components/GoogleAd';

interface TagPageProps {
  params: { tag: string };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(item => ({
    tag: encodeURIComponent(item.tag),
  }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return {
    title: `标签：#${tag} · OneCoder`,
    description: `OneCoder 博客中包含标签「${tag}」的技术文章与题目解析列表。`,
  };
}

export default function TagPage({ params }: TagPageProps) {
  const tag = decodeURIComponent(params.tag);
  const posts = getPostsByTag(tag);
  if (!posts || posts.length === 0) {
    notFound();
  }

  const allTags = getAllTags().slice(0, 30); // Top 30 tags for sidebar switcher

  return (
    <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 py-8">
      {/* Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-teal-500">首页</Link>
        <span>/</span>
        <Link href="/tags/" className="hover:text-teal-500">全站标签</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">#{tag}</span>
      </nav>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl md:text-4xl">🏷️</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  #{tag}
                </h1>
                <span className="text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-500/20">
                  共 {posts.length} 篇博文
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                已为您筛选出所有包含「#{tag}」标签的技术文章与算法真题
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="self-start sm:self-center px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>✕ 清除筛选，返回首页</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Stream + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* Left: Filtered Post Stream */}
        <div>
          <HomePostStream posts={posts} initialCount={20} pageSize={20} />
        </div>

        {/* Right: Sidebar */}
        <aside className="sticky top-20 space-y-6">
          {/* Tag Cloud Switcher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="font-bold text-base text-slate-900 dark:text-slate-100 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>🔥 热门技术标签</span>
              <Link href="/tags/" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
                全部 ({getAllTags().length}) →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {allTags.map(item => {
                const isCurrent = item.tag.toLowerCase() === tag.toLowerCase();
                return (
                  <Link
                    key={item.tag}
                    href={`/tags/${encodeURIComponent(item.tag)}/`}
                    className={`px-2.5 py-1 rounded-lg transition font-mono flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-teal-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>#{item.tag}</span>
                    <span className={`text-[10px] ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                      {item.count}
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
