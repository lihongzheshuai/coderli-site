'use client';

import React from 'react';
import Link from 'next/link';
import { PostMeta } from '@/types/post';
import LatexText from '@/components/LatexText';

interface RelatedPostsProps {
  posts: PostMeta[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="my-10 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
            猜你想读 · 相关文章推荐
          </h3>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          同专栏/同考级智能推荐
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map(item => (
          <Link
            key={item.slug}
            href={`/${item.slug}/`}
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-teal-500/60 hover:shadow-md transition-all duration-200"
          >
            <div>
              {/* Category & Badge */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/20">
                  {item.topicName} · {item.subtopic}
                </span>
                <span>⏱️ {item.readTime}</span>
              </div>

              {/* Title with LaTeX */}
              <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug line-clamp-2 mb-2">
                <LatexText text={item.title} />
              </h4>

              {/* Excerpt with LaTeX */}
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                <LatexText text={item.excerpt} />
              </p>
            </div>

            {/* Footer Date & Read link */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <time dateTime={item.date}>{item.date}</time>
              <span className="text-teal-600 dark:text-teal-400 font-medium group-hover:translate-x-0.5 transition-transform">
                阅读全文 →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
