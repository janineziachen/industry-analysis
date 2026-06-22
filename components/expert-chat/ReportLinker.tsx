'use client';

import { useState, useEffect } from 'react';

type Props = { current: string; selected: string[]; onChange: (industries: string[]) => void };

export function ReportLinker({ current, selected, onChange }: Props) {
  const [available, setAvailable] = useState<string[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('analysis_cache_') && !k.endsWith(current));
    setAvailable(keys.map((k) => k.replace('analysis_cache_', '')));
  }, [current]);

  if (available.length === 0) return null;

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]);
  };

  return (
    <div className="border-t border-[var(--color-border)] px-3 py-2">
      <p className="text-xs text-[var(--color-muted)] mb-1">关联其他报告：</p>
      <div className="flex flex-wrap gap-1">
        {available.map((name) => (
          <button key={name} onClick={() => toggle(name)}
            className={`rounded-full px-2 py-0.5 text-xs ${selected.includes(name) ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40' : 'bg-[var(--color-panel)] text-[var(--color-muted)] border border-[var(--color-border)]'}`}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
