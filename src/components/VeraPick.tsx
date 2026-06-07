'use client';

import { useEffect, useState, useCallback } from 'react';

// Mismo sistema que DailyBriefing — día en idioma + sufijo
const BRIEFING_LANGS = [
  { days: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'], suffix: '· Resumen', lang: 'Español' },
  { days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], suffix: 'Briefing', lang: 'English' },
  { days: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], suffix: '· Synthèse', lang: 'Français' },
  { days: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'], suffix: 'Überblick', lang: 'Deutsch' },
  { days: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'], suffix: 'Sommario', lang: 'Italiano' },
  { days: ['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'], suffix: '· Resum', lang: 'Català' },
  { days: ['Voскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'], suffix: '· Обзор', lang: 'Русский' },
  { days: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'], suffix: 'まとめ', lang: '日本語' },
  { days: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'], suffix: '简报', lang: '中文' },
  { days: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], suffix: '· ملخص', lang: 'العربية' },
  { days: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'], suffix: 'Özet', lang: 'Türkçe' },
  { days: ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'], suffix: 'Oversikt', lang: 'Norsk' },
  { days: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'], suffix: '· Resumo', lang: 'Português' },
  { days: ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'], suffix: 'Overzicht', lang: 'Nederlands' },
];

function getPickLabel(): { label: string; lang: string } {
  const entry = BRIEFING_LANGS[Math.floor(Math.random() * BRIEFING_LANGS.length)];
  const dayName = entry.days[new Date().getDay()];
  return { label: `${dayName} ${entry.suffix}`, lang: entry.lang };
}

type IdeaItem = { title: string; url?: string; description: string };
type InsightData = {
  taskTitle: string | null; taskPrio: number;
  mode: 'search' | 'ai' | 'no_tasks'; ideas: IdeaItem[];
} | null;

export default function VeraPick({ compact = false }: { compact?: boolean }) {
  const [briefing, setBriefing]     = useState<string | null>(null);
  const [insight, setInsight]       = useState<InsightData>(null);
  const [loading, setLoading]       = useState(true);
  const [pickLabel, setPickLabel]   = useState<{ label: string; lang: string }>({ label: '···', lang: '' });

  const load = useCallback((force = false) => {
    setLoading(true);
    setPickLabel(getPickLabel());
    Promise.all([
      fetch(`/api/briefing/morning${force ? '?force=1' : ''}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/daily-insight${force ? '?force=1' : ''}`).then(r => r.json()).catch(() => null),
    ]).then(([b, i]) => {
      setBriefing(b.briefing ?? null);
      setInsight(i);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasIdeas = !loading && insight?.taskTitle && (insight.ideas ?? []).length > 0;
  const noContent = !loading && !briefing && !insight?.taskTitle;

  return (
    <div style={{ marginBottom: compact ? 14 : 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-syne)', fontWeight: 500,
            fontSize: compact ? 12 : 15,
            color: 'var(--gold2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {pickLabel.label}
          </span>
          {pickLabel.lang && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.12em', flexShrink: 0 }}>
              {pickLabel.lang}
            </span>
          )}
        </div>
        <button
          onClick={() => !loading && load(true)}
          title="Regenerar"
          style={{
            background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
            color: loading ? 'var(--text4)' : 'var(--text3)',
            fontFamily: 'var(--font-dm-mono)', fontSize: 11, lineHeight: 1, padding: 0,
          }}
        >{loading ? '···' : '↻'}</button>
      </div>

      <div style={{
        background: 'var(--bg2)', border: '.5px solid var(--bg4)',
        borderLeft: '2px solid var(--gold-ring)',
        borderRadius: compact ? 8 : 14,
        padding: compact ? '10px 12px' : '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Briefing skeleton / content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ height: 11, width: '90%' }} />
            <div className="skeleton" style={{ height: 11, width: '72%' }} />
            <div className="skeleton" style={{ height: 11, width: '82%' }} />
          </div>
        ) : briefing ? (
          <div style={{
            fontFamily: 'var(--font-syne)', fontWeight: 400,
            fontSize: compact ? 11 : 13, lineHeight: 1.65, color: 'var(--text)',
          }}>
            {briefing}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em' }}>
            Sin briefing disponible.
          </div>
        )}

        {/* Divider + insight */}
        {!loading && hasIdeas && (
          <>
            <div style={{ height: .5, background: 'var(--bg4)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {insight!.taskTitle}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                  p{insight!.taskPrio}
                  {insight!.mode === 'search' && ' · WEB'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(insight!.ideas ?? []).map((idea, i) => {
                  const inner = (
                    <div key={i}>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', marginBottom: 2, lineHeight: 1.2 }}>{idea.title}</div>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.3 }}>{idea.description}</div>
                      {idea.url && (
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--blue)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {idea.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </div>
                      )}
                    </div>
                  );
                  return idea.url ? (
                    <a key={i} href={idea.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>
                  ) : inner;
                })}
              </div>
            </div>
          </>
        )}

        {noContent && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em' }}>
            Sin contenido disponible.
          </div>
        )}
      </div>
    </div>
  );
}
