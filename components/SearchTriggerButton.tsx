'use client';

import React from 'react';
import { Search } from 'lucide-react';

export default function SearchTriggerButton() {
  function handleOpenSearch() {
    window.dispatchEvent(new CustomEvent('onecoder:open-search'));
  }

  return (
    <button
      type="button"
      onClick={handleOpenSearch}
      className="px-4 py-2 rounded-[7px] bg-[var(--bg-canvas)] text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--brand)] transition-colors inline-flex items-center gap-2 cursor-pointer"
      style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
    >
      <Search className="w-3.5 h-3.5" />
      <span>按 ⌘K 或 / 检索全站技术文档</span>
    </button>
  );
}
