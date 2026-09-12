import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategoryTree, getAllPosts } from '@/lib/posts';
import CategoryNavTree from '@/components/CategoryNavTree';
import GoogleAd from '@/components/GoogleAd';
import PopularTagsCard from '@/components/PopularTagsCard';

export const metadata: Metadata = {
  title: '全部专题与分类大厅 · OneCoder',
  description: 'OneCoder 博客全站技术专题、考级题解与多级分类索引全集。',
};

export default function AllCategoriesPage() {
  const tree = getCategoryTree();
  const totalPosts = getAllPosts().length;

  return (
    <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 py-8">
      {/* Top Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-teal-500">首页</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">全部专题分类全集</span>
      </nav>

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 mb-8 shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <span className="text-3xl md:text-4xl">📚</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            全站专题分类大厅
          </h1>
          <span className="text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
            共 {tree.length} 大核心体系 · {totalPosts} 篇博文
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          涵盖 GESP 考级真题、Java 服务端架构、CSP/NOIP 信奥竞赛、算法专题等完整知识树体系。点击任意一级或二级分类即可直达文章清单。
        </p>
      </div>

      {/* Main Grid: Categories Tree Cards + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* Categories Full Roster */}
        <div className="space-y-6">
          {tree.map(parent => (
            <div
              key={parent.name}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-teal-500/40 transition-all duration-200"
            >
              {/* Parent Category Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <Link
                  href={`/categories/${encodeURIComponent(parent.name)}/`}
                  className="flex items-center gap-2.5 text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition"
                >
                  <span className="text-teal-600 dark:text-teal-400 font-mono text-base">📁</span>
                  <span>{parent.name}</span>
                </Link>
                <Link
                  href={`/categories/${encodeURIComponent(parent.name)}/`}
                  className="font-mono text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full border border-teal-500/20 hover:bg-teal-100 transition"
                >
                  查看全部 {parent.count} 篇 →
                </Link>
              </div>

              {/* Subcategories Pills */}
              {parent.children && parent.children.length > 0 ? (
                <div>
                  <div className="text-xs text-slate-400 mb-2 font-medium">包含细分子分支：</div>
                  <div className="flex flex-wrap gap-2">
                    {parent.children.map(child => (
                      <Link
                        key={child.name}
                        href={`/categories/${encodeURIComponent(parent.name)}/${encodeURIComponent(child.name)}/`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 dark:bg-slate-800/80 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 text-xs md:text-sm border border-transparent hover:border-teal-500/30 transition flex items-center gap-1.5 group cursor-pointer"
                      >
                        <span className="text-slate-400 text-xs">└</span>
                        <span className="font-medium">{child.name}</span>
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-teal-500 transition font-mono">
                          {child.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>✨ 独立专项知识沉淀，共收录 {parent.count} 篇专业文章。</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: Sidebar */}
        <aside className="sticky top-20 space-y-6">
          <CategoryNavTree categories={tree} limit={10} />

          <GoogleAd
            slot="6734143049"
            minHeight={250}
            label="广告位 4 · 侧边栏吸顶"
          />

          <PopularTagsCard limit={20} />
        </aside>
      </div>
    </div>
  );
}
