import { NextRequest, NextResponse } from 'next/server';
import { sendCommentNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.REVALIDATE_SECRET;

  // Protect test endpoint in production unless correct secret is supplied
  if (process.env.NODE_ENV === 'production' && (!expectedSecret || secret !== expectedSecret)) {
    return NextResponse.json(
      {
        error: 'Unauthorized: invalid or missing secret query param (?secret=YOUR_TOKEN)',
      },
      { status: 401 }
    );
  }

  const recipient =
    process.env.COMMENT_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'wushikezuo@gmail.com';

  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  const activeProvider = hasResend ? 'resend' : hasSmtp ? 'smtp' : 'none';

  const testSlug = '2024-12-10-gesp-2-exam-syllabus-network';
  const testTitle = 'GESP C++ 2级考试大纲知识点：计算机网络基础 (测试文章)';

  const result = await sendCommentNotification({
    slug: testSlug,
    postTitle: testTitle,
    author: '测试读者 (Vercel Test)',
    email: 'test-reader@example.com',
    site: 'https://www.coderli.com',
    content: '这是一条来自 Vercel 线上环境的自动测试留言。如果您收到了这封邮件，说明邮件通知系统已完全配置成功！',
  });

  return NextResponse.json({
    ...result,
    diagnostics: {
      activeProvider,
      recipient,
      hasResendApiKey: hasResend,
      resendKeyPrefix: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 6)}***` : null,
      resendFrom: process.env.RESEND_FROM || 'OneCoder <onboarding@resend.dev>',
      hasSmtpConfig: hasSmtp,
      smtpHost: process.env.SMTP_HOST || null,
      smtpUser: process.env.SMTP_USER || null,
    },
  });
}
