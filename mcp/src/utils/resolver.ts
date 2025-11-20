/**
 * Resolver helpers som försöker Supabase först och faller tillbaka på råa API:er.
 */

import fetch from 'node-fetch';
import { getSupabase } from './supabase.js';

interface ResolverOptions<T> {
  supabaseQuery: () => Promise<T | null>;
  fallbackApi?: () => Promise<T>;
  persist?: (data: T) => Promise<void>;
  onMiss?: () => Promise<void> | void;
}

/**
 * Kör en supabase-fråga och returnerar data, annars försöker fallback API och sparar resultatet.
 */
export async function resolveData<T>(options: ResolverOptions<T>): Promise<{ data: T | null; source: 'supabase' | 'live_api'; fetchedAt: string }> {
  const { supabaseQuery, fallbackApi, persist, onMiss } = options;

  const supabaseResult = await supabaseQuery();
  if (supabaseResult) {
    return {
      data: supabaseResult,
      source: 'supabase',
      fetchedAt: new Date().toISOString(),
    };
  }

  if (!fallbackApi) {
    return {
      data: null,
      source: 'supabase',
      fetchedAt: new Date().toISOString(),
    };
  }

  if (onMiss) {
    try {
      await onMiss();
    } catch {
      // ignore
    }
  }

  if (!canUseLiveFetch()) {
    return {
      data: null,
      source: 'supabase',
      fetchedAt: new Date().toISOString(),
    };
  }

  const liveData = await fallbackApi();
  if (liveData && persist) {
    try {
      await persist(liveData);
    } catch {
      // swallow persistence errors for now
    }
  }

  return {
    data: liveData,
    source: 'live_api',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Helper för att hämta Riksdagens dokument live vid behov.
 */
export async function fetchRiksdagenDokument(dokId: string): Promise<any | null> {
  const normalizedId = dokId.trim();
  const encodedId = encodeURIComponent(normalizedId);
  const endpoints = [
    `https://data.riksdagen.se/dokumentstatus/${encodedId}.json`,
    `https://data.riksdagen.se/dokument/${encodedId}.json`,
  ];

  const errors: string[] = [];

  for (const url of endpoints) {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        errors.push(`404 ${response.statusText} (${url})`);
        continue;
      }
      errors.push(`${response.status} ${response.statusText} (${url})`);
      continue;
    }

    const json: any = await response.json();
    const doc =
      json?.dokumentstatus?.dokument ||
      json?.dokgrupp?.dokument?.[0] ||
      json?.dokument?.[0] ||
      null;

    if (!doc) {
      errors.push(`saknar dokument i svaret (${url})`);
      continue;
    }

    const text =
      doc?.dokumentstatus?.dokument?.dokumenttext ||
      doc?.dokumentstatus?.dokument?.dokutskrift ||
      doc?.dokumenttext ||
      doc?.dokutskrift ||
      '';

    return {
      ...doc,
      text,
    };
  }

  if (errors.length === endpoints.length) {
    return null;
  }

  throw new Error(`Fel vid livehämtning från Riksdagen: ${errors.join('; ')}`);
}

export async function saveJsonToStorage(bucket: string, path: string, payload: unknown) {
  try {
    const supabase = getSupabase();
    await supabase.storage.from(bucket).upload(path, JSON.stringify(payload), {
      contentType: 'application/json',
      upsert: true,
    });
  } catch (error) {
    console.warn(`Kunde inte spara data i bucket ${bucket}:`, (error as Error).message);
  }
}
const maxLiveFetches = parseInt(process.env.MAX_LIVE_FETCHES_PER_MINUTE || '30', 10);
const liveFetchWindowMs = 60_000;
const liveFetchHistory: number[] = [];

function canUseLiveFetch() {
  const now = Date.now();
  while (liveFetchHistory.length && now - liveFetchHistory[0] > liveFetchWindowMs) {
    liveFetchHistory.shift();
  }
  if (liveFetchHistory.length >= maxLiveFetches) {
    return false;
  }
  liveFetchHistory.push(now);
  return true;
}
