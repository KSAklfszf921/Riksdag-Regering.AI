/**
 * Verktyg för att hämta specifika dokument och data
 */

import { getSupabase } from '../utils/supabase.js';
import { resolveLimit, DEFAULT_LIMIT } from '../utils/limits.js';
import { z } from 'zod';
import fetch from 'node-fetch';
import { resolveData, fetchRiksdagenDokument, saveJsonToStorage } from '../utils/resolver.js';
import { logDataMiss } from '../utils/telemetry.js';

/**
 * Hämta ett specifikt dokument med alla detaljer
 */
export const getDokumentSchema = z.object({
  dok_id: z.string().describe('Dokument ID'),
});

export async function getDokument(args: z.infer<typeof getDokumentSchema>) {
  const supabase = getSupabase();

  const { data, source, fetchedAt } = await resolveData({
    supabaseQuery: async () => {
      const { data, error } = await supabase
        .from('riksdagen_dokument')
        .select('*')
        .eq('dok_id', args.dok_id)
        .single();

      if (error) {
        return null;
      }
      return data || null;
    },
    fallbackApi: async () => {
      return await fetchRiksdagenDokument(args.dok_id);
    },
    persist: async (liveData) => {
      const mapped = {
        dok_id: liveData.dok_id,
        doktyp: liveData.doktyp,
        rm: liveData.rm,
        beteckning: liveData.beteckning,
        datum: liveData.datum,
        titel: liveData.titel,
        organ: liveData.organ,
      };
      await supabase.from('riksdagen_dokument').upsert(mapped, { onConflict: 'dok_id' });
      await saveJsonToStorage('riksdagen-dokument', `${args.dok_id}.json`, liveData);
    },
    onMiss: async () => {
      await logDataMiss({
        entity: 'riksdagen_dokument',
        identifier: args.dok_id,
        reason: 'saknas i supabase',
      });
    },
  });

  if (!data) {
    throw new Error(`Dokument med ID ${args.dok_id} hittades inte`);
  }

  const dokument = data;

  return {
    dokument,
    summary: `${dokument.doktyp} ${dokument.beteckning}: ${dokument.titel}`,
    source,
    fetchedAt,
  };
}

/**
 * Hämta en ledamot med fullständig information
 */
export const getLedamotSchema = z.object({
  intressent_id: z.string().describe('Ledamotens intressent ID'),
});

export async function getLedamot(args: z.infer<typeof getLedamotSchema>) {
  const supabase = getSupabase();

  const { data: ledamot, source, fetchedAt } = await resolveData({
    supabaseQuery: async () => {
      const { data, error } = await supabase
        .from('riksdagen_ledamoter')
        .select('*')
        .eq('intressent_id', args.intressent_id)
        .single();

      if (error) return null;
      return data || null;
    },
    fallbackApi: async () => {
      const response = await fetch(`https://data.riksdagen.se/personlista/?iid=${args.intressent_id}&utformat=json`);
      const json: any = await response.json();
      const person = json?.personlista?.person?.[0];
      if (!person) return null;
      return {
        intressent_id: person.intressent_id,
        tilltalsnamn: person.tilltalsnamn,
        fornamn: person.fornamn,
        efternamn: person.efternamn,
        parti: person.parti,
        valkrets: person.valkrets,
        status: person.status,
        bild_url: person.bild_url,
      };
    },
    persist: async (data) => {
      await supabase.from('riksdagen_ledamoter').upsert(data, { onConflict: 'intressent_id' });
    },
    onMiss: async () => {
      await logDataMiss({
        entity: 'riksdagen_ledamoter',
        identifier: args.intressent_id,
        reason: 'saknas i supabase',
      });
    },
  });

  if (!ledamot) {
    throw new Error(`Ledamot med ID ${args.intressent_id} hittades inte`);
  }

  // Hämta uppdrag om tabellen finns
  const { data: uppdrag } = await supabase
    .from('riksdagen_ledamoter_uppdrag')
    .select('*')
    .eq('intressent_id', args.intressent_id)
    .order('uppdrag_fran', { ascending: false });

  const namn = (ledamot.tilltalsnamn || ledamot.fornamn || '').trim();

  return {
    ledamot,
    uppdrag: uppdrag || [],
    summary: `${namn ? `${namn} ` : ''}${ledamot.efternamn} (${ledamot.parti}), ${ledamot.valkrets || 'okänd valkrets'}`,
    source,
    fetchedAt,
  };
}

/**
 * Hämta motioner
 */
export const getMotionerSchema = z.object({
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  parti: z.string().optional().describe('Parti'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function getMotioner(args: z.infer<typeof getMotionerSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);

  let query = supabase
    .from('riksdagen_motioner')
    .select('*')
    .limit(limit)
    .order('datum', { ascending: false });

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  if (args.parti) {
    query = query.ilike('beteckning', `%${args.parti}%`);
  }

  const { data, error } = await query;

  if (error) {
    // Om tabellen inte finns, använd riksdagen_dokument istället
    let fallbackQuery = supabase
      .from('riksdagen_dokument')
      .select('*')
      .eq('doktyp', 'mot')
      .limit(limit)
      .order('datum', { ascending: false });

    if (args.rm) {
      fallbackQuery = fallbackQuery.eq('rm', args.rm);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      throw new Error(`Fel vid hämtning av motioner: ${fallbackError.message}`);
    }

    return {
      count: fallbackData?.length || 0,
      motioner: fallbackData || [],
      source: 'riksdagen_dokument',
    };
  }

  return {
    count: data?.length || 0,
    motioner: data || [],
    source: 'riksdagen_motioner',
  };
}

/**
 * Hämta propositioner från Riksdagen
 */
export const getPropositionerSchema = z.object({
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function getPropositioner(args: z.infer<typeof getPropositionerSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);

  let query = supabase
    .from('riksdagen_propositioner')
    .select('*')
    .limit(limit)
    .order('datum', { ascending: false });

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback till riksdagen_dokument
    let fallbackQuery = supabase
      .from('riksdagen_dokument')
      .select('*')
      .eq('doktyp', 'prop')
      .limit(limit)
      .order('datum', { ascending: false });

    if (args.rm) {
      fallbackQuery = fallbackQuery.eq('rm', args.rm);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      throw new Error(`Fel vid hämtning av propositioner: ${fallbackError.message}`);
    }

    return {
      count: fallbackData?.length || 0,
      propositioner: fallbackData || [],
      source: 'riksdagen_dokument',
    };
  }

  return {
    count: data?.length || 0,
    propositioner: data || [],
    source: 'riksdagen_propositioner',
  };
}

/**
 * Hämta betänkanden
 */
export const getBetankandenSchema = z.object({
  utskott: z.string().optional().describe('Utskott (t.ex. KU, FiU)'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function getBetankanden(args: z.infer<typeof getBetankandenSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);

  let query = supabase
    .from('riksdagen_betankanden')
    .select('*')
    .limit(limit)
    .order('datum', { ascending: false });

  if (args.utskott) {
    query = query.eq('organ', args.utskott);
  }

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback till riksdagen_dokument
      let fallbackQuery = supabase
        .from('riksdagen_dokument')
        .select('*')
        .eq('doktyp', 'bet')
        .limit(limit)
      .order('datum', { ascending: false });

    if (args.utskott) {
      fallbackQuery = fallbackQuery.eq('organ', args.utskott);
    }

    if (args.rm) {
      fallbackQuery = fallbackQuery.eq('rm', args.rm);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      throw new Error(`Fel vid hämtning av betänkanden: ${fallbackError.message}`);
    }

    return {
      count: fallbackData?.length || 0,
      betankanden: fallbackData || [],
      source: 'riksdagen_dokument',
    };
  }

  return {
    count: data?.length || 0,
    betankanden: data || [],
    source: 'riksdagen_betankanden',
  };
}

/**
 * Hämta frågor från Riksdagen
 */
export const getFragorSchema = z.object({
  typ: z.enum(['skriftlig', 'muntlig']).optional().describe('Typ av fråga'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function getFragor(args: z.infer<typeof getFragorSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);
  const warnings: string[] = [];

  let query = supabase
    .from('riksdagen_fragor')
    .select('*')
    .limit(limit)
    .order('publicerad_datum', { ascending: false });

  if (args.typ) {
    warnings.push('typ-filter stöds inte av nuvarande schema och ignoreras.');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid hämtning av frågor: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    fragor: data || [],
    meta: warnings.length ? { warnings } : undefined,
  };
}

/**
 * Hämta interpellationer
 */
export const getInterpellationerSchema = z.object({
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
});

export async function getInterpellationer(args: z.infer<typeof getInterpellationerSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);

  let query = supabase
    .from('riksdagen_interpellationer')
    .select('*')
    .limit(limit)
    .order('publicerad_datum', { ascending: false });

  if (args.from_date) {
    query = query.gte('publicerad_datum', args.from_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid hämtning av interpellationer: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    interpellationer: data || [],
  };
}

/**
 * Hämta utskott
 */
export const getUtskottSchema = z.object({});

export async function getUtskott(args: z.infer<typeof getUtskottSchema>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('riksdagen_utskott')
    .select('*')
    .order('namn');

  if (error) {
    throw new Error(`Fel vid hämtning av utskott: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    utskott: data || [],
  };
}
