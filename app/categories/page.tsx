import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { FolderTree, Folder, ArrowRight } from 'lucide-react';
import { getCategoryTree, getAllPosts } from '@/lib/posts';
import { getCategoryLink } from '@/lib/categories';
import CategoryNavTree from '@/components/CategoryNavTree';
import GoogleAd from '@/components/GoogleAd';
import PopularTagsCard from '@/components/PopularTagsCard';

export const metadata: Metadata = {
  title: '全部专题与分类大厅 · OneCoder',
  description: 'OneCoder 博客全站技术专题、考级题解与多级分类索引全集。',
  alternates: {
    canonical: '/categories/',
  },
};

export default function AllCategoriesPage() {
  const tree = getCategoryTree();
  const totalPosts = getAllPosts().length;
  const categoriesJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.coderli.com/categories/#collection',
        url: 'https://www.coderli.com/categories/',
        name: '全部专题与分类大厅 · OneCoder',
        description: `OneCoder 博客全站技术专题、考级题解与多级分类索引全集（共 ${totalPosts} 篇原创文章）。`,
        inLanguage: 'zh-CN',
        isPartOf: { '@id': 'https://www.coderli.com/#website' },
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.coderli.com/categories/#list',
        name: 'OneCoder 专题分类列表',
        numberOfItems: tree.length,
        itemListElement: tree.map((parent, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: parent.name,
          url: `https://www.coderli.com${getCategoryLink(parent.name)}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.coderli.com/categories/#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.coderli.com/' },
          { '@type': 'ListItem', position: 2, name: '全站专题分类', item: 'https://www.coderli.com/categories/' },
        ],
      },
    ],
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-7 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categoriesJsonLd).replace(/</g, '\\u003c'),
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
        <span className="text-[var(--ink-primary)] font-medium">全站专题分类</span>
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
            <FolderTree className="w-4 h-4" />
          </span>
          <h1 className="text-[20px] sm:text-[23px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
            全站专题分类大厅
          </h1>
          <span className="wb-pill wb-pill-gesp font-mono tnum">
            {tree.length} 大体系 · {totalPosts.toLocaleString()} 篇
          </span>
        </div>
        <p className="text-[13.5px] text-[var(--ink-muted)] max-w-2xl leading-relaxed">
          涵盖 GESP 考级真题、Java 服务端架构、CSP/NOIP 信奥竞赛与算法专题等完整知识树，点击任意一级或二级目录直达清单。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="space-y-3.5">
          {tree.map(parent => (
            <div key={parent.name} className="wb-card p-4 sm:p-5">
              <div
                className="flex items-center justify-between gap-2 pb-3 mb-3 border-b"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <Link
                  href={getCategoryLink(parent.name)}
                  prefetch={false}
                  className="flex items-center gap-2 text-[16px] font-semibold text-[var(--ink-primary)] hover:text-[var(--brand)] transition-colors"
                >
                  <Folder className="w-4 h-4 text-[var(--brand)] flex-shrink-0" />
                  <span>{parent.name}</span>
                </Link>
                <Link
                  href={getCategoryLink(parent.name)}
                  prefetch={false}
                  className="inline-flex items-center gap-1 font-mono tnum text-[12px] font-medium text-[var(--brand)] hover:underline"
                >
                  <span>全部 {parent.count} 篇</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {parent.children && parent.children.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {parent.children.map(child => (
                    <Link
                      key={child.name}
                      href={getCategoryLink(parent.name, child.name)}
                      prefetch={false}
                      className="px-2.5 py-1 rounded-[6px] bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand)] text-[12.5px] transition-colors inline-flex items-center gap-1.5"
                      style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
                    >
                      <span>{child.name}</span>
                      <span className="font-mono tnum text-[11px] text-[var(--ink-faint)]">
                        {child.count}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-[var(--ink-muted)]">
                  独立专项沉淀，共收录 {parent.count} 篇技术文章。
                </p>
              )}
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-[68px] space-y-4">
          <CategoryNavTree categories={tree} limit={10} />

          <GoogleAd
            slot="6734143049"
            minHeight={220}
            label="广告位 4 · 侧边栏吸顶"
          />

          <PopularTagsCard limit={20} />
        </aside>
      </div>
    </div>
  );
}
