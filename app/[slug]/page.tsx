import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ChevronLeft,
  BookOpen,
  Info,
  Github,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getAllPosts,
  getPostBySlug,
  getSiblingSeriesPosts,
  resolveSeoCoverImage,
} from '@/lib/posts';
import { extractProblemId, formatReadTimeCompact, formatCompactTitle } from '@/lib/workbench';
import TOC from '@/components/TOC';
import GoogleAd from '@/components/GoogleAd';
import ViewCounter from '@/components/ViewCounter';
import Comments from '@/components/Comments';
import LatexText from '@/components/LatexText';
import PostNavigation from '@/components/PostNavigation';
import RelatedPosts from '@/components/RelatedPosts';
import OiGamePromo from '@/components/OiGamePromo';

interface PageProps {
  params: { slug: string };
}

export const dynamicParams = true;
export const revalidate = false;

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return { title: '文章未找到 · OneCoder' };
  }

  const canonicalPath = `/${post.slug}/`;
  const canonicalUrl = `https://www.coderli.com${canonicalPath}`;
  const coverUrl = resolveSeoCoverImage(post);

  return {
    title: `${post.title} · OneCoder`,
    description: post.excerpt,
    keywords: Array.from(new Set([...post.tags, ...post.categories, post.topicName, 'OneCoder'])),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonicalUrl,
      siteName: 'OneCoder',
      locale: 'zh_CN',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      section: post.topicName,
      tags: post.tags,
      images: [{ url: coverUrl, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [coverUrl],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const allPosts = getAllPosts();
  const series = getSiblingSeriesPosts(post, allPosts, 10);
  const problemId = extractProblemId(post.title, post.slug);
  const isOiTrack = post.topic === 'gesp' || post.topic === 'csp' || post.topic === 'algo';

  const canonicalUrl = `https://www.coderli.com/${post.slug}/`;
  const coverPath = resolveSeoCoverImage(post);
  const absoluteCoverUrl = coverPath.startsWith('http')
    ? coverPath
    : `https://www.coderli.com${coverPath}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${canonicalUrl}#article`,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline: post.title,
        description: post.excerpt,
        image: [absoluteCoverUrl],
        datePublished: post.date,
        dateModified: post.date,
        author: {
          '@type': 'Person',
          '@id': 'https://www.coderli.com/#author',
          name: post.author || 'OneCoder',
          url: 'https://www.coderli.com/',
        },
        publisher: {
          '@type': 'Person',
          '@id': 'https://www.coderli.com/#author',
          name: 'OneCoder',
          url: 'https://www.coderli.com/',
        },
        articleSection: [post.topicName, post.subtopic, ...post.categories].filter(Boolean),
        keywords: Array.from(new Set([...post.tags, ...post.categories])).join(', '),
        inLanguage: 'zh-CN',
        isPartOf: { '@id': 'https://www.coderli.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '首页',
            item: 'https://www.coderli.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: post.topicName,
            item: `https://www.coderli.com/topics/${post.topic}/`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="max-w-[1680px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_264px] xl:grid-cols-[264px_minmax(0,1fr)_264px] min-h-[calc(100vh-52px)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* =========================================================
          LEFT STICKY SERIES SIDEBAR (xl+)
         ========================================================= */}
      <aside
        aria-label="同级章节连读"
        className="hidden xl:flex flex-col gap-5 px-2.5 py-4 border-r sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="space-y-4">
          {/* Same-level / same-series sibling list */}
          <div>
            <div className="flex items-center justify-between px-2.5 pb-1.5 wb-sb-group-title font-semibold uppercase tracking-[0.04em] text-[var(--ink-muted)]">
              <span className="truncate">{series.heading}</span>
              <span className="font-mono tnum flex-shrink-0">{series.totalInSeries} 篇</span>
            </div>
            <div className="space-y-0.5">
              {series.items.map((item, idx) => {
                const isCurrent = item.slug === post.slug;
                return (
                  <Link
                    key={item.slug}
                    href={`/${item.slug}/`}
                    prefetch={false}
                    className="wb-sb-item"
                    data-active={isCurrent}
                    title={item.title}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono tnum wb-sb-count text-[var(--ink-faint)] flex-shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate">{formatCompactTitle(item.title)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <div className="px-2.5 pb-1.5 wb-sb-group-title font-semibold uppercase tracking-[0.04em] text-[var(--ink-muted)]">
              快速导航
            </div>
            <Link href="/" prefetch={false} className="wb-sb-item">
              <span className="flex items-center gap-2 min-w-0">
                <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">返回全站索引大厅</span>
              </span>
            </Link>
            <Link href={`/topics/${post.topic}/`} prefetch={false} className="wb-sb-item">
              <span className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">查看「{post.topicName}」全集</span>
              </span>
            </Link>
            {isOiTrack && (
              <a
                href="https://wiki.coderli.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="wb-sb-item"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">GESP 考纲 Wiki 字典</span>
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Bottom Exam Standard Notice */}
        <div className="wb-card p-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--brand)] mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isOiTrack ? 'C++11 考场规范' : 'OneCoder 工程规范'}</span>
          </div>
          <p className="text-[11.5px] text-[var(--ink-muted)] leading-relaxed">
            {isOiTrack
              ? '所有题解遵循严格 C++11 标准，禁用流加速与输入判空，本地实测 AC。'
              : '原创工程实践与源码级拆解，配套代码同步归档至 GitHub。'}
          </p>
        </div>
      </aside>

      {/* =========================================================
          CENTER READING WORKBENCH CANVAS
         ========================================================= */}
      <article className="w-full max-w-[810px] mx-auto px-4 sm:px-7 lg:px-9 py-5 lg:py-6 min-w-0">
        {/* Compact Breadcrumb */}
        <nav
          aria-label="面包屑导航"
          className="flex items-center gap-1.5 font-mono tnum text-[12px] text-[var(--ink-muted)] mb-2.5 flex-wrap"
        >
          <Link href="/" prefetch={false} className="hover:text-[var(--brand)] transition-colors">
            首页
          </Link>
          <span>/</span>
          <Link
            href={`/topics/${post.topic}/`}
            prefetch={false}
            className="hover:text-[var(--brand)] transition-colors"
          >
            {post.topicName}
          </Link>
          <span>/</span>
          <span>
            {post.subtopic} · 更新于 {post.date}
          </span>
        </nav>

        {/* Article Title */}
        <h1 className="wb-article-h1 font-semibold tracking-[-0.02em] text-[var(--ink-primary)] mb-3.5">
          <LatexText text={post.title} />
        </h1>

        {/* 4-Cell Structured Fact Strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 rounded-[8px] overflow-hidden mb-4"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            boxShadow: '0 0 0 1px var(--border-hairline)',
          }}
        >
          <div
            className="px-3 py-2 border-b sm:border-b-0 border-r"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <span className="block text-[11px] text-[var(--ink-muted)] mb-0.5">所属专题</span>
            <span className="block text-[12.5px] font-semibold text-[var(--ink-primary)] truncate">
              {post.topic === 'gesp' && post.subtopic?.includes('级')
                ? `GESP ${post.subtopic}`
                : post.subtopic || post.topicName}
            </span>
          </div>
          <div
            className="px-3 py-2 border-b sm:border-b-0 sm:border-r"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <span className="block text-[11px] text-[var(--ink-muted)] mb-0.5">
              {problemId ? '题号标识' : '核心标签'}
            </span>
            <span className="block text-[12.5px] font-semibold font-mono text-[var(--ink-primary)] truncate">
              {problemId || post.tags[0] || post.topicName}
            </span>
          </div>
          <div
            className="px-3 py-2 border-r"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <span className="block text-[11px] text-[var(--ink-muted)] mb-0.5">代码 / 阅读</span>
            <span className="block text-[12.5px] font-semibold font-mono tnum text-[var(--ink-primary)]">
              {isOiTrack ? 'C++11 · ' : ''}
              {formatReadTimeCompact(post.readTime)}
            </span>
          </div>
          <div className="px-3 py-2">
            <span className="block text-[11px] text-[var(--ink-muted)] mb-0.5">累计阅读</span>
            <span className="block text-[12.5px] font-semibold text-[var(--ink-primary)]">
              <ViewCounter slug={post.slug} plain />
            </span>
          </div>
        </div>

        {/* TL;DR Takeaway Box (GEO Direct Answer & Fast Exam Recap) */}
        {post.excerpt && (
          <div
            className="rounded-[8px] px-3.5 py-2.5 mb-5"
            style={{
              backgroundColor: 'var(--brand-surface)',
              boxShadow: 'inset 0 0 0 1px var(--brand-border)',
            }}
          >
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--brand)] mb-1">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>TL;DR · 核心摘要</span>
            </div>
            <p className="wb-tldr-text text-[var(--ink-primary)]">
              <LatexText text={post.excerpt} />
            </p>
          </div>
        )}

        {/* Tags Inline Strip */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            {post.tags.slice(0, 8).map(t => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}/`}
                prefetch={false}
                className="px-2 py-0.5 rounded-[4px] font-mono text-[11px] bg-[var(--bg-subtle)] text-[var(--ink-muted)] hover:text-[var(--brand)] transition-colors"
                style={{ boxShadow: 'inset 0 0 0 1px var(--border-hairline)' }}
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Google Ad Slot 1: Top in-article flow (Preserved) */}
        <GoogleAd
          slot="1669039692"
          format="fluid"
          minHeight={90}
          label="广告位 1 · 文首流式"
        />

        {/* Article HTML Body (KaTeX + Shiki Ligatures Off) */}
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Google Ad Slot 2: In-content (Preserved) */}
        <GoogleAd
          slot="2477304429"
          format="fluid"
          minHeight={90}
          label="广告位 2 · 文中穿插"
        />

        {/* OI-Game Banner */}
        <OiGamePromo variant="banner" />

        {/* Resource & Community Callouts (Clean SVG Icons, Zero Emojis) */}
        <div className="my-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="wb-card p-4">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-primary)] mb-1.5">
              <Github className="w-4 h-4 text-[var(--brand)]" />
              <span>开源代码与考纲字典</span>
            </div>
            <p className="text-[12.5px] text-[var(--ink-muted)] leading-relaxed">
              配套题解代码归档于{' '}
              <a
                href="https://github.com/lihongzheshuai/yummy-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] font-medium hover:underline"
              >
                yummy-code 仓库
              </a>
              ，完整知识点索引见{' '}
              <a
                href="https://wiki.coderli.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] font-medium hover:underline"
              >
                GESP Wiki
              </a>
              。
            </p>
          </div>

          <div className="wb-card p-4">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-primary)] mb-1.5">
              <MessageSquare className="w-4 h-4 text-[var(--brand)]" />
              <span>技术交流与考级答疑</span>
            </div>
            <p className="text-[12.5px] text-[var(--ink-muted)] leading-relaxed">
              欢迎加入{' '}
              <a
                href="https://qm.qq.com/q/fykBPjH8ru"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] font-medium hover:underline"
              >
                C++ GESP/CSP 群（688906745）
              </a>{' '}
              或{' '}
              <a
                href="https://qm.qq.com/q/qwy4BSW9La"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] font-medium hover:underline"
              >
                Java/Python 群（982860385）
              </a>
              。
            </p>
          </div>
        </div>

        {/* Google Ad Slot 3: Post footer recommendation banner (Preserved) */}
        <GoogleAd
          slot="6416549436"
          format="auto"
          minHeight={100}
          label="广告位 3 · 文末推荐横幅"
        />

        {/* Prev / Next Navigation */}
        <PostNavigation prevPost={post.prevPost || null} nextPost={post.nextPost || null} />

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <RelatedPosts posts={post.relatedPosts} />
        )}

        {/* Compact Author Card */}
        <div
          className="mt-8 p-4 sm:p-5 rounded-[8px] flex items-center gap-4"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            boxShadow: '0 0 0 1px var(--border-hairline)',
          }}
        >
          <img
            src="/images/onecoder/avatar.png"
            alt="OneCoder"
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            style={{ boxShadow: '0 0 0 2px var(--brand)' }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-semibold text-[14px] text-[var(--ink-primary)]">OneCoder</h4>
              <span className="font-mono text-[11px] text-[var(--ink-faint)]">始于 2012</span>
            </div>
            <p className="text-[12.5px] text-[var(--ink-muted)] leading-relaxed">
              持续记录 C++ GESP/CSP 信奥算法、Java 服务端架构与 Python 工程实战。官方唯一域名：coderli.com
            </p>
          </div>
        </div>

        {/* Comments Section (Phase 1 XSS-hardened) */}
        <Comments slug={post.slug} postTitle={post.title} />
      </article>

      {/* =========================================================
          RIGHT STICKY TOC & UTILITY RAIL (lg+)
         ========================================================= */}
      <aside
        aria-label="本文目录与工具"
        className="hidden lg:flex flex-col gap-4 px-4 py-5 border-l sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <TOC toc={post.toc} />

        <OiGamePromo
          variant="sidebar"
          contextLabel={post.topic === 'gesp' && post.subtopic ? `GESP ${post.subtopic}` : undefined}
        />

        <a
          href="/llms.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-[6px] text-[12px] font-medium bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
          style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>全站 AI / Markdown 索引</span>
        </a>

        {/* Compact WeChat QR */}
        <div
          className="rounded-[8px] p-3 flex items-center gap-2.5"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            boxShadow: '0 0 0 1px var(--border-hairline)',
          }}
        >
          <img
            src="/images/wechat_qrcode.jpg"
            alt="OneCoder 公众号二维码"
            loading="lazy"
            className="w-11 h-11 rounded-[5px] flex-shrink-0 object-cover"
          />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-[var(--ink-primary)]">学习公众号</div>
            <div className="text-[11px] text-[var(--ink-muted)] leading-snug">
              扫码订阅考纲精讲
            </div>
          </div>
        </div>

        {/* Google Ad Slot 4: Sidebar sticky ad (Preserved) */}
        <GoogleAd
          slot="6734143049"
          format="auto"
          minHeight={220}
          label="广告位 4 · 侧边栏吸顶"
        />
      </aside>
    </div>
  );
}
