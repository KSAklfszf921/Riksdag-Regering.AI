/**
 * Sökverktyg för Riksdagen och Regeringskansliet
 */

import { getSupabase } from '../utils/supabase.js';
import { z } from 'zod';
import { expandPartyAliases } from '../utils/partyAliases.js';

/**
 * Sök efter ledamöter
 */
export const searchLedamoterSchema = z.object({
  namn: z.string().optional().describe('Namn att söka efter (förnamn eller efternamn)'),
  parti: z.string().optional().describe('Parti (t.ex. S, M, SD, V, MP, C, L, KD)'),
  valkrets: z.string().optional().describe('Valkrets'),
  status: z.string().optional().describe('Status (tjänstgörande, tjänstledig, etc.)'),
  limit: z.number().optional().default(50).describe('Max antal resultat'),
});

export async function searchLedamoter(args: z.infer<typeof searchLedamoterSchema>) {
  const supabase = getSupabase();

  let query = supabase
    .from('riksdagen_ledamoter')
    .select('*')
    .limit(args.limit || 50);

  if (args.namn) {
    // FIX: fornamn finns inte i API - använd bara tilltalsnamn och efternamn
    query = query.or(`tilltalsnamn.ilike.%${args.namn}%,efternamn.ilike.%${args.namn}%`);
  }

  if (args.parti) {
    // Expand party aliases (e.g. 'L' includes both 'L' and 'FP')
    const partyAliases = expandPartyAliases(args.parti);
    query = query.in('parti', partyAliases);
  }

  if (args.valkrets) {
    query = query.ilike('valkrets', `%${args.valkrets}%`);
  }

  if (args.status) {
    query = query.ilike('status', `%${args.status}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid sökning av ledamöter: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    ledamoter: data || [],
  };
}

/**
 * Sök efter dokument
 */
export const searchDokumentSchema = z.object({
  titel: z.string().optional().describe('Titel att söka efter'),
  doktyp: z.string().optional().describe('Dokumenttyp (t.ex. mot, prop, bet, skr)'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  organ: z.string().optional().describe('Organ (t.ex. KU, FiU, UU)'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  limit: z.number().optional().default(50).describe('Max antal resultat'),
});

export async function searchDokument(args: z.infer<typeof searchDokumentSchema>) {
  const supabase = getSupabase();

  let query = supabase
    .from('riksdagen_dokument')
    .select('*')
    .limit(args.limit || 50)
    .order('datum', { ascending: false });

  if (args.titel) {
    query = query.ilike('titel', `%${args.titel}%`);
  }

  if (args.doktyp) {
    // FIX: Case-insensitive sökning - API använder lowercase
    query = query.eq('doktyp', args.doktyp.toLowerCase());
  }

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  if (args.organ) {
    query = query.eq('organ', args.organ);
  }

  if (args.from_date) {
    query = query.gte('datum', args.from_date);
  }

  if (args.to_date) {
    query = query.lte('datum', args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid sökning av dokument: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    dokument: data || [],
  };
}

/**
 * Sök efter anföranden
 */
export const searchAnforandenSchema = z.object({
  talare: z.string().optional().describe('Talare att söka efter'),
  parti: z.string().optional().describe('Parti'),
  debattnamn: z.string().optional().describe('Debattnamn'),
  text: z.string().optional().describe('Text att söka i anförandet'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  limit: z.number().optional().default(50).describe('Max antal resultat'),
});

export async function searchAnforanden(args: z.infer<typeof searchAnforandenSchema>) {
  const supabase = getSupabase();

  let query = supabase
    .from('riksdagen_anforanden')
    .select('*')
    .limit(args.limit || 50)
    .order('systemdatum', { ascending: false }); // FIX: anfdatum → systemdatum

  if (args.talare) {
    query = query.ilike('talare', `%${args.talare}%`);
  }

  if (args.parti) {
    // Expand party aliases (e.g. 'L' includes both 'L' and 'FP')
    const partyAliases = expandPartyAliases(args.parti);
    query = query.in('parti', partyAliases);
  }

  if (args.debattnamn) {
    // FIX: debattnamn finns inte - använd avsnittsrubrik
    query = query.ilike('avsnittsrubrik', `%${args.debattnamn}%`);
  }

  if (args.text) {
    // FIX: anftext → anforandetext
    query = query.ilike('anforandetext', `%${args.text}%`);
  }

  if (args.from_date) {
    // FIX: anfdatum → dok_datum
    query = query.gte('dok_datum', args.from_date);
  }

  if (args.to_date) {
    // FIX: anfdatum → dok_datum
    query = query.lte('dok_datum', args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid sökning av anföranden: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    anforanden: data || [],
  };
}

/**
 * Sök efter voteringar
 */
export const searchVoteringarSchema = z.object({
  titel: z.string().optional().describe('Titel att söka efter'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  limit: z.number().optional().default(50).describe('Max antal resultat'),
});

export async function searchVoteringar(args: z.infer<typeof searchVoteringarSchema>) {
  const supabase = getSupabase();

  let query = supabase
    .from('riksdagen_voteringar')
    .select('*')
    .limit(args.limit || 50)
    .order('systemdatum', { ascending: false }); // FIX: votering_datum → systemdatum

  // FIX: titel finns inte i API - ta bort eller använd beteckning istället
  if (args.titel) {
    query = query.ilike('beteckning', `%${args.titel}%`);
  }

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  if (args.from_date) {
    // FIX: votering_datum → systemdatum
    query = query.gte('systemdatum', args.from_date);
  }

  if (args.to_date) {
    // FIX: votering_datum → systemdatum
    query = query.lte('systemdatum', args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid sökning av voteringar: ${error.message}`);
  }

  return {
    count: data?.length || 0,
    voteringar: data || [],
  };
}

/**
 * Sök i regeringskansliets dokument
 */
export const searchRegeringSchema = z.object({
  dataType: z.enum([
    'pressmeddelanden',
    'propositioner',
    'departementsserien',
    'sou',
    'remisser',
    'rapporter',
  ]).describe('Typ av dokument att söka i'),
  titel: z.string().optional().describe('Titel att söka efter'),
  departement: z.string().optional().describe('Departement'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  limit: z.number().optional().default(50).describe('Max antal resultat'),
});

export async function searchRegering(args: z.infer<typeof searchRegeringSchema>) {
  const supabase = getSupabase();

  const tableMap: Record<string, string> = {
    'pressmeddelanden': 'regeringskansliet_pressmeddelanden',
    'propositioner': 'regeringskansliet_propositioner',
    'departementsserien': 'regeringskansliet_departementsserien',
    'sou': 'regeringskansliet_sou',
    'remisser': 'regeringskansliet_remisser',
    'rapporter': 'regeringskansliet_rapporter',
  };

  const tableName = tableMap[args.dataType];

  let query = supabase
    .from(tableName)
    .select('*')
    .limit(args.limit || 50)
    .order('publicerad_datum', { ascending: false });

  if (args.titel) {
    query = query.ilike('titel', `%${args.titel}%`);
  }

  if (args.departement) {
    query = query.ilike('departement', `%${args.departement}%`);
  }

  if (args.from_date) {
    query = query.gte('publicerad_datum', args.from_date);
  }

  if (args.to_date) {
    query = query.lte('publicerad_datum', args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid sökning i ${args.dataType}: ${error.message}`);
  }

  return {
    dataType: args.dataType,
    count: data?.length || 0,
    dokument: data || [],
  };
}
