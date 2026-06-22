'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { ChatSettings } from '@/lib/chat-types';
import { loadSettings, saveSettings } from '@/lib/chat-storage';

type Props = { open: boolean; onClose: () => void };

const PRESETS: { name: string; baseUrl: string; models: string[] }[] = [
  { name: 'Anthropic', baseUrl: 'https://api.anthropic.com', models: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'] },
  { name: 'OpenAI', baseUrl: 'https://api.openai.com', models: ['gpt-4o', 'gpt-4o-mini', 'o1'] },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { name: '硅基流动', baseUrl: 'https://api.siliconflow.cn', models: ['deepseek-ai/DeepSeek-V3'] },
  { name: '自定义', baseUrl: '', models: [] },
];

export function GlobalSettings({ open, onClose }: Props) {
  const [settings, setSettings] = useState<ChatSettings>({
    anthropicApiKey: '',
    anthropicBaseUrl: '',
    anthropicModel: 'claude-sonnet-4-6',
    searchApiKey: '',
  });
  const [activePreset, setActivePreset] = useState('Anthropic');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    if (open) {
      const saved = loadSettings();
      if (saved) {
        setSettings(saved);
        const matched = PRESETS.find((p) => p.baseUrl && saved.anthropicBaseUrl?.includes(new URL(p.baseUrl).host));
        setActivePreset(matched?.name || '自定义');
      }
      setTestStatus('idle');
      setTestError('');
    }
  }, [open]);

  const handlePresetClick = (preset: typeof PRESETS[number]) => {
    setActivePreset(preset.name);
    if (preset.baseUrl) {
      setSettings((s) => ({
        ...s,
        anthropicBaseUrl: preset.baseUrl,
        anthropicModel: preset.models[0] || s.anthropicModel,
      }));
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    onClose();
  };

  const handleTest = async () => {
    if (!settings.anthropicApiKey) { setTestError('请先填写 API Key'); setTestStatus('error'); return; }
    setTestStatus('testing');
    setTestError('');

    const baseUrl = settings.anthropicBaseUrl?.trim().replace(/\/+$/, '') || 'https://api.anthropic.com';
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

  const currentPreset = PRESETS.find((p) => p.name === activePreset);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--color-ink-strong)]">API 设置</h2>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-[var(--color-muted)]">
          支持 Anthropic、OpenAI 及任何兼容的 API 服务。Key 仅存储在浏览器本地。
        </p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                activePreset === preset.name
                  ? 'border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                  : 'border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Field
            label="API Key"
            value={settings.anthropicApiKey}
            type="password"
            placeholder="sk-... / tvly-..."
            required
            onChange={(v) => setSettings({ ...settings, anthropicApiKey: v })}
          />
          <Field
            label="Base URL"
            value={settings.anthropicBaseUrl}
            placeholder={currentPreset?.baseUrl || 'https://api.example.com'}
            onChange={(v) => setSettings({ ...settings, anthropicBaseUrl: v })}
          />
          {currentPreset && currentPreset.models.length > 0 ? (
            <label className="block">
              <span className="text-xs text-[var(--color-muted)]">模型</span>
              <select
                value={settings.anthropicModel}
                onChange={(e) => setSettings({ ...settings, anthropicModel: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]/50"
              >
                {currentPreset.models.map((m) => (
                  <option key={m} value={m} className="bg-[var(--color-panel)]">{m}</option>
                ))}
              </select>
            </label>
          ) : (
            <Field
              label="模型"
              value={settings.anthropicModel}
              placeholder="模型名称"
              onChange={(v) => setSettings({ ...settings, anthropicModel: v })}
            />
          )}
          <Field
            label="Tavily 搜索 Key（可选，启用联网搜索）"
            value={settings.searchApiKey}
            type="password"
            placeholder="tvly-..."
            onChange={(v) => setSettings({ ...settings, searchApiKey: v })}
          />
        </div>

        <div className="mt-4">
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing' || !settings.anthropicApiKey.trim()}
            className="w-full rounded-lg border border-[var(--color-border)] py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-panel)] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {testStatus === 'testing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {testStatus === 'success' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
            {testStatus === 'error' && <XCircle className="h-3.5 w-3.5 text-red-400" />}
            {testStatus === 'testing' ? '测试中...' : testStatus === 'success' ? '连接成功' : '测试连接'}
          </button>
          {testStatus === 'error' && testError && (
            <p className="mt-1.5 text-[10px] text-red-400 leading-tight">{testError}</p>
          )}
          {testStatus === 'success' && (
            <p className="mt-1.5 text-[10px] text-green-500">API 配置正常，可以正常使用</p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!settings.anthropicApiKey.trim()}
          className="mt-5 w-full rounded-xl bg-[var(--color-accent)]/20 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/30 disabled:opacity-40"
        >
          保存设置
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[var(--color-muted)]">
        {label}
        {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-accent)]/50"
      />
    </label>
  );
}
