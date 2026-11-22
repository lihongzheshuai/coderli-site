import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Tag, X } from 'lucide-react';
import { getAllTags, getPostsByTag, toPostCardMeta } from '@/lib/posts';
import HomePostStream from '@/components/HomePostStream';
import GoogleAd from '@/components/GoogleAd';
import PopularTagsCard from '@/components/PopularTagsCard';

interface TagPageProps {
  params: { tag: string };
}

export const dynamicParams = true;
export const revalidate = false;

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(item => ({
    tag: item.tag,
  }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  let tag = params.tag;
  try {
    tag = decodeURIComponent(params.tag);
  } catch {
    tag = params.tag;
  }
  const canonicalPath = `/tags/${encodeURIComponent(tag)}/`;
  const tagPosts = getPostsByTag(tag);
  return {
    title: `标签：#${tag} · OneCoder`,
    description: `OneCoder 博客中包含标签「${tag}」的技术文章与题目解析列表。`,
    robots: tagPosts.length < 2 ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `标签：#${tag} · OneCoder`,
      description: `OneCoder 博客中包含标签「${tag}」的技术文章与题目解析列表。`,
      url: `https://www.coderli.com${canonicalPath}`,
      siteName: 'OneCoder',
      locale: 'zh_CN',
      type: 'website',
    },
  };
}

export default function TagPage({ params }: TagPageProps) {
  let tag = params.tag;
  try {
    tag = decodeURIComponent(params.tag);
  } catch {
    tag = params.tag;
  }
  const posts = getPostsByTag(tag);
  if (!posts || posts.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-7 py-6">
      <nav
        aria-label="面包屑导航"
        className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--ink-muted)] mb-4"
      >
        <Link href="/" prefetch={false} className="hover:text-[var(--brand)]">
          首页
        </Link>
        <span>/</span>
        <Link href="/tags/" prefetch={false} className="hover:text-[var(--brand)]">
          全站标签
        </Link>
        <span>/</span>
        <span className="text-[var(--ink-primary)] font-medium">#{tag}</span>
      </nav>

      <div className="wb-card p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="w-8 h-8 rounded-[7px] grid place-items-center text-[var(--brand)] flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: 'var(--brand-surface)',
                boxShadow: 'inset 0 0 0 1px var(--brand-border)',
              }}
            >
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] sm:text-[23px] font-semibold font-mono tracking-[-0.02em] text-[var(--ink-primary)]">
                  #{tag}
                </h1>
                <span className="wb-pill wb-pill-gesp font-mono tnum">
                  共 {posts.length} 篇
                </span>
              </div>
              <p className="text-[13px] text-[var(--ink-muted)] mt-1">
                已筛选所有包含「#{tag}」标签的技术文章与算法真题
              </p>
            </div>
          </div>

          <Link
            href="/"
            prefetch={false}
            className="self-start sm:self-center px-3 py-1.5 rounded-[6px] text-[12px] font-medium bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand)] inline-flex items-center gap-1 transition-colors"
            style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
          >
            <X className="w-3.5 h-3.5" />
            <span>返回全站索引</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div>
          <HomePostStream posts={posts.slice(0, 80).map(toPostCardMeta)} initialCount={20} pageSize={20} />
        </div>

        <aside className="lg:sticky lg:top-[68px] space-y-4">
          <GoogleAd
            slot="6734143049"
            minHeight={220}
            label="广告位 4 · 侧边栏吸顶"
          />

          <PopularTagsCard currentTag={tag} limit={30} />
        </aside>
      </div>
    </div>
  );
}
