import { NextRequest, NextResponse } from 'next/server';
import { getPostViews, incrementPostViews } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const views = await getPostViews(slug);
  return NextResponse.json({ views });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const cookieName = `viewed_${slug}`;
  const hasViewed = req.cookies.get(cookieName);

  // Short 30-second anti-flood protection (prevents double-clicks, while ensuring page visits increment +1)
  if (hasViewed) {
    const current = await getPostViews(slug);
    return NextResponse.json({ views: current });
  }

  // Atomically increment view count in DB
  const views = await incrementPostViews(slug);

  const res = NextResponse.json({ views });
  res.cookies.set(cookieName, 'true', {
    maxAge: 30, // 30s anti-flood window
    httpOnly: true,
    sameSite: 'lax',
  });

  return res;
}
