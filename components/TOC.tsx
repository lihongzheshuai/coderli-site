'use client';

import React, { useEffect, useState } from 'react';

interface TOCProps {
  toc: {
    id: string;
    title: string;
    depth: number;
  }[];
}

export default function TOC({ toc }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -65% 0%' }
    );

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (!toc || toc.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100 mb-3.5 pb-2 border-b border-slate-100 dark:border-slate-800">
        <span>📑 本文目录大纲</span>
        <span className="text-xs font-mono text-slate-400">TOC</span>
      </div>
      <ul className="space-y-1 text-sm">
        {toc.map(item => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              className={`${item.depth === 3 ? 'pl-4' : ''}`}
            >
              <a
                href={`#${item.id}`}
                className={`block py-1 px-2 rounded transition leading-relaxed ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/50 border-l-2 border-teal-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
                }`}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
