'use client';

import './analysis.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buildFallbackAnalysis } from '@/lib/analysis-schema';
import { loadSettings } from '@/lib/chat-storage';
import type { IndustryAnalysis, DetailSection } from '@/lib/analysis-schema';

export default function PreviewAnalysisPage() {
  const params = useParams();
  const industry = decodeURIComponent(params.industry as string);

  const [analysis, setAnalysis] = useState<IndustryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<DetailSection | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailCache = useRef<Record<string, DetailSection>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalysis() {
      const cacheKey = `industry_cache_${industry}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!cancelled) { setAnalysis(parsed); setLoading(false); return; }
        }
      } catch { /* continue */ }

      try {
        const settings = loadSettings();
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industry,
            apiKey: settings?.anthropicApiKey || undefined,
            baseUrl: settings?.anthropicBaseUrl || undefined,
            model: settings?.anthropicModel || undefined,
          }),
        });

        if (!res.ok || !res.body) throw new Error('API 请求失败');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.chunk && !cancelled) setStreamText(p => p + event.chunk);
              else if (event.done && event.analysis && !cancelled) {
                setAnalysis(event.analysis);
                setLoading(false);
                try { localStorage.setItem(cacheKey, JSON.stringify(event.analysis)); } catch {}
              }
              else if (event.error && !cancelled) throw new Error(event.error);
            } catch {}
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setAnalysis(buildFallbackAnalysis(industry));
          setLoading(false);
        }
      }
    }

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [industry]);

  // PLACEHOLDER_FETCH_DETAIL

  const fetchDetail = useCallback(async (id: string, title: string, type: string) => {
    if (detailCache.current[id]) {
      setActiveDetail(detailCache.current[id]);
      return;
    }
    setDetailLoading(true);
    setActiveDetail({ id, title, summary: '', causeEffect: [], dataPoints: [], cases: [], comparison: [], roadmap: [] });
    try {
      const settings = loadSettings();
      const res = await fetch('/api/analyze-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry, id, type, title,
          apiKey: settings?.anthropicApiKey || undefined,
          baseUrl: settings?.anthropicBaseUrl || undefined,
          model: settings?.anthropicModel || undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error('请求失败');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.done && event.section) {
              detailCache.current[id] = event.section;
              setActiveDetail(event.section);
            }
          } catch {}
        }
      }
    } catch {} finally {
      setDetailLoading(false);
    }
  }, [industry]);

  if (loading) {
    return (
      <main className="ap-page ap-loading-page">
        <div className="ap-loading-wrap">
          <div className="ap-spinner" />
          <h2 className="ap-loading-title">正在分析「{industry}」</h2>
          <p className="ap-loading-sub">AI 正在生成结构化洞察报告</p>
          {streamText && <p className="ap-loading-stream">{streamText.slice(-80)}</p>}
        </div>
      </main>
    );
  }

  if (!analysis) return null;
  const data = analysis;

  return (
    <main className="ap-page">
      <nav className="ap-nav">
        <div className="ap-nav-inner">
          <Link href="/preview" className="ap-nav-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ap-back-icon">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            返回
          </Link>
          <span className="ap-nav-title">{data.industry}</span>
          <span className="ap-nav-badge">AI Report</span>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="ap-header">
        <p className="ap-header-eyebrow">Industry Analysis</p>
        <h1 className="ap-header-title">{data.industry}</h1>
        <p className="ap-header-summary">{data.summary}</p>
        {error && <p className="ap-error-badge">当前为模板数据（API: {error}）</p>}
      </header>

      {/* Timeline */}
      <section className="ap-section">
        <h2 className="ap-section-title">行业编年史</h2>
        <div className="ap-timeline">
          {data.timeline.map((item, i) => (
            <button key={i} className="ap-timeline-item" onClick={() => fetchDetail(item.detailId, item.event, 'timeline')}>
              <span className="ap-timeline-year">{item.year}</span>
              <div className="ap-timeline-content">
                <p className="ap-timeline-event">{item.event}</p>
                <p className="ap-timeline-impact">{item.impact}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Pain Points */}
      <section className="ap-section">
        <h2 className="ap-section-title">核心痛点</h2>
        <div className="ap-card-grid">
          {data.painPoints.map((pain) => (
            <button key={pain.id} className="ap-card" onClick={() => fetchDetail(pain.detailId, pain.title, 'pain')}>
              <div className="ap-card-header">
                <h3 className="ap-card-title">{pain.title}</h3>
                <span className={`ap-severity ap-severity-${pain.severity}`}>{pain.severity}</span>
              </div>
              <p className="ap-card-desc">{pain.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* AI Opportunities */}
      <section className="ap-section">
        <h2 className="ap-section-title">AI 机会</h2>
        <div className="ap-card-grid">
          {data.aiOpportunities.map((opp) => (
            <button key={opp.id} className="ap-card" onClick={() => fetchDetail(opp.detailId, opp.scenario, 'opportunity')}>
              <h3 className="ap-card-title">{opp.scenario}</h3>
              <p className="ap-card-desc">{opp.value}</p>
              <span className="ap-card-tag">{opp.modelType}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Companies */}
      <section className="ap-section">
        <h2 className="ap-section-title">对标企业</h2>
        <div className="ap-card-grid">
          {data.companies.map((comp) => (
            <button key={comp.id} className="ap-card" onClick={() => fetchDetail(comp.detailId, comp.name, 'company')}>
              <div className="ap-card-header">
                <h3 className="ap-card-title">{comp.name}</h3>
                <span className={`ap-maturity ap-maturity-${comp.aiMaturity}`}>AI {comp.aiMaturity}</span>
              </div>
              <p className="ap-card-desc">{comp.notes}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Conclusion */}
      {data.quickConclusion && (
      <section className="ap-section ap-conclusion">
        <h2 className="ap-section-title">行业速通</h2>
        <p className="ap-conclusion-text">{data.quickConclusion.threeMinuteSummary}</p>
        <div className="ap-conclusion-lines">
          {data.quickConclusion.interviewLines.map((item, i) => (
            <div key={i} className="ap-conclusion-line">{typeof item === 'string' ? item : item.line}</div>
          ))}
        </div>
      </section>
      )}

      {/* Detail Modal */}
      {activeDetail && (
        <div className="ap-modal-overlay" onClick={() => setActiveDetail(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ap-modal-close" onClick={() => setActiveDetail(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {detailLoading && !activeDetail.summary ? (
              <div className="ap-modal-loading"><div className="ap-spinner" /></div>
            ) : (
              <>
                <h3 className="ap-modal-title">{activeDetail.title}</h3>
                {activeDetail.summary && <p className="ap-modal-summary">{activeDetail.summary}</p>}
                {activeDetail.causeEffect?.length > 0 && (
                  <div className="ap-modal-block">
                    <h4>因果链</h4>
                    {activeDetail.causeEffect.map((c, i) => <p key={i}>{c}</p>)}
                  </div>
                )}
                {activeDetail.dataPoints?.length > 0 && (
                  <div className="ap-modal-block">
                    <h4>关键数据</h4>
                    {activeDetail.dataPoints.map((d, i) => <p key={i}>{d}</p>)}
                  </div>
                )}
                {activeDetail.cases?.length > 0 && (
                  <div className="ap-modal-block">
                    <h4>案例</h4>
                    {activeDetail.cases.map((c, i) => <p key={i}>{c}</p>)}
                  </div>
                )}
                {activeDetail.roadmap?.length > 0 && (
                  <div className="ap-modal-block">
                    <h4>路径建议</h4>
                    {activeDetail.roadmap.map((r, i) => <p key={i}>{r}</p>)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
