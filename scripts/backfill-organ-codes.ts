import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the backfill.');
  process.exit(1);
}

const PAGE_SIZE = 1000;
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

const allRiksmotes = process.argv.includes('--all-riksmotes');
const riksmote = getArg('rm');
const dryRun = process.argv.includes('--dry-run');

if (!allRiksmotes && !riksmote) {
  console.error('Usage: npx tsx scripts/backfill-organ-codes.ts --all-riksmotes [--dry-run] OR --rm=2025/26');
  process.exit(1);
}

function normalizeOrgan(code: string | undefined | null): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  const match = knownCommittees.find((c) => c === upper || c === trimmed);
  return match ?? upper;
}

function extractFromBeteckning(beteckning?: string | null): string | null {
  if (!beteckning) return null;
  const match = beteckning.match(/:([A-Za-zÅÄÖ]{2,4})\d/);
  return normalizeOrgan(match?.[1] ?? null);
}

function extractFromDokId(dokId?: string | null): string | null {
  if (!dokId) return null;
  const match = dokId.match(/[A-ZÅÄÖ]{2,3}(?=\d)/);
  return normalizeOrgan(match?.[0] ?? null);
}

function deriveOrgan(dokId?: string | null, beteckning?: string | null): string | null {
  return extractFromBeteckning(beteckning) || extractFromDokId(dokId);
}

async function fetchDocuments(offset: number): Promise<{ items: any[]; total: number }> {
  const params = new URLSearchParams({
    select: 'dokument_id,rm,beteckning,organ',
  });

  params.append('or', '(organ.is.null,organ.eq.)');
  if (!allRiksmotes && riksmote) {
    params.append('rm', `eq.${riksmote}`);
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/riksdagen_dokument?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      Prefer: 'count=exact',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase fetch failed: ${response.status} ${text}`);
  }

  const contentRange = response.headers.get('content-range');
  const total = contentRange ? parseInt(contentRange.split('/')[1] || '0', 10) : 0;
  const items = await response.json();
  return { items, total };
}

async function upsertOrganCodes(rows: any[]) {
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

async function main() {
  console.log(
    `🚀 Populerar organ-koder ${allRiksmotes ? 'för alla riksmöten' : `för ${riksmote}`} ${dryRun ? '(dry-run)' : ''}`
  );

  let offset = 0;
  let total = 0;
  const updates: any[] = [];

  do {
    const { items, total: reportedTotal } = await fetchDocuments(offset);
    total = reportedTotal;

    items.forEach((doc) => {
      const organ = deriveOrgan(doc.dokument_id, doc.beteckning);
      if (organ) {
        updates.push({ dokument_id: doc.dokument_id, organ });
      }
    });

    offset += PAGE_SIZE;
  } while (offset < total);

  const stats = updates.reduce<Record<string, number>>((acc, row) => {
    const key = row.organ || 'OKÄND';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(`Hittade ${updates.length} dokument med härledda organ-koder (av totalt ${total}).`);
  console.log('\n📊 Utskottsfördelning');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([organ, count]) => console.log(`${organ}: ${count}`));

  if (dryRun) {
    console.log('\n🔍 Dry run aktiverad - inga ändringar skickades till Supabase.');
    return;
  }

  if (updates.length === 0) {
    console.log('Inga organ-koder att uppdatera.');
    return;
  }

  await upsertOrganCodes(updates);
  console.log('\n✅ Organ-koder uppdaterade i Supabase.');
}

main().catch((error) => {
  console.error('❌ Script misslyckades:', error);
  process.exit(1);
});
