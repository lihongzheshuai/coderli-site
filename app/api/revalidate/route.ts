import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { clearPostCache, getAllPosts } from '@/lib/posts';

async function handleRevalidate(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const slug = req.nextUrl.searchParams.get('slug');

  const expectedSecret = process.env.REVALIDATE_SECRET || 'onecoder-secret-token';

  if (secret !== expectedSecret) {
    return NextResponse.json({ message: 'Invalid revalidation token' }, { status: 401 });
  }

  try {
    // 1. Clear in-memory post cache so fresh files are parsed
    clearPostCache();

    // 2. Revalidate specific post page if provided
    if (slug) {
      revalidatePath(`/${slug}`);
    }

    // 3. Revalidate Homepage (vital for updating total post count and latest stream)
    revalidatePath('/');

    // 4. Revalidate main taxonomy hubs
    revalidatePath('/categories');
    revalidatePath('/tags');

    const totalPosts = getAllPosts().length;

    return NextResponse.json({
      revalidated: true,
      slug: slug || 'all',
      totalPosts,
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'Error revalidating', error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleRevalidate(req);
}

export async function GET(req: NextRequest) {
  return handleRevalidate(req);
}
