import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getPostComments, addPostComment } from '@/lib/db';
import { getAllPosts } from '@/lib/posts';
import { sendCommentNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15; // Vercel Serverless Function max execution cap

/**
 * Determine the canonical or preview site base URL in Vercel / Production environments
 */
function getSiteBaseUrl(req: NextRequest): string {
  // 1. Explicit production site URL if defined and not localhost
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured.replace(/\/$/, '');
  }

  // 2. Request origin header (browser client origin)
  const origin = req.headers.get('origin');
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin.replace(/\/$/, '');
  }

  // 3. Reverse proxy / forwarded host headers (e.g. Vercel Edge / CDN)
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
  }

  // 4. Vercel system environment variables (automatically injected by Vercel platform)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'https://www.coderli.com';
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const comments = await getPostComments(slug);
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  try {
    const body = await req.json();
    const {
      author,
      email,
      site,
      content,
      postTitle: customPostTitle,
      replyToId,
      replyToAuthor,
      replyToContent,
    } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: '请填写留言内容' }, { status: 400 });
    }

    const commentAuthor = (author?.trim() || '匿名').slice(0, 50);

    const newComment = await addPostComment(slug, {
      author: commentAuthor,
      email: email?.trim()?.slice(0, 100) || '',
      site: site?.trim()?.slice(0, 200) || '',
      content: content.trim().slice(0, 2000),
      replyToId: replyToId ? String(replyToId).slice(0, 64) : undefined,
      replyToAuthor: replyToAuthor ? String(replyToAuthor).trim().slice(0, 50) : undefined,
      replyToContent: replyToContent ? String(replyToContent).trim().slice(0, 500) : undefined,
    });

    // Resolve post title for email notification with multiple fallbacks for Vercel Serverless
    let postTitle = customPostTitle?.trim();

    // Fallback 1: in-memory / postsDirectory cache
    if (!postTitle) {
      try {
        const posts = getAllPosts();
        const post = posts.find(p => p.slug === slug);
        if (post?.title) {
          postTitle = post.title;
        }
      } catch (err) {
        console.warn('[Comment API] Could not retrieve post title from posts cache:', err);
      }
    }

    // Fallback 2: public search-index.json
    if (!postTitle) {
      try {
        const indexPath = path.join(process.cwd(), 'public', 'search-index.json');
        if (fs.existsSync(indexPath)) {
          const searchIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
          const matched = searchIndex.find((p: any) => p.slug === slug || p.id === slug);
          if (matched?.title) {
            postTitle = matched.title;
          }
        }
      } catch {
        // ignore
      }
    }

    const siteUrl = getSiteBaseUrl(req);

    // Send email notification to blog owner (wushikezuo@gmail.com)
    try {
      const emailRes = await sendCommentNotification({
        commentId: newComment.id,
        slug,
        postTitle: postTitle || slug,
        author: newComment.author,
        email: newComment.email,
        site: newComment.site,
        content: newComment.content,
        createdAt: newComment.createdAt,
        siteUrl,
        replyToAuthor: newComment.replyToAuthor,
        replyToContent: newComment.replyToContent,
      });
      if (!emailRes.success) {
        console.warn('[Comment API] Email notification was not sent:', emailRes.error);
      } else {
        console.log('[Comment API] Email notification sent successfully:', emailRes.messageId);
      }
    } catch (emailErr) {
      console.error('[Comment API] Failed sending email notification:', emailErr);
    }

    return NextResponse.json({ comment: newComment });
  } catch (err) {
    console.error('[Comment API] Submit comment error:', err);
    return NextResponse.json({ error: '提交失败，请稍后重试' }, { status: 500 });
  }
}
