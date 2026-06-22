'use client';

import { useMemo, useState, useEffect } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import type { DetailSection } from '@/lib/analysis-schema';
import { renderBold } from '@/lib/render-bold';

const tabs = [
  { id: 'cause', label: '因果链' },
  { id: 'data', label: '数据' },
  { id: 'case', label: '案例' },
  { id: 'compare', label: '对比' },
  { id: 'roadmap', label: '路线图' },
] as const;

const tabSummaries: Record<(typeof tabs)[number]['id'], string> = {
  cause: '先看问题是怎么形成的，再看它会影响哪些业务环节。',
  data: '用数据和趋势判断来验证这个问题是否真实存在、是否值得优先处理。',
  case: '看真实案例，判断行业里已经有人怎么做、做到了什么程度。',
  compare: '横向对比不同方案和不同公司，找出最值得借鉴的路径。',
  roadmap: '最终落到怎么做、先做什么、谁来做、怎么验证效果。',
};

// 从流式 JSON 文本中尽力提取已生成的字段
function parsePartialSection(text: string): Partial<DetailSection> | null {
  if (!text.trim()) return null;

  // 先尝试完整解析
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch {
    // 继续尝试部分解析
  }

  const result: Partial<DetailSection> = {};

  // 提取字符串字段
  const stringFields: (keyof DetailSection)[] = ['id', 'title', 'summary'];
  for (const field of stringFields) {
    const match = text.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (match) (result as Record<string, unknown>)[field] = match[1];
  }

  // 提取数组字段（已关闭的数组）
  const arrayFields: (keyof DetailSection)[] = ['causeEffect', 'dataPoints', 'cases', 'comparison', 'roadmap'];
  for (const field of arrayFields) {
    const match = text.match(new RegExp(`"${field}"\\s*:\\s*(\\[[\\s\\S]*?\\])`));
    if (match) {
      try {
        (result as Record<string, unknown>)[field] = JSON.parse(match[1]);
      } catch {
        // 数组未关闭，尝试提取已完成的条目
        const partial = text.match(new RegExp(`"${field}"\\s*:\\s*\\[([\\s\\S]*)`));
        if (partial) {
          const items: string[] = [];
          const itemMatches = partial[1].matchAll(/"((?:[^"\\]|\\.)*)"/g);
          for (const m of itemMatches) items.push(m[1]);
          if (items.length) (result as Record<string, unknown>)[field] = items;
        }
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export function DetailModal({
  open,
  section,
  streamText,
  loading,
  error,
  onClose,
  onRetry,
  title,
}: {
  open?: boolean;
  section: DetailSection | null;
  streamText?: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  title?: string;
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('cause');

  // 重置 tab 每次打开新详情
  useEffect(() => {
    if (loading) setActiveTab('cause');
  }, [loading]);

  const partial = useMemo(() => {
    if (section || !streamText) return null;
    return parsePartialSection(streamText);
  }, [section, streamText]);

  // 当前展示的数据源：完整 section > 流式 partial
  const display: Partial<DetailSection> | null = section ?? partial;

  const content = useMemo(() => {
    if (!display) return null;
    return {
      cause: display.causeEffect ?? [],
      data: display.dataPoints ?? [],
      case: display.cases ?? [],
      compare: display.comparison ?? [],
      roadmap: display.roadmap ?? [],
    };
  }, [display]);

  const isStreaming = !section && !!streamText;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80 px-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] p-2 text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)]"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 纯 loading（尚未收到任何 chunk）*/}
        {loading && !streamText && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-muted)]">正在生成「{title}」的深度分析，约需 5-10 秒...</p>
          </div>
        )}

        {/* 错误 */}
        {!loading && !streamText && error && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
            <p className="text-center text-sm text-red-400">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)]"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </button>
            )}
          </div>
        )}

        {/* 流式 or 完整内容 */}
        {(isStreaming || section) && (
          <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[260px_1fr]">
            <aside className="overflow-y-auto border-b border-[var(--color-border)] bg-[var(--color-panel)] p-6 md:border-b-0 md:border-r">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">Deep Analysis</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">
                {display?.title ?? title ?? '加载中...'}
                {isStreaming && <span className="ml-1 animate-pulse text-[var(--color-accent)]">▍</span>}
              </h2>
              {display?.summary && (
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{display.summary}</p>
              )}

              <div className="mt-5 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">本页结论</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{tabSummaries[activeTab]}</p>
              </div>

              <div className="mt-6 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                      activeTab === tab.id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-elevated)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </aside>

            <section className="overflow-y-auto p-6 md:p-8">
              <div className="mb-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-accent)]">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--color-ink-strong)]">
                  {display?.title ?? title ?? '加载中...'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{tabSummaries[activeTab]}</p>
              </div>

              {content && content[activeTab].length > 0 ? (
                <div className="grid gap-4">
                  {content[activeTab].map((item, i) => {
                    // 解析 "标题：内容" 格式，把冒号前的部分作为标题
                    const colonIdx = item.search(/[：:]/);
                    const hasLabel = colonIdx > 0 && colonIdx <= 8;
                    const label = hasLabel ? item.slice(0, colonIdx) : null;
                    const body = hasLabel ? item.slice(colonIdx + 1).trim() : item;
                    return (
                      <article key={i} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                        {label && (
                          <p className="text-[13px] font-semibold text-[var(--color-ink-strong)] mb-1.5">{label}</p>
                        )}
                        <p className="text-sm leading-7 text-[var(--color-ink)]">{renderBold(body)}</p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {isStreaming && streamText && (
                    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                      <p className="text-xs text-[var(--color-muted)] mb-2">正在生成中...</p>
                      <p className="text-sm leading-6 text-[var(--color-muted)] whitespace-pre-wrap line-clamp-6">{streamText.slice(-300)}</p>
                      <span className="animate-pulse text-[var(--color-accent)]">▍</span>
                    </div>
                  )}
                  {!isStreaming && (
                    <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">暂无内容</div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
