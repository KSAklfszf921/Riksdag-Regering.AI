/**
 * Avancerade aggregeringsverktyg för djupare analys
 */

import { getSupabase } from '../utils/supabase.js';
import { z } from 'zod';

/**
 * Hämta sammanställning av all data i systemet
 */
export const getDataSummarySchema = z.object({});

export async function getDataSummary(args: z.infer<typeof getDataSummarySchema>) {
  const supabase = getSupabase();

  // Samla in statistik från alla tabeller
  const stats: Record<string, number> = {};

  const tables = [
    'riksdagen_ledamoter',
    'riksdagen_dokument',
    'riksdagen_anforanden',
    'riksdagen_voteringar',
    'riksdagen_motioner',
    'riksdagen_propositioner',
    'riksdagen_betankanden',
    'riksdagen_fragor',
    'riksdagen_interpellationer',
    'regeringskansliet_pressmeddelanden',
    'regeringskansliet_propositioner',
    'regeringskansliet_sou',
    'regeringskansliet_remisser',
    'regeringskansliet_rapporter',
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      stats[table] = count || 0;
    }
  }

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return {
    totalPosts: total,
    tabellStatistik: stats,
    riksdagen: {
      ledamoter: stats['riksdagen_ledamoter'] || 0,
      dokument: stats['riksdagen_dokument'] || 0,
      anforanden: stats['riksdagen_anforanden'] || 0,
      voteringar: stats['riksdagen_voteringar'] || 0,
    },
    regeringen: {
      pressmeddelanden: stats['regeringskansliet_pressmeddelanden'] || 0,
      propositioner: stats['regeringskansliet_propositioner'] || 0,
      sou: stats['regeringskansliet_sou'] || 0,
    },
    analysis: `Totalt ${total.toLocaleString('sv-SE')} poster i systemet`,
  };
}

/**
 * Analysera aktivitet per parti över tid
 */
export const analyzePartiActivitySchema = z.object({
  parti: z.string().describe('Parti att analysera (t.ex. S, M, SD)'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function analyzePartiActivity(args: z.infer<typeof analyzePartiActivitySchema>) {
  const supabase = getSupabase();

  const parti = args.parti.toUpperCase();

  // Räkna ledamöter
  const { count: ledamoterCount } = await supabase
    .from('riksdagen_ledamoter')
    .select('*', { count: 'exact', head: true })
    .eq('parti', parti);

  // Räkna anföranden
  let anforandenQuery = supabase
    .from('riksdagen_anforanden')
    .select('*', { count: 'exact', head: true })
    .eq('parti', parti);

  if (args.from_date) {
    anforandenQuery = anforandenQuery.gte('anfdatum', args.from_date);
  }

  if (args.to_date) {
    anforandenQuery = anforandenQuery.lte('anfdatum', args.to_date);
  }

  const { count: anforandenCount } = await anforandenQuery;

  // Räkna motioner (från beteckning)
  let motionerQuery = supabase
    .from('riksdagen_dokument')
    .select('*', { count: 'exact', head: true })
    .eq('doktyp', 'mot')
    .ilike('beteckning', `%${parti}%`);

  if (args.from_date) {
    motionerQuery = motionerQuery.gte('datum', args.from_date);
  }

  if (args.to_date) {
    motionerQuery = motionerQuery.lte('datum', args.to_date);
  }

  const { count: motionerCount } = await motionerQuery;

  // Hämta senaste aktiviteter
  const { data: senaste_anforanden } = await supabase
    .from('riksdagen_anforanden')
    .select('debattnamn, anfdatum, talare')
    .eq('parti', parti)
    .order('anfdatum', { ascending: false })
    .limit(5);

  return {
    parti,
    period: {
      from: args.from_date || 'början',
      to: args.to_date || 'nu',
    },
    statistik: {
      antalLedamoter: ledamoterCount || 0,
      antalAnforanden: anforandenCount || 0,
      antalMotioner: motionerCount || 0,
    },
    senasteAnforanden: senaste_anforanden || [],
    analysis: `${parti} har ${ledamoterCount || 0} ledamöter, ${anforandenCount || 0} anföranden och ${motionerCount || 0} motioner under den angivna perioden.`,
  };
}

/**
 * Analysera riksmöte
 */
export const analyzeRiksmoteSchema = z.object({
  rm: z.string().describe('Riksmöte att analysera (t.ex. 2024/25)'),
});

export async function analyzeRiksmote(args: z.infer<typeof analyzeRiksmoteSchema>) {
  const supabase = getSupabase();

  // Räkna olika dokumenttyper för riksmötet
  const { data: dokumentTyper } = await supabase
    .from('riksdagen_dokument')
    .select('doktyp')
    .eq('rm', args.rm);

  const typCount: Record<string, number> = {};
  dokumentTyper?.forEach(d => {
    if (d.doktyp) {
      typCount[d.doktyp] = (typCount[d.doktyp] || 0) + 1;
    }
  });

  // Räkna voteringar
  const { count: voteringarCount } = await supabase
    .from('riksdagen_voteringar')
    .select('*', { count: 'exact', head: true })
    .eq('rm', args.rm);

  // Räkna anföranden (via datum-matching om rm inte finns)
  const rmYear = args.rm.split('/')[0];
  const { count: anforandenCount } = await supabase
    .from('riksdagen_anforanden')
    .select('*', { count: 'exact', head: true })
    .gte('anfdatum', `${rmYear}-09-01`)
    .lt('anfdatum', `${parseInt(rmYear) + 1}-09-01`);

  return {
    riksmote: args.rm,
    dokumentTyper: typCount,
    totalDokument: dokumentTyper?.length || 0,
    antalVoteringar: voteringarCount || 0,
    antalAnforanden: anforandenCount || 0,
    analysis: `Riksmöte ${args.rm} har ${dokumentTyper?.length || 0} dokument, ${voteringarCount || 0} voteringar och ${anforandenCount || 0} anföranden.`,
  };
}

/**
 * Få topp-listor
 */
export const getTopListsSchema = z.object({
  category: z.enum(['talare', 'partier', 'utskott', 'dokumenttyper']).describe('Kategori att lista'),
  limit: z.number().optional().default(10).describe('Antal i listan'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function getTopLists(args: z.infer<typeof getTopListsSchema>) {
  const supabase = getSupabase();

  switch (args.category) {
    case 'talare': {
      // Topp talare baserat på antal anföranden
      let query = supabase
        .from('riksdagen_anforanden')
        .select('talare, intressent_id');

      if (args.from_date) {
        query = query.gte('anfdatum', args.from_date);
      }

      if (args.to_date) {
        query = query.lte('anfdatum', args.to_date);
      }

      const { data } = await query;

      const talarCount: Record<string, number> = {};
      data?.forEach(a => {
        if (a.talare) {
          talarCount[a.talare] = (talarCount[a.talare] || 0) + 1;
        }
      });

      const sorted = Object.entries(talarCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, args.limit || 10);

      return {
        category: 'Topp talare',
        lista: sorted.map(([talare, antal]) => ({ talare, antalAnforanden: antal })),
      };
    }

    case 'partier': {
      // Topp partier baserat på aktivitet
      const { data: anforanden } = await supabase
        .from('riksdagen_anforanden')
        .select('parti');

      const partiCount: Record<string, number> = {};
      anforanden?.forEach(a => {
        if (a.parti) {
          partiCount[a.parti] = (partiCount[a.parti] || 0) + 1;
        }
      });

      const sorted = Object.entries(partiCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, args.limit || 10);

      return {
        category: 'Topp partier (efter anföranden)',
        lista: sorted.map(([parti, antal]) => ({ parti, antalAnforanden: antal })),
      };
    }

    case 'utskott': {
      // Topp utskott baserat på dokument
      let query = supabase
        .from('riksdagen_dokument')
        .select('organ');

      if (args.from_date) {
        query = query.gte('datum', args.from_date);
      }

      if (args.to_date) {
        query = query.lte('datum', args.to_date);
      }

      const { data } = await query;

      const organCount: Record<string, number> = {};
      data?.forEach(d => {
        if (d.organ) {
          organCount[d.organ] = (organCount[d.organ] || 0) + 1;
        }
      });

      const sorted = Object.entries(organCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, args.limit || 10);

      return {
        category: 'Topp utskott/organ',
        lista: sorted.map(([organ, antal]) => ({ organ, antalDokument: antal })),
      };
    }

    case 'dokumenttyper': {
      // Topp dokumenttyper
      let query = supabase
        .from('riksdagen_dokument')
        .select('doktyp');

      if (args.from_date) {
        query = query.gte('datum', args.from_date);
      }

      if (args.to_date) {
        query = query.lte('datum', args.to_date);
      }

      const { data } = await query;

      const typCount: Record<string, number> = {};
      data?.forEach(d => {
        if (d.doktyp) {
          typCount[d.doktyp] = (typCount[d.doktyp] || 0) + 1;
        }
      });

      const sorted = Object.entries(typCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, args.limit || 10);

      return {
        category: 'Topp dokumenttyper',
        lista: sorted.map(([doktyp, antal]) => ({ dokumenttyp: doktyp, antal })),
      };
    }

    default:
      throw new Error(`Okänd kategori: ${args.category}`);
  }
}

/**
 * Sök över alla tabeller (fulltext search)
 */
export const globalSearchSchema = z.object({
  query: z.string().describe('Sökterm'),
  limit: z.number().optional().default(20).describe('Max resultat per tabell'),
});

export async function globalSearch(args: z.infer<typeof globalSearchSchema>) {
  const supabase = getSupabase();

  const results: Record<string, any[]> = {};

  // Sök i dokument
  const { data: dokument } = await supabase
    .from('riksdagen_dokument')
    .select('dok_id, titel, doktyp, datum')
    .ilike('titel', `%${args.query}%`)
    .limit(args.limit || 20);

  if (dokument && dokument.length > 0) {
    results['dokument'] = dokument;
  }

  // Sök i anföranden
  const { data: anforanden } = await supabase
    .from('riksdagen_anforanden')
    .select('anforande_id, debattnamn, talare, anfdatum')
    .or(`debattnamn.ilike.%${args.query}%,talare.ilike.%${args.query}%`)
    .limit(args.limit || 20);

  if (anforanden && anforanden.length > 0) {
    results['anforanden'] = anforanden;
  }

  // Sök i ledamöter
  const { data: ledamoter } = await supabase
    .from('riksdagen_ledamoter')
    .select('intressent_id, fornamn, efternamn, parti, valkrets')
    .or(`fornamn.ilike.%${args.query}%,efternamn.ilike.%${args.query}%`)
    .limit(args.limit || 20);

  if (ledamoter && ledamoter.length > 0) {
    results['ledamoter'] = ledamoter;
  }

  // Sök i pressmeddelanden
  const { data: press } = await supabase
    .from('regeringskansliet_pressmeddelanden')
    .select('document_id, titel, publicerad_datum, departement')
    .ilike('titel', `%${args.query}%`)
    .limit(args.limit || 20);

  if (press && press.length > 0) {
    results['pressmeddelanden'] = press;
  }

  const totalHits = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return {
    query: args.query,
    totalHits,
    results,
    analysis: `Hittade ${totalHits} resultat för "${args.query}" över ${Object.keys(results).length} olika kategorier.`,
  };
}
