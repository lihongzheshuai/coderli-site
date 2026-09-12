import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import TOC from '@/components/TOC';
import GoogleAd from '@/components/GoogleAd';
import ViewCounter from '@/components/ViewCounter';
import Comments from '@/components/Comments';
import LatexText from '@/components/LatexText';
import PostNavigation from '@/components/PostNavigation';
import RelatedPosts from '@/components/RelatedPosts';

interface PageProps {
  params: { slug: string };
}

export const dynamicParams = true;
export const revalidate = false; // Permanent edge cache until revalidatePath

export async function generateStaticParams() {
  const posts = getAllPosts();
  // Pre-generate newest 50 posts at build time, remainder generated on-demand (ISR)
  return posts.slice(0, 50).map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return { title: '文章未找到 · OneCoder' };
  }

  return {
    title: `${post.title} · OneCoder`,
    description: post.excerpt,
    keywords: [...post.tags, ...post.categories, 'OneCoder'],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.previewImg ? [{ url: post.previewImg }] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="pb-20">
      {/* Top Breadcrumb navigation */}
      <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 mt-5 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
        >
          <span>← 返回全站首页</span>
        </Link>
      </div>

      {/* Main Three-Column Grid */}
      <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        {/* Center: Main Article Container */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-12 shadow-sm min-w-0">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-5 flex-wrap">
            <Link href="/" className="hover:text-teal-500">首页</Link>
            <span>/</span>
            <Link href={`/topics/${post.topic}/`} className="hover:text-teal-500">{post.topicName}</Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{post.subtopic}</span>
          </nav>

          {/* Featured Header Banner (Image or Graphic Card) */}
          {post.previewImg ? (
            <div className="w-full h-56 md:h-72 rounded-xl overflow-hidden mb-8 border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-800/60">
              <img
                src={post.previewImg}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded text-xs font-mono border border-white/10">
                📷 题解插图
              </span>
            </div>
          ) : (
            <div className="w-full py-12 px-6 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/40 text-center mb-8 relative">
              <span className="text-4xl font-mono font-extrabold text-teal-600 dark:text-teal-400 block mb-2">
                {post.previewGraphic.symbol}
              </span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                {post.previewGraphic.title}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {post.previewGraphic.desc}
              </p>
              <span className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                🎨 视觉封面
              </span>
            </div>
          )}

          {/* Article Title */}
          <h1 className="text-2xl md:text-3xl lg:text-[38px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug mb-6">
            <LatexText text={post.title} />
          </h1>

          {/* Metadata line */}
          <div className="flex flex-wrap items-center gap-3.5 text-sm text-slate-500 dark:text-slate-400 pb-6 border-b border-slate-100 dark:border-slate-800 mb-8">
            <span>📅 {post.date}</span>
            <span>·</span>
            <span>✍️ {post.author}</span>
            <span>·</span>
            <ViewCounter slug={post.slug} />
            <span>·</span>
            <span>⏱️ {post.readTime}</span>
            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              {post.tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[11px]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Google Ad Slot 1: Top in-article flow (Slot 1669039692) */}
          <GoogleAd
            slot="1669039692"
            format="fluid"
            minHeight={100}
            label="广告位 1 · 文首流式"
          />

          {/* Article HTML Body (compiled with KaTeX + Shiki) */}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* Google Ad Slot 2: In-content (Slot 2477304429) */}
          <GoogleAd
            slot="2477304429"
            format="fluid"
            minHeight={100}
            label="广告位 2 · 文中穿插"
          />

          {/* Community Callouts */}
          <div className="my-8 space-y-3">
            <div className="p-4 rounded-xl border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-xs md:text-sm text-slate-700 dark:text-slate-300">
              <strong className="text-blue-600 dark:text-blue-400 block mb-1">💡 OneCoder 资源指引</strong>
              <p>所有代码开源上传至 GitHub：<a href="https://github.com/lihongzheshuai/yummy-code" target="_blank" className="text-teal-600 dark:text-teal-400 underline font-semibold">yummy-code 仓库</a> · GESP 专题站：<a href="https://wiki.coderli.com/" target="_blank" className="text-teal-600 dark:text-teal-400 underline font-semibold">GESP WIKI</a></p>
            </div>

            <div className="p-4 rounded-xl border-l-4 border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 text-xs md:text-sm text-slate-700 dark:text-slate-300">
              <strong className="text-teal-600 dark:text-teal-400 block mb-1">🤝 技术交流与答疑</strong>
              <p>欢迎加入：<a href="https://qm.qq.com/q/fykBPjH8ru" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 font-bold underline hover:text-teal-700">C++ GESP/CSP 考级答疑群（688906745）</a> 与 <a href="https://qm.qq.com/q/qwy4BSW9La" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 font-bold underline hover:text-teal-700">Java/Python交流群（982860385）</a>，点击可直接加群。</p>
            </div>
          </div>

          {/* Google Ad Slot 3: Post footer recommendation banner (Slot 6416549436) */}
          <GoogleAd
            slot="6416549436"
            format="auto"
            minHeight={120}
            label="广告位 3 · 文末推荐横幅"
          />

          {/* Previous & Next Post Navigation */}
          <PostNavigation
            prevPost={post.prevPost || null}
            nextPost={post.nextPost || null}
          />

          {/* Related Recommended Posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts posts={post.relatedPosts} />
          )}

          {/* Author Card Footer */}
          <div className="mt-12 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-5">
            <img
              src="/images/onecoder/avatar.png"
              alt="OneCoder"
              className="w-16 h-16 rounded-full border-2 border-teal-500 object-cover flex-shrink-0"
            />
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">OneCoder (lihongzheshuai)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                一个中年人的自留地，记录学习 C++、GESP/NOI、Java、Python 与算法架构的心得体会。本站唯一网址：coderli.com
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-teal-600 dark:text-teal-400">
                <a href="mailto:wushikezuo@gmail.com">📫 wushikezuo@gmail.com</a>
                <a href="https://github.com/lihongzheshuai" target="_blank">🐙 GitHub</a>
                <a href="https://twitter.com/wushikezuohehe" target="_blank">🐦 Twitter/X</a>
                <a href="https://qm.qq.com/q/fykBPjH8ru" target="_blank" rel="noopener noreferrer">👥 QQ群: 688906745</a>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <Comments slug={post.slug} />
        </article>

        {/* Right: Sticky TOC & Sticky Sidebar Ad */}
        <aside className="sticky top-20 space-y-6">
          <TOC toc={post.toc} />

          {/* Google Ad Slot 4: Sidebar sticky ad (Slot 6734143049) */}
          <GoogleAd
            slot="6734143049"
            format="auto"
            minHeight={250}
            label="广告位 4 · 侧边栏吸顶"
          />
        </aside>
      </div>
    </div>
  );
}
