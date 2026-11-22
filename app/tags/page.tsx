import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Tags } from 'lucide-react';
import { getAllTags } from '@/lib/posts';
import GoogleAd from '@/components/GoogleAd';

export const metadata: Metadata = {
  title: '全部标签 · OneCoder',
  description: 'OneCoder 博客全站技术标签归档与索引。',
  alternates: {
    canonical: '/tags/',
  },
};

export default function AllTagsPage() {
  const tags = getAllTags();

  return (
    <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-6">
      <nav
        aria-label="面包屑导航"
        className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--ink-muted)] mb-4"
      >
        <Link href="/" prefetch={false} className="hover:text-[var(--brand)]">
          首页
        </Link>
        <span>/</span>
        <span className="text-[var(--ink-primary)] font-medium">全站技术标签</span>
      </nav>

      <div className="wb-card p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span
            className="w-8 h-8 rounded-[7px] grid place-items-center text-[var(--brand)]"
            style={{
              backgroundColor: 'var(--brand-surface)',
              boxShadow: 'inset 0 0 0 1px var(--brand-border)',
            }}
          >
            <Tags className="w-4 h-4" />
          </span>
          <h1 className="text-[20px] sm:text-[23px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
            全站技术标签索引
          </h1>
          <span className="wb-pill wb-pill-gesp font-mono tnum">
            共 {tags.length} 个标签
          </span>
        </div>
        <p className="text-[13.5px] text-[var(--ink-muted)] max-w-2xl leading-relaxed">
          点击任意标签，即可查看该技术领域或算法考点下的全部原创文章。
        </p>
      </div>

      <div className="wb-card p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {tags.map(item => (
            <Link
              key={item.tag}
              href={`/tags/${encodeURIComponent(item.tag)}/`}
              prefetch={false}
              className="px-3 py-1.5 rounded-[6px] bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand)] font-mono text-[12.5px] transition-colors inline-flex items-center gap-1.5"
              style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
            >
              <span>#{item.tag}</span>
              <span className="tnum text-[11px] text-[var(--ink-faint)]">{item.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <GoogleAd
        slot="6416549436"
        format="auto"
        minHeight={100}
        label="广告位 · 标签页底部推荐"
      />
    </div>
  );
}
