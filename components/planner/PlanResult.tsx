'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, ArrowLeft, ChevronDown } from 'lucide-react';
import ModuleCard from './ModuleCard';
import { loadSettings } from '@/lib/chat-storage';
import type { ProjectInfo, PlannerModule } from '@/lib/planner-types';
import type { IndustryAnalysis } from '@/lib/analysis-schema';

const MODULES: PlannerModule[] = ['needs', 'product', 'competitive', 'business'];

interface PlanResultProps {
  projectInfo: ProjectInfo;
  industryData: IndustryAnalysis | null;
  onBack: () => void;
}

const MODULE_TITLES: Record<PlannerModule, string> = {
  needs: '价值需求分析',
  product: '产品规划方案',
  competitive: '竞争定位建议',
  business: '商业可行性评估',
};

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let isHeader = true;

  const flushTable = () => {
    if (!tableRows.length) return;
    const colCount = Math.max(...tableRows.map(r => r.length));
    // pad rows to same column count
    const padded = tableRows.map(r => {
      while (r.length < colCount) r.push('');
      return r;
    });
    const [head, ...body] = padded;
    const thHtml = head.map(c => `<th>${inlineMd(c)}</th>`).join('');
    const tbHtml = body.map(r => `<tr>${r.map(c => `<td>${inlineMd(c)}</td>`).join('')}</tr>`).join('');
    out.push(`<table><thead><tr>${thHtml}</tr></thead><tbody>${tbHtml}</tbody></table>`);
    tableRows = [];
    isHeader = true;
    inTable = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Table row
    if (line.startsWith('|') && line.endsWith('|')) {
      // Skip separator rows like |---|---|
      if (/^\|[\s\-:]+(\|[\s\-:]+)*\|$/.test(line)) {
        isHeader = false;
        inTable = true;
        continue;
      }
      inTable = true;
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      tableRows.push(cells);
      continue;
    }

    // Non-table line: flush any pending table first
    if (inTable) flushTable();

    if (/^### (.+)$/.test(line)) { out.push(`<h3>${line.replace(/^### /, '')}</h3>`); continue; }
    if (/^## (.+)$/.test(line)) { out.push(`<h2>${line.replace(/^## /, '')}</h2>`); continue; }
    if (/^# (.+)$/.test(line)) { out.push(`<h1>${line.replace(/^# /, '')}</h1>`); continue; }
    if (/^- (.+)$/.test(line)) { out.push(`<li>${inlineMd(line.slice(2))}</li>`); continue; }
    if (/^\d+\. (.+)$/.test(line)) { out.push(`<li>${inlineMd(line.replace(/^\d+\. /, ''))}</li>`); continue; }
    if (line === '---') { out.push('<hr/>'); continue; }
    if (line.trim()) { out.push(`<p>${inlineMd(line)}</p>`); }
  }

  if (inTable) flushTable();

  // Wrap consecutive <li> into <ul>
  return out.join('\n').replace(/(<li>[\s\S]*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`);
}

function inlineMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export default function PlanResult({ projectInfo, industryData, onBack }: PlanResultProps) {
  const [contents, setContents] = useState<Record<PlannerModule, string>>({
    needs: '', product: '', competitive: '', business: '',
  });
  const [loading, setLoading] = useState<Record<PlannerModule, boolean>>({
    needs: true, product: true, competitive: true, business: true,
  });
  const [exportOpen, setExportOpen] = useState(false);
  const abortControllers = useRef<Partial<Record<PlannerModule, AbortController>>>({});

  const doneCount = MODULES.filter((m) => !loading[m] && contents[m]).length;
  const progressPct = (doneCount / MODULES.length) * 100;

  useEffect(() => {
    MODULES.forEach((mod) => generateModule(mod));
    return () => {
      Object.values(abortControllers.current).forEach((c) => c?.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateModule(mod: PlannerModule) {
    const settings = loadSettings();
    if (!settings?.anthropicApiKey) return;

    abortControllers.current[mod]?.abort();
    const controller = new AbortController();
    abortControllers.current[mod] = controller;

    setLoading((prev) => ({ ...prev, [mod]: true }));
    setContents((prev) => ({ ...prev, [mod]: '' }));

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          module: mod,
          projectInfo,
          industryData: industryData ?? undefined,
          apiKey: settings.anthropicApiKey,
          baseUrl: settings.anthropicBaseUrl,
          model: settings.anthropicModel,
        }),
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => `HTTP ${res.status}`);
        setContents((prev) => ({ ...prev, [mod]: `生成失败：${errorText}` }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta: string = parsed.delta?.text || parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulated += delta;
              setContents((prev) => ({ ...prev, [mod]: accumulated }));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      setContents((prev) => ({ ...prev, [mod]: `生成失败：${msg}` }));
    } finally {
      setLoading((prev) => ({ ...prev, [mod]: false }));
    }
  }

  function getSlug() {
    return (projectInfo.description || '产品规划').slice(0, 20);
  }

  async function handleExport(format: 'md' | 'docx' | 'html' | 'pdf') {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const slug = getSlug();

    if (format === 'md') {
      const md = MODULES.map((mod) => contents[mod] ? `# ${MODULE_TITLES[mod]}\n\n${contents[mod]}` : '').filter(Boolean).join('\n\n---\n\n');
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `产品规划_${slug}_${date}.md`; a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
      return;
    }

    if (format === 'docx') {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, AlignmentType } = await import('docx');

      const children: InstanceType<typeof Paragraph | typeof Table>[] = [];

      for (const mod of MODULES) {
        if (!contents[mod]) continue;

        children.push(new Paragraph({ text: MODULE_TITLES[mod], heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));

        const lines = contents[mod].split('\n');
        let tableRows: string[][] = [];
        let inTable = false;

        const flushDocxTable = () => {
          if (!tableRows.length) return;
          const colCount = Math.max(...tableRows.map(r => r.length));
          const padded = tableRows.map(r => { while (r.length < colCount) r.push(''); return r; });
          const [head, ...body] = padded;
          const makeCell = (text: string, isHeader = false) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: text.replace(/\*\*/g, ''), bold: isHeader, size: 20 })] })],
            borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
          });
          const rows = [
            new TableRow({ children: head.map(c => makeCell(c, true)), tableHeader: true }),
            ...body.map(r => new TableRow({ children: r.map(c => makeCell(c)) })),
          ];
          children.push(new Table({ rows, width: { size: 9000, type: 'dxa' } }));
          tableRows = [];
          inTable = false;
        };

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (line.startsWith('|') && line.endsWith('|')) {
            if (/^\|[\s\-:]+(\|[\s\-:]+)*\|$/.test(line)) { inTable = true; continue; }
            inTable = true;
            tableRows.push(line.slice(1, -1).split('|').map(c => c.trim()));
            continue;
          }
          if (inTable) flushDocxTable();

          if (!line) { children.push(new Paragraph('')); continue; }
          if (/^### (.+)/.test(line)) { children.push(new Paragraph({ text: line.replace(/^### /, ''), heading: HeadingLevel.HEADING_3 })); continue; }
          if (/^## (.+)/.test(line)) { children.push(new Paragraph({ text: line.replace(/^## /, ''), heading: HeadingLevel.HEADING_2 })); continue; }
          if (/^# (.+)/.test(line)) { children.push(new Paragraph({ text: line.replace(/^# /, ''), heading: HeadingLevel.HEADING_1 })); continue; }
          if (/^[-*] (.+)/.test(line)) {
            children.push(new Paragraph({ text: line.replace(/^[-*] /, ''), bullet: { level: 0 } })); continue;
          }
          if (/^\d+\. (.+)/.test(line)) {
            children.push(new Paragraph({ text: line.replace(/^\d+\. /, ''), numbering: { reference: 'default-numbering', level: 0 } })); continue;
          }
          if (line === '---') { children.push(new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } } })); continue; }

          // Regular paragraph with bold support
          const runs: InstanceType<typeof TextRun>[] = [];
          const parts = line.split(/(\*\*[^*]+\*\*)/);
          for (const part of parts) {
            if (part.startsWith('**') && part.endsWith('**')) {
              runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
            } else if (part) {
              runs.push(new TextRun(part));
            }
          }
          children.push(new Paragraph({ children: runs }));
        }
        if (inTable) flushDocxTable();
      }

      const doc = new Document({
        numbering: { config: [{ reference: 'default-numbering', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }] }] },
        styles: { paragraphStyles: [{ id: 'Normal', name: 'Normal', run: { font: { eastAsia: '宋体', ascii: 'Calibri' }, size: 24 }, paragraph: { spacing: { line: 360 } } }] },
        sections: [{ children }],
      });

      const buffer = await Packer.toBlob(doc);
      const url = URL.createObjectURL(buffer);
      const a = document.createElement('a');
      a.href = url; a.download = `产品规划_${slug}_${date}.docx`; a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
      return;
    }

    if (format === 'html') {
      const htmlContent = MODULES.map((mod) => contents[mod]
        ? `<section><h2>${MODULE_TITLES[mod]}</h2>${markdownToHtml(contents[mod])}</section>`
        : '').filter(Boolean).join('\n');
      const css = `
        body{font-family:system-ui,-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:40px 24px;color:#1a2332;line-height:1.6}
        h1{font-size:1.75rem;margin:2em 0 0.5em}h2{font-size:1.25rem;margin:2em 0 0.5em;padding-bottom:6px;border-bottom:2px solid #e2e8f0}h3{font-size:1rem;margin:1.5em 0 0.4em}
        p{margin:0.4em 0}ul{margin:0.3em 0;padding-left:1.4em}li{margin:0.2em 0}
        table{border-collapse:collapse;width:100%;margin:0.8em 0;font-size:0.875rem}
        th{background:#f8f9fb;text-align:left;font-weight:600;padding:8px 12px;border:1px solid #e2e8f0}
        td{padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;word-break:break-word}
        hr{border:none;border-top:1px solid #e2e8f0;margin:2em 0}
        strong{font-weight:600}code{background:#f1f3f6;padding:2px 5px;border-radius:3px;font-size:0.85em}
        section{margin-bottom:3em}
      `;
      const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><title>产品规划_${slug}</title><style>${css}</style></head><body>${htmlContent}</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `产品规划_${slug}_${date}.html`; a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
      return;
    }

    if (format === 'pdf') {
      const htmlContent = MODULES.map((mod) => contents[mod]
        ? `<section><h2>${MODULE_TITLES[mod]}</h2>${markdownToHtml(contents[mod])}</section>`
        : '').filter(Boolean).join('\n');
      const css = `body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:40px 24px;color:#1a2332;line-height:1.6}h2{font-size:1.2rem;margin:2em 0 0.5em;border-bottom:1px solid #e2e8f0;padding-bottom:4px}h3{font-size:1rem;margin:1.5em 0 0.4em}table{border-collapse:collapse;width:100%}th{background:#f8f9fb;font-weight:600;padding:7px 10px;border:1px solid #e2e8f0;text-align:left}td{padding:7px 10px;border:1px solid #e2e8f0;vertical-align:top}ul{padding-left:1.4em}hr{border:none;border-top:1px solid #e2e8f0;margin:1.5em 0}@media print{body{padding:0}}`;
      const printWin = window.open('', '_blank');
      if (!printWin) return;
      printWin.document.write(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><title>产品规划_${slug}</title><style>${css}</style></head><body>${htmlContent}</body></html>`);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => { printWin.print(); printWin.close(); }, 500);
      setExportOpen(false);
    }
  }

  return (
    <div className="result-container">
      <div className="result-progress">
        <span>{doneCount}/{MODULES.length} 模块完成</span>
        <div className="result-progress-bar">
          <div className="result-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="result-modules">
        {MODULES.map((mod, i) => (
          <ModuleCard
            key={mod}
            module={mod}
            index={i}
            content={contents[mod]}
            isLoading={loading[mod]}
            onRegenerate={() => generateModule(mod)}
            onContentChange={(value) => setContents((prev) => ({ ...prev, [mod]: value }))}
          />
        ))}
      </div>

      <div className="result-actions">
        <button onClick={onBack} className="pf-btn pf-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} />
          修改信息
        </button>
        <div className="result-actions-spacer" />
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="pf-btn pf-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            导出
            <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div style={{
              position: 'absolute', bottom: '110%', right: 0, minWidth: 150,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 10, boxShadow: '0 4px 20px var(--color-card-shadow)',
              overflow: 'hidden', zIndex: 50,
            }}>
              {([
                { fmt: 'docx', label: 'Word (.docx)' },
                { fmt: 'html', label: 'HTML (.html)' },
                { fmt: 'md', label: 'Markdown (.md)' },
                { fmt: 'pdf', label: 'PDF' },
              ] as { fmt: 'docx' | 'html' | 'md' | 'pdf'; label: string }[]).map(({ fmt, label }) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 14px', fontSize: '0.8125rem',
                    color: 'var(--color-ink)', background: 'none', border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-panel)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
