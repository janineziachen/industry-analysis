'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ChatSettings } from '@/lib/chat-types';
import { loadSettings, saveSettings } from '@/lib/chat-storage';

type Props = { open: boolean; onClose: () => void };

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export function SettingsPanel({ open, onClose }: Props) {
  const [settings, setSettings] = useState<ChatSettings>({
    anthropicApiKey: '', anthropicBaseUrl: '', anthropicModel: 'claude-sonnet-4-6', searchApiKey: '',
  });
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    if (open) {
      const saved = loadSettings();
      if (saved) setSettings(saved);
      setTestStatus('idle');
      setTestError('');
    }
  }, [open]);

  const handleSave = () => { saveSettings(settings); onClose(); };

  const handleTest = async () => {
    if (!settings.anthropicApiKey) { setTestError('请先填写 API Key'); setTestStatus('error'); return; }
    setTestStatus('testing');
    setTestError('');

    const baseUrl = normalizeBaseUrl(settings.anthropicBaseUrl);
    const model = settings.anthropicModel || 'claude-sonnet-4-6';
    const endpoint = baseUrl.endsWith('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.anthropicApiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10, stream: false }),
      });
      if (res.ok) {
        setTestStatus('success');
      } else if (res.status === 404) {
        const alt = baseUrl.endsWith('/v1') ? baseUrl.replace(/\/v1$/, '') : baseUrl + '/v1';
        setTestError(`404 - 端点不存在。建议尝试将 Base URL 改为: ${alt}`);
        setTestStatus('error');
      } else {
        const text = await res.text().catch(() => '');
        setTestError(`${res.status}: ${text.slice(0, 100)}`);
        setTestStatus('error');
      }
    } catch (err) {
      setTestError(`网络错误: ${(err as Error).message}`);
      setTestStatus('error');
    }
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-2xl bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--color-ink-strong)]">API 设置</h3>
        <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        <Field label="API Key *" value={settings.anthropicApiKey} type="password"
          onChange={(v) => setSettings({ ...settings, anthropicApiKey: v })} />
        <div>
          <Field label="Base URL（可选）" value={settings.anthropicBaseUrl} placeholder="https://api.example.com 或 https://api.example.com/v1"
            onChange={(v) => setSettings({ ...settings, anthropicBaseUrl: v })} />
          <p className="mt-1 text-[10px] text-[var(--color-muted)]">
            填写到域名即可（如 https://api.example.com），系统会自动补全 /v1/chat/completions。如果你的地址本身带 /v1 也没关系，会自动处理。
          </p>
        </div>
        <Field label="模型" value={settings.anthropicModel}
          onChange={(v) => setSettings({ ...settings, anthropicModel: v })} />
        <Field label="搜索 API Key（Tavily，可选）" value={settings.searchApiKey} type="password"
          onChange={(v) => setSettings({ ...settings, searchApiKey: v })} />

        {/* 测试连接 */}
        <div className="pt-1">
          <button onClick={handleTest} disabled={testStatus === 'testing'}
            className="w-full rounded-lg border border-[var(--color-border)] py-1.5 text-xs text-[var(--color-ink)] hover:bg-[var(--color-panel)] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
            {testStatus === 'testing' && <Loader2 className="h-3 w-3 animate-spin" />}
            {testStatus === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
            {testStatus === 'error' && <XCircle className="h-3 w-3 text-red-400" />}
            {testStatus === 'testing' ? '测试中...' : testStatus === 'success' ? '连接成功' : '测试连接'}
          </button>
          {testStatus === 'error' && testError && (
            <p className="mt-1.5 text-[10px] text-red-400 leading-tight">{testError}</p>
          )}
        </div>
      </div>
      <button onClick={handleSave} className="mt-3 w-full rounded-lg bg-[var(--color-accent)]/20 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30">
        保存设置
      </button>
    </div>
  );
}

function normalizeBaseUrl(url: string): string {
  if (!url) return 'https://api.anthropic.com';
  return url.trim().replace(/\/+$/, '');
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[var(--color-muted)]">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]/50" />
    </label>
  );
}
