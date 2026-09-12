import React from 'react';
import Link from 'next/link';
import { getAllTags } from '@/lib/posts';

interface PopularTagsCardProps {
  currentTag?: string;
  limit?: number;
}

export default function PopularTagsCard({ currentTag, limit = 24 }: PopularTagsCardProps) {
  const allTags = getAllTags();
  const displayTags = allTags.slice(0, limit);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="font-bold text-base text-slate-900 dark:text-slate-100 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span>🔥</span>
          <span>热门技术标签</span>
        </span>
        <Link
          href="/tags/"
          className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
        >
          全部 ({allTags.length}) →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {displayTags.map(item => {
          const isCurrent =
            currentTag && item.tag.toLowerCase() === currentTag.toLowerCase();
          return (
            <Link
              key={item.tag}
              href={`/tags/${encodeURIComponent(item.tag)}/`}
              className={`px-2.5 py-1 rounded-lg transition font-mono flex items-center gap-1 ${
                isCurrent
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/30 border border-transparent'
              }`}
              title={`查看「#${item.tag}」相关的 ${item.count} 篇博文`}
            >
              <span>#{item.tag}</span>
              <span
                className={`text-[10px] ${
                  isCurrent ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
