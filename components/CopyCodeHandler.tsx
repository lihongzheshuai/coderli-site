'use client';

import { useEffect } from 'react';

function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) resolve();
      else reject(new Error('execCommand failed'));
    } catch (err) {
      reject(err);
    }
  });
}

export default function CopyCodeHandler() {
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Copy code button handler
      const copyBtn = target.closest('.copy-code-btn') as HTMLElement | null;
      if (copyBtn) {
        const encodedCode = copyBtn.getAttribute('data-code');
        if (!encodedCode) return;

        const code = decodeURIComponent(encodedCode);
        copyToClipboard(code).then(() => {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = `
            <svg class="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="copy-label text-teal-400 font-medium">已复制</span>
          `;
          copyBtn.classList.add('border-teal-500/50', 'bg-teal-500/10');

          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.classList.remove('border-teal-500/50', 'bg-teal-500/10');
          }, 2000);
        });
        return;
      }

      // 2. Toggle line numbers handler
      const linesBtn = target.closest('.toggle-lines-btn') as HTMLElement | null;
      if (linesBtn) {
        const codeBlock = linesBtn.closest('.code-block');
        if (!codeBlock) return;
        const isCurrentlyHidden = codeBlock.classList.toggle('hide-line-numbers');
        linesBtn.setAttribute('title', isCurrentlyHidden ? '显示行号' : '隐藏行号');
        linesBtn.classList.toggle('opacity-50', isCurrentlyHidden);
        linesBtn.classList.toggle('text-teal-400', !isCurrentlyHidden);
        return;
      }

      // 3. Toggle word wrap handler
      const wrapBtn = target.closest('.toggle-wrap-btn') as HTMLElement | null;
      if (wrapBtn) {
        const codeBlock = wrapBtn.closest('.code-block');
        if (!codeBlock) return;
        const isWrapped = codeBlock.classList.toggle('code-wrap');
        wrapBtn.setAttribute('title', isWrapped ? '取消折行' : '自动折行');
        wrapBtn.classList.toggle('text-teal-400', isWrapped);
        wrapBtn.classList.toggle('bg-teal-500/10', isWrapped);
        wrapBtn.classList.toggle('border-teal-500/30', isWrapped);
        return;
      }
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return null;
}
