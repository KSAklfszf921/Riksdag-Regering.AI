/**
 * Extra verktyg för djupare insikter (röstsummor, sammanfattningar, syncstatus)
 */

import { z } from 'zod';
import { getSupabase } from '../utils/supabase.js';
import { withCache } from '../utils/cache.js';
import { stripHtml, truncate } from '../utils/helpers.js';
import { DATA_DICTIONARY } from '../data/dictionary.js';

/**
 * Röstsammanfattning per votering
 */
export const getVoteringRosterSummarySchema = z.object({
  votering_id: z.string().describe('Votering att summera'),
});

export async function getVoteringRosterSummary(args: z.infer<typeof getVoteringRosterSummarySchema>) {
  return withCache(`votering_roster:${args.votering_id}`, async () => {
    const supabase = getSupabase();

    const { data: roster, error } = await supabase
      .from('riksdagen_votering_ledamoter')
      .select('parti, rost')
      .eq('votering_id', args.votering_id);

    if (error) {
      throw new Error(`Fel vid hämtning av voteringsröster: ${error.message}`);
    }

    const summary: Record<string, { ja: number; nej: number; avstar: number; franvarande: number; totalt: number }> = {};
    roster?.forEach((row) => {
      const parti = row.parti || 'Okänt parti';
      if (!summary[parti]) {
        summary[parti] = { ja: 0, nej: 0, avstar: 0, franvarande: 0, totalt: 0 };
      }
      summary[parti].totalt += 1;
      switch (row.rost) {
        case 'Ja':
          summary[parti].ja += 1;
          break;
        case 'Nej':
          summary[parti].nej += 1;
          break;
        case 'Avstår':
          summary[parti].avstar += 1;
          break;
        default:
          summary[parti].franvarande += 1;
      }
    });

    const totals = Object.values(summary).reduce(
      (acc, item) => {
        acc.ja += item.ja;
        acc.nej += item.nej;
        acc.avstar += item.avstar;
        acc.franvarande += item.franvarande;
        acc.totalt += item.totalt;
        return acc;
      },
      { ja: 0, nej: 0, avstar: 0, franvarande: 0, totalt: 0 }
    );

    return {
      votering_id: args.votering_id,
      totalRoster: totals,
      partiRoster: summary,
      analysis: `Antal registrerade röster: ${totals.totalt} (Ja: ${totals.ja}, Nej: ${totals.nej}, Avstår: ${totals.avstar}).`,
    };
  }, 120);
}

/**
 * Sammanfatta pressmeddelanden (utan LLM, enkel text-trunkering)
 */
export const summarizePressmeddelandeSchema = z.object({
  document_id: z.string().describe('ID för pressmeddelandet'),
  max_length: z.number().optional().default(500).describe('Max längd för sammanfattningen'),
});

export async function summarizePressmeddelande(args: z.infer<typeof summarizePressmeddelandeSchema>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('regeringskansliet_pressmeddelanden')
    .select('document_id, titel, publicerad_datum, departement, innehall')
    .eq('document_id', args.document_id)
    .single();

  if (error || !data) {
    throw new Error(`Pressmeddelande ${args.document_id} hittades inte (${error?.message ?? 'okänt fel'})`);
  }

  const cleanText = stripHtml(data.innehall || '');
  const summary = truncate(cleanText, args.max_length || 500);

  return {
    meta: {
      document_id: data.document_id,
      titel: data.titel,
      publicerad_datum: data.publicerad_datum,
      departement: data.departement,
    },
    summary,
  };
}

/**
 * Statusrapport för datapipelines
 */
export const getSyncStatusSchema = z.object({});

export async function getSyncStatus() {
  return withCache('sync_status', async () => {
    const supabase = getSupabase();

    const [{ data: riksdagLog }, { data: regeringsLog }] = await Promise.all([
      supabase
        .from('riksdagen_api_log')
        .select('endpoint, status, antal_poster, felmeddelande, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('regeringskansliet_api_log')
        .select('endpoint, status, created_at, felmeddelande')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const summarizeLog = (rows?: any[]) => {
      if (!rows || rows.length === 0) {
        return { latest: null, failures: [] as any[] };
      }
      const latest = rows[0];
      const failures = rows.filter((row) => row.status && row.status.toLowerCase() === 'error');
      return { latest, failures };
    };

    return {
      riksdagen: summarizeLog(riksdagLog ?? []),
      regeringskansliet: summarizeLog(regeringsLog ?? []),
      generated_at: new Date().toISOString(),
    };
  }, 300);
}

/**
 * Data dictionary tool
 */
export const getDataDictionarySchema = z.object({
  dataset: z.string().optional().describe('Filtrera på ett dataset-ID, t.ex. riksdagen_dokument'),
});

export async function getDataDictionary(args: z.infer<typeof getDataDictionarySchema>) {
  if (args.dataset) {
    const match = DATA_DICTIONARY.datasets.find(d => d.id === args.dataset);
    if (!match) {
      throw new Error(`Dataset ${args.dataset} saknas i dictionaryt`);
    }
    return match;
  }

  return DATA_DICTIONARY;
}
