'use client';

import React, { useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ViewCounter({ slug }: { slug: string }) {
  const { data, mutate } = useSWR(`/api/views/${slug}/`, fetcher);

  useEffect(() => {
    fetch(`/api/views/${slug}/`, { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res?.views) {
          mutate(res, false);
        }
      })
      .catch(() => {});
  }, [slug, mutate]);

  const count = data?.views;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
      <span>{count !== undefined ? `${count.toLocaleString()} 次阅读` : '计算中...'}</span>
    </span>
  );
}
