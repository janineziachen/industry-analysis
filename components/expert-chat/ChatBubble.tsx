'use client';

import { MessageCircle } from 'lucide-react';

export function ChatBubble({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="打开专家问答"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-3 text-white shadow-lg transition hover:opacity-90 hover:scale-105 active:scale-95"
      style={{ boxShadow: '0 4px 24px color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="text-[13px] font-medium whitespace-nowrap">专家问答</span>
    </button>
  );
}
