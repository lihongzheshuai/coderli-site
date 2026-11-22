'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { Reply, Quote, CornerDownRight, X, ExternalLink, MessageSquare, ShieldCheck } from 'lucide-react';
import { CommentItem } from '@/types/comment';

const API_BASE = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.coderli.com'
).replace(/\/$/, '');

const getApiHeaders = () => {
  const token = (process.env.API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN || '').trim();
  const headers: Record<string, string> = {};
  if (token) headers['x-api-token'] = token;
  return headers;
};

const fetcher = (url: string) =>
  fetch(url, { headers: getApiHeaders() })
    .then(r => r.json())
    .catch(() => ({ comments: [] }));

const AVATAR_TONES = [
  'bg-[#0D9488]',
  'bg-[#2563EB]',
  'bg-[#4F46E5]',
  'bg-[#B45309]',
  'bg-[#0F766E]',
  'bg-[#334155]',
];

function getAvatarTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (isNaN(diffMs)) return dateStr;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return '刚刚';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} 分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} 小时前`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} 天前`;
    return d.toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
}

function getSafeHttpUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

interface ReplyTarget {
  id: string;
  author: string;
  content: string;
}

export default function Comments({ slug, postTitle }: { slug: string; postTitle?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldFetch(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldFetch(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { data, mutate } = useSWR<{ comments: CommentItem[] }>(
    shouldFetch ? `${API_BASE}/api/comments/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );
  const [author, setAuthor] = useState('匿名');
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const comments = data?.comments || [];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('onecoder_comment_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.author && parsed.author.trim()) setAuthor(parsed.author.trim());
        if (parsed.email) setEmail(parsed.email);
        if (parsed.site) setSite(parsed.site);
      }
    } catch {
      // ignore
    }
  }, []);

  function scrollToComment(id?: string) {
    if (!id) return;
    const el = document.getElementById(`comment-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(id);
      setTimeout(() => {
        setHighlightedId(null);
      }, 2500);
    }
  }

  function handleStartReply(c: CommentItem) {
    setReplyTarget({ id: c.id, author: c.author, content: c.content });
    const formEl = document.getElementById('comment-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }

  function handleStartQuote(c: CommentItem) {
    setReplyTarget({ id: c.id, author: c.author, content: c.content });
    const snippet = c.content.trim().slice(0, 160);
    const quoteLines = snippet.split('\n').map(l => `> ${l}`).join('\n');
    const quoteBlock = `> @${c.author} 说：\n${quoteLines}\n\n`;

    setContent(prev => (prev ? `${quoteBlock}${prev}` : quoteBlock));

    const formEl = document.getElementById('comment-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 100);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalAuthor = author.trim() || '匿名';
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setMessage('请填写您的邮箱地址');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setMessage('请填写合法的邮箱格式 (例如: yourname@example.com)');
      return;
    }

    const trimmedSite = site.trim();
    const safeSiteInput = trimmedSite ? getSafeHttpUrl(trimmedSite) : null;
    if (trimmedSite && !safeSiteInput) {
      setMessage('个人网站链接仅支持 http:// 或 https:// 协议');
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      try {
        localStorage.setItem(
          'onecoder_comment_user',
          JSON.stringify({ author: finalAuthor, email: trimmedEmail, site: safeSiteInput || '' })
        );
      } catch {
        // ignore
      }

      const res = await fetch(`${API_BASE}/api/comments/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          author: finalAuthor,
          email: trimmedEmail,
          site: safeSiteInput || '',
          content: content.trim(),
          postTitle,
          replyToId: replyTarget?.id,
          replyToAuthor: replyTarget?.author,
          replyToContent: replyTarget ? replyTarget.content.slice(0, 200) : undefined,
          b_extra_token: honeypot || undefined,
        }),
      });

      const result = await res.json();
      if (res.ok && result.comment) {
        mutate({ comments: [result.comment, ...comments] }, false);
        setContent('');
        setReplyTarget(null);
        setHoneypot('');
        setMessage(replyTarget ? '回复成功，已通知站长与原留言作者。' : '留言成功，感谢你的交流与支持。');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage(result.error || '提交失败，请稍后重试');
      }
    } catch {
      setMessage('网络请求失败，请检查网络');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatCommentLine(line: string) {
    const regex = /(\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\))|(https?:\/\/[^\s\)\],。，！？]+)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      if (match[1]) {
        elements.push(
          <a
            key={match.index}
            href={match[3]}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-[var(--brand)] font-medium underline underline-offset-2"
          >
            {match[2]}
          </a>
        );
      } else if (match[4]) {
        elements.push(
          <a
            key={match.index}
            href={match[4]}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-[var(--brand)] font-medium underline underline-offset-2 break-all"
          >
            {match[4]}
          </a>
        );
      } else if (match[5]) {
        elements.push(
          <strong key={match.index} className="font-semibold text-[var(--ink-primary)]">
            {match[6]}
          </strong>
        );
      } else if (match[7]) {
        elements.push(
          <em key={match.index} className="italic">
            {match[8]}
          </em>
        );
      } else if (match[9]) {
        elements.push(
          <code
            key={match.index}
            className="font-mono text-xs bg-[var(--bg-subtle)] text-[var(--brand)] px-1 py-0.5 rounded"
            style={{ boxShadow: 'inset 0 0 0 1px var(--border-hairline)' }}
          >
            {match[10]}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }

    return elements.length > 0 ? elements : line;
  }

  function renderCommentBody(text: string) {
    const lines = text.split('\n');
    return (
      <div className="text-[13.5px] text-[var(--ink-secondary)] leading-relaxed space-y-1 break-words">
        {lines.map((line, idx) => {
          if (line.startsWith('>')) {
            return (
              <blockquote
                key={idx}
                className="border-l-2 pl-2.5 my-1 text-[var(--ink-muted)] italic text-[12.5px] bg-[var(--bg-subtle)] py-1 rounded-r"
                style={{ borderColor: 'var(--brand)' }}
              >
                {formatCommentLine(line.replace(/^>\s*/, ''))}
              </blockquote>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="whitespace-pre-wrap">
              {formatCommentLine(line)}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="mt-10 pt-7 border-t"
      style={{ borderColor: 'var(--border-hairline)' }}
      id="comments"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold text-[var(--ink-primary)] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--brand)]" />
          <span>读者讨论与留言</span>
        </h3>
        <span className="text-[12px] text-[var(--ink-muted)] font-mono tnum">
          共 {comments.length} 条讨论
        </span>
      </div>

      {/* Form */}
      <form
        id="comment-form"
        onSubmit={handleSubmit}
        className="rounded-[8px] p-4 sm:p-5 mb-6"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          boxShadow: '0 0 0 1px var(--border-hairline)',
        }}
      >
        {replyTarget && (
          <div
            className="mb-3 p-3 rounded-[6px] flex items-start justify-between gap-3 text-xs"
            style={{
              backgroundColor: 'var(--brand-surface)',
              boxShadow: 'inset 0 0 0 1px var(--brand-border)',
            }}
          >
            <div className="flex items-start gap-2 min-w-0">
              <CornerDownRight className="w-3.5 h-3.5 text-[var(--brand)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-[var(--brand)]">
                  正在回复 @{replyTarget.author}：
                </span>
                <p className="text-[var(--ink-muted)] truncate mt-0.5 italic">
                  “{replyTarget.content}”
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>取消</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-2.5">
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="昵称 (默认匿名)"
            className="w-full px-3 py-2 rounded-[6px] bg-[var(--bg-canvas)] text-[var(--ink-primary)] placeholder:text-[var(--ink-faint)] text-[13px] outline-none focus:ring-2 focus:ring-[var(--brand)]"
            style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
          />
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="邮箱 (必填，用于接收回复)"
            className="w-full px-3 py-2 rounded-[6px] bg-[var(--bg-canvas)] text-[var(--ink-primary)] placeholder:text-[var(--ink-faint)] text-[13px] outline-none focus:ring-2 focus:ring-[var(--brand)]"
            style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
          />
          <input
            type="url"
            value={site}
            onChange={e => setSite(e.target.value)}
            placeholder="个人主页 (选填)"
            className="w-full px-3 py-2 rounded-[6px] bg-[var(--bg-canvas)] text-[var(--ink-primary)] placeholder:text-[var(--ink-faint)] text-[13px] outline-none focus:ring-2 focus:ring-[var(--brand)]"
            style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
          />
        </div>

        <textarea
          ref={textareaRef}
          required
          rows={3}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={
            replyTarget
              ? `回复 @${replyTarget.author}…`
              : '写下你的解题思路、疑问或改进建议… (支持基础 Markdown 语法)'
          }
          className="w-full px-3 py-2.5 rounded-[6px] bg-[var(--bg-canvas)] text-[var(--ink-primary)] placeholder:text-[var(--ink-faint)] text-[13px] outline-none focus:ring-2 focus:ring-[var(--brand)]"
          style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
        />

        {/* Honeypot anti-spam field */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
          <input
            type="text"
            name="b_extra_token"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span className="text-[12px] text-[var(--ink-muted)] flex items-center gap-1.5">
            {message ? (
              <span className="text-[var(--brand)] font-semibold">{message}</span>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>邮箱仅用于接收回复通知，不对外展示</span>
              </>
            )}
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--brand)',
              color: 'var(--brand-cta-text)',
            }}
          >
            {isSubmitting ? '提交中…' : replyTarget ? `发表回复 (@${replyTarget.author})` : '发表评论'}
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div
            className="text-center py-8 text-[var(--ink-muted)] text-[13px] rounded-[8px]"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              boxShadow: '0 0 0 1px var(--border-hairline)',
            }}
          >
            还没有读者留言，欢迎写下你的第一条交流笔记。
          </div>
        ) : (
          comments.map(c => {
            const isHighlighted = highlightedId === c.id;
            return (
              <div
                key={c.id}
                id={`comment-${c.id}`}
                className="wb-card p-4 flex gap-3 transition-all duration-200"
                style={
                  isHighlighted
                    ? {
                        backgroundColor: 'var(--brand-surface)',
                        boxShadow: '0 0 0 1.5px var(--brand)',
                      }
                    : undefined
                }
              >
                <div
                  className={`w-8 h-8 rounded-[7px] ${getAvatarTone(c.author)} text-white font-semibold flex items-center justify-center flex-shrink-0 text-[13px] select-none`}
                >
                  {c.author.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const safeSite = getSafeHttpUrl(c.site);
                        return safeSite ? (
                          <a
                            href={safeSite}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="font-semibold text-[13.5px] text-[var(--ink-primary)] hover:text-[var(--brand)] inline-flex items-center gap-1"
                          >
                            <span>{c.author}</span>
                            <ExternalLink className="w-3 h-3 text-[var(--ink-faint)]" />
                          </a>
                        ) : (
                          <span className="font-semibold text-[13.5px] text-[var(--ink-primary)]">
                            {c.author}
                          </span>
                        );
                      })()}
                    </div>
                    <time
                      className="text-[11.5px] text-[var(--ink-faint)] font-mono tnum"
                      title={new Date(c.createdAt).toLocaleString('zh-CN')}
                    >
                      {formatRelativeTime(c.createdAt)}
                    </time>
                  </div>

                  {c.replyToAuthor && (
                    <button
                      type="button"
                      onClick={() => scrollToComment(c.replyToId)}
                      className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-[5px] bg-[var(--bg-subtle)] text-[11.5px] text-[var(--ink-secondary)] hover:text-[var(--brand)] transition-colors cursor-pointer max-w-full"
                      style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
                    >
                      <CornerDownRight className="w-3 h-3 text-[var(--brand)] flex-shrink-0" />
                      <span className="font-semibold text-[var(--brand)] flex-shrink-0">
                        @{c.replyToAuthor}
                      </span>
                      {c.replyToContent && (
                        <span className="text-[var(--ink-muted)] truncate max-w-[180px] md:max-w-[320px]">
                          : “{c.replyToContent}”
                        </span>
                      )}
                    </button>
                  )}

                  {renderCommentBody(c.content)}

                  <div
                    className="flex items-center gap-3.5 mt-2.5 pt-2 border-t text-[11.5px] text-[var(--ink-muted)]"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <button
                      type="button"
                      onClick={() => handleStartReply(c)}
                      className="inline-flex items-center gap-1 hover:text-[var(--brand)] font-medium cursor-pointer"
                    >
                      <Reply className="w-3 h-3" />
                      <span>回复</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartQuote(c)}
                      className="inline-flex items-center gap-1 hover:text-[var(--brand)] cursor-pointer"
                    >
                      <Quote className="w-3 h-3" />
                      <span>引用</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
