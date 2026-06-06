'use client';

type CalEvent = { startDate: string; type: string; title: string };

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const DAY_NAMES = ['L','M','X','J','V','S','D'];

function dotColor(type: string) {
  return type === 'viaje' ? 'var(--blue)' : type === 'social' ? 'var(--purple)' : 'var(--green)';
}

export default function CalendarSection({ allEvents }: { allEvents: CalEvent[] }) {
  const now    = new Date();
  const year   = now.getFullYear();
  const month  = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysFromMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - daysFromMonday);
  const startDay = monday.getMonth() === month ? monday.getDate() : 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear  = month === 11 ? year + 1 : year;

  const eventDays = new Map<number, { type: string }[]>();
  const nextMonthEventDays = new Map<number, { type: string }[]>();
  allEvents.forEach(e => {
    const d = new Date(e.startDate);
    const map = (d.getMonth() === month && d.getFullYear() === year)
      ? eventDays
      : (d.getMonth() === nextMonth && d.getFullYear() === nextYear)
        ? nextMonthEventDays : null;
    if (map) {
      const day = d.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push({ type: e.type });
    }
  });

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase' }}>Calendar</span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em' }}>{MONTHS[month]} {year}</span>
      </div>
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '14px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.06em', textAlign: 'center', padding: '2px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = startDay + i;
            const isCurrent = dayNum >= 1 && dayNum <= daysInMonth;
            const isNext    = dayNum > daysInMonth;
            const display   = isNext ? dayNum - daysInMonth : dayNum;
            const isToday   = isCurrent && display === now.getDate();
            const evs = isCurrent ? (eventDays.get(display) ?? []) : (nextMonthEventDays.get(display) ?? []);
            return (
              <div key={i} style={{ position: 'relative', fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: isToday ? 'var(--gold2)' : isCurrent ? 'var(--text)' : 'var(--text3)', textAlign: 'center', padding: '5px 2px 8px', lineHeight: 1, borderRadius: 4, background: isToday ? 'var(--gold-subtle)' : 'transparent', fontWeight: isToday ? 500 : 400 }}>
                {display}
                {evs.length > 0 && (
                  <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                    {evs.slice(0, 3).map((ev, j) => (
                      <span key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor(ev.type), display: 'inline-block' }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '.5px solid var(--bg4)' }}>
          {[{ color: 'var(--blue)', label: 'Viaje' }, { color: 'var(--purple)', label: 'Evento' }, { color: 'var(--green)', label: 'Otro' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.08em' }}>{l.label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
