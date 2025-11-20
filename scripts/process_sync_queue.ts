/**
 * Enkel kö-processor som läser poster från data_sync_queue och försöker fylla Supabase.
 */

import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running sync queue processor.');
  process.exit(1);
}

async function fetchQueue() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/data_sync_queue?status=eq.pending&select=*`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load queue: ${response.statusText}`);
  }
  return await response.json();
}

async function updateQueue(id: string, status: 'completed' | 'failed', message?: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/data_sync_queue?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, note: message || null }),
  });
}

async function processItem(item: any) {
  try {
    switch (item.entity) {
      case 'riksdagen_dokument': {
        const response = await fetch(`https://data.riksdagen.se/dokument/${item.identifier}.json`);
        const json = await response.json();
        const dokument = json?.dokgrupp?.dokument?.[0];
        if (dokument) {
          await fetch(`${SUPABASE_URL}/rest/v1/riksdagen_dokument`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
              dok_id: dokument.dok_id,
              doktyp: dokument.doktyp,
              rm: dokument.rm,
              beteckning: dokument.beteckning,
              datum: dokument.datum,
              titel: dokument.titel,
              organ: dokument.organ,
              text: dokument?.dokumentstatus?.dokument?.dokumenttext || dokument?.dokumenttext || null,
            }),
          });
        }
        break;
      }
      default:
        console.warn(`No processor defined for entity ${item.entity}`);
    }
    await updateQueue(item.id, 'completed');
  } catch (error) {
    console.error(`Failed processing ${item.entity} ${item.identifier}:`, (error as Error).message);
    await updateQueue(item.id, 'failed', (error as Error).message);
  }
}

async function main() {
  const queue = await fetchQueue();
  for (const item of queue) {
    await processItem(item);
  }
  console.log(`Processed ${queue.length} queue items.`);
}

main().catch((error) => {
  console.error('Queue processor failed:', error);
  process.exit(1);
});
