'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { CommentItem } from '@/lib/db';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Comments({ slug }: { slug: string }) {
  const { data, mutate } = useSWR<{ comments: CommentItem[] }>(`/api/comments/${slug}/`, fetcher);
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const comments = data?.comments || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`/api/comments/${slug}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, email, site, content }),
      });

      const result = await res.json();
      if (res.ok && result.comment) {
        mutate({ comments: [result.comment, ...comments] }, false);
        setContent('');
        setMessage('🎉 留言成功！感谢你的交流与支持。');
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

  return (
    <section className="mt-14 pt-8 border-t-2 border-slate-200 dark:border-slate-800" id="comments">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>💬 读者留言与交流</span>
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          共 {comments.length} 条讨论
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            required
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="昵称 *"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="邮箱 (选填，用于匹配头像)"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500"
          />
          <input
            type="url"
            value={site}
            onChange={e => setSite(e.target.value)}
            placeholder="个人主页 (选填)"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500"
          />
        </div>

        <textarea
          required
          rows={3}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="写下你的技术见解与疑问... (支持 Markdown 语法与代码块，数据将直接写入你的自建数据库)"
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-teal-500"
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {message ? <span className="text-teal-600 dark:text-teal-400 font-semibold">{message}</span> : '✨ 支持 Markdown 语法格式'}
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
          >
            {isSubmitting ? '提交中...' : '发表评论'}
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            还没有留言，快来成为第一个讨论者吧！
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                {c.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.author}</span>
                  <time className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString('zh-CN')}</time>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
