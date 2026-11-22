import React from 'react';
import { Zap, ArrowUpRight } from 'lucide-react';

interface OiGamePromoProps {
  variant: 'sidebar' | 'banner' | 'compact';
  contextLabel?: string;
}

export default function OiGamePromo({ variant, contextLabel }: OiGamePromoProps) {
  const targetUrl = 'https://oi.coderli.com/?utm_source=coderli_blog';

  if (variant === 'compact') {
    return (
      <div className="wb-card p-3">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.04em] text-[var(--brand)] mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span>OI-GAME 配套演练</span>
        </div>
        <p className="text-[11.5px] text-[var(--ink-muted)] leading-relaxed mb-2">
          GESP 1~8 级 240 关、全真模考与六维能力雷达。
        </p>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--ink-primary)] hover:text-[var(--brand)] transition-colors"
        >
          <span>前往 oi.coderli.com</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        className="rounded-[8px] p-3.5"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          boxShadow: '0 0 0 1px var(--border-hairline)',
        }}
      >
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-primary)] mb-1">
          <Zap className="w-3.5 h-3.5 text-[var(--brand)]" />
          <span>配套实战闯关</span>
        </div>
        <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed mb-3">
          {contextLabel
            ? `在 OI-Game 挑战 ${contextLabel} 对应关卡与模考，即学即测。`
            : '在 OI-Game 挑战 GESP 1~8 级 240 关与全真模考，检验掌握度。'}
        </p>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 w-full py-1.5 px-2.5 rounded-[6px] text-[12px] font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--brand-surface)',
            color: 'var(--brand)',
            boxShadow: 'inset 0 0 0 1px var(--brand-border)',
          }}
        >
          <span>进入信奥闯关</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div
      className="my-7 rounded-[8px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{
        backgroundColor: 'var(--brand-surface)',
        boxShadow: 'inset 0 0 0 1px var(--brand-border)',
      }}
    >
      <div className="min-w-0">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--brand)] mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span>OneCoder 信奥远征平台 · oi.coderli.com</span>
        </div>
        <h3 className="text-[15px] font-semibold text-[var(--ink-primary)] mb-1">
          看完题解，马上用 240 关实战检验掌握度
        </h3>
        <p className="text-[12.5px] text-[var(--ink-secondary)] leading-relaxed">
          覆盖 GESP 1~8 级考纲心法、CSP-J 双栏阅读程序、错题动态变式推演与 90/120 分钟全真模考。
        </p>
      </div>
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-[12.5px] font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
        style={{
          backgroundColor: 'var(--brand)',
          color: 'var(--brand-cta-text)',
        }}
      >
        <span>立即闯关</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
