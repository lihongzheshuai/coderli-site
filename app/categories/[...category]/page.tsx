import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategoryTree, getPostsByCategory } from '@/lib/posts';
import HomePostStream from '@/components/HomePostStream';
import CategoryNavTree from '@/components/CategoryNavTree';
import GoogleAd from '@/components/GoogleAd';
import PopularTagsCard from '@/components/PopularTagsCard';

interface CategoryPageProps {
  params: { category: string[] };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const tree = getCategoryTree();
  const paths: { category: string[] }[] = [];
  // Pre-generate top parent categories at build time; subcategories are generated on-demand (ISR)
  for (const parent of tree.slice(0, 10)) {
    paths.push({ category: [parent.name] });
  }
  return paths;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const rawParent = params.category[0] || '';
  const rawChild = params.category[1] || '';
  let parent = rawParent;
  let child = rawChild;
  try {
    parent = decodeURIComponent(rawParent);
    child = rawChild ? decodeURIComponent(rawChild) : '';
  } catch {}

  const title = child ? `${parent} · ${child} 专题` : `${parent} 专题`;

  return {
    title: `${title} · OneCoder`,
    description: `OneCoder 博客「${title}」分类下的所有技术博文与考级真题解析。`,
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const rawParent = params.category?.[0] || '';
  const rawChild = params.category?.[1] || '';
  let parent: string = rawParent;
  let child: string | undefined = rawChild || undefined;
  try {
    parent = decodeURIComponent(rawParent);
    child = rawChild ? decodeURIComponent(rawChild) : undefined;
  } catch {
    child = rawChild || undefined;
  }

  const posts = getPostsByCategory(parent, child);
  if (!posts || posts.length === 0) {
    notFound();
  }

  const categoryTree = getCategoryTree();

  return (
    <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 py-8">
      {/* Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-teal-500">首页</Link>
        <span>/</span>
        <Link href="/categories/" className="hover:text-teal-500">全部专题分类</Link>
        <span>/</span>
        {child ? (
          <>
            <Link href={`/categories/${encodeURIComponent(parent)}/`} className="hover:text-teal-500">
              {parent}
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{child}</span>
          </>
        ) : (
          <span className="text-slate-600 dark:text-slate-300 font-medium">{parent}</span>
        )}
      </nav>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl md:text-4xl">📂</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {child ? `${parent} · ${child}` : parent}
                </h1>
                <span className="text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-500/20">
                  共 {posts.length} 篇博文
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                {child
                  ? `已为您筛选出属于「${parent}」专栏下「${child}」分支的所有技术博文`
                  : `已为您筛选出属于「${parent}」核心专栏下的所有技术博文与考级解析`}
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
          <CategoryNavTree
            categories={categoryTree}
            currentParent={parent}
            currentChild={child}
            limit={10}
          />

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
