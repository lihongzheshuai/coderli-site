'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PostCardMeta } from '@/types/post';
import ArticleCard from '@/components/ArticleCard';
import GoogleAd from '@/components/GoogleAd';

interface HomePostStreamProps {
  posts: PostCardMeta[];
  totalCount?: number;
  lazySource?: 'home';
  excludeSlug?: string;
  initialCount?: number;
  pageSize?: number;
}

export default function HomePostStream({
  posts,
  totalCount,
  lazySource,
  excludeSlug,
  initialCount = 20,
  pageSize = 20,
}: HomePostStreamProps) {
  const [loadedPosts, setLoadedPosts] = useState<PostCardMeta[]>(posts);
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const effectiveTotal = hasLoadedRemote
    ? loadedPosts.length
    : Math.max(totalCount ?? posts.length, loadedPosts.length);
  const visiblePosts = loadedPosts.slice(0, displayCount);
  const hasMore = displayCount < effectiveTotal;

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const nextCount = displayCount + pageSize;
      if (lazySource === 'home' && !hasLoadedRemote && nextCount > loadedPosts.length) {
        const res = await fetch('/search-index.json', { cache: 'force-cache' });
        if (res.ok) {
          const raw: any[] = await res.json();
          const mapped: PostCardMeta[] = raw
            .filter(item => item.slug && item.slug !== excludeSlug)
            .map(item => ({
              slug: item.slug,
              title: item.title,
              date: item.date,
              tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : [],
              readTime: item.readTime || '3 分钟',
              excerpt: item.excerpt || '',
              topic: item.topic || 'gesp',
              topicName: item.topicName || '技术笔记',
              subtopic: item.subtopic || '精讲',
              previewImg: item.previewImg || null,
              previewGraphic: {
                symbol: item.previewGraphic?.symbol || 'OneCoder',
                title: item.previewGraphic?.title || '技术专题',
              },
            }));
          setLoadedPosts(mapped);
          setHasLoadedRemote(true);
          setDisplayCount(Math.min(nextCount, mapped.length));
          return;
        }
      }
      setDisplayCount(prev => Math.min(prev + pageSize, loadedPosts.length));
    } catch {
      setDisplayCount(prev => Math.min(prev + pageSize, loadedPosts.length));
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div>
      {/* Post feed */}
      <div className="space-y-4">
        {visiblePosts.map((post, idx) => (
          <React.Fragment key={post.slug}>
            <ArticleCard post={post} />
            {/* Cap in-feed Google Ads to at most 3 slots for clean UX & AdSense policy compliance */}
            {(idx === 4 || idx === 19 || idx === 34) && (
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
                  (已显示 {visiblePosts.length} / 共 {effectiveTotal} 篇)
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
            <span>已全部呈现所有 {effectiveTotal} 篇博文（可使用页面右上角或快捷键 <strong>/</strong> 搜索精准定位）</span>
          </div>
        )}
        <div className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          <Link href="/archives/" prefetch={false} className="hover:text-teal-600 dark:hover:text-teal-400 underline underline-offset-4 transition">
            🗂️ 浏览全站博文归档总目录 →
          </Link>
        </div>
      </div>
    </div>
  );
}
