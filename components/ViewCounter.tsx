'use client';

import React from 'react';
import useSWR from 'swr';

const API_BASE = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.coderli.com'
).replace(/\/$/, '');

const incrementFetcher = (url: string) => {
  const token = (process.env.API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN || '').trim();
  const headers: Record<string, string> = {};
  if (token) headers['x-api-token'] = token;

  return fetch(url, { method: 'POST', headers })
    .then(r => r.json())
    .catch(() => ({ views: undefined }));
};

export default function ViewCounter({ slug }: { slug: string }) {
  // Opening the page automatically triggers POST to increment view count by 1 in DB
  const apiUrl = `${API_BASE}/api/views/${slug}`;
  const { data } = useSWR(apiUrl, incrementFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });

  const count = data?.views;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
      <span>{count !== undefined ? `${count.toLocaleString()} 次阅读` : '计算中...'}</span>
    </span>
  );
}
