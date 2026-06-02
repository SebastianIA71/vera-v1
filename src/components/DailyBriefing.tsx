'use client';

import { useEffect, useState, useCallback } from 'react';

const BRIEFING_LANGS: { days: string[]; suffix: string; lang: string }[] = [
  { days: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'], suffix: '· Resumen', lang: 'Español' },
  { days: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], suffix: '· Synthèse', lang: 'Français' },
  { days: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'], suffix: 'Überblick', lang: 'Deutsch' },
  { days: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'], suffix: 'Sommario', lang: 'Italiano' },
  { days: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'], suffix: '· Resumo', lang: 'Português' },
  { days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], suffix: 'Briefing', lang: 'English' },
  { days: ['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'], suffix: '· Resum', lang: 'Català' },
  { days: ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'], suffix: 'Overzicht', lang: 'Nederlands' },
  { days: ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'], suffix: 'Oversikt', lang: 'Norsk' },
  { days: ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'], suffix: 'Översikt', lang: 'Svenska' },
  { days: ['Sunnuntai','Maanantai','Tiistai','Keskiviikko','Torstai','Perjantai','Lauantai'], suffix: 'Katsaus', lang: 'Suomi' },
  { days: ['Vasárnap','Hétfő','Kedd','Szerda','Csütörtök','Péntek','Szombat'], suffix: 'Összefoglaló', lang: 'Magyar' },
  { days: ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'], suffix: 'Przegląd', lang: 'Polski' },
  { days: ['Neděle','Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota'], suffix: 'Přehled', lang: 'Čeština' },
  { days: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'], suffix: '· Обзор', lang: 'Русский' },
  { days: ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'], suffix: 'Περίληψη', lang: 'Ελληνικά' },
  { days: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'], suffix: 'Özet', lang: 'Türkçe' },
  { days: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], suffix: '· ملخص', lang: 'العربية' },
  { days: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'], suffix: 'まとめ', lang: '日本語' },
  { days: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'], suffix: '브리핑', lang: '한국어' },
  { days: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'], suffix: '简报', lang: '中文' },
  { days: ['Igandea','Astelehena','Asteartea','Asteazkena','Osteguna','Ostirala','Larunbata'], suffix: 'Laburpena', lang: 'Euskera' },
  { days: ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'], suffix: 'Rezumat', lang: 'Română' },
  { days: ['Nedelja','Ponedeljek','Torek','Sreda','Četrtek','Petek','Sobota'], suffix: 'Pregled', lang: 'Slovenščina' },
  { days: ['Nedjelja','Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota'], suffix: 'Pregled', lang: 'Hrvatski' },
  { days: ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'], suffix: '· Огляд', lang: 'Українська' },
  { days: ['Կիրակի','Երկուշաբթի','Երեքշաբթի','Չորեքշաբթի','Հինգշաբթի','Ուրբաթ','Շաբաթ'], suffix: 'Ամփոփ', lang: 'Հայերեն' },
  { days: ['კვირა','ორშაბათი','სამშაბათი','ოთხშაბათი','ხუთშაბათი','პარასკევი','შაბათი'], suffix: 'მიმოხილვა', lang: 'ქართული' },
  { days: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'], suffix: 'Ringkasan', lang: 'Bahasa Indonesia' },
  { days: ['Linggo','Lunes','Martes','Miyerkules','Huwebes','Biyernes','Sabado'], suffix: 'Buod', lang: 'Filipino' },
  { days: ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'], suffix: 'Ringkasan', lang: 'Bahasa Melayu' },
  { days: ['Dydd Sul','Dydd Llun','Dydd Mawrth','Dydd Mercher','Dydd Iau','Dydd Gwener','Dydd Sadwrn'], suffix: 'Crynodeb', lang: 'Cymraeg' },
  { days: ['Domhnach','Luan','Máirt','Céadaoin','Déardaoin','Aoine','Satharn'], suffix: 'Achoimre', lang: 'Gaeilge' },
  { days: ['Sontag','Montag','Dinstig','Mitvokh','Donershtik','Fraytik','Shabes'], suffix: '· Bericht', lang: 'Yiddish' },
  { days: ['Sekmadienis','Pirmadienis','Antradienis','Trečiadienis','Ketvirtadienis','Penktadienis','Šeštadienis'], suffix: 'Apžvalga', lang: 'Lietuvių' },
  { days: ['Svētdiena','Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena'], suffix: 'Pārskats', lang: 'Latviešu' },
  { days: ['Pühapäev','Esmaspäev','Teisipäev','Kolmapäev','Neljapäev','Reede','Laupäev'], suffix: 'Ülevaade', lang: 'Eesti' },
  { days: ['Nedela','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'], suffix: 'Prehľad', lang: 'Slovenčina' },
  { days: ['Неделя','Понеделник','Вторник','Сряда','Четвъртък','Петък','Събота'], suffix: 'Преглед', lang: 'Български' },
  { days: ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'], suffix: '· Sumar', lang: 'Moldovenească' },
  { days: ['Якшанба','Душанба','Сешанба','Чоршанба','Пайшанба','Жума','Шанба'], suffix: '· Хулоса', lang: 'Ўзбекча' },
  { days: ['Ravi','Somvar','Mangal','Budh','Guru','Shukra','Shani'], suffix: 'Sarvekshan', lang: 'हिन्दी' },
  { days: ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'], suffix: 'சுருக்கம்', lang: 'தமிழ்' },
  { days: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'], suffix: '· Informe', lang: 'Castellano' },
  { days: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], suffix: '· Bilan', lang: 'Français (alt)' },
  { days: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'], suffix: '· Сводка', lang: 'Русский (alt)' },
  { days: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'], suffix: 'Resoconto', lang: 'Italiano (alt)' },
  { days: ['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'], suffix: '· Informe', lang: 'Català (alt)' },
  { days: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'], suffix: 'Rapor', lang: 'Türkçe (alt)' },
  { days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], suffix: 'Daily Report', lang: 'English (alt)' },
];

function getBriefingTitle(): { title: string; lang: string } {
  const dayIndex = new Date().getDay();
  const entry = BRIEFING_LANGS[Math.floor(Math.random() * BRIEFING_LANGS.length)];
  return { title: `${entry.days[dayIndex]} ${entry.suffix}`, lang: entry.lang };
}

export default function DailyBriefing({ compact = false }: { compact?: boolean }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [titleData, setTitleData] = useState<{ title: string; lang: string }>({ title: 'Briefing', lang: '' });

  useEffect(() => { setTitleData(getBriefingTitle()); }, []);

  const load = useCallback((force = false) => {
    setLoading(true);
    fetch(`/api/briefing/morning${force ? '?force=1' : ''}`)
      .then(r => r.json())
      .then(d => {
        setBriefing(d.briefing ?? null);
        if (force) setTitleData(getBriefingTitle()); // nuevo idioma al regenerar
      })
      .catch(() => setBriefing(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ marginBottom: compact ? 16 : 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-syne)', fontWeight: 500,
            fontSize: compact ? 12 : 15,
            letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase',
          }}>
            {titleData.title}
          </span>
          {titleData.lang && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.1em' }}>
              {titleData.lang}
            </span>
          )}
        </div>
        <button
          onClick={() => !loading && load(true)}
          title="Regenerar briefing"
          style={{
            background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
            color: loading ? 'var(--text4)' : 'var(--text3)',
            fontFamily: 'var(--font-dm-mono)', fontSize: 11, lineHeight: 1,
            padding: 0, display: 'flex', alignItems: 'center',
            transition: 'color .15s',
          }}
        >
          {loading ? '···' : '↻'}
        </button>
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
