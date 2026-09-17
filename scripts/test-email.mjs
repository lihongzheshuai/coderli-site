#!/usr/bin/env node

/**
 * 邮件通知功能测试脚本
 * 用于测试 SMTP 或 Resend 邮件发送是否配置成功
 *
 * 运行方式:
 *   node scripts/test-email.mjs
 */

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// 简单加载 .env.local 或 .env 环境变量
function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      console.log(`[Config] 已加载环境变量配置文件: ${path.basename(p)}`);
      break;
    }
  }
}

loadEnv();

const recipient =
  process.env.COMMENT_NOTIFICATION_EMAIL ||
  process.env.ADMIN_EMAIL ||
  'wushikezuo@gmail.com';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.coderli.com').replace(/\/$/, '');
const testSlug = '2024-12-10-gesp-2-exam-syllabus-network';
const testTitle = 'GESP C++ 2级考试大纲知识点：计算机网络基础';
const testPostUrl = `${siteUrl}/${testSlug}/#comments`;

console.log('\n======================================================');
console.log('       OneCoder 博客读者留言邮件通知测试');
console.log('======================================================');
console.log(`目标接收邮箱: ${recipient}`);
console.log(`测试文章标题: ${testTitle}`);
console.log(`测试文章地址: ${testPostUrl}`);
console.log('------------------------------------------------------');

function normalizeResendFrom(rawFrom) {
  const defaultFrom = 'OneCoder Blog <onboarding@resend.dev>';
  if (!rawFrom) return defaultFrom;
  let from = rawFrom.trim();
  if (!from) return defaultFrom;
  if (from.includes('<') && !from.includes('>')) {
    from = `${from}>`;
  }
  return from;
}

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  console.log('[Mode] 检测到 RESEND_API_KEY，使用 Resend API 发送测试邮件...');
  const from = normalizeResendFrom(process.env.RESEND_FROM);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: `【OneCoder博客测试】读者留言邮件通知测试 - 来自张读者`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #0d9488;">💬 OneCoder 博客 · 读者留言通知测试</h2>
          <p>这是一封测试邮件，表明您的读者留言邮件通知系统配置成功！</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <p><strong>文章来源：</strong> <a href="${testPostUrl}">《${testTitle}》</a></p>
          <p><strong>留言读者：</strong> 张读者 (zhang@example.com)</p>
          <p><strong>留言内容：</strong> 您好，读了您的这篇文章很有收获，请问后续还会更新 GESP 3 级的考点汇总吗？</p>
          <p><strong>文章链接：</strong> <a href="${testPostUrl}">${testPostUrl}</a></p>
        </div>
      `,
      text: `OneCoder 博客测试邮件：读者张读者在文章《${testTitle}》发表了留言：您好，读了您的这篇文章很有收获！链接：${testPostUrl}`,
    }),
  });

  const resData = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log('✅ Resend 发信成功！Message ID:', resData.id);
    return true;
  } else {
    console.error('❌ Resend 发信失败:', resData);
    return false;
  }
}

async function testSmtp() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('⚠️ 未检测到完整的 SMTP 配置 (SMTP_HOST, SMTP_USER, SMTP_PASS)');
    return null;
  }

  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
  const smtpFrom = process.env.SMTP_FROM || `"OneCoder 博客" <${smtpUser}>`;

  console.log(`[Mode] 检测到 SMTP 配置: Host=${smtpHost}, Port=${smtpPort}, User=${smtpUser}`);
  console.log('正在连接 SMTP 服务器并验证凭据...');

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP 认证成功！');
  } catch (verifyErr) {
    console.error('❌ SMTP 验证失败，请检查账号和授权码是否正确:', verifyErr.message);
    return false;
  }

  console.log(`正在向 ${recipient} 发送测试邮件...`);

  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: recipient,
      subject: `【OneCoder博客测试】读者留言邮件通知测试 - 来自张读者`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #0d9488;">💬 OneCoder 博客 · 读者留言通知测试</h2>
          <p>这是一封测试邮件，表明您的读者留言邮件通知系统配置成功！</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <p><strong>文章来源：</strong> <a href="${testPostUrl}">《${testTitle}》</a></p>
          <p><strong>留言读者：</strong> 张读者 (zhang@example.com)</p>
          <p><strong>留言内容：</strong> 您好，读了您的这篇文章很有收获，请问后续还会更新 GESP 3 级的考点汇总吗？</p>
          <p><strong>文章链接：</strong> <a href="${testPostUrl}">${testPostUrl}</a></p>
        </div>
      `,
      text: `OneCoder 博客测试邮件：读者张读者在文章《${testTitle}》发表了留言：您好，读了您的这篇文章很有收获！链接：${testPostUrl}`,
    });

    console.log(`✅ 邮件发送成功！Message ID: ${info.messageId}`);
    return true;
  } catch (sendErr) {
    console.error('❌ 发送邮件失败:', sendErr.message);
    return false;
  }
}

async function testSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;

  console.log('[Mode] 检测到 SENDGRID_API_KEY，使用 SendGrid API 发送测试邮件...');
  const from = process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'OneCoder Blog <noreply@coderli.com>';
  const match = from.match(/(?:.*<)?([^>]+)>?/);
  const fromEmail = match ? match[1].trim() : from;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: recipient }] }],
      from: { email: fromEmail },
      subject: `【OneCoder博客测试】读者留言邮件通知测试 - 来自张读者`,
      content: [
        {
          type: 'text/html',
          value: `
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
              <h2 style="color: #0d9488;">💬 OneCoder 博客 · 读者留言通知测试</h2>
              <p>这是一封测试邮件，表明您的读者留言邮件通知系统配置成功！</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
              <p><strong>文章来源：</strong> <a href="${testPostUrl}">《${testTitle}》</a></p>
              <p><strong>留言读者：</strong> 张读者 (zhang@example.com)</p>
              <p><strong>留言内容：</strong> 您好，读了您的这篇文章很有收获，请问后续还会更新 GESP 3 级的考点汇总吗？</p>
              <p><strong>文章链接：</strong> <a href="${testPostUrl}">${testPostUrl}</a></p>
            </div>
          `,
        },
      ],
    }),
  });

  if (res.ok) {
    console.log('✅ SendGrid 发信成功！');
    return true;
  } else {
    const errText = await res.text().catch(() => '');
    console.error('❌ SendGrid 发信失败:', errText);
    return false;
  }
}

async function main() {
  if (process.env.RESEND_API_KEY) {
    await testResend();
    return;
  }

  if (process.env.SENDGRID_API_KEY) {
    await testSendGrid();
    return;
  }

  const smtpResult = await testSmtp();
  if (smtpResult === null) {
    console.log('\n💡 提示：当前尚未配置邮箱环境变量。');
    console.log('请在项目根目录创建或编辑 .env.local（或在 Vercel 环境变量中配置）：');
    console.log('------------------------------------------------------');
    console.log('【方案 A: Resend 云端发信 (强烈推荐用于 Vercel 环境)】');
    console.log('RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"');
    console.log('RESEND_FROM="OneCoder Blog <onboarding@resend.dev>"');
    console.log('------------------------------------------------------');
    console.log('【方案 B: 标准 SMTP 方式 (QQ邮箱 / 163 / Gmail / 自建邮件服务)】');
    console.log('COMMENT_NOTIFICATION_EMAIL="wushikezuo@gmail.com"');
    console.log('SMTP_HOST="smtp.qq.com"');
    console.log('SMTP_PORT=465');
    console.log('SMTP_SECURE=true');
    console.log('SMTP_USER="你的邮箱账号@qq.com"');
    console.log('SMTP_PASS="你的邮箱POP3/SMTP授权码"');
    console.log('SMTP_FROM="\\"OneCoder 博客\\" <你的邮箱账号@qq.com>"');
    console.log('------------------------------------------------------');
    console.log('配置完成后，重新运行此命令即可自动发送测试邮件。\n');
  }
}

main().catch(console.error);
