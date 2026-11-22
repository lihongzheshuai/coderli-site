import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PostMeta } from '@/types/post';
import LatexText from '@/components/LatexText';

interface PostNavigationProps {
  prevPost: PostMeta | null;
  nextPost: PostMeta | null;
}

export default function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav
      aria-label="文章前后翻页导航"
      className="my-8 pt-6 border-t"
      style={{ borderColor: 'var(--border-hairline)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prevPost ? (
          <Link
            href={`/${prevPost.slug}/`}
            prefetch={false}
            className="group wb-card p-4 flex flex-col justify-between hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div>
              <div className="flex items-center gap-1 text-[11.5px] font-semibold text-[var(--brand)] mb-1.5">
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>上一篇</span>
              </div>
              <h4 className="text-[14px] font-semibold text-[var(--ink-primary)] group-hover:text-[var(--brand)] transition-colors leading-snug line-clamp-2">
                <LatexText text={prevPost.title} />
              </h4>
            </div>
            <div className="mt-2.5 font-mono tnum text-[11.5px] text-[var(--ink-muted)] flex items-center gap-2">
              <span>{prevPost.subtopic || prevPost.topicName}</span>
              <span>·</span>
              <time dateTime={prevPost.date}>{prevPost.date}</time>
            </div>
          </Link>
        ) : (
          <div
            className="p-4 rounded-[8px] text-[12px] text-[var(--ink-faint)] flex flex-col justify-center"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              boxShadow: '0 0 0 1px var(--border-hairline)',
            }}
          >
            <span className="font-medium mb-0.5">上一篇</span>
            <span>已经是本站收录的第一篇历史文章</span>
          </div>
        )}

        {nextPost ? (
          <Link
            href={`/${nextPost.slug}/`}
            prefetch={false}
            className="group wb-card p-4 flex flex-col justify-between hover:bg-[var(--bg-hover)] transition-colors text-left md:text-right"
          >
            <div>
              <div className="flex items-center justify-start md:justify-end gap-1 text-[11.5px] font-semibold text-[var(--brand)] mb-1.5">
                <span>下一篇</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="text-[14px] font-semibold text-[var(--ink-primary)] group-hover:text-[var(--brand)] transition-colors leading-snug line-clamp-2">
                <LatexText text={nextPost.title} />
              </h4>
            </div>
            <div className="mt-2.5 font-mono tnum text-[11.5px] text-[var(--ink-muted)] flex items-center justify-start md:justify-end gap-2">
              <time dateTime={nextPost.date}>{nextPost.date}</time>
              <span>·</span>
              <span>{nextPost.subtopic || nextPost.topicName}</span>
            </div>
          </Link>
        ) : (
          <div
            className="p-4 rounded-[8px] text-[12px] text-[var(--ink-faint)] flex flex-col justify-center text-left md:text-right"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              boxShadow: '0 0 0 1px var(--border-hairline)',
            }}
          >
            <span className="font-medium mb-0.5">下一篇</span>
            <span>已经是最新发布的一篇文章</span>
          </div>
        )}
      </div>
    </nav>
  );
}
