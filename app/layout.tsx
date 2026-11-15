import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import CopyCodeHandler from '@/components/CopyCodeHandler';
import AnalyticsTracker from '@/components/AnalyticsTracker';

import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'OneCoder · C++ GESP/CSP信奥题解与Java后端架构知识库',
  description:
    'OneCoder（李宏哲）独立技术知识库，始于2012年。系统沉淀 C++ GESP 1-8级考纲考点精讲与历年真题题解、CSP-J/S 与 NOIP 信奥算法推导、Java 服务端架构与 Python 数据工程实战。唯一官方网址：https://www.coderli.com',
  keywords: [
    'OneCoder',
    'GESP',
    'GESP考级',
    'GESP真题题解',
    'CSP-J',
    'CSP-S',
    'NOIP',
    '信奥C++',
    'C++算法',
    'Java架构',
    'Spring',
    'Netty',
    'Python',
  ],
  authors: [{ name: 'OneCoder', url: 'https://www.coderli.com' }],
  creator: 'OneCoder',
  publisher: 'OneCoder',
  metadataBase: new URL('https://www.coderli.com'),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': 'https://www.coderli.com/rss.xml',
    },
  },
  openGraph: {
    title: 'OneCoder · C++ GESP/CSP信奥题解与Java后端架构知识库',
    description:
      '始于2012年的独立技术知识库：涵盖 GESP 1-8级考纲精讲与真题题解、CSP-J/S & NOIP 信奥算法、Java 架构与 Python 工程实战。',
    url: 'https://www.coderli.com/',
    siteName: 'OneCoder',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/images/gesp_csp_default_cover.png',
        width: 1200,
        height: 630,
        alt: 'OneCoder 技术与信奥算法知识库',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneCoder · C++ GESP/CSP信奥题解与Java后端架构知识库',
    description:
      '始于2012年的独立技术知识库：涵盖 GESP 1-8级考纲精讲与真题题解、CSP-J/S & NOIP 信奥算法、Java 架构与 Python 工程实战。',
    images: ['/images/gesp_csp_default_cover.png'],
  },
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
        <link rel="alternate" type="text/plain" title="LLMs Index" href="https://www.coderli.com/llms.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.coderli.com/#website',
                  url: 'https://www.coderli.com/',
                  name: 'OneCoder',
                  alternateName: ['OneCoder 技术博客', 'coderli.com'],
                  description:
                    '始于2012年的独立技术知识库，专注 C++ GESP 1-8级考纲与真题解析、CSP-J/S 与 NOIP 信奥算法、Java 架构演进与 Python 数据工程。',
                  inLanguage: 'zh-CN',
                  publisher: { '@id': 'https://www.coderli.com/#author' },
                },
                {
                  '@type': 'Person',
                  '@id': 'https://www.coderli.com/#author',
                  name: 'OneCoder',
                  url: 'https://www.coderli.com/',
                  image: 'https://www.coderli.com/images/onecoder/avatar.png',
                  sameAs: [
                    'https://github.com/lihongzheshuai',
                    'https://github.com/lihongzheshuai/yummy-code',
                    'https://twitter.com/wushikezuohehe',
                    'https://wiki.coderli.com/',
                    'https://oi.coderli.com/',
                  ],
                },
              ],
            }),
          }}
        />

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
        <SpeedInsights />
      </body>
    </html>
  );
}
