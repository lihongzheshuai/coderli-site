'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FolderTree, ChevronRight, Circle } from 'lucide-react';
import type { CategoryNode } from '@/lib/posts';
import { getCategoryLink } from '@/lib/categories';

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
    <div className={`wb-card p-4 ${className}`}>
      <div
        className="wb-nav-link font-semibold text-[var(--ink-primary)] mb-3 pb-2.5 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <span className="flex items-center gap-1.5">
          <FolderTree className="w-4 h-4 text-[var(--brand)]" />
          <span>专题分类目录</span>
        </span>
        <Link
          href="/categories/"
          prefetch={false}
          className="font-mono tnum wb-sb-count text-[var(--brand)] hover:underline font-medium"
        >
          全集 ({totalCount}) →
        </Link>
      </div>

      <div className="space-y-0.5">
        {displayList.map(node => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = !!expanded[node.name.toLowerCase()];
          const isParentActive =
            currentParent &&
            currentParent.toLowerCase() === node.name.toLowerCase() &&
            !currentChild;

          return (
            <div key={node.name} className="select-none">
              <div
                className="wb-sb-item"
                data-active={!!isParentActive}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={e => toggleExpand(node.name, e)}
                      className="w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--ink-muted)] flex-shrink-0 cursor-pointer"
                      aria-label={isExpanded ? '折叠子分类' : '展开子分类'}
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isExpanded ? 'rotate-90 text-[var(--brand)]' : ''
                        }`}
                      />
                    </button>
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-[var(--ink-faint)] flex-shrink-0">
                      <Circle className="w-1.5 h-1.5 fill-current" />
                    </span>
                  )}

                  <Link
                    href={getCategoryLink(node.name)}
                    prefetch={false}
                    className="truncate hover:text-[var(--brand)] transition-colors"
                  >
                    {node.name}
                  </Link>
                </div>

                <span className="font-mono tnum wb-sb-count text-[var(--ink-faint)] ml-2 flex-shrink-0">
                  {node.count}
                </span>
              </div>

              {hasChildren && isExpanded && (
                <div
                  className="ml-4 pl-2.5 border-l space-y-0.5 my-1"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  {node.children.map(child => {
                    const isChildActive =
                      currentParent &&
                      currentChild &&
                      currentParent.toLowerCase() === node.name.toLowerCase() &&
                      currentChild.toLowerCase() === child.name.toLowerCase();

                    return (
                      <Link
                        key={child.name}
                        href={getCategoryLink(node.name, child.name)}
                        prefetch={false}
                        className="wb-sb-item"
                        data-active={!!isChildActive}
                      >
                        <span className="truncate">{child.name}</span>
                        <span className="font-mono tnum wb-sb-count text-[var(--ink-faint)] ml-2 flex-shrink-0">
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

      {totalCount > limit && (
        <div
          className="mt-3 pt-2.5 border-t text-center"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <Link
            href="/categories/"
            prefetch={false}
            className="text-[12px] font-medium text-[var(--brand)] hover:underline inline-flex items-center gap-1"
          >
            <span>查看全部 {totalCount} 大分类 →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
