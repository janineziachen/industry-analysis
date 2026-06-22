'use client';

import { useEffect, useState } from 'react';
import { SearchEntry } from '@/components/search-entry';
import { loadSettings } from '@/lib/chat-storage';

export default function HomePage() {
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    const settings = loadSettings();
    setHasKey(!!settings?.anthropicApiKey);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl text-center">
        <h1 className="mb-8 text-[2.5rem] font-semibold tracking-tight text-[var(--color-ink-strong)] leading-[1.15]">
          行业洞察 · 产品规划
        </h1>
        <SearchEntry />
        {!hasKey && (
          <p className="mt-8 text-[13px] text-[var(--color-muted)]">
            首次使用？点击右上角 <span className="text-[var(--color-accent)]">配置 API Key</span> 开始
          </p>
        )}
        <div className="mt-10 flex items-center justify-center gap-6 text-[13px] text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-semibold text-white">1</span>
            行业洞察报告
          </span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 5h14M11 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-panel)] border border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-muted)]">2</span>
            产品策略规划
          </span>
        </div>
      </div>
    </main>
  );
}
