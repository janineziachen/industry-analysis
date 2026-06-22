'use client';

import { useEffect, useState } from 'react';

type TocItem = { id: string; label: string };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="hidden xl:fixed xl:right-8 xl:top-1/2 xl:block xl:-translate-y-1/2 z-40">
      <ul className="space-y-0.5 border-l border-[var(--color-border)] pl-0">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block border-l-2 px-4 py-1.5 text-[12px] transition -ml-px ${
                activeId === item.id
                  ? 'border-[var(--color-accent)] text-[var(--color-ink-strong)]'
                  : 'border-transparent text-[var(--color-muted)] opacity-70 hover:opacity-100 hover:border-[var(--color-border)]'
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
