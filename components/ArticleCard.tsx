'use client';

import React from 'react';
import Link from 'next/link';
import { PostMeta } from '@/types/post';
import LatexText from '@/components/LatexText';

export default function ArticleCard({ post }: { post: PostMeta }) {
  return (
    <article className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 md:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-500/50 hover:shadow-md flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[13px] text-slate-400 mb-2">
          <span className="font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded border border-teal-500/20">
            {post.topicName} · {post.subtopic}
          </span>
          <span>·</span>
          <time dateTime={post.date}>{post.date}</time>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>

        <h3 className="text-xl md:text-[22px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug mb-2.5">
          <Link href={`/${post.slug}/`} className="block">
            <LatexText text={post.title} />
          </Link>
        </h3>

        <p className="text-[15px] md:text-base text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-3.5">
          <LatexText text={post.excerpt} />
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {post.tags.slice(0, 6).map(t => (
            <Link
              key={t}
              href={`/tags/${encodeURIComponent(t)}/`}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-mono text-xs hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/30 border border-transparent transition cursor-pointer"
              title={`按标签「#${t}」筛选博文`}
            >
              #{t}
            </Link>
          ))}
        </div>
      </div>

      {/* Thumbnail column */}
      <div className="w-full md:w-36 h-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 flex-shrink-0 flex items-center justify-center relative">
        {post.previewImg ? (
          <img
            src={post.previewImg}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
            onError={e => {
              // Fallback to graphic card if image failed
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="text-center p-3">
            <span className="text-xl font-mono font-extrabold text-teal-600 dark:text-teal-400 block mb-0.5">
              {post.previewGraphic.symbol}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1">
              {post.previewGraphic.title}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
