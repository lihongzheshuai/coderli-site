'use client';

import React, { useState, useMemo } from 'react';
import { PostMeta } from '@/types/post';
import ArticleCard from '@/components/ArticleCard';
import GoogleAd from '@/components/GoogleAd';

interface TopicPostListProps {
  posts: PostMeta[];
  subtopics: string[];
}

export default function TopicPostList({ posts, subtopics }: TopicPostListProps) {
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate counts for each subtopic
  const subtopicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of posts) {
      if (post.subtopic) {
        counts[post.subtopic] = (counts[post.subtopic] || 0) + 1;
      }
    }
    return counts;
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchSub = !selectedSubtopic || post.subtopic === selectedSubtopic;
      const matchSearch =
        !searchTerm.trim() ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSub && matchSearch;
    });
  }, [posts, selectedSubtopic, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Interactive Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>🎯</span>
              <span>分类筛选</span>
            </span>
            <span className="text-xs text-slate-400">
              (显示 {filteredPosts.length} / 共 {posts.length} 篇)
            </span>
          </div>

          {/* In-topic search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="在此专栏中快速过滤..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Subtopics Pill Filter Buttons */}
        {subtopics.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setSelectedSubtopic(null)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedSubtopic === null
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>全部</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedSubtopic === null
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {posts.length}
              </span>
            </button>

            {subtopics.map(sub => {
              const count = subtopicCounts[sub] || 0;
              const isSelected = selectedSubtopic === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubtopic(isSelected ? null : sub)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{sub}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filtered Posts Feed */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">未找到匹配条件的文章</p>
          <p className="text-xs text-slate-400 mt-1">请尝试切换分类或清空过滤词</p>
          <button
            type="button"
            onClick={() => {
              setSelectedSubtopic(null);
              setSearchTerm('');
            }}
            className="mt-4 px-4 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-xs font-semibold text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-100 transition"
          >
            重置所有筛选条件
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post, idx) => (
            <React.Fragment key={post.slug}>
              <ArticleCard post={post} />
              {idx === 4 && (
                <GoogleAd
                  slot="9656071817"
                  format="fluid"
                  minHeight={90}
                  label="信息流广告"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
