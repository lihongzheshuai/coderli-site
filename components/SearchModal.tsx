'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Moon, Zap, BookOpen, CornerDownLeft, ArrowUpRight } from 'lucide-react';
import { extractProblemId, getBadgeMeta, formatCompactTitle } from '@/lib/workbench';

interface SearchIndexItem {
  id: string;
  slug: string;
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  topic: 'gesp' | 'csp' | 'java' | 'algo' | 'python-data';
  topicName: string;
  subtopic: string;
  excerpt: string;
}

const HOT_KEYWORDS = ['GESP 五级', 'P17456', 'B4576', '二分', '背包', 'SLF4J', 'Netty'];

export default function SearchModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [indexData, setIndexData] = useState<SearchIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Open/close triggers: ⌘K / Ctrl+K / `/` / custom event
  useEffect(() => {
    function handleOpen() {
      setIsOpen(true);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('onecoder:open-search', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('onecoder:open-search', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll & lazy fetch index when opened
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setTimeout(() => inputRef.current?.focus(), 20);
      if (indexData.length === 0 && !isLoading) {
        setIsLoading(true);
        fetch('/search-index.json', { cache: 'force-cache' })
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data)) setIndexData(data);
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      }
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen, indexData.length, isLoading]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (indexData.length === 0) return [];
    if (!q) return indexData.slice(0, 6);
    return indexData
      .filter(item => {
        const text = `${item.title} ${item.slug} ${(item.categories || []).join(' ')} ${(item.tags || []).join(' ')} ${item.subtopic || ''} ${item.excerpt || ''}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 12);
  }, [indexData, q]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [q, isOpen]);

  // Arrow key navigation inside modal
  useEffect(() => {
    if (!isOpen) return;
    function onModalKey(e: KeyboardEvent) {
      if (results.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        const target = results[selectedIndex];
        if (target) {
          e.preventDefault();
          setIsOpen(false);
          router.push(`/${target.slug}/`);
        }
      }
    }
    window.addEventListener('keydown', onModalKey);
    return () => window.removeEventListener('keydown', onModalKey);
  }, [isOpen, results, selectedIndex, router]);

  if (!isOpen) return null;

  function highlight(text: string) {
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q ? (
        <mark
          key={i}
          className="rounded px-0.5 font-semibold"
          style={{
            backgroundColor: 'var(--brand-surface)',
            color: 'var(--brand)',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  function openPost(slug: string) {
    setIsOpen(false);
    router.push(`/${slug}/`);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="全站命令搜索"
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 backdrop-blur-[4px]"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.50)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[620px] rounded-[12px] overflow-hidden flex flex-col max-h-[76vh]"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Search Input Row */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <Search className="w-4 h-4 text-[var(--ink-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="search"
            aria-label="全站搜索输入框"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              indexData.length > 0
                ? `输入洛谷题号（如 P17456）、GESP 考点或 Java 关键词（共 ${indexData.length.toLocaleString()} 篇）…`
                : '输入洛谷题号（如 P17456）、GESP 考点或 Java 关键词…'
            }
            style={{ outline: 'none' }}
            className="flex-1 bg-transparent border-none !outline-none focus:!outline-none focus-visible:!outline-none text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="wb-kbd cursor-pointer hover:text-[var(--ink-primary)]"
          >
            ESC
          </button>
        </div>

        {/* Results & Actions */}
        <div className="overflow-y-auto p-2 flex-1">
          {!q && (
            <div className="px-2.5 pt-1 pb-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-[var(--ink-faint)] mr-1">
                热门检索:
              </span>
              {HOT_KEYWORDS.map(kw => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setQuery(kw)}
                  className="px-2 py-0.5 rounded-[5px] text-[11.5px] font-mono bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand)] transition cursor-pointer"
                  style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
                >
                  {kw}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="py-10 text-center text-[13px] text-[var(--ink-muted)]">
              正在加载全站索引…
            </div>
          )}

          {!isLoading && q && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-[13.5px] font-medium text-[var(--ink-primary)]">
                未找到匹配「{query}」的文章
              </p>
              <p className="text-[12px] text-[var(--ink-muted)] mt-1">
                可尝试搜索题号前缀（如 P1873）、等级（五级）或技术栈名称
              </p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="mt-1">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-muted)]">
                {q ? `匹配结果（${results.length}）` : '最新更新 · 直达考点与题解'}
              </div>
              {results.map((item, idx) => {
                const badge = getBadgeMeta(item);
                const pid = extractProblemId(item.title, item.slug);
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => openPost(item.slug)}
                    className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[7px] text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="w-[72px] flex-shrink-0 flex items-center">
                        <span
                          className={`wb-pill w-full !px-1 ${
                            badge.track === 'gesp'
                              ? 'wb-pill-gesp'
                              : badge.track === 'contest'
                              ? 'wb-pill-contest'
                              : 'wb-pill-arch'
                          }`}
                        >
                          {badge.label}
                        </span>
                      </span>
                      <span
                        title={item.title}
                        className={`truncate text-[13px] text-[var(--ink-primary)] ${
                          isSelected ? 'font-semibold' : 'font-normal'
                        }`}
                      >
                        {pid && !formatCompactTitle(item.title).toUpperCase().includes(pid) ? (
                          <strong className="font-mono mr-1.5">{pid}</strong>
                        ) : null}
                        {highlight(formatCompactTitle(item.title))}
                      </span>
                    </span>

                    <span className="flex items-center justify-end gap-2 flex-shrink-0 text-[11.5px] text-[var(--ink-muted)]">
                      <span className="font-mono tnum hidden sm:inline">{item.date}</span>
                      <span className="w-6 inline-flex justify-end">
                        {isSelected ? (
                          <kbd className="wb-kbd">
                            <CornerDownLeft className="w-3 h-3" />
                          </kbd>
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Actions Group */}
          <div
            className="mt-2 pt-2 border-t"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-muted)]">
              快捷操作与生态
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('onecoder:toggle-theme'));
              }}
              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[7px] text-left text-[13px] text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Moon className="w-3.5 h-3.5 text-[var(--ink-muted)] flex-shrink-0" />
                <span className="truncate">切换浅色 / 深色工作台主题</span>
              </span>
              <kbd className="wb-kbd flex-shrink-0">⌥T</kbd>
            </button>
            <a
              href="https://oi.coderli.com/?utm_source=coderli_cmd"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[7px] text-left text-[13px] text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Zap className="w-3.5 h-3.5 text-[var(--brand)] flex-shrink-0" />
                <span className="truncate">前往 OI-Game 信奥远征（oi.coderli.com）</span>
              </span>
              <span className="inline-flex items-center justify-end text-[var(--ink-muted)] flex-shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </a>
            <a
              href="https://wiki.coderli.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[7px] text-left text-[13px] text-[var(--ink-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-3.5 h-3.5 text-[var(--ink-muted)] flex-shrink-0" />
                <span className="truncate">前往 GESP 考纲 Wiki 字典（wiki.coderli.com）</span>
              </span>
              <span className="inline-flex items-center justify-end text-[var(--ink-muted)] flex-shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </div>
        </div>

        {/* Footer Hints */}
        <div
          className="px-3.5 py-2 border-t flex items-center justify-between text-[11.5px] text-[var(--ink-muted)]"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="wb-kbd">↑</kbd>
              <kbd className="wb-kbd">↓</kbd>
              <span>切换</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="wb-kbd">↵</kbd>
              <span>打开</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="wb-kbd">ESC</kbd>
              <span>关闭</span>
            </span>
          </div>
          <span className="font-mono tnum">
            {indexData.length > 0 ? `已索引 ${indexData.length.toLocaleString()} 篇` : '全站静态索引'}
          </span>
        </div>
      </div>
    </div>
  );
}
