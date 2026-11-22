'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PostCardMeta } from '@/types/post';
import { extractProblemId, getBadgeMeta, formatReadTimeCompact, formatCompactTitle } from '@/lib/workbench';

export default function ArticleCard({ post }: { post: PostCardMeta }) {
  const badge = getBadgeMeta(post);
  const pid = extractProblemId(post.title, post.slug);
  const pillCls =
    badge.track === 'gesp'
      ? 'wb-pill-gesp'
      : badge.track === 'contest'
      ? 'wb-pill-contest'
      : 'wb-pill-arch';

  return (
    <article className="group wb-card px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ink-muted)] mb-1.5">
            <span className={`wb-pill ${pillCls}`}>{badge.label}</span>
            {pid && (
              <span className="font-mono tnum text-[11.5px] font-semibold text-[var(--ink-primary)]">
                {pid}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <time dateTime={post.date} className="font-mono tnum">
              {post.date}
            </time>
            <span aria-hidden="true">·</span>
            <span className="font-mono tnum">{formatReadTimeCompact(post.readTime)}</span>
          </div>

          <h3 className="wb-card-title font-semibold text-[var(--ink-primary)] group-hover:text-[var(--brand)] transition-colors mb-1.5">
            <Link href={`/${post.slug}/`} title={post.title} className="block" prefetch={false}>
              {formatCompactTitle(post.title)}
            </Link>
          </h3>

          {post.excerpt && (
            <p className="wb-card-excerpt text-[var(--ink-muted)] line-clamp-2 mb-2.5">
              {post.excerpt}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {post.tags.slice(0, 5).map(t => (
                <Link
                  key={t}
                  href={`/tags/${encodeURIComponent(t)}/`}
                  prefetch={false}
                  className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-subtle)] text-[var(--ink-muted)] hover:text-[var(--brand)] font-mono text-[11px] transition-colors"
                  style={{ boxShadow: 'inset 0 0 0 1px var(--border-hairline)' }}
                  title={`按标签「#${t}」筛选博文`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/${post.slug}/`}
          prefetch={false}
          aria-label={`阅读 ${post.title}`}
          className="hidden sm:grid place-items-center w-7 h-7 rounded-[6px] text-[var(--ink-faint)] group-hover:text-[var(--brand)] group-hover:bg-[var(--brand-surface)] transition-colors flex-shrink-0 mt-1"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}
