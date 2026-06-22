'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

type Props = {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  initialText?: string;
  onTextConsumed?: () => void;
};

export function ChatInput({ onSend, onStop, disabled, isStreaming, initialText, onTextConsumed }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      onTextConsumed?.();
      inputRef.current?.focus();
    }
  }, [initialText]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-2 py-2">
      <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          rows={1}
          className="flex-1 resize-none bg-transparent text-xs leading-5 text-[var(--color-ink)] placeholder-[var(--color-muted)] outline-none"
          style={{ maxHeight: '80px' }}
        />
        {isStreaming ? (
          <button onClick={onStop} className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
            <Square className="h-3 w-3" />
          </button>
        ) : (
          <button onClick={handleSend} disabled={disabled || !text.trim()} className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-30 transition-opacity">
            <Send className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
