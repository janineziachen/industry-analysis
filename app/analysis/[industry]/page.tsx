'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Loader2, FileText, Copy, Check, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { IndustryFlow } from '@/components/industry-flow';
import { DetailModal } from '@/components/detail-modal';
import { ReportEditor } from '@/components/report-editor';
import { ReportConfigModal } from '@/components/report-config-modal';
import { ExpertChat } from '@/components/expert-chat/ExpertChat';
import { TableOfContents } from '@/components/table-of-contents';
import { loadSettings } from '@/lib/chat-storage';
import { renderBold } from '@/lib/render-bold';
import { buildFallbackAnalysis } from '@/lib/analysis-schema';
import { buildReportHtml } from '@/lib/report-content';
import type { IndustryAnalysis, DetailSection } from '@/lib/analysis-schema';
import type { ReportOptions } from '@/lib/report-content';

const severityColor: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
};

const severityLabel: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const maturityLabel: Record<string, string> = {
  high: 'AI 成熟',
  medium: 'AI 发展中',
  low: 'AI 早期',
};

const maturityColor: Record<string, string> = {
  high: 'text-emerald-500',
  medium: 'text-amber-500',
  low: 'text-[var(--color-muted)]',
};

type DetailRequest = {
  id: string;
  type: 'pain' | 'opportunity' | 'company' | 'timeline';
  title: string;
};

function CopyCard({ text, scene }: { text: string; scene?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-1 py-4 last:border-0">
      <div className="flex-1 min-w-0">
        {scene && <p className="mb-1.5 text-[15px] font-semibold text-[var(--color-ink-strong)]">{scene}</p>}
        <p className="text-[15px] leading-[1.8] text-[var(--color-ink)]"><span>{renderBold(text)}</span></p>
      </div>
      <button onClick={handleCopy} className="mt-1 shrink-0 rounded-md p-1.5 text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--color-ink-strong)]" aria-label="复制">
        {copied ? <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function SourcesSection({ industry, analysis }: { industry: string; analysis: IndustryAnalysis }) {
  const cacheKey = `sources_cache_${industry}`;

  const [extra, setExtra] = useState<Array<{ title: string; url?: string; citedIn?: string }> | null>(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sources = extra ?? (analysis.sources && analysis.sources.length > 0 ? analysis.sources : null);

  const regenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { loadSettings } = await import('@/lib/chat-storage');
      const settings = loadSettings();
      const res = await fetch('/api/analyze-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          apiKey: settings?.anthropicApiKey,
          baseUrl: settings?.anthropicBaseUrl,
          model: settings?.anthropicModel,
        }),
      });
      if (!res.ok) throw new Error('生成失败');
      const json = await res.json();
      setExtra(json.sources);
      try { localStorage.setItem(cacheKey, JSON.stringify(json.sources)); } catch {}
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [industry, cacheKey]);

  return (
    <section className="section-divider mb-16">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">参考来源</h2>
        <button
          onClick={regenerate}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {loading ? '生成中...' : '重新生成'}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}
      {sources ? (
        <div className="space-y-1.5">
          {sources.map((src, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13px]">
              <span className="text-[var(--color-muted)] opacity-60 tabular-nums shrink-0">[{i + 1}]</span>
              {src.url ? (
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-ink)] opacity-70 transition hover:opacity-100 underline-offset-2 hover:underline leading-relaxed">
                  {src.title}
                </a>
              ) : (
                <span className="text-[var(--color-ink)] opacity-70 leading-relaxed">{src.title}</span>
              )}
              {src.citedIn && <span className="text-[11px] text-[var(--color-muted)] opacity-40 shrink-0 mt-0.5">· {src.citedIn}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[var(--color-muted)]">本次报告未包含参考来源，点击"重新生成"单独获取。</p>
      )}
    </section>
  );
}

function QuickConclusion({ industry, analysis, onDataGenerated }: { industry: string; analysis: IndustryAnalysis; onDataGenerated?: (data: { threeMinuteSummary: string; interviewLines: { scene: string; line: string }[] }) => void }) {
  const cacheKey = `quick_cache_${industry}`;

  const [data, setData] = useState<{ threeMinuteSummary: string; interviewLines: { scene: string; line: string }[] } | null>(() => {
    try {
      const cached = localStorage.getItem(`quick_cache_${industry}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        onDataGenerated?.(parsed);
        return parsed;
      }
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { loadSettings } = await import('@/lib/chat-storage');
      const settings = loadSettings();
      const res = await fetch('/api/analyze-quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          summary: analysis.summary,
          painPoints: analysis.painPoints?.map(p => p.title),
          aiOpportunities: analysis.aiOpportunities?.map(o => o.scenario),
          apiKey: settings?.anthropicApiKey,
          baseUrl: settings?.anthropicBaseUrl,
          model: settings?.anthropicModel,
        }),
      });
      if (!res.ok) throw new Error('生成失败');
      const json = await res.json();
      setData(json);
      onDataGenerated?.(json);
      try { localStorage.setItem(cacheKey, JSON.stringify(json)); } catch {}
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [industry, analysis, onDataGenerated, cacheKey]);

  if (!data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {loading ? '生成中...' : '生成行业速通'}
        </button>
        {error && <p className="text-[12px] text-red-400">{error}</p>}
      </div>
    );
  }

  const bySentence = data.threeMinuteSummary.split(/(?<=[。！？])\s*/).map(s => s.trim()).filter(Boolean);
  const parts = bySentence.length <= 1 && data.threeMinuteSummary.length > 60
    ? data.threeMinuteSummary.split(/[，,；;]\s*/).map(s => s.trim()).filter(s => s.length > 4)
    : bySentence;

  return (
    <>
      <div className="mb-8">
        {parts.map((s, i) => (
          <p key={i} className="mb-2.5 text-[14px] leading-[1.8] text-[var(--color-ink)]">{s}</p>
        ))}
      </div>
      <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2 shadow-card">
        {data.interviewLines.map((item, i) => (
          <CopyCard key={i} text={item.line} scene={item.scene} />
        ))}
      </div>
      <button onClick={() => { setData(null); try { localStorage.removeItem(cacheKey); } catch {} generate(); }} className="mt-4 flex items-center gap-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition">
        <RefreshCw className="h-3 w-3" /> 重新生成
      </button>
    </>
  );
}

export default function AnalysisPage() {
  const params = useParams();
  const industry = decodeURIComponent(params.industry as string);

  const [analysis, setAnalysis] = useState<IndustryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showReportConfig, setShowReportConfig] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions | null>(null);
  const [quickConclusionData, setQuickConclusionData] = useState<{ threeMinuteSummary: string; interviewLines: { scene: string; line: string }[] } | null>(null);

  const [detailRequest, setDetailRequest] = useState<DetailRequest | null>(null);
  const [detailSection, setDetailSection] = useState<DetailSection | null>(null);
  const [detailStreamText, setDetailStreamText] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCache, setDetailCache] = useState<Record<string, DetailSection>>({});
  const detailCacheRef = useRef<Record<string, DetailSection>>({});
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const detailDismissed = useRef(false);
  const activeRequestId = useRef<number>(0);

  // 从 localStorage 恢复详情缓存（useEffect 里执行，避免 SSR 问题）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`detail_cache_${industry}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDetailCache(parsed);
        detailCacheRef.current = parsed;
      }
    } catch { /* 忽略 */ }
  }, [industry]);

  const [streamStalled, setStreamStalled] = useState(false);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cacheKey = `industry_cache_${industry}`;

    if (fetchKey === 0) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setAnalysis(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {}
    } else {
      try { localStorage.removeItem(cacheKey); localStorage.removeItem(`detail_cache_${industry}`); } catch {}
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setStreamStalled(false);
    setStreamText('');
    setError(null);

    (async () => {
      try {
        const settings = loadSettings();
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            industry,
            apiKey: settings?.anthropicApiKey || undefined,
            baseUrl: settings?.anthropicBaseUrl || undefined,
            model: settings?.anthropicModel || undefined,
            searchApiKey: settings?.searchApiKey || undefined,
          }),
        });

        if (!res.ok || !res.body) throw new Error('API 请求失败');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let gotResult = false;

        const resetStallTimer = () => {
          if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
          setStreamStalled(false);
          stallTimerRef.current = setTimeout(() => {
            if (!controller.signal.aborted) setStreamStalled(true);
          }, 15000);
        };
        resetStallTimer();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (controller.signal.aborted) return;

          resetStallTimer();
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6);
            try {
              const event = JSON.parse(json);
              if (event.chunk && !controller.signal.aborted) {
                setStreamText((prev) => prev + event.chunk);
              } else if (event.done && event.analysis && !controller.signal.aborted) {
                setAnalysis(event.analysis);
                setLoading(false);
                gotResult = true;
                try { localStorage.setItem(cacheKey, JSON.stringify(event.analysis)); } catch {}
              } else if (event.error && !controller.signal.aborted) {
                throw new Error(event.error);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && (parseErr.message.startsWith('API') || parseErr.message.includes('失败') || parseErr.message.includes('截断'))) {
                throw parseErr;
              }
            }
          }
        }

        if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
        if (!gotResult && !controller.signal.aborted) setStreamStalled(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
        setStreamStalled(true);
        setError((err as Error).message);
      }
    })();

    return () => {
      controller.abort();
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
  }, [industry, fetchKey]);

  const handleResume = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  // 保持 ref 和 state 同步，供 fetchDetail 闭包里直接读，避免陈旧快照
  useEffect(() => {
    detailCacheRef.current = detailCache;
  }, [detailCache]);

  const saveDetailCache = useCallback((id: string, section: DetailSection) => {
    setDetailCache((prev) => {
      const next = { ...prev, [id]: section };
      detailCacheRef.current = next;
      try {
        localStorage.setItem(`detail_cache_${industry}`, JSON.stringify(next));
      } catch { /* 空间不足时静默 */ }
      return next;
    });
  }, [industry]);

  const fetchDetail = useCallback(async (req: DetailRequest) => {
    detailDismissed.current = false;
    const myId = ++activeRequestId.current;

    // 用 ref 读缓存，避免闭包陈旧问题
    if (detailCacheRef.current[req.id]) {
      setDetailSection(detailCacheRef.current[req.id]);
      setDetailRequest(req);
      setDetailError(null);
      setDetailOpen(true);
      return;
    }

    setDetailRequest(req);
    setDetailOpen(true);
    setDetailSection(null);
    setDetailStreamText('');
    setDetailError(null);
    setDetailLoading(true);

    try {
      const settings = loadSettings();
      const res = await fetch('/api/analyze-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          id: req.id,
          type: req.type,
          title: req.title,
          apiKey: settings?.anthropicApiKey || undefined,
          baseUrl: settings?.anthropicBaseUrl || undefined,
          model: settings?.anthropicModel || undefined,
        }),
      });

      if (!res.ok || !res.body) throw new Error('详情请求失败');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);
            if (event.chunk) {
              accumulated += event.chunk;
              // 只有是当前活跃请求且弹窗未关闭时才更新流式文字
              if (myId === activeRequestId.current && !detailDismissed.current) {
                setDetailStreamText(accumulated);
              }
            } else if (event.done && event.section) {
              // 无论如何都存缓存（含 localStorage 持久化）
              saveDetailCache(req.id, event.section);
              // dismissed=true 说明弹窗已关（后台模式或强制关闭），不更新 UI
              // activeRequestId 不匹配说明已被新请求覆盖，同样不更新 UI
              if (myId === activeRequestId.current && !detailDismissed.current) {
                setDetailStreamText('');
                setDetailLoading(false);
                setDetailSection(event.section);
              }
            } else if (event.error) {
              throw new Error(event.error);
            }
          } catch (parseErr) {
            if ((parseErr as Error).message !== 'Unexpected token') {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if (myId === activeRequestId.current && !detailDismissed.current) {
        setDetailError((err as Error).message);
        setDetailLoading(false);
      }
    }
  }, [industry, saveDetailCache]);

  // 强制关闭：停止后台、清空状态
  const forceCloseDetail = useCallback(() => {
    detailDismissed.current = true;
    activeRequestId.current++;
    setShowCloseConfirm(false);
    setDetailOpen(false);
    setDetailRequest(null);
    setDetailSection(null);
    setDetailStreamText('');
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  // 后台继续：隐藏弹窗但 API 继续跑，完成后只存缓存
  const backgroundContinueDetail = useCallback(() => {
    detailDismissed.current = true;
    setShowCloseConfirm(false);
    setDetailOpen(false);
    setDetailRequest(null);
    setDetailSection(null);
    setDetailStreamText('');
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  const handleCloseDetail = useCallback(() => {
    if (detailLoading) {
      setShowCloseConfirm(true);
    } else {
      forceCloseDetail();
    }
  }, [detailLoading, forceCloseDetail]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          {!streamStalled && <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />}
          <p className="mt-5 text-[15px] text-[var(--color-ink-strong)]">正在分析「{industry}」</p>
          <p className="mt-2 text-[13px] text-[var(--color-muted)]">深度报告生成中，通常需要 2-5 分钟，取决于 API 响应速度</p>
          {streamText && (
            <p className="mt-4 max-w-xs text-center text-[11px] text-[var(--color-muted)] opacity-60 line-clamp-2">{streamText.slice(-100)}</p>
          )}
          {streamStalled && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-[13px] text-amber-600 dark:text-amber-400">
                {error ? `连接中断：${error}` : '输出似乎已停止'}
              </p>
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                重新生成
              </button>
              <p className="text-[11px] text-[var(--color-muted)]">{error ? '请点击重新生成' : '已生成的内容已保存，点击后从断点继续'}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (!analysis) return null;

  return (
    <main className="analysis-content min-h-screen px-4 pb-16 pt-20 md:px-8 lg:px-12">
      <TableOfContents items={[
        { id: 'sec-market', label: '市场规模' },
        { id: 'sec-flow', label: '产业链' },
        { id: 'sec-timeline', label: '编年史' },
        { id: 'sec-policy', label: '政策监管' },
        { id: 'sec-pain', label: '核心痛点' },
        { id: 'sec-opp', label: 'AI 机会' },
        { id: 'sec-compete', label: '竞争格局' },
        { id: 'sec-company', label: '对标企业' },
        { id: 'sec-invest', label: '投融资' },
        { id: 'sec-quick', label: '行业速通' },
      ]} />
      <div className="mx-auto max-w-[52rem]">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回
        </Link>

        {error && (
          <div className="mb-6 rounded-card border border-amber-500/20 bg-amber-900/10 px-4 py-3 text-sm text-amber-200/90">
            API 调用失败（{error}），当前显示模板数据。
          </div>
        )}

        {/* Header */}
        <header className="mb-16">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink-strong)] md:text-[2.5rem] md:leading-[1.2]">{analysis.industry}</h1>
          <p className="mt-4 text-[15px] leading-[1.8] text-[var(--color-muted)]">{renderBold(analysis.summary)}</p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setShowReportConfig(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-[13px] text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)] hover:border-[var(--color-border)]"
            >
              <FileText className="h-3.5 w-3.5" />
              导出报告
            </button>
            <button
              onClick={() => { setAnalysis(null); setLoading(true); setStreamText(''); setError(null); setFetchKey((k) => k + 1); }}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-[13px] text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)] hover:border-[var(--color-border)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重新生成
            </button>
          </div>
        </header>

        {/* 核心发现 */}
        {analysis.keyFindings && analysis.keyFindings.length > 0 && (
          <div className="mb-16 rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-card">
            <ul className="space-y-2.5">
              {analysis.keyFindings.map((finding, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.7] text-[var(--color-ink)]">
                  <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{renderBold(finding)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 市场数据仪表盘 */}
        {analysis.marketData && (
          <section id="sec-market" className="mb-16">
            <div className="flex items-baseline gap-3 mb-5">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">市场规模</h2>
              {analysis.lifecycleStage && (
                <span className="text-[13px] text-[var(--color-muted)]">{analysis.lifecycleStage}</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* 核心数据：规模 + 增速 */}
              <div className="md:col-span-1 flex flex-col gap-4">
                <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-4">
                  <p className="text-[14px] font-semibold text-[var(--color-ink-strong)] mb-3">市场规模</p>
                  <div className="space-y-1">
                    {analysis.marketData.totalSize.replace(/\*\*/g, '').split(/[\/／]/).map((part, i) => (
                      <p key={i} className="text-[22px] font-bold tracking-tight text-[var(--color-ink-strong)] leading-tight">{part.trim()}</p>
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--color-muted)]">{analysis.marketData.year} 年数据</p>
                </div>
                <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-4">
                  <p className="text-[14px] font-semibold text-[var(--color-ink-strong)] mb-3">同比增速</p>
                  {(() => {
                    const raw = analysis.marketData.growth.replace(/\*\*/g, '');
                    const match = raw.match(/^([^（(]+)([（(].+[）)])?(.*)$/);
                    const main = match?.[1]?.trim() ?? raw;
                    const note = (match?.[2] ?? '') + (match?.[3] ?? '');
                    return (
                      <>
                        <p className="text-[28px] font-bold tracking-tight text-[var(--color-accent)] leading-none">{main}</p>
                        {note && <p className="mt-2 text-[12px] text-[var(--color-muted)]">{note.replace(/[（）]/g, m => m === '（' ? '(' : ')')}</p>}
                      </>
                    );
                  })()}
                </div>
              </div>
              {/* 细分市场 + 预测 */}
              <div className="md:col-span-2 rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-4">
                <p className="text-[14px] font-semibold text-[var(--color-ink-strong)] mb-4">细分市场</p>
                <div className="space-y-2.5">
                  {analysis.marketData.segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-[var(--color-ink)] min-w-0 truncate">{seg.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="h-[3px] w-20 overflow-hidden rounded-full bg-[var(--color-border)]">
                          <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: seg.share, opacity: 0.6 }} />
                        </div>
                        <span className="text-[13px] font-medium tabular-nums text-[var(--color-ink-strong)] w-10 text-right">{seg.share}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {analysis.marketData.forecast && (
                  <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-[13px] text-[var(--color-muted)] leading-relaxed">{renderBold(analysis.marketData.forecast)}</p>
                )}
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-[var(--color-muted)] opacity-60">来源：{analysis.marketData.source}</p>
          </section>
        )}

        {/* 产业链图 */}
        <section id="sec-flow" className="section-divider mb-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">产业链全景</h2>
          <IndustryFlow
            analysis={analysis}
            onNodeSelect={(sectionId) => {
              const pain = analysis.painPoints.find((p) => p.detailId === sectionId);
              if (pain) { fetchDetail({ id: sectionId, type: 'pain', title: pain.title }); return; }
              const opp = analysis.aiOpportunities.find((o) => o.detailId === sectionId);
              if (opp) { fetchDetail({ id: sectionId, type: 'opportunity', title: opp.scenario }); return; }
              const comp = analysis.companies.find((c) => c.detailId === sectionId);
              if (comp) { fetchDetail({ id: sectionId, type: 'company', title: comp.name }); }
            }}
          />
        </section>

        {/* 编年史 */}
        <section id="sec-timeline" className="section-divider mb-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">行业编年史</h2>
          <div className="relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[var(--color-accent)] before:via-[var(--color-border)] before:to-transparent">
            {analysis.timeline.map((item) => (
              <button
                key={item.year}
                onClick={() => fetchDetail({ id: item.detailId, type: 'timeline', title: item.event })}
                className="relative w-full py-3 pl-4 text-left transition hover:bg-[var(--color-surface)] rounded-lg group"
              >
                <span className="absolute left-[-4.5px] top-[18px] h-[9px] w-[9px] rounded-full border-2 border-[var(--color-panel)] bg-[var(--color-accent)] opacity-60 transition group-hover:opacity-100" />
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 text-[14px] font-medium text-[var(--color-muted)] tabular-nums">{item.year}</span>
                  <span className="text-[15px] font-medium text-[var(--color-ink-strong)]">{item.event}</span>
                </div>
                <p className="mt-1 pl-[calc(4ch+0.75rem)] text-[13px] leading-[1.7] text-[var(--color-muted)]">{renderBold(item.impact)}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 政策与监管 */}
        {analysis.policies && analysis.policies.length > 0 && (
          <section id="sec-policy" className="section-divider mb-16">
            <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">政策与监管</h2>
            <div className="space-y-px rounded-card overflow-hidden border border-[var(--color-border)] shadow-card">
              {analysis.policies.map((pol) => (
                <button
                  key={pol.id}
                  onClick={() => fetchDetail({ id: pol.detailId, type: 'policy' as 'pain', title: pol.name })}
                  className="flex w-full items-start gap-5 bg-[var(--color-panel)] px-5 py-4 text-left transition hover:bg-[var(--color-elevated)]"
                >
                  <span className="shrink-0 pt-0.5 text-[14px] font-medium text-[var(--color-muted)] tabular-nums">{pol.year}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px] font-semibold text-[var(--color-ink-strong)]">{pol.name}</span>
                      <span className={`text-[12px] ${pol.type === 'positive' ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
                        {pol.type === 'positive' ? '利好' : '合规'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.7] text-[var(--color-muted)]">{renderBold(pol.impact)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 痛点 */}
        <section id="sec-pain" className="section-divider mb-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">核心痛点</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {analysis.painPoints.map((pain) => {
              const relatedOpp = analysis.aiOpportunities.find((o) => o.relatedPain === pain.id);
              return (
                <button
                  key={pain.id}
                  onClick={() => fetchDetail({ id: pain.detailId, type: 'pain', title: pain.title })}
                  className="card-hover flex flex-col rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] p-5 text-left shadow-card"
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold leading-snug text-[var(--color-ink-strong)]">{pain.title}</h3>
                    <span className={`shrink-0 mt-0.5 text-[12px] font-medium ${severityColor[pain.severity]}`}>
                      {severityLabel[pain.severity]}
                    </span>
                  </div>
                  <p className="flex-1 text-[13px] leading-[1.7] text-[var(--color-muted)]">{renderBold(pain.description)}</p>
                  {relatedOpp && (
                    <p className="mt-3 text-[12px] text-[var(--color-accent)]">
                      → {relatedOpp.scenario}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* AI 机会 */}
        <section id="sec-opp" className="section-divider mb-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">AI 机会点</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {analysis.aiOpportunities.map((opp) => {
              const relatedPainPoint = opp.relatedPain
                ? analysis.painPoints.find((p) => p.id === opp.relatedPain)
                : null;
              return (
                <button
                  key={opp.id}
                  onClick={() => fetchDetail({ id: opp.detailId, type: 'opportunity', title: opp.scenario })}
                  className="card-hover flex flex-col rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] p-5 text-left shadow-card"
                >
                  <h3 className="mb-2 text-[15px] font-semibold leading-snug text-[var(--color-ink-strong)]">{opp.scenario}</h3>
                  <p className="flex-1 text-[13px] leading-[1.7] text-[var(--color-muted)]">{renderBold(opp.value)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <span className="text-[var(--color-muted)]">{opp.modelType}</span>
                    {relatedPainPoint && (
                      <span className="text-red-400/60">← {relatedPainPoint.title}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 竞争格局 */}
        {analysis.competitiveLandscape && (
          <section id="sec-compete" className="section-divider mb-16">
            <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">竞争格局</h2>
            <p className="mb-5 text-[14px] leading-[1.8] text-[var(--color-muted)]">{renderBold(analysis.competitiveLandscape.summary)}</p>
            <div className="space-y-3">
              {analysis.competitiveLandscape.tiers.map((tier, i) => (
                <div key={i} className="rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-card">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-[15px] font-semibold text-[var(--color-ink-strong)]">{tier.level}</span>
                    <span className="text-[13px] text-[var(--color-muted)]">{renderBold(tier.description)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tier.companies.map((name, j) => (
                      <span key={j} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] text-[var(--color-ink)]">{name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {analysis.competitiveLandscape.dimensions && analysis.competitiveLandscape.dimensions.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-card border border-[var(--color-border)] shadow-card">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
                      <th className="px-5 py-3 text-left text-[14px] font-semibold text-[var(--color-ink-strong)]">竞争维度</th>
                      {(analysis.competitiveLandscape.tiers ?? []).map((tier, i) => (
                        <th key={i} className="px-5 py-3 text-left text-[14px] font-semibold text-[var(--color-ink-strong)]">{tier.level}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.competitiveLandscape.dimensions.map((dim, i) => {
                      const vals = [dim.tier1, dim.tier2, dim.tier3].filter(Boolean);
                      return (
                        <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="px-5 py-3 text-[14px] font-medium text-[var(--color-ink-strong)]">{renderBold(dim.name)}</td>
                          {vals.map((v, j) => (
                            <td key={j} className="px-5 py-3 text-[14px] text-[var(--color-ink)]">{renderBold(v ?? '')}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 企业 */}
        <section id="sec-company" className="section-divider mb-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">对标企业</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {analysis.companies.map((comp) => (
              <button
                key={comp.id}
                onClick={() => fetchDetail({ id: comp.detailId, type: 'company', title: comp.name })}
                className="card-hover flex flex-col h-full rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] p-5 text-left shadow-card"
              >
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[var(--color-ink-strong)] leading-snug">{comp.name}</h3>
                  <span className={`shrink-0 text-[12px] font-medium mt-0.5 ${maturityColor[comp.aiMaturity] ?? 'text-[var(--color-muted)]'}`}>
                    {maturityLabel[comp.aiMaturity] ?? `AI ${comp.aiMaturity}`}
                  </span>
                </div>
                <p className="flex-1 text-[13px] leading-[1.7] text-[var(--color-muted)]">{renderBold(comp.notes)}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 投融资动态 */}
        {analysis.investment && analysis.investment.length > 0 && (
          <section id="sec-invest" className="section-divider mb-16">
            <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">投融资动态</h2>
            <div className="space-y-3">
              {analysis.investment.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => fetchDetail({ id: inv.detailId, type: 'investment' as 'pain', title: inv.event })}
                  className="card-hover w-full rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-4 text-left shadow-card transition"
                >
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 mt-0.5 text-[13px] font-medium text-[var(--color-muted)] tabular-nums w-10">{inv.year}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-[15px] font-semibold text-[var(--color-ink-strong)]">{inv.event.replace(/\*\*/g, '')}</span>
                        {inv.amount && <span className="text-[14px] font-semibold text-[var(--color-accent)] shrink-0">{inv.amount.replace(/\*\*/g, '')}</span>}
                      </div>
                      {inv.parties && <p className="mt-1 text-[13px] text-[var(--color-muted)]">{inv.parties}</p>}
                      {inv.significance && <p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--color-ink)]">{renderBold(inv.significance)}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 行业速通 */}
        <section id="sec-quick" className="section-divider mb-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-[var(--color-ink-strong)]">行业速通</h2>
          <QuickConclusion industry={industry} analysis={analysis} onDataGenerated={setQuickConclusionData} />
        </section>

        {/* 数据来源 */}
        <SourcesSection industry={industry} analysis={analysis} />

        {/* 底部导出 */}
        <section className="section-divider mb-8">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[var(--color-muted)]">导出本报告</p>
            <button
              onClick={() => setShowReportConfig(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90"
            >
              <FileText className="h-3.5 w-3.5" />
              导出报告
            </button>
          </div>
        </section>

        {/* 下一步：产品规划 */}
        <section className="section-divider mb-16">
          <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-[13px] font-medium text-[var(--color-muted)] mb-1">行业分析已完成</p>
              <p className="text-[15px] font-semibold text-[var(--color-ink-strong)]">下一步：基于本报告制定产品规划</p>
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">用 JTBD、竞争定位、精益画布等框架，快速生成产品策略方案</p>
            </div>
            <Link
              href={`/planner?from=${encodeURIComponent(industry)}`}
              className="shrink-0 flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-[13px] font-medium text-white transition hover:opacity-90"
            >
              进入产品规划
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </section>

        <footer className="border-t border-[var(--color-border)] pt-6 pb-4">
          <p className="text-[11px] text-[var(--color-muted)] opacity-60">本报告由 AI 自动生成，仅供参考，不构成投资或决策建议。</p>
        </footer>
      </div>

      <DetailModal
        open={detailOpen}
        section={detailSection}
        streamText={detailStreamText}
        loading={detailLoading}
        error={detailError}
        title={detailRequest?.title}
        onClose={handleCloseDetail}
        onRetry={detailRequest ? () => fetchDetail(detailRequest) : undefined}
      />

      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-bg)]/85 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[16px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-2xl">
            <h3 className="text-[14px] font-semibold text-[var(--color-ink-strong)]">详情正在加载</h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--color-muted)]">是否继续在后台加载？完成后自动缓存。</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={forceCloseDetail}
                className="flex-1 rounded-[10px] border border-[var(--color-border)] py-2.5 text-[13px] text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)]"
              >
                取消
              </button>
              <button
                onClick={backgroundContinueDetail}
                className="flex-1 rounded-[10px] bg-[var(--color-accent)] py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
              >
                后台继续
              </button>
            </div>
          </div>
        </div>
      )}

      {showReport && reportOptions && (
        <ReportEditor
          analysis={quickConclusionData ? { ...analysis, quickConclusion: quickConclusionData } : analysis}
          initialHtml={buildReportHtml(quickConclusionData ? { ...analysis, quickConclusion: quickConclusionData } : analysis, reportOptions, detailCache)}
          onClose={() => setShowReport(false)}
        />
      )}

      {showReportConfig && (
        <ReportConfigModal
          analysis={analysis}
          detailCache={detailCache}
          onConfirm={(opts) => {
            setReportOptions(opts);
            setShowReportConfig(false);
            setShowReport(true);
          }}
          onCancel={() => setShowReportConfig(false)}
        />
      )}

      <ExpertChat analysis={analysis} activeSection={detailSection} />
    </main>
  );
}
