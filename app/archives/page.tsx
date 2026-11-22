import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Archive } from 'lucide-react';
import { getAllPosts } from '@/lib/posts';
import { getBadgeMeta } from '@/lib/workbench';

export const revalidate = false;

export const metadata: Metadata = {
  title: '全站博文归档总目录 · OneCoder',
  description:
    'OneCoder 博客始于2012年的全部原创技术文章、GESP 1-8级考纲与真题题解、CSP-J/S & NOIP 信奥算法、Java架构与Python实战全量归档索引。',
  alternates: {
    canonical: '/archives/',
  },
  openGraph: {
    title: '全站博文归档总目录 · OneCoder',
    description:
      'OneCoder 博客全部原创技术文章、GESP 1-8级考纲与真题题解、CSP-J/S & NOIP 信奥算法归档总目录。',
    url: 'https://www.coderli.com/archives/',
    siteName: 'OneCoder',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ArchivesPage() {
  const posts = getAllPosts();

  const groupedByYear = new Map<string, typeof posts>();
  for (const post of posts) {
    const year = post.date && post.date.length >= 4 ? post.date.slice(0, 4) : '早期归档';
    if (!groupedByYear.has(year)) {
      groupedByYear.set(year, []);
    }
    groupedByYear.get(year)!.push(post);
  }
  const years = Array.from(groupedByYear.keys()).sort((a, b) => (a < b ? 1 : -1));
  const archivesJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.coderli.com/archives/#collection',
        url: 'https://www.coderli.com/archives/',
        name: '全站博文归档总目录 · OneCoder',
        description: `OneCoder 博客 2012 年至今全部 ${posts.length} 篇原创技术文章与信奥题解归档索引。`,
        inLanguage: 'zh-CN',
        isPartOf: { '@id': 'https://www.coderli.com/#website' },
        mainEntity: { '@id': 'https://www.coderli.com/archives/#list' },
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.coderli.com/archives/#list',
        name: '最新归档文章',
        numberOfItems: Math.min(posts.length, 25),
        itemListElement: posts.slice(0, 25).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.title,
          url: `https://www.coderli.com/${p.slug}/`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.coderli.com/archives/#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.coderli.com/' },
          { '@type': 'ListItem', position: 2, name: '全站归档', item: 'https://www.coderli.com/archives/' },
        ],
      },
    ],
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(archivesJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <nav
        aria-label="面包屑导航"
        className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--ink-muted)] mb-4"
      >
        <Link href="/" prefetch={false} className="hover:text-[var(--brand)]">
          首页
        </Link>
        <span>/</span>
        <span className="text-[var(--ink-primary)] font-medium">全站归档</span>
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
            <Archive className="w-4 h-4" />
          </span>
          <h1 className="text-[20px] sm:text-[23px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
            全站博文归档总目录
          </h1>
          <span className="wb-pill wb-pill-gesp font-mono tnum">
            {posts.length.toLocaleString()} 篇 · {years.length} 个年份
          </span>
        </div>
        <p className="text-[13.5px] text-[var(--ink-muted)] max-w-3xl leading-relaxed mb-4">
          按时间倒序完整收录 2012 年至今的所有原创笔记与信奥题解，点击年份快速锚点跳转。
        </p>
        <div className="flex flex-wrap gap-1.5">
          {years.map(y => (
            <a
              key={y}
              href={`#year-${y}`}
              className="px-2.5 py-1 rounded-[5px] bg-[var(--bg-subtle)] text-[12px] font-mono tnum font-medium text-[var(--ink-secondary)] hover:text-[var(--brand)] transition-colors"
              style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
            >
              {y} ({groupedByYear.get(y)!.length})
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {years.map(year => {
          const yearPosts = groupedByYear.get(year)!;
          return (
            <section
              key={year}
              id={`year-${year}`}
              className="wb-card overflow-hidden scroll-mt-[68px]"
            >
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <h2 className="text-[15px] font-semibold font-mono tnum text-[var(--ink-primary)]">
                  {year} 年
                </h2>
                <span className="text-[12px] font-mono tnum text-[var(--ink-muted)]">
                  {yearPosts.length} 篇
                </span>
              </div>
              <ul className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {yearPosts.map(post => {
                  const badge = getBadgeMeta(post);
                  const pillCls =
                    badge.track === 'gesp'
                      ? 'wb-pill-gesp'
                      : badge.track === 'contest'
                      ? 'wb-pill-contest'
                      : 'wb-pill-arch';
                  return (
                    <li
                      key={post.slug}
                      className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ borderColor: 'var(--border-hairline)' }}
                    >
                      <time
                        dateTime={post.date}
                        className="text-[12px] font-mono tnum text-[var(--ink-muted)] flex-shrink-0 w-[86px]"
                      >
                        {post.date}
                      </time>
                      <span className={`wb-pill ${pillCls} flex-shrink-0`}>{badge.label}</span>
                      <Link
                        href={`/${post.slug}/`}
                        prefetch={false}
                        className="text-[13.5px] font-medium text-[var(--ink-primary)] hover:text-[var(--brand)] transition-colors leading-snug min-w-0 truncate"
                      >
                        {post.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
