'use client';

import { useState, useEffect } from 'react';

export function useTextSelection(): string {
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection()?.toString().trim() || '';
      setSelected(sel);
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, []);

  return selected;
}
