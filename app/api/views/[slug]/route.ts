import { NextRequest, NextResponse } from 'next/server';
import { getPostViews, incrementPostViews } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const views = await getPostViews(slug);
  return NextResponse.json({ views });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const cookieName = `viewed_${slug}`;
  const hasViewed = req.cookies.get(cookieName);

  // If viewed within 2 hours, return current count without incrementing
  if (hasViewed) {
    const current = await getPostViews(slug);
    return NextResponse.json({ views: current });
  }

  // Increment view in DB
  const views = await incrementPostViews(slug);

  const res = NextResponse.json({ views });
  // Set 2 hours dedup cookie
  res.cookies.set(cookieName, 'true', {
    maxAge: 7200,
    httpOnly: true,
    sameSite: 'lax',
  });

  return res;
}
