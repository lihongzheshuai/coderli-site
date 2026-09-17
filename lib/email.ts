import nodemailer from 'nodemailer';
import { generateCommentDeleteToken } from './admin';

export interface CommentNotificationData {
  commentId?: string;
  slug: string;
  postTitle?: string;
  author: string;
  email?: string;
  site?: string;
  content: string;
  createdAt?: string;
  siteUrl?: string;
  replyToAuthor?: string;
  replyToContent?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCSTDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  return d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Generate a responsive and polished HTML email template
 */
function buildHtmlTemplate({
  postTitle,
  postUrl,
  author,
  email,
  site,
  content,
  formattedTime,
  replyToAuthor,
  replyToContent,
  deleteUrl,
}: {
  postTitle: string;
  postUrl: string;
  author: string;
  email?: string;
  site?: string;
  content: string;
  formattedTime: string;
  replyToAuthor?: string;
  replyToContent?: string;
  deleteUrl?: string;
}): string {
  const safeAuthor = escapeHtml(author);
  const safeTitle = escapeHtml(postTitle);
  const safeContent = escapeHtml(content).replace(/\n/g, '<br/>');
  const safeEmail = email ? escapeHtml(email) : '';
  const safeSite = site ? escapeHtml(site) : '';
  const safeReplyAuthor = replyToAuthor ? escapeHtml(replyToAuthor) : '';
  const safeReplyContent = replyToContent ? escapeHtml(replyToContent).replace(/\n/g, '<br/>') : '';

  const isReply = !!safeReplyAuthor;
  const headerTitle = isReply ? '💬 OneCoder 博客 · 读者回复通知' : '💬 OneCoder 博客 · 读者留言通知';
  const headerSubtitle = isReply
    ? `读者 <strong>${safeAuthor}</strong> 回复了 <strong>@${safeReplyAuthor}</strong> 的讨论`
    : `您的博客收到了一条新读者留言，请及时查阅与交流。`;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="620" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 26px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: 700; letter-spacing: 0.5px;">
                ${headerTitle}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #ccfbf1;">
                ${headerSubtitle}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 32px;">
              
              <!-- Article Info Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-left: 4px solid #0d9488; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
                      文章来源
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                      <a href="${postUrl}" target="_blank" style="color: #0f766e; text-decoration: none;">
                        《${safeTitle}》
                      </a>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 6px; word-break: break-all;">
                      链接：<a href="${postUrl}" target="_blank" style="color: #0d9488; text-decoration: underline;">${postUrl}</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Commenter Info -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <strong style="font-size: 14px; color: #1e293b;">${isReply ? '回复者信息：' : '留言者信息：'}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #475569; line-height: 1.8;">
                    • <strong>昵称：</strong> ${safeAuthor} ${isReply ? `<span style="color: #0d9488; font-weight: 600;">(回复 @${safeReplyAuthor})</span>` : ''}<br/>
                    ${safeEmail ? `• <strong>邮箱：</strong> <a href="mailto:${safeEmail}" style="color: #0f766e; text-decoration: none;">${safeEmail}</a><br/>` : '• <strong>邮箱：</strong> <span style="color: #94a3b8;">（未填写）</span><br/>'}
                    ${safeSite ? `• <strong>个人主页：</strong> <a href="${safeSite}" target="_blank" style="color: #0f766e; text-decoration: none;">${safeSite}</a><br/>` : ''}
                    • <strong>提交时间：</strong> ${formattedTime} (北京时间)
                  </td>
                </tr>
              </table>

              ${isReply ? `
              <!-- Quoted Parent Comment -->
              <div style="background-color: #f1f5f9; border-left: 3px solid #0d9488; border-radius: 6px; padding: 12px 14px; margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px;">
                  💬 引用的原留言 (@${safeReplyAuthor})：
                </div>
                <div style="font-size: 13px; color: #475569; line-height: 1.6; font-style: italic;">
                  “${safeReplyContent}”
                </div>
              </div>
              ` : ''}

              <!-- Comment Body Box -->
              <div style="margin-bottom: 28px;">
                <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">
                  ${isReply ? '回复内容：' : '留言详情内容：'}
                </div>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 18px; font-size: 14px; color: #1e293b; line-height: 1.7; word-break: break-word;">
                  ${safeContent}
                </div>
              </div>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <a href="${postUrl}" target="_blank" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(13, 148, 136, 0.25);">
                      👉 前往文章查看并回复
                    </a>
                  </td>
                </tr>
              </table>

              ${safeEmail ? `
              <div style="text-align: center; margin-top: 10px;">
                <a href="mailto:${safeEmail}?subject=Re:%20${encodeURIComponent('关于《' + postTitle + '》的留言回复')}" style="font-size: 12px; color: #64748b; text-decoration: underline;">
                  或者直接通过邮件回复该读者 (${safeEmail})
                </a>
              </div>
              ` : ''}

              ${deleteUrl ? `
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #e2e8f0; text-align: center;">
                <span style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 8px;">站长专属快捷管理通道</span>
                <a href="${deleteUrl}" target="_blank" style="display: inline-block; background-color: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; text-decoration: none; font-size: 12px; font-weight: 600; padding: 7px 16px; border-radius: 6px;">
                  🗑️ 一键删除此留言 (仅管理员可见)
                </a>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              本邮件由 <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.coderli.com'}" target="_blank" style="color: #64748b; text-decoration: none; font-weight: 500;">OneCoder 博客系统 (coderli.com)</a> 自动发送<br/>
              接收邮箱：${process.env.COMMENT_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'wushikezuo@gmail.com'}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email content as fallback
 */
function buildPlainText({
  postTitle,
  postUrl,
  author,
  email,
  site,
  content,
  formattedTime,
  replyToAuthor,
  replyToContent,
  deleteUrl,
}: {
  postTitle: string;
  postUrl: string;
  author: string;
  email?: string;
  site?: string;
  content: string;
  formattedTime: string;
  replyToAuthor?: string;
  replyToContent?: string;
  deleteUrl?: string;
}): string {
  const isReply = !!replyToAuthor;
  return `
【OneCoder 博客】${isReply ? `收到来自 ${author} 的新回复！` : '收到新读者留言！'}

文章标题：《${postTitle}》
文章地址：${postUrl}

--- 留言者信息 ---
昵称：${author} ${isReply ? `(回复 @${replyToAuthor})` : ''}
邮箱：${email || '（未填写）'}
主页：${site || '（未填写）'}
时间：${formattedTime} (北京时间)
${isReply ? `\n--- 引用原留言 (@${replyToAuthor}) ---\n“${replyToContent}”\n` : ''}
--- ${isReply ? '回复内容' : '留言内容'} ---
${content}

------------------
您可以访问以下链接查看与回复留言：
${postUrl}
${deleteUrl ? `\n------------------\n站长专属管理操作：\n如需一键删除此条留言，请点击以下管理链接：\n${deleteUrl}\n` : ''}
`.trim();
}

/**
 * Send comment notification email to admin (default: wushikezuo@gmail.com)
 */
export async function sendCommentNotification(data: CommentNotificationData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  let recipient = (
    process.env.COMMENT_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'wushikezuo@gmail.com'
  ).trim();

  // Auto-correct common typo in env var
  if (recipient.toLowerCase() === 'shikezuo@gmail.com') {
    recipient = 'wushikezuo@gmail.com';
  }

  const siteUrl = (
    data.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    'https://www.coderli.com'
  ).replace(/\/$/, '');

  const postUrl = `${siteUrl}/${data.slug}/#comments`;
  const postTitle = data.postTitle || data.slug;
  const formattedTime = formatCSTDate(data.createdAt);

  let deleteUrl: string | undefined;
  if (data.commentId) {
    try {
      const token = generateCommentDeleteToken(data.commentId);
      deleteUrl = `${siteUrl}/api/comments/delete?id=${encodeURIComponent(data.commentId)}&token=${token}`;
    } catch (tokenErr) {
      console.warn('[Email Notification] Failed generating comment delete token:', tokenErr);
    }
  }

  const subject = data.replyToAuthor
    ? `【OneCoder 博客】新回复提醒：《${postTitle}》 - ${data.author} 回复了 @${data.replyToAuthor}`
    : `【OneCoder 博客】新留言提醒：《${postTitle}》 - 来自 ${data.author}`;

  const html = buildHtmlTemplate({
    postTitle,
    postUrl,
    author: data.author,
    email: data.email,
    site: data.site,
    content: data.content,
    formattedTime,
    replyToAuthor: data.replyToAuthor,
    replyToContent: data.replyToContent,
    deleteUrl,
  });
  const text = buildPlainText({
    postTitle,
    postUrl,
    author: data.author,
    email: data.email,
    site: data.site,
    content: data.content,
    formattedTime,
    replyToAuthor: data.replyToAuthor,
    replyToContent: data.replyToContent,
    deleteUrl,
  });

  // 1. Resend API (Recommended on Vercel Serverless: HTTP REST, no TCP port blocking, instant delivery)
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      let resendFrom = (process.env.RESEND_FROM || '').trim();

      // Ensure valid "Name <email@domain.com>" or "email@domain.com" format required by Resend
      if (!resendFrom) {
        resendFrom = 'OneCoder Blog <onboarding@resend.dev>';
      } else if (!resendFrom.includes('@')) {
        // If user only configured a display name like "OneCoder Blog", append the official Resend test address
        resendFrom = `${resendFrom} <onboarding@resend.dev>`;
      } else if (
        resendFrom.includes('@gmail.com') ||
        resendFrom.includes('@qq.com') ||
        resendFrom.includes('@163.com') ||
        resendFrom.includes('@126.com') ||
        resendFrom.includes('@hotmail.com') ||
        resendFrom.includes('@outlook.com')
      ) {
        resendFrom = 'OneCoder Blog <onboarding@resend.dev>';
      }

      // Only pass reply_to if it is a syntactically valid email to avoid Resend 422 errors
      const isValidEmail = (em?: string) => !!(em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim()));
      const replyTo = isValidEmail(data.email) ? data.email!.trim() : undefined;

      const payload: Record<string, any> = {
        from: resendFrom,
        to: [recipient],
        subject,
        html,
        text,
      };
      if (replyTo) {
        payload.reply_to = replyTo;
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = resData?.message || JSON.stringify(resData);
        console.error(`[Email Notification] Resend API error (${res.status}):`, errMsg);
        return {
          success: false,
          error: `Resend API (${res.status}): ${errMsg}`,
        };
      }

      console.log('[Email Notification] Sent via Resend successfully to:', recipient, 'id:', resData.id);
      return { success: true, messageId: resData.id };
    } catch (err: any) {
      console.error('[Email Notification] Failed to send via Resend:', err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  // 2. SendGrid REST API (Alternative HTTP provider on Vercel)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sendGridFrom = process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'OneCoder Blog <noreply@coderli.com>';
      const match = sendGridFrom.match(/(?:.*<)?([^>]+)>?/);
      const fromEmail = match ? match[1].trim() : sendGridFrom;

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: fromEmail },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
          reply_to: data.email ? { email: data.email } : undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[Email Notification] SendGrid API error:', errText);
        return { success: false, error: errText };
      }

      console.log('[Email Notification] Sent via SendGrid successfully to:', recipient);
      return { success: true };
    } catch (err: any) {
      console.error('[Email Notification] Failed to send via SendGrid:', err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  // 3. SMTP Transport via Nodemailer (Works on Vercel Node.js runtime & local servers)
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(
      `[Email Notification] Email service not configured (SMTP / RESEND_API_KEY / SENDGRID_API_KEY). ` +
        `Email notification to ${recipient} was skipped. ` +
        `Please set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in Vercel Environment Variables.`
    );
    return {
      success: false,
      error: 'SMTP or HTTP mail credentials not configured in environment variables',
    };
  }

  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
  const smtpFrom = process.env.SMTP_FROM || `"OneCoder 博客" <${smtpUser}>`;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: recipient,
      subject,
      text,
      html,
      replyTo: data.email || undefined,
    });

    console.log(`[Email Notification] Email sent successfully to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('[Email Notification] Failed to send email via SMTP:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}
