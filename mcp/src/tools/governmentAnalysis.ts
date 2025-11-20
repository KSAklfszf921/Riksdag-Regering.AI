/**
 * Regeringskansliet-analysverktyg
 * Analysera departement, propositioner, pressmeddelanden
 */

import { z } from 'zod';
import {
  fetchG0vDocuments,
  searchG0vAllTypes,
  analyzeByDepartment,
  fetchG0vLatestUpdate,
  G0vDocumentType,
} from '../utils/g0vApi.js';
import { getSupabase } from '../utils/supabase.js';

/**
 * Analysera departementens aktivitet
 */
export const analyzeDepartmentsSchema = z.object({
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  includeSpeeches: z.boolean().optional().default(true).describe('Inkludera tal'),
});

export async function analyzeDepartments(
  args: z.infer<typeof analyzeDepartmentsSchema>
) {
  const analysis = await analyzeByDepartment({
    dateFrom: args.from_date,
    dateTo: args.to_date,
  });

  // Sort departments by total activity
  const sortedDepartments = Object.entries(analysis.departments)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, stats]) => ({
      departement: name,
      ...stats,
    }));

  return {
    period: {
      from: args.from_date || 'början',
      to: args.to_date || 'nu',
    },
    totalDocuments: analysis.total,
    departmentCount: Object.keys(analysis.departments).length,
    departments: sortedDepartments,
    topDepartments: sortedDepartments.slice(0, 5),
    summary: {
      mostActive: sortedDepartments[0],
      averageDocumentsPerDepartment: Math.round(
        analysis.total / Object.keys(analysis.departments).length
      ),
    },
  };
}

/**
 * Spåra en propositions väg från Regering till Riksdag
 */
export const trackPropositionFlowSchema = z.object({
  proposition_reference: z
    .string()
    .describe('Propositionens beteckning (t.ex. Prop. 2024/25:1)'),
});

export async function trackPropositionFlow(
  args: z.infer<typeof trackPropositionFlowSchema>
) {
  const supabase = getSupabase();

  // 1. Sök i Regeringens propositioner
  const { data: regeringProp } = await supabase
    .from('regeringskansliet_propositioner')
    .select('*')
    .ilike('beteckning', `%${args.proposition_reference}%`)
    .limit(5);

  // 2. Sök i Riksdagens propositioner
  const { data: riksdagProp } = await supabase
    .from('riksdagen_dokument')
    .select('*')
    .eq('doktyp', 'prop')
    .ilike('beteckning', `%${args.proposition_reference}%`)
    .limit(5);

  // 3. Sök relaterade betänkanden
  const { data: betankanden } = await supabase
    .from('riksdagen_dokument')
    .select('*')
    .eq('doktyp', 'bet')
    .ilike('beteckning', `%${args.proposition_reference}%`)
    .limit(5);

  // 4. Sök relaterade motioner
  const { data: motioner } = await supabase
    .from('riksdagen_dokument')
    .select('*')
    .eq('doktyp', 'mot')
    .ilike('titel', `%${args.proposition_reference}%`)
    .limit(10);

  // 5. Sök voteringar
  const { data: voteringar } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .ilike('beteckning', `%${args.proposition_reference}%`)
    .limit(5);

  return {
    proposition: args.proposition_reference,
    timeline: [
      {
        stage: 'Regeringen',
        status: regeringProp && regeringProp.length > 0 ? 'Hittad' : 'Ej hittad',
        count: regeringProp?.length || 0,
        documents: regeringProp || [],
      },
      {
        stage: 'Riksdagen',
        status: riksdagProp && riksdagProp.length > 0 ? 'Hittad' : 'Ej hittad',
        count: riksdagProp?.length || 0,
        documents: riksdagProp || [],
      },
      {
        stage: 'Utskottsbetänkanden',
        status: betankanden && betankanden.length > 0 ? 'Hittad' : 'Ej hittad',
        count: betankanden?.length || 0,
        documents: betankanden || [],
      },
      {
        stage: 'Votering',
        status: voteringar && voteringar.length > 0 ? 'Genomförd' : 'Ej genomförd',
        count: voteringar?.length || 0,
        votings: voteringar || [],
      },
    ],
    relatedMotions: {
      count: motioner?.length || 0,
      motions: motioner || [],
    },
    summary: {
      totalStages: 4,
      completedStages: [
        regeringProp && regeringProp.length > 0,
        riksdagProp && riksdagProp.length > 0,
        betankanden && betankanden.length > 0,
        voteringar && voteringar.length > 0,
      ].filter(Boolean).length,
    },
  };
}

/**
 * Analysera policyutveckling över tid
 */
export const analyzePolicyTimelineSchema = z.object({
  topic: z.string().describe('Ämne/policy-område att analysera'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  include_types: z
    .array(z.string())
    .optional()
    .describe('Dokumenttyper att inkludera'),
});

export async function analyzePolicyTimeline(
  args: z.infer<typeof analyzePolicyTimelineSchema>
) {
  const types: G0vDocumentType[] = (args.include_types as G0vDocumentType[]) || [
    'pressmeddelanden',
    'propositioner',
    'sou',
    'tal',
  ];

  // Search across all document types
  const results = await searchG0vAllTypes(args.topic, {
    types,
    dateFrom: args.from_date,
    dateTo: args.to_date,
  });

  // Create timeline
  const timeline: Array<{
    date: string;
    type: string;
    title: string;
    sender?: string;
    url: string;
  }> = [];

  Object.entries(results).forEach(([type, documents]) => {
    documents.forEach((doc) => {
      timeline.push({
        date: doc.published,
        type,
        title: doc.title,
        sender: doc.sender,
        url: doc.url,
      });
    });
  });

  // Sort by date
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  // Group by month
  const monthlyActivity: Record<string, number> = {};
  timeline.forEach((item) => {
    const month = item.date.substring(0, 7); // YYYY-MM
    monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
  });

  return {
    topic: args.topic,
    period: {
      from: args.from_date || timeline[0]?.date || 'N/A',
      to: args.to_date || timeline[timeline.length - 1]?.date || 'N/A',
    },
    totalDocuments: timeline.length,
    documentTypes: Object.entries(results).map(([type, docs]) => ({
      type,
      count: docs.length,
    })),
    timeline,
    monthlyActivity,
    summary: {
      mostActiveMonth: Object.entries(monthlyActivity).sort(
        (a, b) => b[1] - a[1]
      )[0],
      averagePerMonth: Math.round(
        timeline.length / Object.keys(monthlyActivity).length
      ),
    },
  };
}

/**
 * Jämför regeringens och riksdagens aktivitet
 */
export const compareGovernmentParliamentSchema = z.object({
  topic: z.string().describe('Ämne att jämföra'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function compareGovernmentParliament(
  args: z.infer<typeof compareGovernmentParliamentSchema>
) {
  const supabase = getSupabase();

  // Government data from g0v.se
  const govResults = await searchG0vAllTypes(args.topic, {
    types: ['pressmeddelanden', 'propositioner', 'tal'],
    dateFrom: args.from_date,
    dateTo: args.to_date,
  });

  // Parliament data from Supabase
  let riksdagQuery = supabase
    .from('riksdagen_dokument')
    .select('*')
    .ilike('titel', `%${args.topic}%`)
    .limit(100);

  if (args.from_date) {
    riksdagQuery = riksdagQuery.gte('datum', args.from_date);
  }

  if (args.to_date) {
    riksdagQuery = riksdagQuery.lte('datum', args.to_date);
  }

  const { data: riksdagDocs } = await riksdagQuery;

  // Speeches in parliament
  let anforandenQuery = supabase
    .from('riksdagen_anforanden')
    .select('*')
    .ilike('anforandetext', `%${args.topic}%`)
    .limit(100);

  if (args.from_date) {
    anforandenQuery = anforandenQuery.gte('dok_datum', args.from_date);
  }

  if (args.to_date) {
    anforandenQuery = anforandenQuery.lte('dok_datum', args.to_date);
  }

  const { data: anforanden } = await anforandenQuery;

  const totalGov =
    (govResults.pressmeddelanden?.length || 0) +
    (govResults.propositioner?.length || 0) +
    (govResults.tal?.length || 0);

  const totalRiksdag = (riksdagDocs?.length || 0) + (anforanden?.length || 0);

  return {
    topic: args.topic,
    period: {
      from: args.from_date || 'början',
      to: args.to_date || 'nu',
    },
    government: {
      total: totalGov,
      pressReleases: govResults.pressmeddelanden?.length || 0,
      propositions: govResults.propositioner?.length || 0,
      speeches: govResults.tal?.length || 0,
      documents: govResults,
    },
    parliament: {
      total: totalRiksdag,
      documents: riksdagDocs?.length || 0,
      speeches: anforanden?.length || 0,
      data: {
        documents: riksdagDocs || [],
        speeches: anforanden || [],
      },
    },
    comparison: {
      governmentLeads: totalGov > totalRiksdag,
      difference: Math.abs(totalGov - totalRiksdag),
      ratio: totalRiksdag > 0 ? (totalGov / totalRiksdag).toFixed(2) : 'N/A',
    },
  };
}

/**
 * Hämta senaste uppdateringar från regeringen
 */
export const getLatestGovernmentUpdatesSchema = z.object({
  limit: z.number().optional().default(20).describe('Antal uppdateringar'),
  types: z.array(z.string()).optional().describe('Dokumenttyper'),
});

export async function getLatestGovernmentUpdates(
  args: z.infer<typeof getLatestGovernmentUpdatesSchema>
) {
  const metadata = await fetchG0vLatestUpdate();

  const types: G0vDocumentType[] = (args.types as G0vDocumentType[]) || [
    'pressmeddelanden',
    'propositioner',
  ];

  const documents = await Promise.all(
    types.map((type) =>
      fetchG0vDocuments(type, {
        limit: args.limit,
      })
    )
  );

  const allDocs = documents.flat().sort((a, b) => {
    const dateA = a.updated || a.published;
    const dateB = b.updated || b.published;
    return dateB.localeCompare(dateA);
  });

  return {
    lastUpdated: metadata.updated,
    totalDocuments: metadata.totalDocuments,
    documentTypes: metadata.documentTypes,
    latestUpdates: allDocs.slice(0, args.limit),
  };
}
