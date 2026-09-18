import { NextRequest, NextResponse } from 'next/server';
import { sendCommentNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

let lastCallTimestamp = 0;

export async function GET(req: NextRequest) {
  // Simple rate limiting to prevent spamming: 1 request per 5 seconds
  const now = Date.now();
  if (now - lastCallTimestamp < 5000) {
    return NextResponse.json(
      { ok: false, message: 'Too many requests' },
      { status: 429 }
    );
  }
  lastCallTimestamp = now;

  try {
    const result = await sendCommentNotification({
      slug: 'connectivity-test',
      postTitle: '邮件服务连通性验证',
      author: '服务连通性检测',
      email: 'test@coderli.com',
      content: '这是一条用于验证邮件服务连通性的测试消息。',
    });

    if (result.success) {
      return NextResponse.json({
        ok: true,
        status: 'connected',
      });
    }

    // 详细错误仅在服务端记录日志，避免向外泄露系统和第三方凭证细节
    console.error('[test-email] Mail delivery failed:', result.error);
    return NextResponse.json(
      { ok: false, status: 'unavailable' },
      { status: 502 }
    );
  } catch (err) {
    console.error('[test-email] Unexpected error during connectivity test:', err);
    return NextResponse.json(
      { ok: false, status: 'error' },
      { status: 500 }
    );
  }
}

