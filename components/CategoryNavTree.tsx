'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CategoryNode } from '@/lib/posts';

interface CategoryNavTreeProps {
  categories: CategoryNode[];
  limit?: number;
  currentParent?: string;
  currentChild?: string;
  className?: string;
}

export default function CategoryNavTree({
  categories,
  limit = 10,
  currentParent,
  currentChild,
  className = '',
}: CategoryNavTreeProps) {
  // Tree is collapsed by default as requested; auto-expand current active parent if on that page
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (currentParent) {
      initial[currentParent.toLowerCase()] = true;
    }
    return initial;
  });

  const displayList = categories.slice(0, limit);
  const totalCount = categories.length;

  function toggleExpand(categoryName: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const key = categoryName.toLowerCase();
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="font-bold text-base text-slate-900 dark:text-slate-100 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span>📚</span>
          <span>专题分类快速导航</span>
        </span>
        <Link
          href="/categories/"
          className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
        >
          全集 ({totalCount}) →
        </Link>
      </div>

      {/* Tree list */}
      <div className="space-y-1 text-[15px]">
        {displayList.map(node => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = !!expanded[node.name.toLowerCase()];
          const isParentActive =
            currentParent &&
            currentParent.toLowerCase() === node.name.toLowerCase() &&
            !currentChild;

          return (
            <div key={node.name} className="select-none">
              {/* Parent category row */}
              <div
                className={`flex items-center justify-between p-2 rounded-xl transition font-medium group ${
                  isParentActive
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Expand/Collapse Toggle arrow */}
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={e => toggleExpand(node.name, e)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-[11px] flex-shrink-0 cursor-pointer"
                      aria-label={isExpanded ? '折叠子分类' : '展开子分类'}
                      title={isExpanded ? '点击折叠子分类' : '点击展开子分类'}
                    >
                      <span className={`inline-block transition-transform duration-200 ${isExpanded ? 'rotate-90 text-teal-600' : ''}`}>
                        ▶
                      </span>
                    </button>
                  ) : (
                    <span className="w-5 h-5 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs flex-shrink-0">
                      •
                    </span>
                  )}

                  {/* Category Name link */}
                  <Link
                    href={`/categories/${encodeURIComponent(node.name)}/`}
                    className="truncate hover:text-teal-600 dark:hover:text-teal-400 transition"
                    title={`查看「${node.name}」专栏下的全部博文`}
                  >
                    {node.name}
                  </Link>
                </div>

                {/* Article count badge */}
                <span className="font-mono text-teal-600 dark:text-teal-400 font-bold text-xs bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-500/20 ml-2 flex-shrink-0">
                  {node.count} 篇
                </span>
              </div>

              {/* Subcategories (Children) - Collapsed by default, animated expand */}
              {hasChildren && isExpanded && (
                <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-0.5 my-1 animate-fadeIn">
                  {node.children.map(child => {
                    const isChildActive =
                      currentParent &&
                      currentChild &&
                      currentParent.toLowerCase() === node.name.toLowerCase() &&
                      currentChild.toLowerCase() === child.name.toLowerCase();

                    return (
                      <Link
                        key={child.name}
                        href={`/categories/${encodeURIComponent(node.name)}/${encodeURIComponent(child.name)}/`}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm transition ${
                          isChildActive
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                        title={`查看「${node.name} / ${child.name}」下的博文`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="text-slate-300 dark:text-slate-600 text-xs">└</span>
                          <span>{child.name}</span>
                        </span>
                        <span className="font-mono text-slate-400 text-xs ml-2 flex-shrink-0">
                          {child.count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: View more categories link */}
      {totalCount > limit && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link
            href="/categories/"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1 transition"
          >
            <span>显示全部 {totalCount} 大专题与分类大厅</span>
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
