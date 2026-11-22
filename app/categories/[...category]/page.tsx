import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FolderOpen, X } from 'lucide-react';
import { getCategoryTree, getPostsByCategory, toPostCardMeta } from '@/lib/posts';
import { getCategoryLink } from '@/lib/categories';
import HomePostStream from '@/components/HomePostStream';
import CategoryNavTree from '@/components/CategoryNavTree';
import GoogleAd from '@/components/GoogleAd';
import PopularTagsCard from '@/components/PopularTagsCard';

interface CategoryPageProps {
  params: { category: string[] };
}

export const dynamicParams = true;
export const revalidate = false;

function parseCategoryParams(categorySegments: string[]): { parent: string; child?: string } {
  if (
    categorySegments.length >= 2 &&
    categorySegments[0].toUpperCase() === 'CSP' &&
    categorySegments[1].toUpperCase() === 'NOIP'
  ) {
    return {
      parent: 'CSP/NOIP',
      child: categorySegments[2] ? decodeURIComponent(categorySegments[2]) : undefined,
    };
  }
  return {
    parent: decodeURIComponent(categorySegments[0] || ''),
    child: categorySegments[1] ? decodeURIComponent(categorySegments[1]) : undefined,
  };
}

export async function generateStaticParams() {
  const tree = getCategoryTree();
  const paths: { category: string[] }[] = [];
  for (const parent of tree) {
    if (parent.name === 'CSP/NOIP') {
      paths.push({ category: ['CSP', 'NOIP'] });
      for (const child of parent.children) {
        paths.push({ category: ['CSP', 'NOIP', child.name] });
      }
    } else {
      paths.push({ category: [parent.name] });
      for (const child of parent.children) {
        paths.push({ category: [parent.name, child.name] });
      }
    }
  }
  return paths;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { parent, child } = parseCategoryParams(params.category || []);
  const title = child ? `${parent} · ${child} 专题` : `${parent} 专题`;
  const canonicalPath = getCategoryLink(parent, child);

  return {
    title: `${title} · OneCoder`,
    description: `OneCoder 博客「${title}」分类下的所有技术博文与考级真题解析。`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} · OneCoder`,
      description: `OneCoder 博客「${title}」分类下的所有技术博文与考级真题解析。`,
      url: `https://www.coderli.com${canonicalPath}`,
      siteName: 'OneCoder',
      locale: 'zh_CN',
      type: 'website',
    },
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { parent, child } = parseCategoryParams(params.category || []);

  const posts = getPostsByCategory(parent, child);
  if (!posts || posts.length === 0) {
    notFound();
  }

  const categoryTree = getCategoryTree();
  const pageTitle = child ? `${parent} · ${child} 专题` : `${parent} 专题`;
  const canonicalUrl = `https://www.coderli.com${getCategoryLink(parent, child)}`;
  const breadcrumbItems: Record<string, any>[] = [
    { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.coderli.com/' },
    { '@type': 'ListItem', position: 2, name: '专题分类', item: 'https://www.coderli.com/categories/' },
    {
      '@type': 'ListItem',
      position: 3,
      name: parent,
      item: `https://www.coderli.com${getCategoryLink(parent)}`,
    },
  ];
  if (child) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 4,
      name: child,
      item: canonicalUrl,
    });
  }
  const categoryJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        url: canonicalUrl,
        name: `${pageTitle} · OneCoder`,
        description: `OneCoder 博客「${pageTitle}」分类下的所有技术博文与考级真题解析（共 ${posts.length} 篇）。`,
        inLanguage: 'zh-CN',
        isPartOf: { '@id': 'https://www.coderli.com/#website' },
        mainEntity: { '@id': `${canonicalUrl}#list` },
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#list`,
        name: `${pageTitle}文章列表`,
        numberOfItems: Math.min(posts.length, 20),
        itemListElement: posts.slice(0, 20).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.title,
          url: `https://www.coderli.com/${p.slug}/`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbItems,
      },
    ],
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-7 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categoryJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <nav
        aria-label="面包屑导航"
        className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--ink-muted)] mb-4 flex-wrap"
      >
        <Link href="/" prefetch={false} className="hover:text-[var(--brand)]">
          首页
        </Link>
        <span>/</span>
        <Link href="/categories/" prefetch={false} className="hover:text-[var(--brand)]">
          专题分类
        </Link>
        <span>/</span>
        {child ? (
          <>
            <Link href={getCategoryLink(parent)} prefetch={false} className="hover:text-[var(--brand)]">
              {parent}
            </Link>
            <span>/</span>
            <span className="text-[var(--ink-primary)] font-medium">{child}</span>
          </>
        ) : (
          <span className="text-[var(--ink-primary)] font-medium">{parent}</span>
        )}
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
              <FolderOpen className="w-4 h-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] sm:text-[23px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
                  {child ? `${parent} · ${child}` : parent}
                </h1>
                <span className="wb-pill wb-pill-gesp font-mono tnum">
                  共 {posts.length} 篇
                </span>
              </div>
              <p className="text-[13px] text-[var(--ink-muted)] mt-1">
                {child
                  ? `已筛选「${parent}」专栏下「${child}」分支的全部技术文章`
                  : `已筛选「${parent}」专栏下的全部技术文章与真题解析`}
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
          <HomePostStream posts={posts.map(toPostCardMeta)} initialCount={20} pageSize={20} />
        </div>

        <aside className="lg:sticky lg:top-[68px] space-y-4">
          <CategoryNavTree
            categories={categoryTree}
            currentParent={parent}
            currentChild={child}
            limit={10}
          />

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
