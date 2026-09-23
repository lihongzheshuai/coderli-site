'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { Reply, Quote, CornerDownRight, X, ExternalLink, MessageSquare } from 'lucide-react';
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

const AVATAR_GRADIENTS = [
  'from-teal-500 to-emerald-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-teal-600',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
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

interface ReplyTarget {
  id: string;
  author: string;
  content: string;
}

export default function Comments({ slug, postTitle }: { slug: string; postTitle?: string }) {
  const { data, mutate } = useSWR<{ comments: CommentItem[] }>(`${API_BASE}/api/comments/${slug}`, fetcher);
  const [author, setAuthor] = useState('匿名');
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const comments = data?.comments || [];

  // Restore author info from localStorage
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

  // Smooth scroll to an existing comment and briefly highlight it
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

  // Set reply target and focus form
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

  // Quote comment into textarea as markdown blockquote
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
    if (!content.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      // Remember user details in browser
      try {
        localStorage.setItem(
          'onecoder_comment_user',
          JSON.stringify({ author: finalAuthor, email: email.trim(), site: site.trim() })
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
          email: email.trim(),
          site: site.trim(),
          content: content.trim(),
          postTitle,
          replyToId: replyTarget?.id,
          replyToAuthor: replyTarget?.author,
          replyToContent: replyTarget ? replyTarget.content.slice(0, 200) : undefined,
        }),
      });

      const result = await res.json();
      if (res.ok && result.comment) {
        mutate({ comments: [result.comment, ...comments] }, false);
        setContent('');
        setReplyTarget(null);
        setMessage(replyTarget ? '🎉 回复成功！已通知站长与作者。' : '🎉 留言成功！感谢你的交流与支持。');
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

  // Helper to parse markdown links, bold, italic, code, and raw URLs in comments
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
        // [text](url)
        elements.push(
          <a
            key={match.index}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 font-medium underline underline-offset-2 hover:text-teal-700 dark:hover:text-teal-300 transition"
          >
            {match[2]}
          </a>
        );
      } else if (match[4]) {
        // raw URL
        elements.push(
          <a
            key={match.index}
            href={match[4]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 font-medium underline underline-offset-2 hover:text-teal-700 dark:hover:text-teal-300 break-all transition"
          >
            {match[4]}
          </a>
        );
      } else if (match[5]) {
        // **bold**
        elements.push(
          <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
            {match[6]}
          </strong>
        );
      } else if (match[7]) {
        // *italic*
        elements.push(
          <em key={match.index} className="italic">
            {match[8]}
          </em>
        );
      } else if (match[9]) {
        // `code`
        elements.push(
          <code
            key={match.index}
            className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700"
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

  // Render markdown quotes in comment content nicely
  function renderCommentBody(text: string) {
    const lines = text.split('\n');
    return (
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-1 break-words">
        {lines.map((line, idx) => {
          if (line.startsWith('>')) {
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-teal-500/70 pl-2.5 my-1 text-slate-500 dark:text-slate-400 italic text-xs md:text-sm bg-slate-50/60 dark:bg-slate-800/40 py-0.5 rounded-r"
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
    <section className="mt-14 pt-8 border-t-2 border-slate-200 dark:border-slate-800" id="comments">
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>读者讨论与留言</span>
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          共 {comments.length} 条讨论
        </span>
      </div>

      {/* Form */}
      <form
        id="comment-form"
        onSubmit={handleSubmit}
        className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-8 shadow-sm transition-all"
      >
        {/* Active Reply Banner */}
        {replyTarget && (
          <div className="mb-3.5 p-3 rounded-lg bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-2 min-w-0">
              <CornerDownRight className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold text-teal-800 dark:text-teal-300">
                  正在回复 @{replyTarget.author}：
                </span>
                <p className="text-slate-600 dark:text-slate-400 truncate mt-0.5 italic">
                  “{replyTarget.content}”
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-teal-100/60 dark:hover:bg-teal-900/60 transition flex-shrink-0"
              title="取消回复模式"
            >
              <X className="w-3.5 h-3.5" />
              <span>取消回复</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="昵称 (默认匿名)"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="邮箱 (选填，支持收到博主回复)"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
          />
          <input
            type="url"
            value={site}
            onChange={e => setSite(e.target.value)}
            placeholder="个人主页 (选填)"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
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
              ? `回复 @${replyTarget.author}... (写下你的想法或交流答疑)`
              : '写下你的技术见解与疑问... (支持点击下方留言直接「回复」与「引用」)'
          }
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
        />

        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {message ? (
              <span className="text-teal-600 dark:text-teal-400 font-semibold">{message}</span>
            ) : (
              '✨ 支持点击留言直接回复 · Markdown 引用格式'
            )}
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
          >
            {isSubmitting ? '提交中...' : replyTarget ? `发表回复 (@${replyTarget.author})` : '发表评论'}
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            💬 还没有读者留言，快来成为第一个讨论者吧！
          </div>
        ) : (
          comments.map(c => {
            const isHighlighted = highlightedId === c.id;
            return (
              <div
                key={c.id}
                id={`comment-${c.id}`}
                className={`p-4 md:p-5 rounded-xl border transition-all duration-300 flex gap-3.5 ${
                  isHighlighted
                    ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 shadow-md ring-2 ring-teal-500/30'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                    c.author
                  )} text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm select-none`}
                >
                  {c.author.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      {c.site ? (
                        <a
                          href={c.site}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition inline-flex items-center gap-1"
                        >
                          <span>{c.author}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {c.author}
                        </span>
                      )}
                    </div>
                    <time
                      className="text-xs text-slate-400 font-mono"
                      title={new Date(c.createdAt).toLocaleString('zh-CN')}
                    >
                      {formatRelativeTime(c.createdAt)}
                    </time>
                  </div>

                  {/* Quoted Reference Tag (if this comment is a reply) */}
                  {c.replyToAuthor && (
                    <button
                      type="button"
                      onClick={() => scrollToComment(c.replyToId)}
                      className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-teal-50 dark:bg-slate-800/80 dark:hover:bg-teal-950/40 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 transition group text-left max-w-full"
                      title={c.replyToId ? '点击定位并高亮原留言' : undefined}
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <span className="font-semibold text-teal-700 dark:text-teal-400 flex-shrink-0">
                        @{c.replyToAuthor}
                      </span>
                      {c.replyToContent && (
                        <span className="text-slate-400 dark:text-slate-500 truncate max-w-[180px] md:max-w-[340px]">
                          : “{c.replyToContent}”
                        </span>
                      )}
                    </button>
                  )}

                  {/* Comment Body */}
                  {renderCommentBody(c.content)}

                  {/* Actions (Reply & Quote) */}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400 dark:text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleStartReply(c)}
                      className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition font-medium"
                      title={`回复 @${c.author}`}
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>回复</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartQuote(c)}
                      className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition"
                      title={`引用 @${c.author} 的留言`}
                    >
                      <Quote className="w-3.5 h-3.5" />
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
