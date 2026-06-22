import type { IndustryAnalysis, DetailSection } from './analysis-schema';

export type DetailInclusion = {
  id: string;
  title: string;
  type: 'pain' | 'opportunity' | 'company';
  include: boolean;
  placement: 'inline' | 'appendix';
};

export type GlossaryTerm = {
  term: string;
  definition: string;
};

export type ReportOptions = {
  detailInclusions: DetailInclusion[];
  includeGlossary: boolean;
  glossaryTerms?: GlossaryTerm[];
};

function inlineMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function splitToSentences(text: string): string[] {
  const bySentence = text
    .split(/(?<=[。！？])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bySentence.length <= 1 && text.length > 60) {
    return text
      .split(/[，,；;]\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 4);
  }
  return bySentence;
}

function divider() {
  return `<hr/>`;
}

// 用 blockquote 替代 div.report-card — tiptap 原生支持，样式不会被剥离
function card(content: string) {
  return `<blockquote>${content}</blockquote>`;
}

// 详情区块：用 h3 替代 p.report-label，用原生 ul/li，样式完全靠 CSS
function buildDetailSectionHtml(section: DetailSection): string {
  const ceItems = section.causeEffect.map((s) => `<li>${inlineMd(s)}</li>`).join('');
  const dpItems = section.dataPoints.map((s) => `<li>${inlineMd(s)}</li>`).join('');
  const caseItems = section.cases.map((s) => `<li>${inlineMd(s)}</li>`).join('');
  const cmpItems = section.comparison.map((s) => `<li>${inlineMd(s)}</li>`).join('');
  const rmItems = section.roadmap.map((s, i) => {
    const clean = s.replace(/^第[一二三四五\d]步[：:]\s*/, '');
    return `<li><strong>第${['一', '二', '三', '四', '五'][i] ?? i + 1}步</strong>　${inlineMd(clean)}</li>`;
  }).join('');

  return `
<p><em>${inlineMd(section.summary)}</em></p>
<h3>▌ 因果链路</h3>
<ul>${ceItems}</ul>
<h3>▌ 数据佐证</h3>
<ul>${dpItems}</ul>
<h3>▌ 真实案例</h3>
<ul>${caseItems}</ul>
<h3>▌ 方案对比</h3>
<ul>${cmpItems}</ul>
<h3>▌ 落地路线</h3>
<ul>${rmItems}</ul>
`;
}

export function buildReportHtml(
  analysis: IndustryAnalysis,
  options: ReportOptions = { detailInclusions: [], includeGlossary: false },
  detailCache: Record<string, DetailSection> = {},
): string {
  const { industry, summary, timeline, painPoints, aiOpportunities, companies, quickConclusion } = analysis;
  const { detailInclusions, includeGlossary } = options;

  const resolveSection = (id: string): DetailSection | undefined =>
    detailCache[id] ?? analysis.detailSections?.[id];

  const inlineIds = new Set(detailInclusions.filter((d) => d.include && d.placement === 'inline').map((d) => d.id));
  const appendixIds = new Set(detailInclusions.filter((d) => d.include && d.placement === 'appendix').map((d) => d.id));

  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── 封面页（用 h1 + p 组合，tiptap 完全支持）──────────
  const coverHtml = `
<h1>${industry} 行业深度分析报告</h1>
<p><em>生成日期：${date}　·　内部参考 · AI 生成</em></p>
${divider()}
`;

  // ── 执行摘要 ──────────────────────────────────────────
  const sentences = splitToSentences(quickConclusion?.threeMinuteSummary ?? summary).slice(0, 5);
  const execSummaryItems = sentences.map((s) => `<li>${inlineMd(s)}</li>`).join('');
  const execSummaryHtml = `
<h2>执行摘要</h2>
<ul>${execSummaryItems}</ul>
`;

  // ── 编年史 ────────────────────────────────────────────
  const timelineItems = timeline.map((t) => card(`
<p><strong>${t.year}　${t.event}</strong></p>
<p>${inlineMd(t.impact)}</p>
`)).join('');

  // ── 痛点 ──────────────────────────────────────────────
  const severityText: Record<string, string> = { high: '⚠ 严重程度：高', medium: '▲ 严重程度：中', low: '● 严重程度：低' };

  const painItems = painPoints.map((p) => {
    const detail = inlineIds.has(p.detailId) && resolveSection(p.detailId);
    return card(`
<p><strong>${p.title}</strong></p>
<p><em>${severityText[p.severity]}</em></p>
<p>${inlineMd(p.description)}</p>
${detail ? buildDetailSectionHtml(detail) : ''}
`);
  }).join('');

  // ── AI 机会点 ─────────────────────────────────────────
  const oppItems = aiOpportunities.map((o, i) => {
    const detail = inlineIds.has(o.detailId) && resolveSection(o.detailId);
    return card(`
<p><strong>${i + 1}. ${o.scenario}</strong></p>
<p><em>技术方案：${o.modelType}</em></p>
<p>${inlineMd(o.value)}</p>
${detail ? buildDetailSectionHtml(detail) : ''}
`);
  }).join('');

  // ── 对标企业 ──────────────────────────────────────────
  const maturityText: Record<string, string> = { high: 'AI 成熟度：高', medium: 'AI 成熟度：中', low: 'AI 成熟度：初期' };

  const companyItems = companies.map((c) => {
    const detail = inlineIds.has(c.detailId) && resolveSection(c.detailId);
    return card(`
<p><strong>${c.name}</strong></p>
<p><em>${maturityText[c.aiMaturity]}</em></p>
<p>${inlineMd(c.notes)}</p>
${detail ? buildDetailSectionHtml(detail) : ''}
`);
  }).join('');

  // ── 行业速通 ──────────────────────────────────────────
  const coreSentences = splitToSentences(quickConclusion?.threeMinuteSummary ?? summary);
  const coreParas = coreSentences.map((s) => `<p>${inlineMd(s)}</p>`).join('');

  const interviewLines = (quickConclusion?.interviewLines ?? [])
    .map((item, i) => {
      const text = typeof item === 'string' ? item : item.line;
      return card(`<p><strong>${['一', '二', '三', '四', '五', '六'][i] ?? i + 1}、</strong>${inlineMd(text)}</p>`);
    })
    .join('');

  // ── 附件 ──────────────────────────────────────────────
  let appendixHtml = '';
  if (appendixIds.size > 0) {
    const parts = [...appendixIds]
      .map((id) => {
        const section = resolveSection(id);
        if (!section) return '';
        return `<h3>${section.title}</h3>${buildDetailSectionHtml(section)}`;
      })
      .filter(Boolean)
      .join(divider());
    if (parts) appendixHtml = `${divider()}<h2>附件：深度分析详情</h2>${parts}`;
  }

  // ── 术语表 ────────────────────────────────────────────
  const glossaryHtml = includeGlossary ? (() => {
    const terms = options.glossaryTerms ?? [];
    const termItems = terms.length > 0
      ? terms.map((t) => `<p><strong>${t.term}</strong>　${t.definition}</p>`).join('')
      : `<p><em>（术语解释生成中...）</em></p>`;
    return `${divider()}<h2>专业名词解释</h2>${termItems}`;
  })() : '';

  return `
${coverHtml}
${execSummaryHtml}
${divider()}
<h2>行业概述</h2>
<p>${inlineMd(summary)}</p>
${divider()}
<h2>行业编年史</h2>
${timelineItems}
${divider()}
<h2>核心痛点分析</h2>
${painItems}
${divider()}
<h2>AI 机会点</h2>
${oppItems}
${divider()}
<h2>对标企业</h2>
${companyItems}
${divider()}
<h2>行业速通</h2>
<h3>三分钟核心逻辑</h3>
${coreParas}
<h3>核心金句</h3>
${interviewLines}
${appendixHtml}
${glossaryHtml}
`.trim();
}
