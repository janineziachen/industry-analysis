'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { IndustryAnalysis, DetailSection } from '@/lib/analysis-schema';
import type { DetailInclusion, ReportOptions, GlossaryTerm } from '@/lib/report-content';
import { extractTermCandidates } from '@/lib/extract-terms';

type Props = {
  analysis: IndustryAnalysis;
  detailCache: Record<string, DetailSection>;
  onConfirm: (options: ReportOptions) => void;
  onCancel: () => void;
};

function buildDefaultInclusions(analysis: IndustryAnalysis): DetailInclusion[] {
  const result: DetailInclusion[] = [];
  analysis.painPoints.forEach((p) => result.push({ id: p.detailId, title: p.title, type: 'pain', include: false, placement: 'inline' }));
  analysis.aiOpportunities.forEach((o) => result.push({ id: o.detailId, title: o.scenario, type: 'opportunity', include: false, placement: 'inline' }));
  analysis.companies.forEach((c) => result.push({ id: c.detailId, title: c.name, type: 'company', include: false, placement: 'inline' }));
  return result;
}

const typeLabel: Record<string, string> = { pain: '核心痛点', opportunity: 'AI 机会点', company: '对标企业' };
const typeColor: Record<string, string> = {
  pain: 'text-red-500 bg-red-500/10',
  opportunity: 'text-[var(--color-accent)] bg-[var(--color-accent)]/10',
  company: 'text-amber-600 dark:text-yellow-400 bg-amber-500/10',
};

export function ReportConfigModal({ analysis, detailCache, onConfirm, onCancel }: Props) {
  const hasDetailSections = Object.keys(detailCache).length > 0 ||
    (!!analysis.detailSections && Object.keys(analysis.detailSections).length > 0);

  const [inclusions, setInclusions] = useState<DetailInclusion[]>(() => buildDefaultInclusions(analysis));
  const [detailExpanded, setDetailExpanded] = useState(false);

  // 术语表状态
  const [includeGlossary, setIncludeGlossary] = useState(false);
  const [glossaryExpanded, setGlossaryExpanded] = useState(false);
  const [termCandidates] = useState<string[]>(() => extractTermCandidates(analysis, detailCache));
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [glossaryLoading, setGlossaryLoading] = useState(false);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [glossaryError, setGlossaryError] = useState<string | null>(null);

  // 勾选术语表时自动展开
  useEffect(() => {
    if (includeGlossary) setGlossaryExpanded(true);
  }, [includeGlossary]);

  const toggleTerm = (term: string) => {
    setSelectedTerms((prev) => {
      const next = new Set(prev);
      next.has(term) ? next.delete(term) : next.add(term);
      return next;
    });
    // 有术语被选中就重置已生成的结果
    setGlossaryTerms([]);
    setGlossaryError(null);
  };

  const generateGlossary = async () => {
    if (selectedTerms.size === 0) return;
    setGlossaryLoading(true);
    setGlossaryError(null);
    try {
      const res = await fetch('/api/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: [...selectedTerms], industry: analysis.industry }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGlossaryTerms(data.terms);
    } catch (err) {
      setGlossaryError((err as Error).message);
    } finally {
      setGlossaryLoading(false);
    }
  };

  const toggleInclude = (id: string) => setInclusions((prev) => prev.map((d) => d.id === id ? { ...d, include: !d.include } : d));
  const togglePlacement = (id: string) => setInclusions((prev) => prev.map((d) => d.id === id ? { ...d, placement: d.placement === 'inline' ? 'appendix' : 'inline' } : d));
  const allOn = inclusions.every((d) => d.include);
  const toggleAll = () => setInclusions((prev) => prev.map((d) => ({ ...d, include: !allOn })));
  const anySelected = inclusions.some((d) => d.include);

  const handleConfirm = () => {
    onConfirm({
      detailInclusions: inclusions,
      includeGlossary,
      glossaryTerms: glossaryTerms.length > 0 ? glossaryTerms : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-accent)]">Report Config</p>
            <h2 className="mt-0.5 text-lg font-semibold">配置报告内容</h2>
          </div>
          <button onClick={onCancel} className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] p-2 text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">

          {/* 详情页颗粒度 */}
          <section>
            <button
              onClick={() => setDetailExpanded((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-ink)] transition hover:border-[var(--color-accent)]/30"
            >
              <span className="font-medium">是否纳入详情页内容？</span>
              <div className="flex items-center gap-2 text-[var(--color-muted)]">
                {anySelected ? <span className="text-[var(--color-accent)] text-xs">已选 {inclusions.filter((d) => d.include).length} 项</span> : <span className="text-xs">不纳入</span>}
                {detailExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {detailExpanded && (
              <div className="mt-3 space-y-2">
                {!hasDetailSections && (
                  <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-600 dark:text-yellow-300">
                    尚未加载任何详情页，请先在分析页点击卡片加载详情，再生成报告。
                  </p>
                )}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-[var(--color-muted)]">全选 / 全不选</span>
                  <button onClick={toggleAll} className="text-xs text-[var(--color-accent)] hover:underline">{allOn ? '全不选' : '全选'}</button>
                </div>
                {inclusions.map((item) => {
                  const hasData = !!(detailCache[item.id] ?? analysis.detailSections?.[item.id]);
                  return (
                    <div key={item.id} className={`rounded-2xl border px-4 py-3 transition ${item.include ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-panel)]'} ${!hasData ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={item.include} onChange={() => hasData && toggleInclude(item.id)} disabled={!hasData} className="h-4 w-4 accent-[#2dd4bf] cursor-pointer" />
                        <span className="flex-1 text-sm text-[var(--color-ink-strong)]">{item.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${typeColor[item.type]}`}>{typeLabel[item.type]}</span>
                        {!hasData && <span className="text-xs text-[var(--color-muted)]">未加载</span>}
                      </div>
                      {item.include && hasData && (
                        <div className="mt-3 flex gap-2 pl-7">
                          <button onClick={() => item.placement !== 'inline' && togglePlacement(item.id)} className={`rounded-xl px-3 py-1 text-xs transition ${item.placement === 'inline' ? 'bg-[var(--color-accent)] text-white font-medium' : 'border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]'}`}>嵌入正文</button>
                          <button onClick={() => item.placement !== 'appendix' && togglePlacement(item.id)} className={`rounded-xl px-3 py-1 text-xs transition ${item.placement === 'appendix' ? 'bg-[var(--color-accent)] text-white font-medium' : 'border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]'}`}>作为附件</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 专业名词解释 */}
          <section>
            <button
              onClick={() => { setIncludeGlossary((v) => !v); }}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${includeGlossary ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-ink-strong)]' : 'border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-ink)] hover:border-[var(--color-accent)]/30'}`}
            >
              <div className="text-left">
                <p className="font-medium">添加专业名词解释</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">AI 自动识别全文术语，生成解释附在报告末尾</p>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-muted)] ml-4 shrink-0">
                {includeGlossary && selectedTerms.size > 0 && <span className="text-[var(--color-accent)] text-xs">已选 {selectedTerms.size} 个术语</span>}
                {includeGlossary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {includeGlossary && glossaryExpanded && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-[var(--color-muted)] px-1">系统从全文识别出以下候选术语，勾选你希望解释的：</p>

                {termCandidates.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)] px-1">未识别到明显的专业术语</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (selectedTerms.size === termCandidates.length) {
                          setSelectedTerms(new Set());
                        } else {
                          setSelectedTerms(new Set(termCandidates));
                        }
                        setGlossaryTerms([]);
                        setGlossaryError(null);
                      }}
                      className={`rounded-full px-3 py-1 text-xs transition border ${
                        selectedTerms.size === termCandidates.length
                          ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] font-medium'
                          : 'border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-ink-strong)]'
                      }`}
                    >
                      全部
                    </button>
                    {termCandidates.map((term) => (
                      <button
                        key={term}
                        onClick={() => toggleTerm(term)}
                        className={`rounded-full px-3 py-1 text-xs transition border ${
                          selectedTerms.has(term)
                            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] font-medium'
                            : 'border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-ink-strong)]'
                        }`}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}

                {selectedTerms.size > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={generateGlossary}
                      disabled={glossaryLoading}
                      className="flex items-center gap-2 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20 disabled:opacity-50"
                    >
                      {glossaryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {glossaryLoading ? '生成中...' : `生成 ${selectedTerms.size} 个术语解释`}
                    </button>

                    {glossaryError && <p className="text-xs text-red-400">{glossaryError}</p>}

                    {glossaryTerms.length > 0 && (
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 space-y-2">
                        <p className="text-xs text-[var(--color-muted)]">预览（可在报告编辑器中修改）：</p>
                        {glossaryTerms.map((t) => (
                          <div key={t.term} className="text-sm">
                            <span className="font-semibold text-[var(--color-ink-strong)]">{t.term}</span>
                            <span className="text-[var(--color-muted)] ml-2">{t.definition}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
          <button onClick={onCancel} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)]">取消</button>
          <button
            onClick={handleConfirm}
            disabled={includeGlossary && selectedTerms.size > 0 && glossaryTerms.length === 0 && !glossaryLoading}
            className="rounded-xl bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {includeGlossary && selectedTerms.size > 0 && glossaryTerms.length === 0 ? '请先生成术语解释' : '生成报告'}
          </button>
        </div>
      </div>
    </div>
  );
}
