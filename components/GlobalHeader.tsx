'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Key, Sun, Moon } from 'lucide-react';
import { loadSettings } from '@/lib/chat-storage';
import { useTheme } from '@/lib/theme';
import { GlobalSettings } from './GlobalSettings';

export function GlobalHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const settings = loadSettings();
    setHasKey(!!settings?.anthropicApiKey);
  }, [settingsOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--color-muted)]">AI 行业分析</span>
          <Link href="/planner" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition">
            产品规划
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition ${
              hasKey
                ? 'border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                : 'border border-[var(--color-accent)]/30 text-[var(--color-accent)]'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            {hasKey ? 'API 设置' : '配置 API Key'}
          </button>
        </div>
      </header>
      <GlobalSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
