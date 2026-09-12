'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  postCount?: number;
}

export default function Header({ postCount }: HeaderProps) {
  const pathname = usePathname();
  // Default to Light Theme as requested
  const [isDark, setIsDark] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial theme setup: default to light unless explicitly saved as 'dark'
    const storedTheme = localStorage.getItem('theme');
    const isDarkStored = storedTheme === 'dark';
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const isWideStored = localStorage.getItem('wide') === 'true';
    setIsWide(isWideStored);
    if (isWideStored) {
      document.body.classList.add('ultra-wide');
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  function toggleWide() {
    const nextWide = !isWide;
    setIsWide(nextWide);
    if (nextWide) {
      document.body.classList.add('ultra-wide');
      localStorage.setItem('wide', 'true');
    } else {
      document.body.classList.remove('ultra-wide');
      localStorage.setItem('wide', 'false');
    }
  }

  function openSearch() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
  }

  function handleHomeClick(e: React.MouseEvent) {
    if (pathname === '/' || pathname === '') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  }

  const navs = [
    { label: '首页', href: '/', onClick: handleHomeClick },
    { label: '🏆 GESP 考级', href: '/topics/gesp/' },
    { label: '☕ Java 架构', href: '/topics/java/' },
    { label: '⌘ CSP / NOIP', href: '/topics/csp/' },
    { label: '🧮 算法专题', href: '/topics/algo/' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-[var(--container-max-width)] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-3 group"
          title="点击返回首页或回到顶部"
        >
          <img
            src="/images/onecoder/avatar.png"
            alt="OneCoder Avatar"
            className="w-10 h-10 rounded-xl object-cover border-2 border-teal-500 shadow-sm group-hover:scale-105 transition"
            onError={e => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-tight">
              OneCoder
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
              coderli.com{postCount ? ` · ${postCount} 篇博文` : ''}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {navs.map(n => {
            const isActive = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={n.onClick}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-2.5">
          <button
            type="button"
            onClick={openSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-xs text-slate-600 dark:text-slate-400 hover:border-teal-500 transition cursor-pointer"
            title="快捷搜索 (按 / 或 Ctrl+K)"
          >
            <span>🔍 搜索博文...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={toggleWide}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-teal-500 transition text-sm flex items-center gap-1 cursor-pointer"
            title="切换超宽屏 / 标准宽度"
          >
            <span>{isWide ? '⤡' : '⤢'}</span>
            <span className="text-xs hidden md:inline">{isWide ? '收缩' : '超宽屏'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-teal-500 transition text-sm cursor-pointer"
            title="切换浅色 / 深色模式"
          >
            {isDark ? '🌙' : '☀️'}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 hover:text-teal-600 text-base flex items-center justify-center cursor-pointer"
            aria-label="打开网站导航菜单"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 shadow-lg space-y-1">
          {navs.map(n => {
            const isActive = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={e => {
                  if (n.onClick) n.onClick(e);
                  setMobileMenuOpen(false);
                }}
                className={`block px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
