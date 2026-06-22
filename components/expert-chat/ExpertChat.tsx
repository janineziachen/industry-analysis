'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, DepthLevel, ChatContext } from '@/lib/chat-types';
import type { IndustryAnalysis, DetailSection } from '@/lib/analysis-schema';
import { loadSettings, saveChatSession, loadChatSession, deleteChatSession } from '@/lib/chat-storage';
import { ChatBubble } from './ChatBubble';
import { ChatWindow } from './ChatWindow';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { RoleSelector } from './RoleSelector';
import { ReportLinker } from './ReportLinker';
import { DepthSelector } from './DepthSelector';
import { SettingsPanel } from './SettingsPanel';
import { HistoryDialog } from './HistoryDialog';
import { PromptGuide, PromptGuideButton } from './PromptGuide';
import { useTextSelection } from './useTextSelection';
import { Settings } from 'lucide-react';

type Props = {
  analysis: IndustryAnalysis;
  activeSection: DetailSection | null;
};

export function ExpertChat({ analysis, activeSection }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [linkedReports, setLinkedReports] = useState<string[]>([]);
  const [depth, setDepth] = useState<DepthLevel>('intermediate');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const selectedText = useTextSelection();

  useEffect(() => {
    const session = loadChatSession(analysis.industry);
    if (session) setMessages(session.messages);
  }, [analysis.industry]);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatSession(analysis.industry, { industry: analysis.industry, messages, createdAt: Date.now(), updatedAt: Date.now() });
    }
  }, [messages, analysis.industry]);

  const exportChat = useCallback(() => {
    const md = messages.map((m) => m.role === 'user' ? `**我：** ${m.content}` : `**助手：**\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对话记录_${analysis.industry}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, analysis.industry]);

  const handleSend = useCallback(async (question: string) => {
    const settings = loadSettings();
    if (!settings?.anthropicApiKey) { setSettingsOpen(true); return; }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamContent('');

    const context: ChatContext = { fullReport: analysis, activeSection, selectedText: selectedText || undefined };

    // Load linked reports from cache
    const linked = linkedReports.map((name) => {
      try {
        const raw = localStorage.getItem('analysis_cache_' + name);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }).filter(Boolean);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, context: { ...context, linkedReports: linked }, roles, depth,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          apiKey: settings.anthropicApiKey,
          baseUrl: settings.anthropicBaseUrl,
          model: settings.anthropicModel,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `请求失败 (${res.status})`;
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {
          const text = await res.text().catch(() => '');
          if (text) errMsg = text.slice(0, 200);
        }
        throw new Error(errMsg);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              // Anthropic native format
              const delta = parsed.delta?.text
                || parsed.content_block?.text
                // OpenAI-compatible format
                || parsed.choices?.[0]?.delta?.content
                || '';
              if (delta) { full += delta; setStreamContent(full); }
            } catch { /* skip non-JSON lines */ }
          }
        }
      }

      if (!full.trim()) {
        throw new Error('API 未返回有效内容，请检查 API 设置');
      }

      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: full, timestamp: Date.now(), depth, expertRoles: [...roles] };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: `❌ ${(err as Error).message}`, timestamp: Date.now() };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsStreaming(false);
      setStreamContent('');
      abortRef.current = null;
    }
  }, [analysis, activeSection, roles, depth, messages]);

  const handleStop = () => { abortRef.current?.abort(); };

  // 聊天窗打开时给 body 加 class，让主内容区自动让出右侧空间
  useEffect(() => {
    if (open) {
      document.body.classList.add('chat-open');
    } else {
      document.body.classList.remove('chat-open');
    }
    return () => { document.body.classList.remove('chat-open'); };
  }, [open]);

  if (!open) return <ChatBubble onClick={() => setOpen(true)} />;

  return (
    <ChatWindow onClose={() => setShowCloseDialog(true)} onMinimize={() => setOpen(false)}>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-1.5">
          <DepthSelector value={depth} onChange={setDepth} />
          <button onClick={() => setSettingsOpen(true)} className="text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]" data-no-drag>
            <Settings className="h-4 w-4" />
          </button>
        </div>
        <RoleSelector selected={roles} onChange={setRoles} />
        <ReportLinker current={analysis.industry} selected={linkedReports} onChange={setLinkedReports} />
        <ChatMessages messages={messages} isStreaming={isStreaming} streamContent={streamContent} />
        <div className="flex items-center gap-1 border-t border-[var(--color-border)] px-2 py-1.5">
          <PromptGuideButton onClick={() => setGuideOpen(true)} />
          <div className="flex-1">
            <ChatInput onSend={handleSend} onStop={handleStop} disabled={isStreaming} isStreaming={isStreaming} initialText={pendingQuestion} onTextConsumed={() => setPendingQuestion('')} />
          </div>
        </div>
        <PromptGuide open={guideOpen} onClose={() => setGuideOpen(false)} onUseQuestion={(q) => setPendingQuestion(q)} />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <HistoryDialog
          open={showCloseDialog}
          onKeep={() => { setShowCloseDialog(false); setOpen(false); }}
          onDelete={() => { deleteChatSession(analysis.industry); setMessages([]); setShowCloseDialog(false); setOpen(false); }}
          onExport={() => { exportChat(); setShowCloseDialog(false); setOpen(false); }}
        />
      </div>
    </ChatWindow>
  );
}
