import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/posts';
import { seedPostViews } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  // Authorization check
  const expectedSecret = process.env.REVALIDATE_SECRET || 'onecoder-secret-2026';
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = getAllPosts();
  const seedItems = posts.map(p => {
    // Generate random view count between 150 and 200
    const views = Math.floor(Math.random() * (200 - 150 + 1)) + 150;
    return { slug: p.slug, views };
  });

  const result = await seedPostViews(seedItems);

  return NextResponse.json({
    success: true,
    seededArticles: result.count,
    totalViewsSeeded: result.totalViews,
    sample: seedItems.slice(0, 5),
    timestamp: new Date().toISOString(),
  });
}
