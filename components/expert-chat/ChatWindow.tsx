'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { X, Minus } from 'lucide-react';

type Props = {
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
};

export function ChatWindow({ onClose, onMinimize, children }: Props) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size] = useState({ w: 400, h: 560 });
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const clamp = useCallback((x: number, y: number) => {
    const maxX = window.innerWidth - size.w - 8;
    const maxY = window.innerHeight - size.h - 8;
    return { x: Math.max(8, Math.min(x, maxX)), y: Math.max(8, Math.min(y, maxY)) };
  }, [size.w, size.h]);

  useEffect(() => {
    setPos(clamp(window.innerWidth - size.w - 24, window.innerHeight - size.h - 24));
    setMounted(true);
  }, [clamp, size.w, size.h]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => setPos(clamp(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y));
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, clamp]);

  if (!mounted) return null;

  return (
    <div
      ref={windowRef}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      className="fixed z-50 flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl backdrop-blur-xl"
    >
      <div
        onMouseDown={onMouseDown}
        className="flex shrink-0 cursor-move items-center justify-between border-b border-[var(--color-border)] px-4 py-2"
      >
        <span className="text-sm font-medium text-[var(--color-ink-strong)]">专家问答</span>
        <div className="flex items-center gap-1" data-no-drag>
          <button onClick={onMinimize} className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]" title="最小化"><Minus className="h-4 w-4" /></button>
          <button onClick={onClose} className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]" title="关闭"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
