/**
 * Analysverktyg för Riksdagen och Regeringskansliet
 */

import { getSupabase } from '../utils/supabase.js';
import { calculateStatistics, groupBy } from '../utils/helpers.js';
import { z } from 'zod';

/**
 * Analysera partifördelning av ledamöter
 */
export const analyzePartifordelningSchema = z.object({
  valkrets: z.string().optional().describe('Filtrera efter valkrets'),
});

export async function analyzePartifordelning(args: z.infer<typeof analyzePartifordelningSchema>) {
  const supabase = getSupabase();

  let query = supabase
    .from('riksdagen_ledamoter')
    .select('parti, valkrets, status');

  if (args.valkrets) {
    query = query.ilike('valkrets', `%${args.valkrets}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid analys av partifördelning: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      totalLedamoter: 0,
      partiFordelning: {},
      analysis: 'Inga ledamöter hittades',
    };
  }

  const stats = calculateStatistics(data, 'parti');
  const grouped = groupBy(data, 'parti');

  const partiAnalys: Record<string, any> = {};
  for (const [parti, ledamoter] of Object.entries(grouped)) {
    partiAnalys[parti] = {
      antal: ledamoter.length,
      procent: ((ledamoter.length / data.length) * 100).toFixed(2) + '%',
    };
  }

  return {
    totalLedamoter: data.length,
    antalPartier: stats.unique,
    partiFordelning: partiAnalys,
    analysis: `Det finns ${data.length} ledamöter fördelade över ${stats.unique} partier.`,
  };
}

/**
 * Analysera röstningsstatistik för voteringar
 */
export const analyzeVoteringSchema = z.object({
  votering_id: z.string().describe('ID för voteringen att analysera'),
});

export async function analyzeVotering(args: z.infer<typeof analyzeVoteringSchema>) {
  const supabase = getSupabase();

  // Hämta votering
  const { data: votering, error: voteringError } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .eq('votering_id', args.votering_id)
    .single();

  if (voteringError) {
    throw new Error(`Fel vid hämtning av votering: ${voteringError.message}`);
  }

  if (!votering) {
    throw new Error(`Votering med ID ${args.votering_id} hittades inte`);
  }

  // Hämta detaljerade röster om de finns
  const { data: roster, error: rosterError } = await supabase
    .from('riksdagen_voteringar_roster')
    .select('*')
    .eq('votering_id', args.votering_id);

  let partiAnalys: Record<string, any> = {};
  if (roster && roster.length > 0) {
    const grouped = groupBy(roster, 'parti');

    for (const [parti, votes] of Object.entries(grouped)) {
      const jaRoster = votes.filter(v => v.rost === 'Ja').length;
      const nejRoster = votes.filter(v => v.rost === 'Nej').length;
      const avstarRoster = votes.filter(v => v.rost === 'Avstår').length;
      const franvarandeRoster = votes.filter(v => v.rost === 'Frånvarande').length;

      partiAnalys[parti] = {
        ja: jaRoster,
        nej: nejRoster,
        avstår: avstarRoster,
        frånvarande: franvarandeRoster,
        totalt: votes.length,
      };
    }
  }

  const totalRoster = (votering.antal_ja || 0) + (votering.antal_nej || 0);
  const jaAndel = totalRoster > 0 ? ((votering.antal_ja || 0) / totalRoster * 100).toFixed(1) : '0';

  return {
    votering: {
      id: votering.votering_id,
      titel: votering.titel,
      datum: votering.votering_datum,
      rm: votering.rm,
      beteckning: votering.beteckning,
    },
    resultat: {
      ja: votering.antal_ja || 0,
      nej: votering.antal_nej || 0,
      avstående: votering.antal_avstående || 0,
      frånvarande: votering.antal_frånvarande || 0,
      jaAndel: `${jaAndel}%`,
    },
    partiAnalys: roster && roster.length > 0 ? partiAnalys : null,
    analysis: `Votering "${votering.titel}" genomfördes ${votering.votering_datum}. Resultatet blev ${votering.antal_ja || 0} Ja-röster mot ${votering.antal_nej || 0} Nej-röster (${jaAndel}% Ja).`,
  };
}

/**
 * Analysera aktivitet för en ledamot
 */
export const analyzeLedamotSchema = z.object({
  intressent_id: z.string().describe('ID för ledamoten'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function analyzeLedamot(args: z.infer<typeof analyzeLedamotSchema>) {
  const supabase = getSupabase();

  // Hämta ledamot
  const { data: ledamot, error: ledamotError } = await supabase
    .from('riksdagen_ledamoter')
    .select('*')
    .eq('intressent_id', args.intressent_id)
    .single();

  if (ledamotError || !ledamot) {
    throw new Error(`Ledamot med ID ${args.intressent_id} hittades inte`);
  }

  // Hämta anföranden
  let anforandenQuery = supabase
    .from('riksdagen_anforanden')
    .select('*')
    .eq('intressent_id', args.intressent_id);

  if (args.from_date) {
    anforandenQuery = anforandenQuery.gte('anfdatum', args.from_date);
  }

  if (args.to_date) {
    anforandenQuery = anforandenQuery.lte('anfdatum', args.to_date);
  }

  const { data: anforanden, error: anforandenError } = await anforandenQuery;

  // Hämta röster
  let rosterQuery = supabase
    .from('riksdagen_voteringar_roster')
    .select('*')
    .eq('intressent_id', args.intressent_id);

  const { data: roster, error: rosterError } = await rosterQuery;

  const rostStats = roster ? {
    ja: roster.filter(r => r.rost === 'Ja').length,
    nej: roster.filter(r => r.rost === 'Nej').length,
    avstår: roster.filter(r => r.rost === 'Avstår').length,
    frånvarande: roster.filter(r => r.rost === 'Frånvarande').length,
    totalt: roster.length,
  } : null;

  return {
    ledamot: {
      namn: `${ledamot.fornamn} ${ledamot.efternamn}`,
      parti: ledamot.parti,
      valkrets: ledamot.valkrets,
      status: ledamot.status,
    },
    aktivitet: {
      antalAnforanden: anforanden?.length || 0,
      antalRostningar: roster?.length || 0,
    },
    rostningsstatistik: rostStats,
    analysis: `${ledamot.fornamn} ${ledamot.efternamn} (${ledamot.parti}) har gjort ${anforanden?.length || 0} anföranden och deltagit i ${roster?.length || 0} voteringar.`,
  };
}

/**
 * Analysera dokumentstatistik
 */
export const analyzeDokumentStatistikSchema = z.object({
  doktyp: z.string().optional().describe('Dokumenttyp att analysera'),
  rm: z.string().optional().describe('Riksmöte att analysera'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function analyzeDokumentStatistik(args: z.infer<typeof analyzeDokumentStatistikSchema>) {
  const supabase = getSupabase();

  let query = supabase.from('riksdagen_dokument').select('doktyp, organ, datum, rm');

  if (args.doktyp) {
    query = query.eq('doktyp', args.doktyp);
  }

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  if (args.from_date) {
    query = query.gte('datum', args.from_date);
  }

  if (args.to_date) {
    query = query.lte('datum', args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid analys av dokumentstatistik: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      totalDokument: 0,
      dokumenttyper: {},
      organ: {},
      analysis: 'Inga dokument hittades för de angivna kriterierna',
    };
  }

  const doktypStats = calculateStatistics(data, 'doktyp');
  const organStats = calculateStatistics(data, 'organ');

  return {
    totalDokument: data.length,
    antalDokumenttyper: doktypStats.unique,
    dokumenttyper: doktypStats.distribution,
    antalOrgan: organStats.unique,
    organ: organStats.distribution,
    period: {
      from: args.from_date || 'början',
      to: args.to_date || 'nu',
    },
    analysis: `Det finns ${data.length} dokument av ${doktypStats.unique} olika dokumenttyper från ${organStats.unique} olika organ.`,
  };
}

/**
 * Analysera trender över tid
 */
export const analyzeTrendSchema = z.object({
  dataType: z.enum(['dokument', 'anforanden', 'voteringar']).describe('Typ av data att analysera'),
  groupBy: z.enum(['day', 'week', 'month', 'year']).describe('Gruppering (dag, vecka, månad, år)'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function analyzeTrend(args: z.infer<typeof analyzeTrendSchema>) {
  const supabase = getSupabase();

  const tableMap = {
    'dokument': { table: 'riksdagen_dokument', dateField: 'datum' },
    'anforanden': { table: 'riksdagen_anforanden', dateField: 'anfdatum' },
    'voteringar': { table: 'riksdagen_voteringar', dateField: 'votering_datum' },
  };

  const config = tableMap[args.dataType];

  let query = supabase
    .from(config.table)
    .select(config.dateField);

  if (args.from_date) {
    query = query.gte(config.dateField, args.from_date);
  }

  if (args.to_date) {
    query = query.lte(config.dateField, args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid trendanalys: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      dataType: args.dataType,
      totalItems: 0,
      trend: {},
      analysis: 'Inga data hittades för trendanalys',
    };
  }

  // Gruppera efter tidsperiod
  const trend: Record<string, number> = {};
  for (const item of data) {
    const dateValue = (item as any)[config.dateField];
    const date = new Date(dateValue);
    let key: string;

    switch (args.groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${week}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
    }

    trend[key] = (trend[key] || 0) + 1;
  }

  const sortedTrend = Object.entries(trend)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

  return {
    dataType: args.dataType,
    totalItems: data.length,
    groupBy: args.groupBy,
    trend: sortedTrend,
    analysis: `Trendanalys av ${args.dataType} grupperat per ${args.groupBy} visar ${Object.keys(trend).length} olika perioder med totalt ${data.length} poster.`,
  };
}
