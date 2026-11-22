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

export default function ViewCounter({ slug, plain = false }: { slug: string; plain?: boolean }) {
  const apiUrl = `${API_BASE}/api/views/${slug}`;
  const { data } = useSWR(apiUrl, incrementFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });

  const count = data?.views;

  if (plain) {
    return (
      <span className="font-mono tnum">
        {count !== undefined ? `${count.toLocaleString()} 次` : '实时统计'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono tnum text-[12.5px] font-semibold text-[var(--ink-primary)]">
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ backgroundColor: 'var(--brand)' }}
      />
      <span>{count !== undefined ? `${count.toLocaleString()} 次阅读` : '统计中…'}</span>
    </span>
  );
}
