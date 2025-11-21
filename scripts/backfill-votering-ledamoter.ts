import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the backfill.');
  process.exit(1);
}

const PAGE_SIZE = 500;
const BATCH_SIZE = 1000;
const API_DELAY_MS = 100;

type VoteRow = {
  votering_id: string;
  rm: string | null;
  beteckning: string | null;
  datum: string | null;
  punkt: number | null;
  intressent_id: string;
  namn: string;
  parti: string;
  valkrets: string;
  rostning: string;
};

type PartyStats = Record<string, { ja: number; nej: number; avstar: number; franvarande: number }>;

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.substring(prefix.length) : undefined;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function upsertVotes(rows: VoteRow[]) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/riksdagen_votering_ledamoter`, {
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

async function fetchVoteringar(rm: string): Promise<any[]> {
  let page = 1;
  const voterings: any[] = [];

  while (true) {
    const url = new URL('https://data.riksdagen.se/voteringlista/');
    url.search = new URLSearchParams({
      rm,
      utformat: 'json',
      sz: PAGE_SIZE.toString(),
      p: page.toString(),
    }).toString();

    const response = await fetch(url.toString());
    const json = await response.json();
    const list = json?.voteringlista?.votering || [];
    voterings.push(...list);

    const totalPages = parseInt(json?.voteringlista?.['@sidor'] ?? '1', 10);
    if (page >= totalPages) {
      break;
    }

    page += 1;
  }

  return voterings;
}

async function fetchVoteringMeta(voteringId: string): Promise<any | null> {
  const url = new URL('https://data.riksdagen.se/voteringlista/');
  url.search = new URLSearchParams({
    votering_id: voteringId,
    utformat: 'json',
    sz: '1',
  }).toString();

  const response = await fetch(url.toString());
  const json = await response.json();
  return json?.voteringlista?.votering?.[0] ?? null;
}

function normalizeVote(value: string): 'ja' | 'nej' | 'avstår' | 'frånvarande' | 'okänd' {
  const lower = (value || '').toLowerCase();
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('nej')) return 'nej';
  if (lower.startsWith('avst')) return 'avstår';
  if (lower.startsWith('fr') || lower.includes('från')) return 'frånvarande';
  return 'okänd';
}

function addPartyStat(stats: PartyStats, parti: string, vote: ReturnType<typeof normalizeVote>) {
  const key = parti || 'OKÄNT';
  if (!stats[key]) {
    stats[key] = { ja: 0, nej: 0, avstar: 0, franvarande: 0 };
  }
  switch (vote) {
    case 'ja':
      stats[key].ja += 1;
      break;
    case 'nej':
      stats[key].nej += 1;
      break;
    case 'avstår':
      stats[key].avstar += 1;
      break;
    case 'frånvarande':
      stats[key].franvarande += 1;
      break;
    default:
      break;
  }
}

async function fetchVotesForVotering(votering: any): Promise<VoteRow[]> {
  const url = new URL('https://data.riksdagen.se/voteringsaldramanshistorik/');
  url.search = new URLSearchParams({
    votering_id: votering.votering_id,
    utformat: 'json',
    sz: '400',
  }).toString();

  const response = await fetch(url.toString());
  const json = await response.json();
  const list = json?.voteringsaldramanshistorik?.ledamot_rostning || [];

  return list.map((item: any) => ({
    votering_id: votering.votering_id,
    rm: votering.rm ?? null,
    beteckning: votering.beteckning ?? null,
    datum: votering.dok_datum ?? votering.datum ?? null,
    punkt: votering.punkt ? parseInt(votering.punkt, 10) : null,
    intressent_id: item.intressent_id,
    namn: item.namn,
    parti: item.parti,
    valkrets: item.valkrets,
    rostning: normalizeVote(item.rost),
  }));
}

function reportPartyStats(stats: PartyStats) {
  console.log('\n📊 Parti-statistik');
  Object.entries(stats)
    .sort((a, b) => b[1].ja + b[1].nej + b[1].avstar + b[1].franvarande - (a[1].ja + a[1].nej + a[1].avstar + a[1].franvarande))
    .forEach(([party, values]) => {
      console.log(
        `${party}: Ja=${values.ja}, Nej=${values.nej}, Avstår=${values.avstar}, Frånvarande=${values.franvarande}`
      );
    });
}

async function main() {
  const riksmote = getArg('riksmote');
  const voteringId = getArg('votering-id');

  if (!riksmote && !voteringId) {
    console.error('Usage: npx tsx scripts/backfill-votering-ledamoter.ts --riksmote=2025/26 OR --votering-id=<ID>');
    process.exit(1);
  }

  let voteringar: any[] = [];

  if (voteringId) {
    const meta = await fetchVoteringMeta(voteringId);
    if (!meta) {
      console.error(`❌ Hittade ingen votering med ID ${voteringId}`);
      process.exit(1);
    }
    voteringar = [meta];
  } else if (riksmote) {
    console.log(`📥 Hämtar voteringar för riksmöte ${riksmote}...`);
    voteringar = await fetchVoteringar(riksmote);
  }

  console.log(`🚀 Bearbetar ${voteringar.length} voteringar...`);

  const buffer: VoteRow[] = [];
  const stats: PartyStats = {};
  let totalVotes = 0;

  for (let i = 0; i < voteringar.length; i += 1) {
    const votering = voteringar[i];
    console.log(`\n[${i + 1}/${voteringar.length}] ${votering.votering_id} - ${votering.beteckning || 'okänd beteckning'}`);

    const votes = await fetchVotesForVotering(votering);
    votes.forEach((vote) => addPartyStat(stats, vote.parti, vote.rostning as ReturnType<typeof normalizeVote>));
    buffer.push(...votes);
    totalVotes += votes.length;

    if (buffer.length >= BATCH_SIZE) {
      console.log(`↗️  Upsertar ${buffer.length} röster...`);
      await upsertVotes(buffer.splice(0, buffer.length));
    }

    await delay(API_DELAY_MS);
  }

  if (buffer.length > 0) {
    console.log(`↗️  Upsertar sista batchen (${buffer.length} röster)...`);
    await upsertVotes(buffer);
  }

  console.log(`\n✅ Klar: ${totalVotes} röster upsertade.`);
  reportPartyStats(stats);
}

main().catch((error) => {
  console.error('❌ Backfill misslyckades:', error);
  process.exit(1);
});
