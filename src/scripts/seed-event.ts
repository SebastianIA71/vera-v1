import { db } from '../lib/db';
import { events } from '../lib/db/schema';

async function main() {
  await db.insert(events).values({
    title: 'Cena con Marta y Jordi',
    startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    endDate:   new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    type: 'social',
    who: 'Marta · Jordi',
    status: 'planning',
  });
  console.log('✓ Evento social insertado: Cena con Marta y Jordi (en 8 días)');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
