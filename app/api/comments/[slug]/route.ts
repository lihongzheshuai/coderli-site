import { NextRequest, NextResponse } from 'next/server';
import { getPostComments, addPostComment } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const comments = await getPostComments(slug);
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  try {
    const body = await req.json();
    const { author, email, site, content } = body;

    if (!author?.trim() || !email?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '请填写称呼、邮箱与留言内容' }, { status: 400 });
    }

    const newComment = await addPostComment(slug, {
      author: author.trim().slice(0, 50),
      email: email.trim().slice(0, 100),
      site: site?.trim()?.slice(0, 200),
      content: content.trim().slice(0, 2000),
    });

    return NextResponse.json({ comment: newComment });
  } catch {
    return NextResponse.json({ error: '提交失败，请稍后重试' }, { status: 500 });
  }
}
