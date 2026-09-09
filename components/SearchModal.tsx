'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LatexText from '@/components/LatexText';

interface SearchIndexItem {
  id: string;
  slug: string;
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  topic: string;
  topicName: string;
  subtopic: string;
  excerpt: string;
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [indexData, setIndexData] = useState<SearchIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch search index when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);

      if (indexData.length === 0 && !isLoading) {
        setIsLoading(true);
        fetch('/search-index.json')
          .then(r => r.json())
          .then(data => {
            setIndexData(data);
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      }
    }
  }, [isOpen, indexData.length, isLoading]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  let results: SearchIndexItem[] = [];

  if (q && indexData.length > 0) {
    results = indexData
      .filter(item => {
        const text = (item.title + ' ' + item.categories.join(' ') + ' ' + item.tags.join(' ') + ' ' + item.excerpt).toLowerCase();
        return text.includes(q);
      })
      .slice(0, 15);
  }

  function highlight(text: string) {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q ? (
        <mark key={i} className="bg-teal-500/25 text-teal-600 dark:text-teal-400 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <span className="text-xl text-teal-600 dark:text-teal-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="快速检索 936 篇博文（支持标题、洛谷题号如 B4501、技术如 SLF4J）..."
            className="flex-1 bg-transparent border-none outline-none text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 font-sans"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs font-mono px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
          >
            ESC
          </button>
        </div>

        <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
          {isLoading && (
            <div className="py-10 text-center text-sm text-slate-400">
              正在加载 936 篇博文索引数据...
            </div>
          )}

          {!isLoading && !query && (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>输入关键词进行毫秒级模糊搜索</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {['GESP', '四级', '山之谷', '烤鸡', 'SLF4J', 'Netty', '二分'].map(kw => (
                  <button
                    key={kw}
                    onClick={() => setQuery(kw)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:text-teal-500 font-mono text-xs text-slate-500"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">
              未找到匹配文章，换个关键词试试？
            </div>
          )}

          {!isLoading &&
            results.map(item => (
              <Link
                key={item.slug}
                href={`/${item.slug}/`}
                onClick={() => setIsOpen(false)}
                className="block p-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">{item.topicName} · {item.subtopic}</span>
                  <time>{item.date}</time>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mb-1">
                  {highlight(item.title)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  <LatexText text={item.excerpt} />
                </p>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
