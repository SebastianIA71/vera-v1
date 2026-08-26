'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function NotesEditor({ minHeight = 90 }: { minHeight?: number }) {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => { setText(data.text ?? ''); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const save = useCallback((value: string) => {
    setSaving(true);
    fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: value }),
    }).finally(() => setSaving(false));
  }, []);

  const handleChange = (value: string) => {
    setText(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(value), 700);
  };

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        value={text}
        disabled={!loaded}
        onChange={e => handleChange(e.target.value)}
        placeholder="Anota lo que quieras — sin estructura, sin categorías…"
        style={{
          width: '100%', minHeight, resize: 'vertical', boxSizing: 'border-box',
          background: 'transparent', border: 'none', outline: 'none',
          fontFamily: 'var(--font-dm-sans)', fontSize: 13, lineHeight: 1.5,
          color: 'var(--text)', padding: 0,
        }}
      />
      <span style={{
        position: 'absolute', bottom: -2, right: 0,
        fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em',
        color: 'var(--text4)', opacity: saving ? 1 : 0, transition: 'opacity .2s',
      }}>
        GUARDANDO…
      </span>
    </div>
  );
}
