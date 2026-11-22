import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { PostMeta } from '@/types/post';
import { getBadgeMeta, formatReadTimeCompact } from '@/lib/workbench';
import LatexText from '@/components/LatexText';

interface RelatedPostsProps {
  posts: PostMeta[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section
      className="my-8 pt-6 border-t"
      style={{ borderColor: 'var(--border-hairline)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--brand)]" />
          <h3 className="text-[16px] font-semibold text-[var(--ink-primary)]">
            同专栏相关推荐
          </h3>
        </div>
        <span className="text-[12px] text-[var(--ink-muted)] hidden sm:inline">
          同考级 / 同考点延伸阅读
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {posts.map(item => {
          const badge = getBadgeMeta(item);
          const pillCls =
            badge.track === 'gesp'
              ? 'wb-pill-gesp'
              : badge.track === 'contest'
              ? 'wb-pill-contest'
              : 'wb-pill-arch';

          return (
            <Link
              key={item.slug}
              href={`/${item.slug}/`}
              prefetch={false}
              className="group wb-card p-4 flex flex-col justify-between hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`wb-pill ${pillCls}`}>{badge.label}</span>
                  <span className="font-mono tnum text-[11px] text-[var(--ink-muted)]">
                    {formatReadTimeCompact(item.readTime)}
                  </span>
                </div>

                <h4 className="text-[13.5px] font-semibold text-[var(--ink-primary)] group-hover:text-[var(--brand)] transition-colors leading-snug line-clamp-2 mb-1.5">
                  <LatexText text={item.title} />
                </h4>

                <p className="text-[12px] text-[var(--ink-muted)] line-clamp-2 leading-relaxed mb-3">
                  <LatexText text={item.excerpt} />
                </p>
              </div>

              <div
                className="pt-2.5 border-t flex items-center justify-between text-[11.5px] text-[var(--ink-muted)]"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <time dateTime={item.date} className="font-mono tnum">
                  {item.date}
                </time>
                <span className="inline-flex items-center gap-0.5 text-[var(--brand)] font-medium">
                  <span>阅读</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
