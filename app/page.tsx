import React from 'react';
import Link from 'next/link';
import { getAllPosts, getFeaturedPost } from '@/lib/posts';
import HomePostStream from '@/components/HomePostStream';
import GoogleAd from '@/components/GoogleAd';

export const revalidate = false; // ISR static caching

export default function HomePage() {
  const posts = getAllPosts();
  const featured = getFeaturedPost();
  const streamPosts = featured ? posts.filter(p => p.slug !== featured.slug) : posts;

  const topicStats = {
    gesp: posts.filter(p => p.topic === 'gesp').length,
    java: posts.filter(p => p.topic === 'java').length,
    csp: posts.filter(p => p.topic === 'csp').length,
    algo: posts.filter(p => p.topic === 'algo').length,
    pythonData: posts.filter(p => p.topic === 'python-data').length,
  };

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 mt-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm">
          <div>
            <div className="text-xs font-mono font-semibold tracking-widest text-teal-600 dark:text-teal-400 uppercase mb-2">
              ONECODER · DEVELOPER’S KNOWLEDGE BASE
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug mb-3">
              慢慢学，认真写。<br />
              <span className="text-teal-600 dark:text-teal-400">把每一次想明白的技术，留在这里。</span>
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-6">
              一个中年人的技术自留地。记录学习 C++、GESP/NOI 信奥算法、Java 架构演进与 Python 的心得体会。
              始于 2012，现已积累 936 篇独立技术笔记。
            </p>

            <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400">936</span>
                <span className="text-xs text-slate-400 block">累计博文</span>
              </div>
              <div>
                <span className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400">504</span>
                <span className="text-xs text-slate-400 block">GESP考级题解</span>
              </div>
              <div>
                <span className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400">14 年</span>
                <span className="text-xs text-slate-400 block">坚持记录</span>
              </div>
              <div>
                <span className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400">128万+</span>
                <span className="text-xs text-slate-400 block">全站总阅读</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center flex-shrink-0">
            <img
              src="/images/wechat_qrcode.jpg"
              alt="微信公众号二维码"
              className="w-32 h-32 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
            />
            <span className="text-xs text-slate-500 font-semibold mt-2">
              GESP/CSP 学习公众号
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Stream + Sidebar */}
      <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* Left Column: Post Feed */}
        <div>
          {/* Featured Top Card */}
          {featured && (
            <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-8 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] shadow-sm hover:border-teal-500/60 hover:shadow-md transition duration-200">
              <div className="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-md inline-block mb-3 border border-teal-500/20">
                    {featured.pinned ? '📌 核心置顶' : '🔥 最新推荐'} · {featured.topicName}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mb-3 leading-snug">
                    <Link href={`/${featured.slug}/`}>{featured.title}</Link>
                  </h2>
                  <p className="text-[15px] md:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {featured.excerpt}
                  </p>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>📅 {featured.date}</span>
                  <span>·</span>
                  <span>⏱️ {featured.readTime}</span>
                  <span>·</span>
                  <span className="font-mono">#{featured.tags[0] || 'C++'}</span>
                </div>
              </div>

              <div className="h-48 md:h-full bg-slate-100 dark:bg-slate-800/60 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
                {featured.previewImg ? (
                  <img
                    src={featured.previewImg}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="p-6 text-center">
                    <span className="text-3xl font-mono font-bold text-teal-600 dark:text-teal-400 block mb-1">
                      {featured.previewGraphic.symbol}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {featured.previewGraphic.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Topic Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200 dark:border-slate-800 text-sm">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-full bg-teal-600 text-white font-medium text-xs whitespace-nowrap shadow-sm"
            >
              全部博文 ({posts.length})
            </Link>
            <Link
              href="/topics/gesp/"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500 text-xs whitespace-nowrap transition"
            >
              🏆 GESP 考级 ({topicStats.gesp})
            </Link>
            <Link
              href="/topics/java/"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500 text-xs whitespace-nowrap transition"
            >
              ☕ Java 架构 ({topicStats.java})
            </Link>
            <Link
              href="/topics/csp/"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500 text-xs whitespace-nowrap transition"
            >
              ⌘ CSP / NOIP ({topicStats.csp})
            </Link>
            <Link
              href="/topics/algo/"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500 text-xs whitespace-nowrap transition"
            >
              🧮 算法专题 ({topicStats.algo})
            </Link>
          </div>

          {/* Article Stream with Lazy Load / Pagination */}
          <HomePostStream posts={streamPosts} initialCount={20} pageSize={20} />
        </div>

        {/* Right Column: Sidebar */}
        <aside className="space-y-6">
          {/* Author Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3.5 mb-3.5">
              <img
                src="/images/onecoder/avatar.png"
                alt="OneCoder"
                className="w-14 h-14 rounded-full border-2 border-teal-500 object-cover"
              />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">OneCoder</h3>
                <span className="text-xs text-slate-400 font-mono">wushikezuohehe</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              一个中年人的自留地，记录学习 Java、Python、C++ 以及算法架构的心得体会。本站唯一网址：coderli.com
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                href="https://github.com/lihongzheshuai"
                target="_blank"
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-500 transition"
              >
                🐙 GitHub
              </Link>
              <Link
                href="https://twitter.com/wushikezuohehe"
                target="_blank"
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-500 transition"
              >
                🐦 Twitter/X
              </Link>
              <span className="px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                👥 QQ群: 688906745
              </span>
            </div>
          </div>

          {/* Topics Navigation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              📚 专题快速导航
            </div>
            <div className="space-y-1.5 text-xs">
              <Link
                href="/topics/gesp/"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <span>🏆 GESP 编程与算法</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{topicStats.gesp} 篇</span>
              </Link>
              <Link
                href="/topics/java/"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <span>☕ Java 架构演进与实战</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{topicStats.java} 篇</span>
              </Link>
              <Link
                href="/topics/csp/"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <span>⌘ CSP / NOIP 信奥竞赛</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{topicStats.csp} 篇</span>
              </Link>
              <Link
                href="/topics/algo/"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <span>🧮 算法专题与 LeetCode</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{topicStats.algo} 篇</span>
              </Link>
            </div>
          </div>

          {/* Sticky Sidebar Google Ad (Slot 6734143049) */}
          <div className="sticky top-20">
            <GoogleAd
              slot="6734143049"
              minHeight={250}
              label="广告位 4 · 侧边栏吸顶"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
