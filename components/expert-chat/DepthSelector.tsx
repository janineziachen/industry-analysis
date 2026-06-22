'use client';

import type { DepthLevel } from '@/lib/chat-types';

const LEVELS: { value: DepthLevel; label: string }[] = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'professional', label: '专业' },
];

type Props = { value: DepthLevel; onChange: (v: DepthLevel) => void };

export function DepthSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-0.5">
      {LEVELS.map((level) => (
        <button
          key={level.value}
          onClick={() => onChange(level.value)}
          className={`rounded-md px-2 py-0.5 text-xs transition ${
            value === level.value ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]'
          }`}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
