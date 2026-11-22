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
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-muted)] mb-2">
        On This Page
      </div>
      <ul
        className="border-l space-y-0.5 max-h-[48vh] overflow-y-auto pr-1.5 pb-3"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        {toc.map(item => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block -ml-px border-l-2 py-1 text-[12.5px] leading-snug transition-colors ${
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
    </nav>
  );
}
