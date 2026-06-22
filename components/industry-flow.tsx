'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { renderBold } from '@/lib/render-bold';
import { MoveHorizontal } from 'lucide-react';
import type { IndustryAnalysis } from '@/lib/analysis-schema';

type CardData = {
  id: string;
  label: string;
  description: string;
  aiHint: string;
  sectionId: string;
  tag: string;
};

function buildCards(analysis: IndustryAnalysis): CardData[] {
  const cards: CardData[] = [];
  const pains = analysis.painPoints || [];
  const opps = analysis.aiOpportunities || [];
  const companies = analysis.companies || [];

  if (pains[0]) cards.push({ id: 'upstream', tag: '上游', label: pains[0].title, description: pains[0].description, aiHint: opps[0]?.scenario || 'AI 赋能点', sectionId: pains[0].detailId });
  if (opps[0]) cards.push({ id: 'midstream', tag: '中游', label: opps[1]?.scenario || opps[0].scenario, description: opps[1]?.value || opps[0].value, aiHint: opps[1]?.modelType || opps[0].modelType, sectionId: opps[1]?.detailId || opps[0].detailId });
  if (companies[0]) cards.push({ id: 'downstream', tag: '下游', label: pains[1]?.title || companies[0].name, description: pains[1]?.description || companies[0].notes, aiHint: opps[2]?.scenario || '智能化应用', sectionId: pains[1]?.detailId || companies[0].detailId });
  if (pains[2] || opps[2]) {
    const item = pains[2] || pains[1];
    cards.push({ id: 'infra', tag: '基础设施', label: item?.title || '数据底座', description: item?.description || '支撑全链路数据流转', aiHint: opps[opps.length - 1]?.modelType || 'RAG + 知识图谱', sectionId: item?.detailId || opps[opps.length - 1]?.detailId || '' });
  }

  return cards;
}

export function IndustryFlow({ analysis, onNodeSelect }: { analysis: IndustryAnalysis; onNodeSelect: (sectionId: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragged, setDragged] = useState(false);

  const cards = buildCards(analysis);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    setDragged(false);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const delta = x - startX.current;
    if (Math.abs(delta) > 4) setDragged(true);
    scrollRef.current.scrollLeft = scrollLeft.current - delta;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }, []);

  const handleCardClick = useCallback((card: CardData) => {
    if (dragged) return;
    setSelected(card.id);
    onNodeSelect(card.sectionId);
  }, [dragged, onNodeSelect]);

  return (
    <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto pb-3 select-none"
        style={{ cursor: 'grab', scrollbarWidth: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {cards.map((card, i) => (
          <div key={card.id} className="flex items-center flex-shrink-0">
            <div
              onClick={() => handleCardClick(card)}
              className={`w-[260px] flex-shrink-0 rounded-[12px] border p-5 transition cursor-pointer ${
                selected === card.id ? 'border-[var(--color-accent)]/40 bg-[var(--color-elevated)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-muted)]/20'
              }`}
            >
              <div className="mb-3">
                <span className="text-[13px] font-semibold text-[var(--color-ink-strong)]">{card.tag}</span>
              </div>
              <h3 className="text-[14px] font-medium text-[var(--color-ink-strong)] leading-snug">{card.label}</h3>
              <p className="mt-2 text-[13px] text-[var(--color-muted)] leading-[1.6]">{renderBold(card.description)}</p>
              <div className="mt-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                <p className="text-[11px] text-[var(--color-muted)] opacity-70 mb-1">AI 结合点</p>
                <p className="text-[13px] text-[var(--color-ink)] leading-[1.5]">{renderBold(card.aiHint)}</p>
              </div>
            </div>
            {i < cards.length - 1 && (
              <svg width="40" height="16" viewBox="0 0 40 16" fill="none" className="flex-shrink-0 text-[var(--color-muted)] opacity-30">
                <line x1="0" y1="8" x2="32" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                <polyline points="28,3 38,8 28,13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-[var(--color-muted)] opacity-40 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6h6M7.5 4l2 2-2 2M4.5 4l-2 2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        左右拖动查看完整产业链
      </p>
    </div>
  );
}
