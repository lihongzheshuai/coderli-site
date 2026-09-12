'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className="mt-24 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-10 transition-colors">
      <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            © 2012–2026 <strong>OneCoder</strong> · 保持好奇，认真记录。
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <Link href="https://github.com/lihongzheshuai" target="_blank" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
            GitHub ↗
          </Link>
          <Link href="https://twitter.com/wushikezuohehe" target="_blank" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
            Twitter/X ↗
          </Link>
          <a href="https://qm.qq.com/q/fykBPjH8ru" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
            QQ交流群 ↗
          </a>
          <Link href="https://wiki.coderli.com/" target="_blank" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
            GESP WIKI ↗
          </Link>
          <button
            onClick={scrollToTop}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-slate-600 dark:text-slate-400 transition"
          >
            回到顶部 ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
