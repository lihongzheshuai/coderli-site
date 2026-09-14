'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount as external scripts automatically track the initial page load
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (!pathname) return;

    // Track Baidu Tongji SPA page navigation
    if (typeof window !== 'undefined' && (window as any)._hmt) {
      (window as any)._hmt.push(['_trackPageview', pathname]);
    }

    // Track Google Analytics (GA4) SPA page navigation
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('config', 'G-5L9P03RR0R', {
        page_path: pathname,
      });
    }
  }, [pathname]);

  return null;
}
