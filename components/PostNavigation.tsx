'use client';

import React from 'react';
import Link from 'next/link';
import { PostMeta } from '@/types/post';
import LatexText from '@/components/LatexText';

interface PostNavigationProps {
  prevPost: PostMeta | null;
  nextPost: PostMeta | null;
}

export default function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav aria-label="文章前后翻页导航" className="my-10 pt-6 border-t border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Previous Post (Chronologically Older) */}
        {prevPost ? (
          <Link
            href={`/${prevPost.slug}/`}
            className="group flex flex-col justify-between p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2">
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>上一篇 · Previous</span>
              </div>
              <h4 className="text-[15px] md:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug line-clamp-2">
                <LatexText text={prevPost.title} />
              </h4>
            </div>
            <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
              <span className="font-medium bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {prevPost.topicName}
              </span>
              <span>·</span>
              <time dateTime={prevPost.date}>{prevPost.date}</time>
            </div>
          </Link>
        ) : (
          <div className="p-4 md:p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20 text-slate-400 flex flex-col justify-center text-xs">
            <span className="font-semibold text-slate-400 mb-1">← 上一篇</span>
            <span>已经是本站收录的第一篇历史博文了</span>
          </div>
        )}

        {/* Next Post (Chronologically Newer) */}
        {nextPost ? (
          <Link
            href={`/${nextPost.slug}/`}
            className="group flex flex-col justify-between p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-200 shadow-sm hover:shadow-md text-left md:text-right"
          >
            <div>
              <div className="flex items-center justify-start md:justify-end gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2">
                <span>下一篇 · Next</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <h4 className="text-[15px] md:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug line-clamp-2">
                <LatexText text={nextPost.title} />
              </h4>
            </div>
            <div className="mt-3 text-xs text-slate-400 flex items-center justify-start md:justify-end gap-2">
              <time dateTime={nextPost.date}>{nextPost.date}</time>
              <span>·</span>
              <span className="font-medium bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {nextPost.topicName}
              </span>
            </div>
          </Link>
        ) : (
          <div className="p-4 md:p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20 text-slate-400 flex flex-col justify-center text-left md:text-right text-xs">
            <span className="font-semibold text-slate-400 mb-1">下一篇 →</span>
            <span>已经是最新发布的一篇博文了</span>
          </div>
        )}
      </div>
    </nav>
  );
}
