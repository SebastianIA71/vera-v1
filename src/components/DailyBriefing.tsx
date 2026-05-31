'use client';

import { useEffect, useState } from 'react';

function getBriefingTitle(): string {
  const now = new Date();
  const dayIndex = now.getDay(); // 0=Dom … 6=Sáb
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );

  const langs = [
    { days: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'], suffix: '· Resumen' },
    { days: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],  suffix: '· Synthèse' },
    { days: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'], suffix: 'Überblick' },
    { days: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'], suffix: 'Sommario' },
    { days: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],     suffix: '· Resumo' },
    { days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], suffix: 'Briefing' },
  ];

  const lang = langs[weekNum % 6];
  return `${lang.days[dayIndex]} ${lang.suffix}`;
}

export default function DailyBriefing({ compact = false }: { compact?: boolean }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Briefing');

  useEffect(() => {
    setTitle(getBriefingTitle());
  }, []);

  useEffect(() => {
    fetch('/api/briefing/morning')
      .then(r => r.json())
      .then(d => setBriefing(d.briefing ?? null))
      .catch(() => setBriefing(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ marginBottom: compact ? 16 : 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-syne)', fontWeight: 500,
          fontSize: compact ? 12 : 15,
          letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase',
        }}>
          {title}
        </span>
      </div>

      <div style={{
        background: 'var(--bg2)', border: '.5px solid var(--bg4)',
        borderLeft: '2px solid rgba(196,168,106,0.3)',
        borderRadius: compact ? 8 : 14,
        padding: compact ? '10px 12px' : '14px 16px',
      }}>
        {loading && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)' }}>
            GENERANDO···
          </div>
        )}

        {!loading && !briefing && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.1em' }}>
            Sin briefing disponible.
          </div>
        )}

        {!loading && briefing && (
          <div style={{
            fontFamily: 'var(--font-syne)', fontWeight: 400,
            fontSize: compact ? 11 : 13,
            lineHeight: 1.65, color: 'var(--text)',
          }}>
            {briefing}
          </div>
        )}
      </div>
    </div>
  );
}
