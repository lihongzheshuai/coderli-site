import React from 'react';
import Link from 'next/link';
import { Tags } from 'lucide-react';
import { getAllTags } from '@/lib/posts';

interface PopularTagsCardProps {
  currentTag?: string;
  limit?: number;
}

export default function PopularTagsCard({ currentTag, limit = 24 }: PopularTagsCardProps) {
  const allTags = getAllTags();
  const displayTags = allTags.slice(0, limit);

  return (
    <div className="wb-card p-4">
      <div
        className="text-[13px] font-semibold text-[var(--ink-primary)] mb-3 pb-2.5 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <span className="flex items-center gap-1.5">
          <Tags className="w-3.5 h-3.5 text-[var(--brand)]" />
          <span>热门技术标签</span>
        </span>
        <Link
          href="/tags/"
          prefetch={false}
          className="font-mono tnum text-[11.5px] text-[var(--brand)] hover:underline font-medium"
        >
          全部 ({allTags.length}) →
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {displayTags.map(item => {
          const isCurrent =
            currentTag && item.tag.toLowerCase() === currentTag.toLowerCase();
          return (
            <Link
              key={item.tag}
              href={`/tags/${encodeURIComponent(item.tag)}/`}
              prefetch={false}
              className="px-2 py-0.5 rounded-[5px] transition-colors font-mono text-[11.5px] inline-flex items-center gap-1"
              style={
                isCurrent
                  ? {
                      backgroundColor: 'var(--brand)',
                      color: 'var(--brand-cta-text)',
                      fontWeight: 600,
                    }
                  : {
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--ink-secondary)',
                      boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
                    }
              }
              title={`查看「#${item.tag}」相关的 ${item.count} 篇博文`}
            >
              <span>#{item.tag}</span>
              <span className="tnum text-[10.5px] opacity-65">{item.count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
