'use client';

import React from 'react';

export default function SearchTriggerButton() {
  function handleOpenSearch() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
  }

  return (
    <button
      type="button"
      onClick={handleOpenSearch}
      className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium hover:border-teal-500 text-slate-700 dark:text-slate-300 transition shadow-sm inline-flex items-center gap-2 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
    >
      <span>浏览历史全部 936 篇博文（点击或按 / 快捷键检索）</span>
    </button>
  );
}
