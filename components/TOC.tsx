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
  const [activeId, setActiveId] = useState<string>(toc[0]?.id || '');

  useEffect(() => {
    if (!toc || toc.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-72px 0% -68% 0%' }
    );

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (!toc || toc.length === 0) return null;

  return (
    <nav aria-label="本文目录">
      <div className="wb-toc-heading font-semibold uppercase tracking-[0.05em] text-[var(--ink-muted)] mb-2.5">
        On This Page
      </div>
      <div className="relative">
        <ul
          className="border-l space-y-0.5 max-h-[52vh] overflow-y-auto pr-1.5 pb-6"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          {toc.map(item => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`block -ml-px border-l-2 py-1.5 wb-toc-link transition-colors ${
                    item.depth === 3 ? 'pl-5' : 'pl-3'
                  } ${
                    isActive
                      ? 'border-[var(--brand)] text-[var(--brand)] font-semibold'
                      : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-7"
          style={{
            background: 'linear-gradient(to top, var(--bg-canvas) 15%, transparent)',
          }}
        />
      </div>
    </nav>
  );
}
