'use client';

type Props = { open: boolean; onKeep: () => void; onDelete: () => void; onExport: () => void };

export function HistoryDialog({ open, onKeep, onDelete, onExport }: Props) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-[var(--color-bg)]/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <p className="text-sm text-[var(--color-ink-strong)]">是否保留对话记录？</p>
        <div className="flex flex-col gap-2">
          <button onClick={onKeep} className="rounded-lg bg-[var(--color-accent)]/20 py-1.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30">保留</button>
          <button onClick={onExport} className="rounded-lg border border-[var(--color-border)] py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]">导出并关闭</button>
          <button onClick={onDelete} className="rounded-lg py-1.5 text-sm text-red-400 hover:text-red-300">不保留，直接关闭</button>
        </div>
      </div>
    </div>
  );
}
