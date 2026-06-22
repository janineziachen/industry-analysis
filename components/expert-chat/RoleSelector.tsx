'use client';

import { ROLES } from '@/lib/chat-types';

type Props = { selected: string[]; onChange: (ids: string[]) => void };

export function RoleSelector({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      {ROLES.map((role) => (
        <button
          key={role.id}
          onClick={() => toggle(role.id)}
          title={role.description}
          className={`rounded-full px-2.5 py-1 text-xs transition ${
            selected.includes(role.id)
              ? 'border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
              : 'border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]'
          }`}
        >
          {role.icon} {role.name}
        </button>
      ))}
      {selected.length > 2 && (
        <span className="self-center text-xs text-[var(--color-muted)]">角色越少，回答越聚焦</span>
      )}
    </div>
  );
}
