'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, CheckCircle2, Archive } from 'lucide-react';
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
      <div className="space-y-2.5">
        {visiblePosts.map((post, idx) => (
          <React.Fragment key={post.slug}>
            <ArticleCard post={post} />
            {(idx === 4 || idx === 19 || idx === 34) && (
              <GoogleAd
                slot="9656071817"
                format="fluid"
                layoutKey="-eu-2+fi-5k-by"
                minHeight={90}
                label="信息流广告"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="text-center mt-8">
        {hasMore ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 rounded-[7px] bg-[var(--bg-canvas)] text-[13px] font-medium text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--brand)] transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
          >
            {isLoadingMore ? (
              <span>加载中…</span>
            ) : (
              <>
                <span>加载更多文章</span>
                <span className="font-mono tnum text-[12px] text-[var(--ink-muted)]">
                  ({visiblePosts.length} / {effectiveTotal})
                </span>
                <ArrowDown className="w-3.5 h-3.5 text-[var(--brand)]" />
              </>
            )}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[7px] bg-[var(--bg-subtle)] text-[12px] text-[var(--ink-muted)] font-mono tnum">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span>已呈现全部 {effectiveTotal} 篇内容（按 ⌘K 或 / 快速检索全站）</span>
          </div>
        )}
        <div className="mt-3.5 text-[12px] text-[var(--ink-muted)]">
          <Link
            href="/archives/"
            prefetch={false}
            className="inline-flex items-center gap-1.5 hover:text-[var(--brand)] transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>浏览全站博文归档总目录 →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
