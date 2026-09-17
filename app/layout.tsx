import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import CopyCodeHandler from '@/components/CopyCodeHandler';
import AnalyticsTracker from '@/components/AnalyticsTracker';

import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'OneCoder · 一个中年人的自留地',
  description:
    '记录学习Java、Python、C++、GESP/NOI算法以及架构的心得体会。本站唯一网址：https://www.coderli.com',
  keywords: ['C++', 'GESP', 'NOI', 'Java', 'Python', '算法', '架构', 'Spring', 'Netty', 'PostgreSQL'],
  authors: [{ name: 'OneCoder', url: 'https://www.coderli.com' }],
  metadataBase: new URL('https://www.coderli.com'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const posts = getAllPosts();
  const postCount = posts.length;

  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        {/* Dark mode restoration script: default to Light theme unless 'dark' is saved */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* Google AdSense Global Client Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7615326632728696"
          crossOrigin="anonymous"
        />
        {/* Google Verification */}
        <meta name="google-site-verification" content="EQxpnRQ0t7ULCtknIN_oBRlo8FXtZsL-OaiUcI50_wU" />

        {/* Google Analytics (GA4) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-5L9P03RR0R"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-5L9P03RR0R');
            `,
          }}
        />

        {/* 百度统计 (Baidu Tongji) */}
        <Script
          id="baidu-tongji"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?c38895d905174718ae7d95e42ce528c7";
                var s = document.getElementsByTagName("script")[0]; 
                s.parentNode.insertBefore(hm, s);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans selection:bg-teal-500 selection:text-white">
        <AnalyticsTracker />
        <Header postCount={postCount} />
        <main className="flex-1">{children}</main>
        <Footer />
        <SearchModal />
        <CopyCodeHandler />
        <Analytics />
      </body>
    </html>
  );
}
