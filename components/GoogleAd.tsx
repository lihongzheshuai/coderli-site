'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string;
  responsive?: boolean;
  minHeight?: number;
  className?: string;
  label?: string;
}

export default function GoogleAd({
  slot,
  format = 'auto',
  layoutKey,
  responsive = true,
  minHeight = 100,
  className = '',
  label = 'Google AdSense',
}: GoogleAdProps) {
  const pathname = usePathname();
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      }
    } catch {
      // Ignore Adsbygoogle duplicate push errors on SPA navigation
    }
  }, [pathname, slot]);

  return (
    <div
      className={`my-6 text-center overflow-hidden border border-dashed border-slate-700/60 dark:border-slate-800 rounded-lg p-3 bg-slate-100/50 dark:bg-slate-900/40 transition-colors ${className}`}
      style={{ minHeight: `${minHeight}px` }}
    >
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2 px-1">
        <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
          {label}
        </span>
        <span className="opacity-70">Slot: {slot}</span>
      </div>

      <ins
        key={`${pathname}-${slot}`}
        ref={adRef}
        className="adsbygoogle block"
        data-ad-client="ca-pub-7615326632728696"
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
