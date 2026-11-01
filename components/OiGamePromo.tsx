import React from 'react';

interface OiGamePromoProps {
  variant: 'sidebar' | 'banner';
}

export default function OiGamePromo({ variant }: OiGamePromoProps) {
  const targetUrl = 'https://oi.coderli.com/?utm_source=coderli_blog';

  if (variant === 'sidebar') {
    return (
      <div className="rounded-2xl overflow-hidden border border-cyan-500/30 dark:border-cyan-500/40 bg-slate-950 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-400 transition duration-300 group">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative"
          title="前往 OneCoder 信奥闯关平台 (oi.coderli.com)"
        >
          <img
            src="/images/onecoder/oi-quest-sidebar.png"
            alt="OneCoder C++ 信奥远征闯关平台 · GESP 1-8级与CSP真题互动闯关"
            className="w-full h-auto block group-hover:scale-[1.02] transition duration-300"
          />
        </a>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-2xl overflow-hidden border border-cyan-500/30 dark:border-cyan-500/40 bg-slate-950 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-400 transition duration-300 group">
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
        title="立即前往 OneCoder 信奥远征闯关平台 (oi.coderli.com) 刷题闯关"
      >
        <img
          src="/images/onecoder/oi-quest-banner.png"
          alt="看完题解去实战！OneCoder C++ 信奥远征闯关平台 (oi.coderli.com)"
          className="w-full h-auto block group-hover:scale-[1.01] transition duration-300"
        />
      </a>
    </div>
  );
}
