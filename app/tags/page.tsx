import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllTags } from '@/lib/posts';

export const metadata: Metadata = {
  title: '全部标签 · OneCoder',
  description: 'OneCoder 博客全站技术标签归档与索引。',
};

export default function AllTagsPage() {
  const tags = getAllTags();

  return (
    <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 py-8">
      {/* Top Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-teal-500">首页</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">全站技术标签</span>
      </nav>

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 mb-8 shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <span className="text-3xl md:text-4xl">🏷️</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            全站技术标签索引
          </h1>
          <span className="text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
            共 {tags.length} 个标签
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          点击任意标签，即可筛选出该技术领域沉淀的所有博文与算法真题。
        </p>
      </div>

      {/* Tags Cloud Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap gap-2.5">
          {tags.map(item => (
            <Link
              key={item.tag}
              href={`/tags/${encodeURIComponent(item.tag)}/`}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-teal-50 dark:bg-slate-800/80 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 font-mono text-xs md:text-sm border border-transparent hover:border-teal-500/30 transition flex items-center gap-1.5 group cursor-pointer"
            >
              <span>#{item.tag}</span>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-teal-500 transition">
                {item.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
