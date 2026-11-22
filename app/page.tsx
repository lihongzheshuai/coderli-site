import React from 'react';
import { getAllPosts, getWorkbenchStats, toPostCardMeta } from '@/lib/posts';
import WorkbenchHome from '@/components/WorkbenchHome';

export const revalidate = false; // Static export

export default function HomePage() {
  const posts = getAllPosts();
  const stats = getWorkbenchStats(posts);
  // Keep initial HTML lean (20 slim rows); full 1,027+ index lazy-loads on filter/pagination
  const initialPosts = posts.slice(0, 20).map(toPostCardMeta);

  return <WorkbenchHome initialPosts={initialPosts} stats={stats} />;
}
