'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Menu,
  BookOpen,
  Trophy,
  Star,
  Code2,
  Monitor,
  Database,
  Filter,
  AlignJustify,
  PenLine,
  ChevronRight,
  SearchX,
  ArrowUpRight,
} from 'lucide-react';
import type { PostCardMeta } from '@/types/post';
import {
  GESP_LEVELS,
  extractProblemId,
  classifyPostKind,
  getBadgeMeta,
  formatReadTimeCompact,
  formatCompactTitle,
  type WorkbenchSidebarStats,
} from '@/lib/workbench';
import OiGamePromo from '@/components/OiGamePromo';
import GoogleAd from '@/components/GoogleAd';

type ScopeFilter =
  | { kind: 'all' }
  | { kind: 'gesp-level'; level: string }
  | { kind: 'gesp-other' }
  | { kind: 'csp' }
  | { kind: 'noip' }
  | { kind: 'algo' }
  | { kind: 'java' }
  | { kind: 'python-data' };

type TypeTab = 'all' | 'syllabus' | 'problem' | 'arch';

interface WorkbenchHomeProps {
  initialPosts: PostCardMeta[];
  stats: WorkbenchSidebarStats;
}

const PAGE_SIZE = 15;

export default function WorkbenchHome({ initialPosts, stats }: WorkbenchHomeProps) {
  const [allPosts, setAllPosts] = useState<PostCardMeta[]>(initialPosts);
  const [hasLoadedFull, setHasLoadedFull] = useState(false);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  const [scope, setScope] = useState<ScopeFilter>({ kind: 'all' });
  const [typeTab, setTypeTab] = useState<TypeTab>('all');
  const [quickQuery, setQuickQuery] = useState('');
  const [compact, setCompact] = useState(false);
  const [page, setPage] = useState(1);

  const ensureFullIndex = useCallback(async () => {
    if (hasLoadedFull || isLoadingFull) return;
    setIsLoadingFull(true);
    try {
      const res = await fetch('/search-index.json', { cache: 'force-cache' });
      if (res.ok) {
        const raw: any[] = await res.json();
        const mapped: PostCardMeta[] = raw
          .filter(item => item && item.slug)
          .map(item => ({
            slug: item.slug,
            title: item.title || item.slug,
            date: item.date || '',
            tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : [],
            readTime: item.readTime || '5 分钟',
            excerpt: item.excerpt || '',
            topic: item.topic || 'gesp',
            topicName: item.topicName || '技术笔记',
            subtopic: item.subtopic || '精讲',
            previewImg: item.previewImg || null,
            previewGraphic: {
              symbol: item.previewGraphic?.symbol || 'OneCoder',
              title: item.previewGraphic?.title || '技术专题',
            },
          }));
        setAllPosts(mapped);
        setHasLoadedFull(true);
      }
    } catch {
      // Keep initial posts if offline
    } finally {
      setIsLoadingFull(false);
    }
  }, [hasLoadedFull, isLoadingFull]);

  function handleSelectScope(next: ScopeFilter) {
    setScope(next);
    setPage(1);
    if (next.kind !== 'all') {
      ensureFullIndex();
    }
  }

  function handleSelectType(next: TypeTab) {
    setTypeTab(next);
    setPage(1);
    if (next !== 'all') {
      ensureFullIndex();
    }
  }

  function handleQuickFilter(val: string) {
    setQuickQuery(val);
    setPage(1);
    if (val.trim().length > 0) {
      ensureFullIndex();
    }
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    if (nextPage > 1) {
      ensureFullIndex();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetAll() {
    setScope({ kind: 'all' });
    setTypeTab('all');
    setQuickQuery('');
    setPage(1);
  }

  const filteredPosts = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    return allPosts.filter(post => {
      // 1. Sidebar scope match
      if (scope.kind === 'gesp-level') {
        if (post.topic !== 'gesp' || post.subtopic !== scope.level) return false;
      } else if (scope.kind === 'gesp-other') {
        const known = GESP_LEVELS.some(l => l.level === post.subtopic);
        if (post.topic !== 'gesp' || known) return false;
      } else if (scope.kind === 'csp') {
        if (post.topic !== 'csp' || post.subtopic === 'NOIP') return false;
      } else if (scope.kind === 'noip') {
        if (post.topic !== 'csp' || post.subtopic !== 'NOIP') return false;
      } else if (scope.kind === 'algo') {
        if (post.topic !== 'algo') return false;
      } else if (scope.kind === 'java') {
        if (post.topic !== 'java') return false;
      } else if (scope.kind === 'python-data') {
        if (post.topic !== 'python-data') return false;
      }

      // 2. Segmented type match
      if (typeTab !== 'all') {
        const k = classifyPostKind(post);
        if (k !== typeTab) return false;
      }

      // 3. Inline query match
      if (q) {
        const haystack = `${post.title} ${post.slug} ${post.excerpt} ${post.subtopic} ${(post.tags || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [allPosts, scope, typeTab, quickQuery]);

  const isUnfiltered = scope.kind === 'all' && typeTab === 'all' && !quickQuery.trim();
  const totalCountDisplay = hasLoadedFull
    ? filteredPosts.length
    : isUnfiltered
    ? stats.total
    : filteredPosts.length;

  const totalPages = Math.max(1, Math.ceil(totalCountDisplay / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pagePosts = filteredPosts.slice(startIdx, startIdx + PAGE_SIZE);

  const paneTitle = useMemo(() => {
    switch (scope.kind) {
      case 'gesp-level':
        return `GESP ${scope.level} 专题索引`;
      case 'gesp-other':
        return 'GESP 综合考纲与专题';
      case 'csp':
        return 'CSP-J / S 竞赛真题索引';
      case 'noip':
        return 'NOIP 全国联赛真题索引';
      case 'algo':
        return 'LeetCode 与经典算法索引';
      case 'java':
        return 'Java 服务端架构与日志笔记';
      case 'python-data':
        return 'Python 与数据工程实战';
      default:
        return '全站题解与技术索引';
    }
  }, [scope]);

  const yearsSince2012 = Math.max(14, new Date().getFullYear() - 2012);

  return (
    <div className="max-w-[1680px] mx-auto grid grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)] min-h-[calc(100vh-52px)]">
      {/* =========================================================
          LEFT STICKY WORKBENCH SIDEBAR (Desktop lg+)
         ========================================================= */}
      <aside
        aria-label="知识库分类树"
        className="hidden lg:flex flex-col justify-between gap-3 px-2.5 py-3 border-r sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div>
          {/* Root All Articles Node */}
          <div
            className="mb-2.5 pb-2.5 border-b"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <button
              type="button"
              onClick={() => handleSelectScope({ kind: 'all' })}
              className="wb-sb-item"
              data-active={scope.kind === 'all'}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Menu className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">全部原创文章</span>
              </span>
              <span className="font-mono tnum text-[11.5px] opacity-75">
                {stats.total.toLocaleString()}
              </span>
            </button>
          </div>

          {/* Group 1: GESP C++ Levels 1-8 */}
          <div className="mb-3">
            <div className="flex items-center justify-between px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-muted)]">
              <span>GESP C++ 考级</span>
              <span className="font-mono tnum">{stats.gespTotal}</span>
            </div>
            {GESP_LEVELS.map(spec => {
              const cnt = stats.gespLevels[spec.level] || 0;
              const active = scope.kind === 'gesp-level' && scope.level === spec.level;
              return (
                <button
                  key={spec.level}
                  type="button"
                  onClick={() => handleSelectScope({ kind: 'gesp-level', level: spec.level })}
                  className="wb-sb-item"
                  data-active={active}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{spec.label}</span>
                  </span>
                  <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                    {cnt}
                  </span>
                </button>
              );
            })}
            {stats.gespOther > 0 && (
              <button
                type="button"
                onClick={() => handleSelectScope({ kind: 'gesp-other' })}
                className="wb-sb-item"
                data-active={scope.kind === 'gesp-other'}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">GESP 综合与考前策略</span>
                </span>
                <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                  {stats.gespOther}
                </span>
              </button>
            )}
          </div>

          {/* Group 2: Informatics Contests */}
          <div className="mb-3">
            <div className="flex items-center justify-between px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-muted)]">
              <span>信息学竞赛</span>
              <span className="font-mono tnum">{stats.contestTotal}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectScope({ kind: 'csp' })}
              className="wb-sb-item"
              data-active={scope.kind === 'csp'}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">CSP-J / S 竞赛真题</span>
              </span>
              <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                {stats.cspCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScope({ kind: 'noip' })}
              className="wb-sb-item"
              data-active={scope.kind === 'noip'}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Star className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">NOIP 全国联赛</span>
              </span>
              <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                {stats.noipCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScope({ kind: 'algo' })}
              className="wb-sb-item"
              data-active={scope.kind === 'algo'}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Code2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">LeetCode / 经典算法</span>
              </span>
              <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                {stats.algoCount}
              </span>
            </button>
          </div>

          {/* Group 3: Engineering & Architecture */}
          <div>
            <div className="flex items-center justify-between px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-muted)]">
              <span>工程与架构</span>
              <span className="font-mono tnum">{stats.engTotal}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectScope({ kind: 'java' })}
              className="wb-sb-item"
              data-active={scope.kind === 'java'}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Monitor className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Java 架构与日志</span>
              </span>
              <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                {stats.javaCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScope({ kind: 'python-data' })}
              className="wb-sb-item"
              data-active={scope.kind === 'python-data'}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Database className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Python 与数据工程</span>
              </span>
              <span className="font-mono tnum text-[11.5px] text-[var(--ink-faint)]">
                {stats.pythonDataCount}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Compact OI-Game Card */}
        <div className="space-y-2.5 flex-shrink-0 pt-2">
          <OiGamePromo variant="compact" />
        </div>
      </aside>

      {/* =========================================================
          RIGHT MAIN INDEX WORKBENCH PANE
         ========================================================= */}
      <div className="px-3 sm:px-5 lg:px-7 py-4 lg:py-5 min-w-0">
        {/* Compact Workbench Header + KPI Strip */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 mb-3 border-b"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <div>
            <h1 className="text-[19px] sm:text-[20px] font-semibold tracking-[-0.02em] leading-snug text-[var(--ink-primary)]">
              {paneTitle}
            </h1>
            <p className="text-[13px] text-[var(--ink-muted)] mt-0.5">
              按 GESP 等级、洛谷题号与技术栈极速定位 · 严格 C++11 规范
              <span className="hidden sm:inline">
                {' '}· 按 <kbd className="wb-kbd mx-0.5">⌘K</kbd> 键盘直达
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3.5 tnum text-[12px] text-[var(--ink-muted)] flex-shrink-0">
            <div className="flex items-baseline gap-1">
              <strong className="text-[15px] font-semibold text-[var(--ink-primary)]">
                {stats.total.toLocaleString()}
              </strong>
              <span>原创文章</span>
            </div>
            <span className="w-px h-3.5" style={{ backgroundColor: 'var(--border-hairline)' }} />
            <div className="flex items-baseline gap-1">
              <strong className="text-[15px] font-semibold text-[var(--ink-primary)]">
                {stats.gespTotal}
              </strong>
              <span>GESP 考级</span>
            </div>
            <span className="w-px h-3.5" style={{ backgroundColor: 'var(--border-hairline)' }} />
            <div className="flex items-baseline gap-1">
              <strong className="text-[15px] font-semibold text-[var(--ink-primary)]">
                {yearsSince2012} 年
              </strong>
              <span>始于 2012</span>
            </div>
          </div>
        </div>

        {/* Mobile-Only Horizontal Scrollable GESP Level Strip */}
        <div
          role="group"
          aria-label="GESP 等级快捷筛选"
          className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 pb-1.5 mb-2.5"
        >
          <button
            type="button"
            onClick={() => handleSelectScope({ kind: 'all' })}
            className="flex-shrink-0 min-h-[34px] px-3 rounded-[7px] text-[12.5px] font-medium transition-colors"
            style={
              scope.kind === 'all'
                ? {
                    backgroundColor: 'var(--brand-surface)',
                    color: 'var(--brand)',
                    fontWeight: 600,
                    boxShadow: '0 0 0 1px var(--brand-border)',
                  }
                : {
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--ink-secondary)',
                    boxShadow: '0 0 0 1px var(--border-hairline)',
                  }
            }
          >
            全部
          </button>
          {GESP_LEVELS.map(spec => {
            const active = scope.kind === 'gesp-level' && scope.level === spec.level;
            return (
              <button
                key={spec.level}
                type="button"
                onClick={() => handleSelectScope({ kind: 'gesp-level', level: spec.level })}
                className="flex-shrink-0 min-h-[34px] px-3 rounded-[7px] text-[12.5px] font-medium transition-colors"
                style={
                  active
                    ? {
                        backgroundColor: 'var(--brand-surface)',
                        color: 'var(--brand)',
                        fontWeight: 600,
                        boxShadow: '0 0 0 1px var(--brand-border)',
                      }
                    : {
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--ink-secondary)',
                        boxShadow: '0 0 0 1px var(--border-hairline)',
                      }
                }
              >
                {spec.level}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleSelectScope({ kind: 'csp' })}
            className="flex-shrink-0 min-h-[34px] px-3 rounded-[7px] text-[12.5px] font-medium transition-colors"
            style={
              scope.kind === 'csp'
                ? {
                    backgroundColor: 'var(--brand-surface)',
                    color: 'var(--brand)',
                    fontWeight: 600,
                    boxShadow: '0 0 0 1px var(--brand-border)',
                  }
                : {
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--ink-secondary)',
                    boxShadow: '0 0 0 1px var(--border-hairline)',
                  }
            }
          >
            CSP
          </button>
          <button
            type="button"
            onClick={() => handleSelectScope({ kind: 'java' })}
            className="flex-shrink-0 min-h-[34px] px-3 rounded-[7px] text-[12.5px] font-medium transition-colors"
            style={
              scope.kind === 'java'
                ? {
                    backgroundColor: 'var(--brand-surface)',
                    color: 'var(--brand)',
                    fontWeight: 600,
                    boxShadow: '0 0 0 1px var(--brand-border)',
                  }
                : {
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--ink-secondary)',
                    boxShadow: '0 0 0 1px var(--border-hairline)',
                  }
            }
          >
            Java
          </button>
        </div>

        {/* Filter & Density Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div
            role="tablist"
            aria-label="内容类型筛选"
            className="grid grid-cols-4 sm:inline-flex items-center gap-0.5 p-[3px] rounded-[7px]"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              boxShadow: '0 0 0 1px var(--border-hairline)',
            }}
          >
            {(
              [
                { id: 'all', label: '最新更新' },
                { id: 'syllabus', label: '考纲精讲' },
                { id: 'problem', label: '真题题解' },
                { id: 'arch', label: '架构工程' },
              ] as const
            ).map(tab => {
              const active = typeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelectType(tab.id)}
                  className={`min-h-[30px] sm:min-h-0 px-2 sm:px-3 py-1 rounded-[5px] text-[12px] transition-colors cursor-pointer ${
                    active
                      ? 'font-semibold text-[var(--ink-primary)] bg-[var(--bg-surface-elevated)]'
                      : 'font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                  style={
                    active
                      ? { boxShadow: '0 0 0 1px var(--border-hairline), 0 1px 2px rgba(15,23,42,0.06)' }
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label
              className="flex-1 sm:flex-initial flex items-center gap-1.5 h-[34px] sm:h-[30px] px-2.5 rounded-[6px] bg-[var(--bg-canvas)] focus-within:ring-2 focus-within:ring-[var(--brand)]"
              style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
            >
              <Filter className="w-3.5 h-3.5 text-[var(--ink-muted)] flex-shrink-0" />
              <span className="sr-only">在当前列表内快速过滤</span>
              <input
                type="search"
                value={quickQuery}
                onChange={e => handleQuickFilter(e.target.value)}
                placeholder="过滤当前列表…"
                className="w-full sm:w-[176px] bg-transparent border-none outline-none text-[12.5px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
              />
            </label>

            <button
              type="button"
              onClick={() => setCompact(v => !v)}
              aria-pressed={compact}
              className="hidden sm:inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-[6px] text-[12px] font-medium bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
              style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>{compact ? '标准模式' : '紧凑模式'}</span>
            </button>
          </div>
        </div>

        {/* Precision Index Data Table */}
        <div className="wb-card overflow-hidden">
          {/* Desktop Table Header */}
          <div
            aria-hidden="true"
            className="hidden md:grid grid-cols-[88px_96px_minmax(0,1fr)_90px_58px_18px] items-center gap-3 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-muted)] border-b"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <span>级别 / 专栏</span>
            <span>题号 / 类型</span>
            <span>标题与核心考点</span>
            <span className="text-right">发布日期</span>
            <span className="text-right">时长</span>
            <span />
          </div>

          {isLoadingFull && pagePosts.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[var(--ink-muted)]">
              正在检索全站 {stats.total.toLocaleString()} 篇索引…
            </div>
          ) : pagePosts.length === 0 ? (
            <div className="py-12 px-6 text-center" role="status" aria-live="polite">
              <div
                className="w-10 h-10 rounded-[10px] mx-auto mb-3 grid place-items-center text-[var(--ink-muted)] bg-[var(--bg-subtle)]"
                style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
              >
                <SearchX className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-semibold text-[var(--ink-primary)] mb-1">
                当前筛选下暂无匹配文章
              </h3>
              <p className="text-[13px] text-[var(--ink-muted)] mb-3.5">
                试试清除筛选条件，或直接点击下方高频考点：
              </p>
              <div className="inline-flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-3 py-1 rounded-[6px] text-[12px] font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:text-[var(--brand)] cursor-pointer"
                  style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
                >
                  重置全部筛选
                </button>
                {['P17456', '同余', '二分', 'SLF4J'].map(kw => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => {
                      setScope({ kind: 'all' });
                      setTypeTab('all');
                      handleQuickFilter(kw);
                    }}
                    className="px-3 py-1 rounded-[6px] text-[12px] font-mono bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand)] cursor-pointer"
                    style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {pagePosts.map(post => {
                const badge = getBadgeMeta(post);
                const pid = extractProblemId(post.title, post.slug);
                const kind = classifyPostKind(post);
                const pillCls =
                  badge.track === 'gesp'
                    ? 'wb-pill-gesp'
                    : badge.track === 'contest'
                    ? 'wb-pill-contest'
                    : 'wb-pill-arch';

                return (
                  <Link
                    key={post.slug}
                    href={`/${post.slug}/`}
                    prefetch={false}
                    title={post.title}
                    className={`group flex flex-wrap md:grid md:grid-cols-[88px_96px_minmax(0,1fr)_90px_58px_18px] items-center justify-between gap-x-3 gap-y-1.5 px-3.5 border-b last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors ${
                      compact ? 'py-2' : 'py-2.5 md:py-2.5'
                    }`}
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    {/* Col 1: Semantic Track Badge */}
                    <span className={`wb-pill ${pillCls} order-1`}>{badge.label}</span>

                    {/* Col 2: Problem ID or Content Type (desktop) */}
                    <span className="hidden md:inline-flex items-center gap-1.5 min-w-0 order-2">
                      {pid ? (
                        <span className="font-mono tnum text-[12px] font-semibold text-[var(--ink-primary)]">
                          {pid}
                        </span>
                      ) : kind === 'syllabus' ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)] truncate">
                          <PenLine className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>考纲精讲</span>
                        </span>
                      ) : kind === 'arch' ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)] truncate">
                          <Monitor className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{post.subtopic || '工程实战'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)] truncate">
                          <Code2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>题解笔记</span>
                        </span>
                      )}
                    </span>

                    {/* Col 3: Title + Core Takeaway */}
                    <div className="order-3 flex-[1_0_100%] md:flex-initial min-w-0">
                      <div className="text-[14px] md:text-[13.5px] font-medium text-[var(--ink-primary)] group-hover:text-[var(--brand)] leading-snug line-clamp-2 md:line-clamp-1 transition-colors">
                        {formatCompactTitle(post.title)}
                      </div>
                      {!compact && post.excerpt ? (
                        <div className="text-[12px] text-[var(--ink-muted)] truncate mt-0.5">
                          {post.excerpt}
                        </div>
                      ) : null}
                    </div>

                    {/* Col 4: Date */}
                    <time
                      dateTime={post.date}
                      className="order-2 md:order-4 ml-auto md:ml-0 text-right font-mono tnum text-[11.5px] md:text-[12px] text-[var(--ink-muted)] whitespace-nowrap"
                    >
                      {post.date}
                    </time>

                    {/* Col 5: Read Time (desktop) */}
                    <span className="hidden md:block order-5 text-right font-mono tnum text-[12px] text-[var(--ink-muted)] whitespace-nowrap">
                      {formatReadTimeCompact(post.readTime)}
                    </span>

                    {/* Col 6: Chevron (desktop) */}
                    <span
                      aria-hidden="true"
                      className="hidden md:grid place-items-center order-6 text-[var(--ink-faint)] opacity-70 group-hover:opacity-100 group-hover:text-[var(--brand)] transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Table Pagination Footer */}
          <div
            className="px-3.5 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[12px] text-[var(--ink-muted)]"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <span className="font-mono tnum">
              {pagePosts.length > 0
                ? `显示 ${startIdx + 1}–${startIdx + pagePosts.length} / 共 ${totalCountDisplay.toLocaleString()} 篇原创内容`
                : '0 条匹配结果'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => handlePageChange(safePage - 1)}
                className="px-2.5 py-1 rounded-[5px] text-[11.5px] font-medium bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
              >
                上一页
              </button>
              <span className="font-mono tnum px-2 text-[11.5px]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => handlePageChange(safePage + 1)}
                className="px-2.5 py-1 rounded-[5px] text-[11.5px] font-medium bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                style={{ boxShadow: '0 0 0 1px var(--border-strong)' }}
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Utility Strip: WeChat QR + QQ Community + Full Archives */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="wb-card p-3.5 flex items-center gap-3.5">
            <img
              src="/images/wechat_qrcode.jpg"
              alt="OneCoder GESP/CSP 学习公众号二维码"
              loading="lazy"
              className="w-14 h-14 rounded-[6px] flex-shrink-0 object-cover"
              style={{ boxShadow: '0 0 0 1px var(--border-hairline)' }}
            />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--ink-primary)]">
                GESP / CSP 学习公众号
              </div>
              <p className="text-[12px] text-[var(--ink-muted)] mt-0.5 leading-snug">
                微信扫码关注，同步获取每日考纲精讲与真题解析推送。
              </p>
            </div>
          </div>

          <div className="wb-card p-3.5 flex flex-col justify-between gap-2">
            <div>
              <div className="text-[13px] font-semibold text-[var(--ink-primary)]">
                技术交流与考级答疑群
              </div>
              <p className="text-[12px] text-[var(--ink-muted)] mt-0.5 leading-snug">
                C++ GESP/CSP 群（688906745）· Java/Python 群（982860385）
              </p>
            </div>
            <div className="flex items-center gap-3 text-[12px] font-medium">
              <a
                href="https://qm.qq.com/q/fykBPjH8ru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[var(--brand)] hover:underline"
              >
                <span>加入信奥群</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://github.com/lihongzheshuai/yummy-code"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[var(--ink-secondary)] hover:text-[var(--brand)]"
              >
                <span>GitHub 开源题库</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="wb-card p-3.5 flex flex-col justify-between gap-2">
            <div>
              <div className="text-[13px] font-semibold text-[var(--ink-primary)]">
                全站目录与专题直达
              </div>
              <p className="text-[12px] text-[var(--ink-muted)] mt-0.5 leading-snug">
                始于 2012 年的全部 {stats.total.toLocaleString()} 篇技术笔记按年份与多级目录归档。
              </p>
            </div>
            <div className="flex items-center gap-3 text-[12px] font-medium">
              <Link href="/archives/" prefetch={false} className="text-[var(--brand)] hover:underline">
                年份归档 →
              </Link>
              <Link href="/categories/" prefetch={false} className="text-[var(--ink-secondary)] hover:text-[var(--brand)]">
                多级分类
              </Link>
              <Link href="/tags/" prefetch={false} className="text-[var(--ink-secondary)] hover:text-[var(--brand)]">
                全部标签
              </Link>
            </div>
          </div>
        </div>

        {/* Single Clean Below-the-Fold AdSense Unit (Preserves monetization without polluting hero) */}
        <GoogleAd
          slot="9656071817"
          format="fluid"
          layoutKey="-eu-2+fi-5k-by"
          minHeight={90}
          label="广告位 · 首页索引底部"
        />
      </div>
    </div>
  );
}
