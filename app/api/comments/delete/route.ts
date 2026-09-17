import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCommentById, deletePostComment } from '@/lib/db';
import { verifyCommentDeleteToken } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtmlLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - OneCoder 博客管理</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
      --primary: #0d9488;
      --primary-hover: #0f766e;
      --danger: #e11d48;
      --danger-hover: #be123c;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b1120;
        --card: #1e293b;
        --text: #f1f5f9;
        --muted: #94a3b8;
        --border: #334155;
        --primary: #14b8a6;
        --primary-hover: #2dd4bf;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      max-width: 540px;
      width: 100%;
      padding: 32px 28px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
    }
    .badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .badge-teal { background: #ccfbf1; color: #0f766e; }
    .badge-rose { background: #ffe4e6; color: #be123c; }
    .badge-slate { background: #e2e8f0; color: #475569; }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    p.desc {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .info-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 24px;
      font-size: 13px;
      line-height: 1.6;
    }
    .info-item {
      display: flex;
      margin-bottom: 8px;
    }
    .info-item:last-child { margin-bottom: 0; }
    .info-label {
      width: 60px;
      flex-shrink: 0;
      color: var(--muted);
      font-weight: 500;
    }
    .info-value {
      flex: 1;
      color: var(--text);
      word-break: break-word;
    }
    .comment-preview {
      background: rgba(13, 148, 136, 0.05);
      border-left: 3px solid var(--primary);
      padding: 12px 14px;
      border-radius: 0 8px 8px 0;
      margin-top: 10px;
      font-size: 13px;
      color: var(--text);
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 11px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      flex: 1;
      min-width: 140px;
      text-align: center;
    }
    .btn-danger {
      background: var(--danger);
      color: #ffffff;
    }
    .btn-danger:hover {
      background: var(--danger-hover);
      box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
    }
    .btn-secondary {
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: var(--bg);
      color: var(--text);
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 12px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="card">
    ${bodyContent}
    <div class="footer">
      OneCoder 博客系统 · 站长安全管理控制台
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const confirm = searchParams.get('confirm');

  // 1. Validate parameters & token
  if (!id || !token || !verifyCommentDeleteToken(id, token)) {
    const html = renderHtmlLayout(
      '权限验证失败',
      `
      <span class="badge badge-rose">403 拒绝访问</span>
      <h1>⚠️ 安全凭证无效或已过期</h1>
      <p class="desc">
        抱歉，该删除链接的安全签名校验未通过，您无权执行此操作。请确保是从博主接收的邮件中完整复制或打开此链接。
      </p>
      <div class="btn-group">
        <a href="/" class="btn btn-secondary">返回博客首页</a>
      </div>
      `
    );
    return new NextResponse(html, { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 2. Fetch the target comment details
  const comment = await getCommentById(id);

  // If already deleted or not found
  if (!comment) {
    const html = renderHtmlLayout(
      '留言不存在',
      `
      <span class="badge badge-slate">状态提示</span>
      <h1>💬 该留言已被删除或不存在</h1>
      <p class="desc">
        数据库中未找到 ID 为 <code>${escapeHtml(id)}</code> 的留言，该记录可能已经被删除或已被移除。
      </p>
      <div class="btn-group">
        <a href="/" class="btn btn-primary">返回博客首页</a>
      </div>
      `
    );
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const postUrl = `/${comment.slug}#comments`;

  // 3. Direct execution if confirmed (e.g. ?confirm=1)
  if (confirm === '1') {
    await deletePostComment(id);
    try {
      revalidatePath(`/${comment.slug}`);
      revalidatePath('/');
    } catch {
      // ignore
    }

    const html = renderHtmlLayout(
      '删除成功',
      `
      <span class="badge badge-teal">操作成功</span>
      <h1>✅ 留言已成功删除</h1>
      <p class="desc">
        来自读者 <strong>${escapeHtml(comment.author)}</strong> 的留言已从数据库中彻底清除，文章页面缓存已同步刷新。
      </p>
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">文章：</span>
          <span class="info-value"><code>${escapeHtml(comment.slug)}</code></span>
        </div>
        <div class="info-item">
          <span class="info-label">留言者：</span>
          <span class="info-value">${escapeHtml(comment.author)}</span>
        </div>
        <div class="comment-preview">${escapeHtml(comment.content)}</div>
      </div>
      <div class="btn-group">
        <a href="${postUrl}" class="btn btn-primary">返回文章留言区</a>
        <a href="/" class="btn btn-secondary">返回首页</a>
      </div>
      `
    );
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 4. Default: Show single-tap confirmation card to protect against email link crawler prefetching
  const html = renderHtmlLayout(
    '确认删除留言',
    `
    <span class="badge badge-rose">管理员确认</span>
    <h1>🗑️ 确认要删除此条留言吗？</h1>
    <p class="desc">
      您正在通过邮件专属管理通道申请删除文章下的一条留言。请核对以下信息，确认后将永久从数据库中移除。
    </p>
    <div class="info-box">
      <div class="info-item">
        <span class="info-label">所属文章：</span>
        <span class="info-value"><a href="${postUrl}" target="_blank" style="color: var(--primary); text-decoration: none;">/${escapeHtml(comment.slug)}</a></span>
      </div>
      <div class="info-item">
        <span class="info-label">留言读者：</span>
        <span class="info-value"><strong>${escapeHtml(comment.author)}</strong> ${comment.email ? `(${escapeHtml(comment.email)})` : ''}</span>
      </div>
      <div class="info-item">
        <span class="info-label">发表时间：</span>
        <span class="info-value">${escapeHtml(new Date(comment.createdAt).toLocaleString('zh-CN'))}</span>
      </div>
      <div class="comment-preview">${escapeHtml(comment.content)}</div>
    </div>
    <form method="POST" action="/api/comments/delete">
      <input type="hidden" name="id" value="${escapeHtml(id)}" />
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <div class="btn-group">
        <button type="submit" class="btn btn-danger">确认永久删除</button>
        <a href="${postUrl}" class="btn btn-secondary">取消并返回文章</a>
      </div>
    </form>
    `
  );

  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function POST(req: NextRequest) {
  let id: string | null = null;
  let token: string | null = null;

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await req.json();
      id = body?.id;
      token = body?.token;
    } catch {
      // ignore
    }
  } else if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    try {
      const formData = await req.formData();
      id = formData.get('id') as string | null;
      token = formData.get('token') as string | null;
    } catch {
      // ignore
    }
  }

  // Fallback to query parameters
  if (!id) id = req.nextUrl.searchParams.get('id');
  if (!token) token = req.nextUrl.searchParams.get('token');

  // Verify token
  if (!id || !token || !verifyCommentDeleteToken(id, token)) {
    if (contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid delete token' }, { status: 403 });
    }
    const html = renderHtmlLayout(
      '权限验证失败',
      `
      <span class="badge badge-rose">403 拒绝访问</span>
      <h1>⚠️ 安全凭证无效或已过期</h1>
      <p class="desc">抱歉，该删除请求的校验签名无效或不匹配。</p>
      <div class="btn-group"><a href="/" class="btn btn-secondary">返回博客首页</a></div>
      `
    );
    return new NextResponse(html, { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const result = await deletePostComment(id);

  if (result.comment?.slug) {
    try {
      revalidatePath(`/${result.comment.slug}`);
      revalidatePath('/');
    } catch {
      // ignore
    }
  }

  if (contentType.includes('application/json')) {
    return NextResponse.json({
      success: true,
      message: result.success ? 'Comment deleted successfully' : 'Comment already deleted or not found',
      id,
    });
  }

  const postUrl = result.comment ? `/${result.comment.slug}#comments` : '/';

  const html = renderHtmlLayout(
    '删除成功',
    `
    <span class="badge badge-teal">操作成功</span>
    <h1>✅ 留言已成功删除</h1>
    <p class="desc">
      该留言已从数据库中彻底清除，文章页面与首页缓存已同步刷新。
    </p>
    <div class="btn-group">
      <a href="${postUrl}" class="btn btn-primary">返回文章留言区</a>
      <a href="/" class="btn btn-secondary">返回博客首页</a>
    </div>
    `
  );

  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
