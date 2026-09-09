import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const slug = req.nextUrl.searchParams.get('slug');

  const expectedSecret = process.env.REVALIDATE_SECRET || 'onecoder-secret-token';

  if (secret !== expectedSecret) {
    return NextResponse.json({ message: 'Invalid revalidation token' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ message: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    // Revalidate the specific post and the homepage
    revalidatePath(`/${slug}`);
    revalidatePath('/');
    return NextResponse.json({ revalidated: true, slug, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ message: 'Error revalidating', error: err?.message }, { status: 500 });
  }
}
