'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer
      className="border-t py-6 transition-colors"
      style={{
        backgroundColor: 'var(--bg-subtle)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="max-w-[1680px] mx-auto px-4 lg:px-7 flex flex-col md:flex-row items-center justify-between gap-4 text-[12.5px] text-[var(--ink-muted)]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--ink-primary)]">
            © 2012–2026 OneCoder
          </span>
          <span className="text-[var(--ink-faint)]">·</span>
          <span>始于 2012 · C++ 信奥算法与工程知识库</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px]">
          <Link href="/archives/" prefetch={false} className="hover:text-[var(--brand)] transition-colors">
            全站归档
          </Link>
          <Link href="/categories/" prefetch={false} className="hover:text-[var(--brand)] transition-colors">
            专题分类
          </Link>
          <Link href="/tags/" prefetch={false} className="hover:text-[var(--brand)] transition-colors">
            全部标签
          </Link>
          <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition-colors">
            RSS
          </a>
          <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition-colors">
            llms.txt
          </a>
          <a
            href="https://github.com/lihongzheshuai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-[var(--brand)] transition-colors"
          >
            <span>GitHub</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
          <a
            href="https://qm.qq.com/q/fykBPjH8ru"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-[var(--brand)] transition-colors"
          >
            <span>QQ答疑群</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
          <a
            href="https://wiki.coderli.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-[var(--brand)] transition-colors"
          >
            <span>GESP Wiki</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
            style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
          >
            <ArrowUp className="w-3 h-3" />
            <span>顶部</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
