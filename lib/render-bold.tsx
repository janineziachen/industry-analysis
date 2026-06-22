import React from 'react';

export function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} className="text-[var(--color-ink-strong)] font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
