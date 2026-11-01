import React from 'react';

interface OiGamePromoProps {
  variant: 'sidebar' | 'banner';
}

export default function OiGamePromo({ variant }: OiGamePromoProps) {
  const targetUrl = 'https://oi.coderli.com/?utm_source=coderli_blog';

  if (variant === 'sidebar') {
    return (
      <div className="rounded-2xl overflow-hidden border border-teal-500/30 dark:border-cyan-500/40 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md dark:shadow-lg dark:hover:shadow-cyan-500/20 hover:border-teal-500 dark:hover:border-cyan-400 transition duration-300 group">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative"
          title="前往 OneCoder 信奥闯关平台 (oi.coderli.com)"
        >
          {/* 亮色模式自动显示亮色海报 */}
          <img
            src="/images/onecoder/oi-quest-sidebar-light.webp"
            alt="OneCoder C++ 信奥远征闯关平台 · GESP 1-8级与CSP真题互动闯关"
            loading="lazy"
            className="w-full h-auto block dark:hidden group-hover:scale-[1.02] transition duration-300"
          />
          {/* 暗色模式自动显示暗色海报 */}
          <img
            src="/images/onecoder/oi-quest-sidebar-dark.webp"
            alt="OneCoder C++ 信奥远征闯关平台 · GESP 1-8级与CSP真题互动闯关"
            loading="lazy"
            className="w-full h-auto hidden dark:block group-hover:scale-[1.02] transition duration-300"
          />
        </a>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-2xl overflow-hidden border border-teal-500/30 dark:border-cyan-500/40 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md dark:shadow-lg dark:hover:shadow-cyan-500/20 hover:border-teal-500 dark:hover:border-cyan-400 transition duration-300 group">
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
        title="立即前往 OneCoder 信奥远征闯关平台 (oi.coderli.com) 刷题闯关"
      >
        {/* 亮色模式自动显示亮色横幅 */}
        <img
          src="/images/onecoder/oi-quest-banner-light.webp"
          alt="看完题解去实战！OneCoder C++ 信奥远征闯关平台 (oi.coderli.com)"
          loading="lazy"
          className="w-full h-auto block dark:hidden group-hover:scale-[1.01] transition duration-300"
        />
        {/* 暗色模式自动显示暗色横幅 */}
        <img
          src="/images/onecoder/oi-quest-banner-dark.webp"
          alt="看完题解去实战！OneCoder C++ 信奥远征闯关平台 (oi.coderli.com)"
          loading="lazy"
          className="w-full h-auto hidden dark:block group-hover:scale-[1.01] transition duration-300"
        />
      </a>
    </div>
  );
}
