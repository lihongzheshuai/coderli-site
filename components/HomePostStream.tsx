'use client';

import React, { useState } from 'react';
import { PostMeta } from '@/types/post';
import ArticleCard from '@/components/ArticleCard';
import GoogleAd from '@/components/GoogleAd';

interface HomePostStreamProps {
  posts: PostMeta[];
  initialCount?: number;
  pageSize?: number;
}

export default function HomePostStream({
  posts,
  initialCount = 20,
  pageSize = 20,
}: HomePostStreamProps) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visiblePosts = posts.slice(0, displayCount);
  const hasMore = displayCount < posts.length;

  function handleLoadMore() {
    setIsLoadingMore(true);
    // Tiny microtask delay for smooth UI feedback
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + pageSize, posts.length));
      setIsLoadingMore(false);
    }, 150);
  }

  return (
    <div>
      {/* Post feed */}
      <div className="space-y-4">
        {visiblePosts.map((post, idx) => (
          <React.Fragment key={post.slug}>
            <ArticleCard post={post} />
            {/* Insert In-Feed Google Ad after the 5th article */}
            {idx === 4 && (
              <GoogleAd
                slot="9656071817"
                format="fluid"
                layoutKey="-eu-2+fi-5k-by"
                minHeight={90}
                label="广告位 5 · 首页信息流原生穿插"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Lazy loading bottom controls */}
      <div className="text-center mt-10">
        {hasMore ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-8 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 text-slate-700 dark:text-slate-200 transition shadow-sm inline-flex items-center gap-2.5 cursor-pointer group disabled:opacity-60"
          >
            {isLoadingMore ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></span>
                <span>加载中...</span>
              </>
            ) : (
              <>
                <span>加载后续文章</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-teal-500 transition">
                  (已显示 {visiblePosts.length} / 共 {posts.length} 篇)
                </span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:translate-y-0.5 transition">
                  ↓
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
            <span>🎉</span>
            <span>已全部呈现所有 {posts.length} 篇博文（可使用页面右上角或快捷键 <strong>/</strong> 搜索精准定位）</span>
          </div>
        )}
      </div>
    </div>
  );
}
