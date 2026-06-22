import type { ChatSession, ChatSettings } from './chat-types';

const CHAT_PREFIX = 'expert_chat_';
const SETTINGS_KEY = 'expert_chat_settings';

function obfuscate(value: string): string {
  return btoa(value.split('').reverse().join(''));
}

function deobfuscate(value: string): string {
  try {
    return atob(value).split('').reverse().join('');
  } catch {
    return '';
  }
}

export function saveChatSession(industry: string, session: ChatSession): void {
  try {
    localStorage.setItem(CHAT_PREFIX + industry, JSON.stringify(session));
  } catch { /* storage full — silently fail */ }
}

export function loadChatSession(industry: string): ChatSession | null {
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + industry);
    if (!raw) return null;
    return JSON.parse(raw) as ChatSession;
  } catch {
    return null;
  }
}

export function deleteChatSession(industry: string): void {
  localStorage.removeItem(CHAT_PREFIX + industry);
}

export function saveSettings(settings: ChatSettings): void {
  const stored = {
    ...settings,
    anthropicApiKey: obfuscate(settings.anthropicApiKey),
    searchApiKey: obfuscate(settings.searchApiKey),
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored));
  } catch { /* silently fail */ }
}

export function loadSettings(): ChatSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    return {
      ...stored,
      anthropicApiKey: deobfuscate(stored.anthropicApiKey || ''),
      searchApiKey: deobfuscate(stored.searchApiKey || ''),
    };
  } catch {
    return null;
  }
}
