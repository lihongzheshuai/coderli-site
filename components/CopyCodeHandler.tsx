'use client';

import { useEffect } from 'react';

export default function CopyCodeHandler() {
  useEffect(() => {
    function handleCopyClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLElement;
      if (!target) return;

      const encodedCode = target.getAttribute('data-code');
      if (!encodedCode) return;

      const code = decodeURIComponent(encodedCode);
      navigator.clipboard.writeText(code).then(() => {
        const originalText = target.innerHTML;
        target.innerHTML = '✅ 已复制';
        target.classList.add('bg-teal-700', 'text-white');
        setTimeout(() => {
          target.innerHTML = originalText;
          target.classList.remove('bg-teal-700', 'text-white');
        }, 2000);
      });
    }

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  return null;
}
