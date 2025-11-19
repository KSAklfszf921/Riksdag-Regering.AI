/**
 * Jämförelseverktyg för Riksdagen och Regeringskansliet
 */

import { getSupabase } from '../utils/supabase.js';
import { z } from 'zod';

/**
 * Jämför två ledamöter
 */
export const compareLedamoterSchema = z.object({
  intressent_id_1: z.string().describe('ID för första ledamoten'),
  intressent_id_2: z.string().describe('ID för andra ledamoten'),
});

export async function compareLedamoter(args: z.infer<typeof compareLedamoterSchema>) {
  const supabase = getSupabase();

  // Hämta båda ledamöterna
  const { data: ledamoter, error } = await supabase
    .from('riksdagen_ledamoter')
    .select('*')
    .in('intressent_id', [args.intressent_id_1, args.intressent_id_2]);

  if (error || !ledamoter || ledamoter.length !== 2) {
    throw new Error('Kunde inte hämta båda ledamöterna');
  }

  const [ledamot1, ledamot2] = ledamoter;

  // Hämta anföranden för båda
  const { data: anforanden1 } = await supabase
    .from('riksdagen_anforanden')
    .select('*')
    .eq('intressent_id', args.intressent_id_1);

  const { data: anforanden2 } = await supabase
    .from('riksdagen_anforanden')
    .select('*')
    .eq('intressent_id', args.intressent_id_2);

  // Hämta röster för båda
  const { data: roster1 } = await supabase
    .from('riksdagen_voteringar_roster')
    .select('*')
    .eq('intressent_id', args.intressent_id_1);

  const { data: roster2 } = await supabase
    .from('riksdagen_voteringar_roster')
    .select('*')
    .eq('intressent_id', args.intressent_id_2);

  return {
    ledamot1: {
      namn: `${ledamot1.fornamn} ${ledamot1.efternamn}`,
      parti: ledamot1.parti,
      valkrets: ledamot1.valkrets,
      antalAnforanden: anforanden1?.length || 0,
      antalRostningar: roster1?.length || 0,
    },
    ledamot2: {
      namn: `${ledamot2.fornamn} ${ledamot2.efternamn}`,
      parti: ledamot2.parti,
      valkrets: ledamot2.valkrets,
      antalAnforanden: anforanden2?.length || 0,
      antalRostningar: roster2?.length || 0,
    },
    jamforelse: {
      sammaParti: ledamot1.parti === ledamot2.parti,
      sammaValkrets: ledamot1.valkrets === ledamot2.valkrets,
      skillnadAnforanden: (anforanden1?.length || 0) - (anforanden2?.length || 0),
      skillnadRostningar: (roster1?.length || 0) - (roster2?.length || 0),
    },
    analysis: `${ledamot1.fornamn} ${ledamot1.efternamn} (${ledamot1.parti}) har ${anforanden1?.length || 0} anföranden och ${roster1?.length || 0} röstningar, medan ${ledamot2.fornamn} ${ledamot2.efternamn} (${ledamot2.parti}) har ${anforanden2?.length || 0} anföranden och ${roster2?.length || 0} röstningar.`,
  };
}

/**
 * Jämför partiernas röstbeteende i specifika voteringar
 */
export const comparePartiRostningSchema = z.object({
  votering_id_1: z.string().describe('ID för första voteringen'),
  votering_id_2: z.string().describe('ID för andra voteringen'),
});

export async function comparePartiRostning(args: z.infer<typeof comparePartiRostningSchema>) {
  const supabase = getSupabase();

  // Hämta båda voteringarna
  const { data: voteringar, error: voteringError } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .in('votering_id', [args.votering_id_1, args.votering_id_2]);

  if (voteringError || !voteringar || voteringar.length !== 2) {
    throw new Error('Kunde inte hämta båda voteringarna');
  }

  const [votering1, votering2] = voteringar;

  // Hämta röster för båda voteringarna
  const { data: roster1 } = await supabase
    .from('riksdagen_voteringar_roster')
    .select('*')
    .eq('votering_id', args.votering_id_1);

  const { data: roster2 } = await supabase
    .from('riksdagen_voteringar_roster')
    .select('*')
    .eq('votering_id', args.votering_id_2);

  // Gruppera röster per parti
  const partiRoster1: Record<string, { ja: number; nej: number }> = {};
  const partiRoster2: Record<string, { ja: number; nej: number }> = {};

  roster1?.forEach(rost => {
    if (!partiRoster1[rost.parti]) {
      partiRoster1[rost.parti] = { ja: 0, nej: 0 };
    }
    if (rost.rost === 'Ja') partiRoster1[rost.parti].ja++;
    if (rost.rost === 'Nej') partiRoster1[rost.parti].nej++;
  });

  roster2?.forEach(rost => {
    if (!partiRoster2[rost.parti]) {
      partiRoster2[rost.parti] = { ja: 0, nej: 0 };
    }
    if (rost.rost === 'Ja') partiRoster2[rost.parti].ja++;
    if (rost.rost === 'Nej') partiRoster2[rost.parti].nej++;
  });

  return {
    votering1: {
      id: votering1.votering_id,
      titel: votering1.titel,
      datum: votering1.votering_datum,
      partiRoster: partiRoster1,
    },
    votering2: {
      id: votering2.votering_id,
      titel: votering2.titel,
      datum: votering2.votering_datum,
      partiRoster: partiRoster2,
    },
    analysis: `Jämförelse mellan "${votering1.titel}" (${votering1.votering_datum}) och "${votering2.titel}" (${votering2.votering_datum}).`,
  };
}

/**
 * Jämför dokument från Riksdagen och Regeringen om samma ämne
 */
export const compareRiksdagRegeringSchema = z.object({
  searchTerm: z.string().describe('Sökterm för att hitta relaterade dokument'),
  limit: z.number().optional().default(10).describe('Max antal dokument från varje källa'),
});

export async function compareRiksdagRegering(args: z.infer<typeof compareRiksdagRegeringSchema>) {
  const supabase = getSupabase();

  // Sök i Riksdagens dokument
  const { data: riksdagDok } = await supabase
    .from('riksdagen_dokument')
    .select('*')
    .ilike('titel', `%${args.searchTerm}%`)
    .limit(args.limit || 10)
    .order('datum', { ascending: false });

  // Sök i Regeringens propositioner
  const { data: regeringProp } = await supabase
    .from('regeringskansliet_propositioner')
    .select('*')
    .ilike('titel', `%${args.searchTerm}%`)
    .limit(args.limit || 10)
    .order('publicerad_datum', { ascending: false });

  // Sök i Regeringens pressmeddelanden
  const { data: regeringPress } = await supabase
    .from('regeringskansliet_pressmeddelanden')
    .select('*')
    .ilike('titel', `%${args.searchTerm}%`)
    .limit(args.limit || 10)
    .order('publicerad_datum', { ascending: false });

  return {
    searchTerm: args.searchTerm,
    riksdagen: {
      antalDokument: riksdagDok?.length || 0,
      dokument: riksdagDok || [],
    },
    regeringen: {
      antalPropositioner: regeringProp?.length || 0,
      propositioner: regeringProp || [],
      antalPressmeddelanden: regeringPress?.length || 0,
      pressmeddelanden: regeringPress || [],
    },
    analysis: `Hittade ${riksdagDok?.length || 0} dokument från Riksdagen, ${regeringProp?.length || 0} propositioner och ${regeringPress?.length || 0} pressmeddelanden från Regeringen relaterade till "${args.searchTerm}".`,
  };
}

/**
 * Jämför aktivitet mellan partier
 */
export const comparePartierSchema = z.object({
  parti_1: z.string().describe('Första partiet (t.ex. S, M, SD)'),
  parti_2: z.string().describe('Andra partiet'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function comparePartier(args: z.infer<typeof comparePartierSchema>) {
  const supabase = getSupabase();

  const parti1 = args.parti_1.toUpperCase();
  const parti2 = args.parti_2.toUpperCase();

  // Räkna ledamöter per parti
  const { data: ledamoter1 } = await supabase
    .from('riksdagen_ledamoter')
    .select('intressent_id')
    .eq('parti', parti1);

  const { data: ledamoter2 } = await supabase
    .from('riksdagen_ledamoter')
    .select('intressent_id')
    .eq('parti', parti2);

  // Räkna anföranden per parti
  let anforandenQuery1 = supabase
    .from('riksdagen_anforanden')
    .select('*', { count: 'exact', head: true })
    .eq('parti', parti1);

  let anforandenQuery2 = supabase
    .from('riksdagen_anforanden')
    .select('*', { count: 'exact', head: true })
    .eq('parti', parti2);

  if (args.from_date) {
    anforandenQuery1 = anforandenQuery1.gte('anfdatum', args.from_date);
    anforandenQuery2 = anforandenQuery2.gte('anfdatum', args.from_date);
  }

  if (args.to_date) {
    anforandenQuery1 = anforandenQuery1.lte('anfdatum', args.to_date);
    anforandenQuery2 = anforandenQuery2.lte('anfdatum', args.to_date);
  }

  const { count: anforanden1 } = await anforandenQuery1;
  const { count: anforanden2 } = await anforandenQuery2;

  // Räkna dokument per parti (motioner etc)
  let dokumentQuery1 = supabase
    .from('riksdagen_dokument')
    .select('*', { count: 'exact', head: true })
    .eq('doktyp', 'mot')
    .ilike('beteckning', `%${parti1}%`);

  let dokumentQuery2 = supabase
    .from('riksdagen_dokument')
    .select('*', { count: 'exact', head: true })
    .eq('doktyp', 'mot')
    .ilike('beteckning', `%${parti2}%`);

  if (args.from_date) {
    dokumentQuery1 = dokumentQuery1.gte('datum', args.from_date);
    dokumentQuery2 = dokumentQuery2.gte('datum', args.from_date);
  }

  if (args.to_date) {
    dokumentQuery1 = dokumentQuery1.lte('datum', args.to_date);
    dokumentQuery2 = dokumentQuery2.lte('datum', args.to_date);
  }

  const { count: dokument1 } = await dokumentQuery1;
  const { count: dokument2 } = await dokumentQuery2;

  return {
    parti1: {
      namn: parti1,
      antalLedamoter: ledamoter1?.length || 0,
      antalAnforanden: anforanden1 || 0,
      antalMotioner: dokument1 || 0,
    },
    parti2: {
      namn: parti2,
      antalLedamoter: ledamoter2?.length || 0,
      antalAnforanden: anforanden2 || 0,
      antalMotioner: dokument2 || 0,
    },
    skillnad: {
      ledamoter: (ledamoter1?.length || 0) - (ledamoter2?.length || 0),
      anforanden: (anforanden1 || 0) - (anforanden2 || 0),
      motioner: (dokument1 || 0) - (dokument2 || 0),
    },
    analysis: `${parti1} har ${ledamoter1?.length || 0} ledamöter och ${anforanden1 || 0} anföranden, medan ${parti2} har ${ledamoter2?.length || 0} ledamöter och ${anforanden2 || 0} anföranden.`,
  };
}
