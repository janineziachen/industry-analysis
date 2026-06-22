'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useState } from 'react';
import {
  X, Bold, Italic, Highlighter, AlignLeft, AlignCenter,
  FileDown, FileText, FileType2, Loader2,
  Undo2, Redo2, List, ListOrdered, Heading1, Heading2, Heading3,
} from 'lucide-react';
import type { IndustryAnalysis } from '@/lib/analysis-schema';

function ToolbarButton({ onClick, active, title, children }: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`rounded-lg p-1.5 transition text-sm ${
        active ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-ink-strong)]'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="h-4 w-px bg-white/10" />;
}

export function ReportEditor({
  analysis,
  initialHtml,
  onClose,
}: {
  analysis: IndustryAnalysis;
  initialHtml: string;
  onClose: () => void;
}) {
  const [exporting, setExporting] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: { class: 'outline-none min-h-[600px]' },
    },
  });

  // PDF：注入打印样式后调用 window.print()
  const exportPdf = useCallback(() => {
    setExporting('pdf');
    // 短暂延迟让 setExporting 渲染，再弹打印对话框
    setTimeout(() => {
      window.print();
      setExporting(null);
    }, 100);
  }, []);

  // Markdown：先处理内联格式，再处理块级元素
  const exportMarkdown = useCallback(() => {
    if (!editor) return;
    setExporting('md');
    const html = editor.getHTML();

    let md = html
      // 先处理内联格式（在块级处理之前，否则 <li> 里的 strong 会丢失）
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*')
      .replace(/<mark[^>]*>([\s\S]*?)<\/mark>/g, '==$1==')
      // 块级元素
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '### $1\n\n')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1\n')
      .replace(/<ul[^>]*>|<\/ul>/g, '\n')
      .replace(/<ol[^>]*>|<\/ol>/g, '\n')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1\n\n')
      .replace(/<hr[^>]*>/g, '\n---\n\n')
      // 清理剩余标签
      .replace(/<[^>]+>/g, '')
      // HTML 实体
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // 合并多余空行
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.industry}_行业分析报告.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  }, [editor, analysis.industry]);

  // Word：深度优先递归，正确处理 div 包裹的内容
  const exportWord = useCallback(async () => {
    if (!editor) return;
    setExporting('word');
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, WidthType, BorderStyle, Table, TableRow, TableCell } = await import('docx');

      const html = editor.getHTML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const children: unknown[] = [];

      // 深度优先递归，div/section 透传子节点
      function processNode(node: Node): void {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        if (tag === 'div' || tag === 'section' || tag === 'article') {
          // 透传：递归处理所有子节点
          Array.from(el.childNodes).forEach(processNode);
          return;
        }

        if (tag === 'hr') {
          children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } } }));
          return;
        }

        const text = el.textContent || '';

        if (tag === 'h1') {
          children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 160 } }));
        } else if (tag === 'h2') {
          children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 120 } }));
        } else if (tag === 'h3') {
          children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 80 } }));
        } else if (tag === 'p') {
          const runs = Array.from(el.childNodes).map((child) => {
            if (child.nodeType === Node.TEXT_NODE) return new TextRun({ text: child.textContent || '', font: { eastAsia: '宋体', ascii: 'Calibri' } });
            const c = child as Element;
            const ct = c.tagName?.toLowerCase();
            const cv = c.textContent || '';
            if (ct === 'strong') return new TextRun({ text: cv, bold: true, font: { eastAsia: '宋体', ascii: 'Calibri' } });
            if (ct === 'em') return new TextRun({ text: cv, italics: true, font: { eastAsia: '宋体', ascii: 'Calibri' } });
            if (ct === 'mark') return new TextRun({ text: cv, highlight: 'yellow', font: { eastAsia: '宋体', ascii: 'Calibri' } });
            return new TextRun({ text: cv, font: { eastAsia: '宋体', ascii: 'Calibri' } });
          });
          if (runs.length > 0) children.push(new Paragraph({ children: runs, spacing: { after: 160 } }));
        } else if (tag === 'ul' || tag === 'ol') {
          Array.from(el.querySelectorAll('li')).forEach((li) => {
            children.push(new Paragraph({
              text: li.textContent || '',
              bullet: { level: 0 },
              spacing: { after: 80 },
              indent: { left: 360 },
            }));
          });
        } else if (tag === 'table') {
          const rows = Array.from(el.querySelectorAll('tr')).map((tr) => {
            const cells = Array.from(tr.querySelectorAll('th, td')).map((cell) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: cell.textContent || '', bold: cell.tagName.toLowerCase() === 'th', font: { eastAsia: '宋体', ascii: 'Calibri' } })] })],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                },
              }),
            );
            return new TableRow({ children: cells });
          });
          if (rows.length > 0) {
            children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            children.push(new Paragraph(''));
          }
        } else {
          // 其他未知标签也递归处理子节点
          Array.from(el.childNodes).forEach(processNode);
        }
      }

      Array.from(doc.body.childNodes).forEach(processNode);

      // 确保至少有一个段落
      if (children.length === 0) children.push(new Paragraph(''));

      const wordDoc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: 'Normal',
              name: 'Normal',
              run: { font: { eastAsia: '宋体', ascii: 'Calibri' }, size: 28 },
              paragraph: { spacing: { line: 360 } },
            },
          ],
        },
        sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 } } }, children: children as InstanceType<typeof Paragraph>[] }],
      });

      const buffer = await Packer.toBlob(wordDoc);
      const url = URL.createObjectURL(buffer);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysis.industry}_行业分析报告.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }, [editor, analysis.industry]);

  if (!editor) return null;

  return (
    <div className="report-editor-root fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 print:hidden">
        <span className="mr-2 text-sm font-semibold text-[var(--color-ink-strong)] shrink-0">{analysis.industry} · 行业分析报告</span>

        <Sep />

        {/* 撤销 / 重做 */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="撤销">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="重做">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <Sep />

        {/* 标题级别 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="一级标题">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="二级标题">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="三级标题">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Sep />

        {/* 文字格式 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="加粗">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="高亮标注">
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <Sep />

        {/* 列表 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Sep />

        {/* 对齐 */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="左对齐">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="居中">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportMarkdown} disabled={!!exporting}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)] disabled:opacity-40">
            {exporting === 'md' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            Markdown
          </button>
          <button onClick={exportWord} disabled={!!exporting}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)] disabled:opacity-40">
            {exporting === 'word' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileType2 className="h-3.5 w-3.5" />}
            Word
          </button>
          <button onClick={exportPdf} disabled={!!exporting}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40">
            {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            PDF
          </button>
          <Sep />
          <button onClick={onClose} className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] p-1.5 text-[var(--color-muted)] transition hover:text-[var(--color-ink-strong)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 编辑区 */}
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg)] print:overflow-visible">
        <div className="mx-auto max-w-3xl px-8 py-12 print:max-w-none print:px-0 print:py-0">
          <div className="report-content">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
