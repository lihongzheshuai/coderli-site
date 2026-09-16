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
      { error: 'Rate limit: please wait 5 seconds before running another test.' },
      { status: 429 }
    );
  }
  lastCallTimestamp = now;

  const rawKey = (process.env.RESEND_API_KEY || '').trim();
  const hasResend = !!rawKey;
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  const recipient = (
    process.env.COMMENT_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'wushikezuo@gmail.com'
  ).trim();

  const activeProvider = hasResend ? 'resend' : hasSmtp ? 'smtp' : 'none';

  const testSlug = '2024-12-10-gesp-2-exam-syllabus-network';
  const testTitle = '【在线测试】读者留言邮件通知连通性验证';

  const result = await sendCommentNotification({
    slug: testSlug,
    postTitle: testTitle,
    author: 'Vercel 连通性测试员',
    email: 'test-bot@coderli.com',
    site: 'https://www.coderli.com',
    content: '这是一条用于排查 Vercel 与 Resend 发信连通性的线上测试留言。如果您在 Gmail 收到此邮件，说明系统已全线打通！',
  });

  return NextResponse.json({
    ...result,
    diagnostics: {
      activeProvider,
      recipient,
      hasResendApiKey: hasResend,
      resendKeyLength: rawKey.length,
      resendKeyPrefix: hasResend ? `${rawKey.slice(0, 6)}***` : null,
      resendFromConfigured: process.env.RESEND_FROM || '(未配置，系统默认使用 OneCoder <onboarding@resend.dev>)',
      hasSmtpConfig: hasSmtp,
      smtpHost: process.env.SMTP_HOST || null,
      smtpUser: process.env.SMTP_USER || null,
      vercelEnv: process.env.VERCEL_ENV || 'production',
    },
  });
}
