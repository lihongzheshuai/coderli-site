import React from 'react';
import { getAllPosts, getWorkbenchStats, toPostCardMeta } from '@/lib/posts';
import WorkbenchHome from '@/components/WorkbenchHome';

export const revalidate = false; // Static export

export default function HomePage() {
  const posts = getAllPosts();
  const stats = getWorkbenchStats(posts);
  // Keep initial HTML lean (20 slim rows); full 1,027+ index lazy-loads on filter/pagination
  const initialPosts = posts.slice(0, 20).map(toPostCardMeta);

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.coderli.com/#home-collection',
        url: 'https://www.coderli.com/',
        name: 'OneCoder · 全站题解与技术索引',
        description:
          '始于 2012 年的独立技术知识库：涵盖 GESP C++ 1-8级考纲精讲与真题题解、CSP-J/S & NOIP 信奥算法、Java 架构演进与 Python 数据工程实战。',
        inLanguage: 'zh-CN',
        isPartOf: { '@id': 'https://www.coderli.com/#website' },
        mainEntity: { '@id': 'https://www.coderli.com/#latest-list' },
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.coderli.com/#latest-list',
        name: 'OneCoder 最新原创文章与信奥题解',
        numberOfItems: initialPosts.length,
        itemListElement: initialPosts.map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.title,
          url: `https://www.coderli.com/${p.slug}/`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <WorkbenchHome initialPosts={initialPosts} stats={stats} />
    </>
  );
}
