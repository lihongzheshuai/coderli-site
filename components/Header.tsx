'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  Search,
  Moon,
  Sun,
  ArrowUpRight,
  Menu,
  X,
  BookOpen,
  Trophy,
  Archive,
  Tags,
  Layers,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  postCount?: number;
}

export default function Header({ postCount }: HeaderProps) {
  const pathname = usePathname() || '/';
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const applyTheme = useCallback((dark: boolean) => {
    setIsDark(dark);
    const root = document.documentElement;
    root.classList.add('theme-switching');
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // Force immediate atomic style recalculation across all CSS-variable consumers
    void root.offsetHeight;
    requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const dark = storedTheme === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onToggleEvent() {
      const next = !document.documentElement.classList.contains('dark');
      applyTheme(next);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        onToggleEvent();
      }
    }
    window.addEventListener('onecoder:toggle-theme', onToggleEvent);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('onecoder:toggle-theme', onToggleEvent);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [applyTheme]);

  function openSearch() {
    window.dispatchEvent(new CustomEvent('onecoder:open-search'));
  }

  const isHome = pathname === '/' || pathname === '';
  const isTopics = pathname.startsWith('/topics') || pathname.startsWith('/categories');
  const isArchives = pathname.startsWith('/archives');

  return (
    <header
      className="sticky top-0 z-30 h-[52px] backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 94%, transparent)',
        boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
      }}
    >
      <div className="h-full max-w-[1680px] mx-auto grid grid-cols-[auto_1fr_auto] lg:grid-cols-[248px_minmax(0,1fr)_auto] items-center px-3 lg:px-0 lg:pr-7 gap-2 lg:gap-0">
        {/* Left Brand Column (248px aligned with desktop sidebar) */}
        <div
          className="h-full flex items-center gap-2.5 lg:px-4 lg:border-r lg:bg-[var(--bg-subtle)]"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <button
            type="button"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label={mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-[34px] h-[34px] rounded-[7px] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
            style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link href="/" prefetch={false} className="inline-flex items-center gap-2.5 group">
            <span
              className="w-[26px] h-[26px] rounded-[6px] grid place-items-center flex-shrink-0 transition-transform group-hover:scale-[1.03] bg-[#0F172A] text-white dark:bg-[#172133] dark:text-[#2DD4BF] dark:ring-1 dark:ring-white/15"
              aria-hidden="true"
            >
              <Code2 className="w-3.5 h-3.5 stroke-[2.4]" />
            </span>
            <span className="flex items-baseline gap-1.5">
              <strong className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
                OneCoder
              </strong>
              {postCount ? (
                <span className="hidden sm:inline font-mono tnum text-[11px] text-[var(--ink-muted)]">
                  {postCount.toLocaleString()} 篇
                </span>
              ) : null}
            </span>
          </Link>
        </div>

        {/* Center Command Search Trigger */}
        <div className="flex items-center justify-end lg:justify-start lg:px-7 min-w-0">
          <button
            type="button"
            onClick={openSearch}
            aria-label="打开全站命令搜索面板 (⌘K)"
            className="hidden sm:flex items-center justify-between gap-2.5 w-full max-w-[490px] h-[34px] px-3 pr-2.5 rounded-[7px] text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] bg-[var(--bg-subtle)] transition-all cursor-pointer"
            style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                搜索题号（P17456 / B4576）、GESP 考点或 Java 技术笔记…
              </span>
            </span>
            <kbd className="wb-kbd">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={openSearch}
            aria-label="搜索全站"
            className="sm:hidden inline-flex items-center justify-center w-[34px] h-[34px] rounded-[7px] bg-[var(--bg-subtle)] text-[var(--ink-primary)]"
            style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Right Primary Navigation & Single Brand CTA */}
        <nav aria-label="主导航" className="flex items-center gap-1">
          <Link
            href="/"
            prefetch={false}
            className={`hidden md:inline-flex items-center px-2.5 py-1.5 rounded-[6px] text-[13px] transition-colors ${
              isHome
                ? 'font-semibold text-[var(--ink-primary)] bg-[var(--bg-hover)]'
                : 'font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            索引大厅
          </Link>
          <Link
            href="/topics/gesp/"
            prefetch={false}
            className={`hidden md:inline-flex items-center px-2.5 py-1.5 rounded-[6px] text-[13px] transition-colors ${
              isTopics
                ? 'font-semibold text-[var(--ink-primary)] bg-[var(--bg-hover)]'
                : 'font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            专题
          </Link>
          <Link
            href="/archives/"
            prefetch={false}
            className={`hidden md:inline-flex items-center px-2.5 py-1.5 rounded-[6px] text-[13px] transition-colors ${
              isArchives
                ? 'font-semibold text-[var(--ink-primary)] bg-[var(--bg-hover)]'
                : 'font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            归档
          </Link>
          <a
            href="https://wiki.coderli.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <span>GESP Wiki</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <span
            className="hidden md:block w-px h-[18px] mx-1.5"
            style={{ backgroundColor: 'var(--border-hairline)' }}
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={() => applyTheme(!isDark)}
            aria-label={isDark ? '切换至浅色模式' : '切换至深色模式'}
            title={isDark ? '切换至浅色模式 (⌥T)' : '切换至深色模式 (⌥T)'}
            className="hidden sm:grid place-items-center w-8 h-8 rounded-[6px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="https://oi.coderli.com/?utm_source=coderli_header"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 ml-0.5 sm:ml-1 px-2.5 sm:px-3 py-1.5 rounded-[6px] text-[12.5px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--brand)',
              color: 'var(--brand-cta-text)',
            }}
          >
            <span className="hidden sm:inline">信奥闯关 240 关</span>
            <span className="sm:hidden">信奥闯关</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-b px-4 py-3 space-y-2 shadow-lg"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Link href="/" prefetch={false} className="wb-sb-item" data-active={isHome}>
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>全站索引</span>
              </span>
            </Link>
            <Link
              href="/topics/gesp/"
              prefetch={false}
              className="wb-sb-item"
              data-active={pathname.startsWith('/topics/gesp')}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>GESP 考级</span>
              </span>
            </Link>
            <Link
              href="/topics/csp/"
              prefetch={false}
              className="wb-sb-item"
              data-active={pathname.startsWith('/topics/csp')}
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>CSP / NOIP</span>
              </span>
            </Link>
            <Link
              href="/topics/java/"
              prefetch={false}
              className="wb-sb-item"
              data-active={pathname.startsWith('/topics/java')}
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" />
                <span>Java 架构</span>
              </span>
            </Link>
            <Link href="/archives/" prefetch={false} className="wb-sb-item" data-active={isArchives}>
              <span className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5" />
                <span>全站归档</span>
              </span>
            </Link>
            <Link
              href="/tags/"
              prefetch={false}
              className="wb-sb-item"
              data-active={pathname.startsWith('/tags')}
            >
              <span className="flex items-center gap-2">
                <Tags className="w-3.5 h-3.5" />
                <span>全部标签</span>
              </span>
            </Link>
          </div>

          <div
            className="pt-2 border-t flex items-center justify-between gap-2"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <button
              type="button"
              onClick={() => applyTheme(!isDark)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-secondary)]"
              style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? '切换浅色模式' : '切换深色模式'}</span>
            </button>
            <a
              href="https://wiki.coderli.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-medium text-[var(--brand)] bg-[var(--brand-surface)]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>GESP Wiki ↗</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
