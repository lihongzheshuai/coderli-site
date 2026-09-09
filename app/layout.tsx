import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import CopyCodeHandler from '@/components/CopyCodeHandler';

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
  return (
    <html lang="zh-CN" className="dark scroll-smooth">
      <head>
        {/* Google AdSense Global Client Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7615326632728696"
          crossOrigin="anonymous"
        />
        {/* Google Verification */}
        <meta name="google-site-verification" content="EQxpnRQ0t7ULCtknIN_oBRlo8FXtZsL-OaiUcI50_wU" />
      </head>
      <body className="min-h-screen flex flex-col font-sans selection:bg-teal-500 selection:text-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SearchModal />
        <CopyCodeHandler />
      </body>
    </html>
  );
}
