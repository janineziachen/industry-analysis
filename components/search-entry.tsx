'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function SearchEntry() {
  const router = useRouter();
  const [industry, setIndustry] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = industry.trim();

    if (!value) return;

    router.push(`/analysis/${encodeURIComponent(value)}`);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-card md:flex-row md:items-center">
      <div className="flex-1 text-left">
        <input
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          placeholder="输入行业名称，如：冷链物流、电力零售、工业检测"
          className="w-full bg-transparent text-[16px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
        />
      </div>
      <button className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--color-accent)] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110">
        开始分析
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
