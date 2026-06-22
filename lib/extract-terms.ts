import type { IndustryAnalysis } from './analysis-schema';
import type { DetailSection } from './analysis-schema';

// 提取全文中的专业术语候选
export function extractTermCandidates(
  analysis: IndustryAnalysis,
  detailCache: Record<string, DetailSection> = {},
): string[] {
  const candidates = new Set<string>();

  // 1. AI 机会点的技术方案字段（最密集）
  analysis.aiOpportunities.forEach((o) => {
    // 按 + / / 、 空格 拆分
    o.modelType.split(/[+\/、\s]+/).forEach((t) => {
      const s = t.trim();
      if (s.length >= 2 && s.length <= 30) candidates.add(s);
    });
  });

  // 2. 扫描括号内的英文缩写：如 (GAN)、（PINN）
  const fullText = [
    analysis.summary,
    ...analysis.painPoints.map((p) => p.title + ' ' + p.description),
    ...analysis.aiOpportunities.map((o) => o.scenario + ' ' + o.value + ' ' + o.modelType),
    ...analysis.companies.map((c) => c.notes),
    analysis.quickConclusion?.threeMinuteSummary ?? '',
    ...(analysis.quickConclusion?.interviewLines ?? []),
    ...Object.values(detailCache).flatMap((s) => [
      ...s.causeEffect, ...s.dataPoints, ...s.cases, ...s.comparison, ...s.roadmap,
    ]),
  ].join(' ');

  // 英文缩写（全大写 2-8 字母）
  const abbrevMatches = fullText.match(/\b[A-Z]{2,8}\b/g) ?? [];
  abbrevMatches.forEach((m) => candidates.add(m));

  // 括号内的词
  const parenMatches = fullText.match(/[（(]([^）)]{2,20})[）)]/g) ?? [];
  parenMatches.forEach((m) => {
    const inner = m.replace(/^[（(]|[）)]$/g, '').trim();
    if (inner.length >= 2) candidates.add(inner);
  });

  // 3. 过滤掉明显不是术语的词
  const stopWords = new Set(['the', 'and', 'for', 'AI', 'IT', 'OR', 'vs', 'ROI', 'CEO', 'API', 'URL', 'PDF', 'APP']);
  const chineseCommon = /^[的了是在有这那个也都]/;

  return [...candidates]
    .filter((t) => !stopWords.has(t))
    .filter((t) => !chineseCommon.test(t))
    .filter((t) => t.length >= 2)
    .slice(0, 20); // 最多展示 20 个候选
}
