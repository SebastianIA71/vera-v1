'use client';

import { useEffect, useState } from 'react';

const BRIEFING_LANGS: { days: string[]; suffix: string }[] = [
  { days: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'], suffix: '· Resumen' },
  { days: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], suffix: '· Synthèse' },
  { days: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'], suffix: 'Überblick' },
  { days: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'], suffix: 'Sommario' },
  { days: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'], suffix: '· Resumo' },
  { days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], suffix: 'Briefing' },
  { days: ['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'], suffix: '· Resum' },
  { days: ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'], suffix: 'Overzicht' },
  { days: ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'], suffix: 'Oversikt' },
  { days: ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'], suffix: 'Översikt' },
  { days: ['Sunnuntai','Maanantai','Tiistai','Keskiviikko','Torstai','Perjantai','Lauantai'], suffix: 'Katsaus' },
  { days: ['Vasárnap','Hétfő','Kedd','Szerda','Csütörtök','Péntek','Szombat'], suffix: 'Összefoglaló' },
  { days: ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'], suffix: 'Przegląd' },
  { days: ['Neděle','Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota'], suffix: 'Přehled' },
  { days: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'], suffix: '· Обзор' },
  { days: ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'], suffix: 'Περίληψη' },
  { days: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'], suffix: 'Özet' },
  { days: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], suffix: '· ملخص' },
  { days: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'], suffix: 'まとめ' },
  { days: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'], suffix: '브리핑' },
  { days: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'], suffix: '简报' },
  { days: ['Rmingay','Lhunes','Mhartes','Miercures','Juevres','Biernes','Sabo'], suffix: '· Resenya' },
  { days: ['Igandea','Astelehena','Asteartea','Asteazkena','Osteguna','Ostirala','Larunbata'], suffix: 'Laburpena' },
  { days: ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'], suffix: 'Rezumat' },
  { days: ['Nedelja','Ponedeljek','Torek','Sreda','Četrtek','Petek','Sobota'], suffix: 'Pregled' },
  { days: ['Nedjelja','Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota'], suffix: 'Pregled' },
  { days: ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'], suffix: '· Огляд' },
  { days: ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'], suffix: '· Sumar' },
  { days: ['Կիրակի','Երկուշաբթի','Երեքշաբթի','Չորեքշաբթի','Հինգշաբթի','Ուրբաթ','Շաբաթ'], suffix: 'Ամփոփ' },
  { days: ['კვირა','ორშაბათი','სამშაბათი','ოთხშაბათი','ხუთშაბათი','პარასკევი','შაბათი'], suffix: 'მიმოხილვა' },
  { days: ['Якшанба','Душанба','Сешанба','Чоршанба','Пайшанба','Жума','Шанба'], suffix: '· Хулоса' },
  { days: ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'], suffix: 'Xulosa' },
  { days: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'], suffix: 'Ringkasan' },
  { days: ['Linggo','Lunes','Martes','Miyerkules','Huwebes','Biyernes','Sabado'], suffix: 'Buod' },
  { days: ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'], suffix: 'Ringkasan' },
  { days: ['Ravi','Somvar','Mangal','Budh','Guru','Shukra','Shani'], suffix: 'Sarvekshan' },
  { days: ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'], suffix: 'சுருக்கம்' },
  { days: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'], suffix: 'Rapor' },
  { days: ['Dimecres','Dijous','Divendres','Dissabte','Diumenge','Dilluns','Dimarts'], suffix: '· Informe' },
  { days: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'], suffix: 'Resoconto' },
  { days: ['Dydd Sul','Dydd Llun','Dydd Mawrth','Dydd Mercher','Dydd Iau','Dydd Gwener','Dydd Sadwrn'], suffix: 'Crynodeb' },
  { days: ['Domhnach','Luan','Máirt','Céadaoin','Déardaoin','Aoine','Satharn'], suffix: 'Achoimre' },
  { days: ['Sontag','Montag','Dinstig','Mitvokh','Donershtik','Fraytik','Shabes'], suffix: '· Bericht' },
  { days: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], suffix: '· Bilan' },
  { days: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'], suffix: '· Сводка' },
  { days: ['Sábado','Domingo','Lunes','Martes','Miércoles','Jueves','Viernes'], suffix: '· Informe' },
  { days: ['Sekmadienis','Pirmadienis','Antradienis','Trečiadienis','Ketvirtadienis','Penktadienis','Šeštadienis'], suffix: 'Apžvalga' },
  { days: ['Svētdiena','Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena'], suffix: 'Pārskats' },
  { days: ['Pühapäev','Esmaspäev','Teisipäev','Kolmapäev','Neljapäev','Reede','Laupäev'], suffix: 'Ülevaade' },
  { days: ['Nedela','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'], suffix: 'Prehľad' },
];

function getBriefingTitle(): string {
  const dayIndex = new Date().getDay();
  const lang = BRIEFING_LANGS[Math.floor(Math.random() * BRIEFING_LANGS.length)];
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
