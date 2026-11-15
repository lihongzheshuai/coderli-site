import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';

export const revalidate = false;

export const metadata: Metadata = {
  title: '全站博文归档总目录 · OneCoder',
  description:
    'OneCoder 博客始于2012年的全部原创技术文章、GESP 1-8级考纲与真题题解、CSP-J/S & NOIP 信奥算法、Java架构与Python实战全量归档索引。',
  alternates: {
    canonical: '/archives/',
  },
  openGraph: {
    title: '全站博文归档总目录 · OneCoder',
    description:
      'OneCoder 博客全部原创技术文章、GESP 1-8级考纲与真题题解、CSP-J/S & NOIP 信奥算法归档总目录。',
    url: 'https://www.coderli.com/archives/',
    siteName: 'OneCoder',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ArchivesPage() {
  const posts = getAllPosts();

  const groupedByYear = new Map<string, typeof posts>();
  for (const post of posts) {
    const year = post.date && post.date.length >= 4 ? post.date.slice(0, 4) : '早期归档';
    if (!groupedByYear.has(year)) {
      groupedByYear.set(year, []);
    }
    groupedByYear.get(year)!.push(post);
  }
  const years = Array.from(groupedByYear.keys()).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 py-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-teal-500">
          首页
        </Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">全站博文归档</span>
      </nav>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-3.5 mb-2">
          <span className="text-3xl md:text-4xl">🗂️</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            全站博文归档总目录
          </h1>
          <span className="text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
            共 {posts.length} 篇独立博文 · 覆盖 {years.length} 个年份
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed mb-4">
          按时间倒序完整收录 2012 年至今的所有原创笔记与信奥题解，点击年份可快速跳转定位。
        </p>
        <div className="flex flex-wrap gap-2">
          {years.map(y => (
            <a
              key={y}
              href={`#year-${y}`}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/60 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition"
            >
              {y} ({groupedByYear.get(y)!.length})
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {years.map(year => {
          const yearPosts = groupedByYear.get(year)!;
          return (
            <section
              key={year}
              id={`year-${year}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm scroll-mt-20"
            >
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl md:text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  {year} 年
                </h2>
                <span className="text-xs font-mono text-slate-400">{yearPosts.length} 篇</span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {yearPosts.map(post => (
                  <li key={post.slug} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-4">
                    <span className="text-xs font-mono text-slate-400 flex-shrink-0 w-24">
                      {post.date}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 flex-shrink-0 w-fit">
                      {post.subtopic || post.topicName}
                    </span>
                    <Link
                      href={`/${post.slug}/`}
                      prefetch={false}
                      className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition leading-snug"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
