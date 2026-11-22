'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Filter, X, SearchX, ArrowDown } from 'lucide-react';
import { PostCardMeta } from '@/types/post';
import ArticleCard from '@/components/ArticleCard';
import GoogleAd from '@/components/GoogleAd';

interface TopicPostListProps {
  posts: PostCardMeta[];
  subtopics: string[];
  pageSize?: number;
}

export default function TopicPostList({ posts, subtopics, pageSize = 24 }: TopicPostListProps) {
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(pageSize);

  useEffect(() => {
    setDisplayCount(pageSize);
  }, [selectedSubtopic, searchTerm, pageSize]);

  const subtopicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of posts) {
      if (post.subtopic) {
        counts[post.subtopic] = (counts[post.subtopic] || 0) + 1;
      }
    }
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter(post => {
      const matchSub = !selectedSubtopic || post.subtopic === selectedSubtopic;
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.tags.some(t => t.toLowerCase().includes(q));
      return matchSub && matchSearch;
    });
  }, [posts, selectedSubtopic, searchTerm]);

  const visiblePosts = filteredPosts.slice(0, displayCount);
  const hasMore = displayCount < filteredPosts.length;

  return (
    <div className="space-y-4">
      {/* Interactive Filter Toolbar */}
      <div className="wb-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-[13px]">
            <Filter className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span className="font-semibold text-[var(--ink-primary)]">子分支筛选</span>
            <span className="font-mono tnum text-[12px] text-[var(--ink-muted)]">
              ({filteredPosts.length} / {posts.length} 篇)
            </span>
          </div>

          <div
            className="relative flex items-center gap-1.5 h-[32px] px-2.5 rounded-[6px] bg-[var(--bg-subtle)] focus-within:ring-2 focus-within:ring-[var(--brand)]"
            style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
          >
            <Filter className="w-3.5 h-3.5 text-[var(--ink-muted)] flex-shrink-0" />
            <input
              type="text"
              placeholder="在此专栏内快速过滤…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-52 bg-transparent border-none outline-none text-[12.5px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] pr-5"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="清空搜索词"
                className="absolute right-2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {subtopics.length > 0 && (
          <div
            className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <button
              type="button"
              onClick={() => setSelectedSubtopic(null)}
              className="px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
              style={
                selectedSubtopic === null
                  ? {
                      backgroundColor: 'var(--brand-surface)',
                      color: 'var(--brand)',
                      fontWeight: 600,
                      boxShadow: '0 0 0 1px var(--brand-border)',
                    }
                  : {
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--ink-secondary)',
                      boxShadow: '0 0 0 1px var(--border-hairline)',
                    }
              }
            >
              <span>全部</span>
              <span className="font-mono tnum text-[11px] opacity-75">{posts.length}</span>
            </button>

            {subtopics.map(sub => {
              const count = subtopicCounts[sub] || 0;
              const isSelected = selectedSubtopic === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubtopic(isSelected ? null : sub)}
                  className="px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--brand-surface)',
                          color: 'var(--brand)',
                          fontWeight: 600,
                          boxShadow: '0 0 0 1px var(--brand-border)',
                        }
                      : {
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--ink-secondary)',
                          boxShadow: '0 0 0 1px var(--border-hairline)',
                        }
                  }
                >
                  <span>{sub}</span>
                  <span className="font-mono tnum text-[11px] opacity-75">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filtered Posts Feed */}
      {filteredPosts.length === 0 ? (
        <div className="wb-card py-12 px-6 text-center">
          <div
            className="w-10 h-10 rounded-[10px] mx-auto mb-3 grid place-items-center text-[var(--ink-muted)] bg-[var(--bg-subtle)]"
            style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
          >
            <SearchX className="w-5 h-5" />
          </div>
          <p className="text-[14px] font-semibold text-[var(--ink-primary)]">未找到匹配条件的文章</p>
          <p className="text-[12.5px] text-[var(--ink-muted)] mt-1">请尝试切换子分类或清空过滤词</p>
          <button
            type="button"
            onClick={() => {
              setSelectedSubtopic(null);
              setSearchTerm('');
            }}
            className="mt-3.5 px-3.5 py-1.5 rounded-[6px] text-[12px] font-semibold text-[var(--brand)] bg-[var(--brand-surface)] cursor-pointer"
            style={{ boxShadow: '0 0 0 1px var(--brand-border)' }}
          >
            重置所有筛选条件
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visiblePosts.map((post, idx) => (
            <React.Fragment key={post.slug}>
              <ArticleCard post={post} />
              {/* Cap topic in-feed ads to at most 2 slots */}
              {(idx === 4 || idx === 19) && (
                <GoogleAd
                  slot="9656071817"
                  format="fluid"
                  minHeight={90}
                  label="信息流广告"
                />
              )}
            </React.Fragment>
          ))}

          <div className="text-center pt-4">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setDisplayCount(prev => Math.min(prev + pageSize, filteredPosts.length))}
                className="px-6 py-2.5 rounded-[7px] bg-[var(--bg-canvas)] text-[13px] font-medium text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--brand)] transition-colors inline-flex items-center gap-2 cursor-pointer"
                style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
              >
                <span>加载更多专栏文章</span>
                <span className="font-mono tnum text-[12px] text-[var(--ink-muted)]">
                  ({visiblePosts.length} / {filteredPosts.length})
                </span>
                <ArrowDown className="w-3.5 h-3.5 text-[var(--brand)]" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[7px] bg-[var(--bg-subtle)] text-[12px] font-mono tnum text-[var(--ink-muted)]">
                <span>已呈现当前筛选下的全部 {filteredPosts.length} 篇文章</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
