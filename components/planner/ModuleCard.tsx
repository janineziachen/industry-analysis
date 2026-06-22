'use client';

import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { RefreshCw, Edit3, Check, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { PlannerModule } from '@/lib/planner-types';
import { MODULE_META } from '@/lib/planner-types';

function extractTextLength(node: React.ReactNode): number {
  if (typeof node === 'string') return node.length;
  if (typeof node === 'number') return String(node).length;
  if (Array.isArray(node)) return node.reduce((sum, n) => sum + extractTextLength(n), 0);
  if (node && typeof node === 'object' && 'props' in (node as object)) {
    return extractTextLength((node as React.ReactElement).props.children);
  }
  return 0;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in (node as object)) {
    return extractText((node as React.ReactElement).props.children);
  }
  return '';
}

// 可拖拽调宽的表格组件
function ResizableTable({ children, initialWidths }: { children: React.ReactNode; initialWidths: string[] }) {
  const [widths, setWidths] = useState<string[]>(initialWidths);
  const tableRef = useRef<HTMLTableElement>(null);
  const dragging = useRef<{ colIdx: number; startX: number; startPx: number } | null>(null);

  const onMouseDown = useCallback((colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    const table = tableRef.current;
    if (!table) return;
    const cols = table.querySelectorAll('col');
    const colEl = cols[colIdx] as HTMLElement;
    const startPx = colEl.getBoundingClientRect().width;
    dragging.current = { colIdx, startX: e.clientX, startPx };

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !table) return;
      const { colIdx: ci, startX, startPx: sp } = dragging.current;
      const delta = ev.clientX - startX;
      const newPx = Math.max(40, sp + delta);
      const tableW = table.getBoundingClientRect().width;
      setWidths((prev) => {
        const next = [...prev];
        next[ci] = ((newPx / tableW) * 100).toFixed(1) + '%';
        return next;
      });
    };

    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table ref={tableRef} style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.8rem' }}>
        <colgroup>
          {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        {/* 把 onMouseDown 通过 context 传给 th */}
        <ResizableContext.Provider value={{ onResizeStart: onMouseDown, colCount: widths.length }}>
          {children}
        </ResizableContext.Provider>
      </table>
    </div>
  );
}

const ResizableContext = React.createContext<{
  onResizeStart: (colIdx: number, e: React.MouseEvent) => void;
  colCount: number;
}>({ onResizeStart: () => {}, colCount: 0 });

import React from 'react';

// 自定义表格渲染
const markdownComponents: Components = {
  table({ children }) {
    let colLengths: number[] = [];
    let colTexts: string[] = [];
    const rows = Array.isArray(children) ? children : [children];
    for (const section of rows) {
      if (!section || typeof section !== 'object') continue;
      const sectionEl = section as React.ReactElement;
      if (sectionEl.type !== 'thead') continue;
      const theadChildren = Array.isArray(sectionEl.props.children) ? sectionEl.props.children : [sectionEl.props.children];
      for (const tr of theadChildren) {
        if (!tr || typeof tr !== 'object') continue;
        const trEl = tr as React.ReactElement;
        const ths = Array.isArray(trEl.props.children) ? trEl.props.children : [trEl.props.children];
        colLengths = ths.map((th: React.ReactNode) => {
          if (!th || typeof th !== 'object') return 4;
          return Math.max(extractTextLength((th as React.ReactElement).props.children), 4);
        });
        colTexts = ths.map((th: React.ReactNode) => {
          if (!th || typeof th !== 'object') return '';
          return extractText((th as React.ReactElement).props.children);
        });
      }
    }

    const NARROW_HEADERS = new Set(['序', '#', 'no', 'no.', '编号']);
    const isNarrow = (len: number, text: string) => len <= 2 || NARROW_HEADERS.has(text.trim().toLowerCase());
    const total = colLengths.reduce((a, b) => a + b, 0) || 1;
    const MIN_PCT = 8;
    const colWidths = colLengths.map((l, idx) => {
      if (isNarrow(l, colTexts[idx] ?? '')) return 'narrow';
      return Math.max((l / total) * 100, MIN_PCT);
    });
    const fixedCount = colWidths.filter((w) => w === 'narrow').length;
    const flexTotal = colWidths.filter((w) => w !== 'narrow').reduce((a, b) => a + (b as number), 0) || 1;
    const initialWidths = colWidths.map((w) =>
      w === 'narrow' ? '36px' : ((w as number) / flexTotal * (100 - fixedCount * 3)).toFixed(1) + '%'
    );

    return <ResizableTable initialWidths={initialWidths}>{children}</ResizableTable>;
  },
  th({ children }) {
    const ctx = React.useContext(ResizableContext);
    // 找到当前 th 的索引：通过父级 tr 的 children 顺序无法直接拿到，改用 onMouseDown 位置跟踪
    const thRef = useRef<HTMLTableCellElement>(null);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      const th = thRef.current;
      if (!th) return;
      const tr = th.parentElement;
      if (!tr) return;
      const idx = Array.from(tr.children).indexOf(th);
      ctx.onResizeStart(idx, e);
    }, [ctx]);

    return (
      <th ref={thRef} style={{
        background: 'var(--color-panel)', textAlign: 'left', fontWeight: 600,
        fontSize: '0.8rem', color: 'var(--color-ink-strong)',
        padding: '6px 10px', border: '1px solid var(--color-border)',
        overflowWrap: 'break-word', wordBreak: 'break-word',
        position: 'relative', userSelect: 'none',
      }}>
        {children}
        {/* 拖拽手柄 */}
        <span
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 6, cursor: 'col-resize',
            background: 'transparent',
          }}
          title="拖动调整列宽"
        />
      </th>
    );
  },
  td({ children }) {
    return (
      <td style={{
        padding: '6px 10px', border: '1px solid var(--color-border)',
        verticalAlign: 'top', color: 'var(--color-ink)',
        overflowWrap: 'break-word', wordBreak: 'break-word',
      }}>{children}</td>
    );
  },
};

type Props = {
  module: PlannerModule;
  index: number;
  content: string;
  isLoading: boolean;
  onRegenerate: () => void;
  onContentChange: (content: string) => void;
};

export default function ModuleCard({ module, index, content, isLoading, onRegenerate, onContentChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const meta = MODULE_META[module];

  const handleEdit = () => {
    setEditText(content);
    setEditing(true);
    setExpanded(true);
  };

  const handleSave = () => {
    onContentChange(editText);
    setEditing(false);
  };

  const summary = content
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .slice(0, 2)
    .join(' ')
    .slice(0, 120);

  const isDone = !isLoading && content.length > 0;

  return (
    <div className="mc">
      <button
        onClick={() => !editing && setExpanded(!expanded)}
        className="mc-header"
        aria-expanded={expanded}
      >
        <div className="mc-left">
          <span className={`mc-number ${isDone ? 'done' : ''}`}>
            {isDone ? '✓' : index + 1}
          </span>
          <div className="mc-info">
            <h3 className="mc-title">{meta.title}</h3>
            {!expanded && !isLoading && content && (
              <p className="mc-summary">{summary}</p>
            )}
            {isLoading && (
              <p className="mc-loading">正在生成…</p>
            )}
          </div>
        </div>
        <div className="mc-right">
          {isLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />}
          {isDone && !editing && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                className="mc-action-btn"
                title="重新生成"
                aria-label="重新生成"
              >
                <RefreshCw size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="mc-action-btn"
                title="编辑"
                aria-label="编辑"
              >
                <Edit3 size={12} />
              </button>
            </>
          )}
          {!editing && (
            expanded
              ? <ChevronUp size={14} style={{ color: 'var(--color-muted)' }} />
              : <ChevronDown size={14} style={{ color: 'var(--color-muted)' }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mc-body">
          {editing ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="mc-edit-area"
              />
              <div className="mc-edit-actions">
                <button onClick={() => setEditing(false)} className="pf-btn pf-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  <X size={11} /> 取消
                </button>
                <button onClick={handleSave} className="pf-btn pf-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  <Check size={11} /> 保存
                </button>
              </div>
            </div>
          ) : (
            <div className="mc-content prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content || '等待生成…'}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
