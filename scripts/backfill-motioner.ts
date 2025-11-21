import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the backfill.');
  process.exit(1);
}

const pageSize = 500;
const knownCommittees = [
  'KU',
  'FIU',
  'SKU',
  'UU',
  'SOU',
  'JUU',
  'CU',
  'NU',
  'KRU',
  'UBU',
  'AU',
  'FÖU',
  'FOU',
  'TU',
  'BOU',
  'SFU',
  'MJU',
];

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.substring(prefix.length) : undefined;
}

function normalizeOrgan(code: string | undefined | null): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  const match = knownCommittees.find((c) => c === upper || c === trimmed);
  return match ?? upper;
}

function extractOrganFromBeteckning(beteckning?: string): string | null {
  if (!beteckning) return null;
  const match = beteckning.match(/:([A-Za-zÅÄÖ]{2,4})\d/);
  return normalizeOrgan(match?.[1] ?? null);
}

async function upsertRows(rows: any[]) {
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/riksdagen_dokument`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase upsert failed: ${response.status} ${text}`);
    }
  }
}

async function fetchMotioner(rm: string, limit?: number) {
  let page = 1;
  const documents: any[] = [];

  while (true) {
    const url = new URL('https://data.riksdagen.se/dokumentlista/');
    url.search = new URLSearchParams({
      doktyp: 'mot',
      rm,
      utformat: 'json',
      sz: pageSize.toString(),
      sort: 'datum',
      p: page.toString(),
    }).toString();

    const response = await fetch(url.toString());
    const json = await response.json();
    const list = json?.dokumentlista?.dokument || [];
    documents.push(...list);

    const totalPages = parseInt(json?.dokumentlista?.['@sidor'] ?? '1', 10);
    const fetchedEnough = limit ? documents.length >= limit : false;

    if (page >= totalPages || fetchedEnough) {
      break;
    }

    page += 1;
  }

  return limit ? documents.slice(0, limit) : documents;
}

function mapMotion(item: any) {
  const organ = normalizeOrgan(item.organ) || extractOrganFromBeteckning(item.beteckning);

  return {
    dokument_id: item.dok_id,
    rm: item.rm,
    beteckning: item.beteckning,
    doktyp: 'mot',
    titel: item.titel,
    subtitel: item.subtitel,
    organ: organ ?? null,
    publicerad_datum: item.publicerad,
    datum: item.publicerad,
    status: item.status,
    dokument_url_text: item.dokument_url_text,
    dokument_url_html: item.dokument_url_html,
  };
}

function reportStats(mapped: any[]) {
  const stats = mapped.reduce<Record<string, number>>((acc, row) => {
    const key = row.organ || 'OKÄND';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Utskottsfördelning (motioner)');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([organ, count]) => {
      console.log(`${organ}: ${count}`);
    });
}

async function main() {
  const rm = getArg('rm');
  const limitArg = getArg('limit');
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;

  if (!rm) {
    console.error('Usage: npx tsx scripts/backfill-motioner.ts --rm=2025/26 [--limit=1000]');
    process.exit(1);
  }

  console.log(`🚀 Importerar motioner för riksmöte ${rm}${limit ? ` (limit ${limit})` : ''}...`);

  const documents = await fetchMotioner(rm, limit);
  const mapped = documents.map(mapMotion);

  console.log(`Hämtade ${mapped.length} motioner, skriver till Supabase...`);
  await upsertRows(mapped);

  console.log(`✅ Klar: ${mapped.length} motioner upsertade.`);
  reportStats(mapped);
}

main().catch((error) => {
  console.error('❌ Backfill misslyckades:', error);
  process.exit(1);
});
