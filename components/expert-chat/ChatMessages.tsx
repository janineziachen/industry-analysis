'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/lib/chat-types';

type Props = {
  messages: Message[];
  isStreaming: boolean;
  streamContent: string;
};

export function ChatMessages({ messages, isStreaming, streamContent }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-muted)] text-sm space-y-2">
          <p>试试问我：</p>
          <p className="opacity-70">&ldquo;这个行业的核心壁垒是什么？&rdquo;</p>
          <p className="opacity-70">&ldquo;AI 在这个领域有哪些落地机会？&rdquo;</p>
        </div>
      )}
      {messages.map((msg) => (
        <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : ''}>
          <div className={msg.role === 'user'
            ? 'max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--color-accent)]/20 px-4 py-2 text-sm text-[var(--color-ink)]'
            : 'prose prose-sm max-w-none text-[var(--color-ink)] dark:prose-invert'
          }>
            {msg.role === 'user' ? msg.content : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            )}
          </div>
        </div>
      ))}
      {isStreaming && streamContent && (
        <div className="prose prose-sm max-w-none text-[var(--color-ink)] dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
          <span className="inline-block h-4 w-1 animate-pulse bg-[var(--color-accent)]" />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
