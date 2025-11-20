/**
 * Förbättrad sökning för Regeringskansliet
 * Kombinerar Supabase och g0v.se data
 */

import { z } from 'zod';
import { getSupabase } from '../utils/supabase.js';
import { fetchG0vDocuments, searchG0vAllTypes, G0vDocumentType } from '../utils/g0vApi.js';

/**
 * Unified search across all government document types
 */
export const searchGovernmentAllSchema = z.object({
  query: z.string().describe('Sökfråga'),
  types: z.array(z.string()).optional().describe('Dokumenttyper att söka i'),
  departement: z.string().optional().describe('Filtrera på departement'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  limit: z.number().optional().default(50).describe('Max resultat per typ'),
  use_g0v: z.boolean().optional().default(true).describe('Använd g0v.se API'),
});

export async function searchGovernmentAll(args: z.infer<typeof searchGovernmentAllSchema>) {
  const results: Record<string, any[]> = {};

  // 1. Search in Supabase (if available)
  const supabase = getSupabase();

  const supabaseTables = [
    'regeringskansliet_pressmeddelanden',
    'regeringskansliet_propositioner',
    'regeringskansliet_sou',
    'regeringskansliet_ds',
    'regeringskansliet_remisser',
    'regeringskansliet_tal',
    'regeringskansliet_uppdrag',
  ];

  for (const table of supabaseTables) {
    let query = supabase
      .from(table)
      .select('*')
      .ilike('titel', `%${args.query}%`)
      .limit(args.limit);

    if (args.departement) {
      query = query.ilike('departement', `%${args.departement}%`);
    }

    if (args.from_date) {
      query = query.gte('publicerad_datum', args.from_date);
    }

    if (args.to_date) {
      query = query.lte('publicerad_datum', args.to_date);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      results[table] = data;
    }
  }

  // 2. Search in g0v.se (if enabled and types specified)
  if (args.use_g0v) {
    const g0vTypes: G0vDocumentType[] = (args.types as G0vDocumentType[]) || [
      'pressmeddelanden',
      'propositioner',
      'sou',
      'tal',
    ];

    const g0vResults = await searchG0vAllTypes(args.query, {
      types: g0vTypes,
      dateFrom: args.from_date,
      dateTo: args.to_date,
      limit: args.limit,
    });

    // Merge g0v results
    Object.entries(g0vResults).forEach(([type, docs]) => {
      if (docs.length > 0) {
        results[`g0v_${type}`] = docs;
      }
    });
  }

  // Calculate totals
  const totals = Object.entries(results).reduce(
    (acc, [type, docs]) => {
      acc.totalDocuments += docs.length;
      acc.byType[type] = docs.length;
      return acc;
    },
    { totalDocuments: 0, byType: {} as Record<string, number> }
  );

  return {
    query: args.query,
    period: {
      from: args.from_date || 'början',
      to: args.to_date || 'nu',
    },
    ...totals,
    results,
    sources: {
      supabase: Object.keys(results).filter((k) => !k.startsWith('g0v_')).length,
      g0v: Object.keys(results).filter((k) => k.startsWith('g0v_')).length,
    },
  };
}

/**
 * Advanced government document search with filtering
 */
export const advancedGovernmentSearchSchema = z.object({
  query: z.string().describe('Sökfråga'),
  document_type: z
    .enum([
      'pressmeddelanden',
      'propositioner',
      'sou',
      'ds',
      'remisser',
      'tal',
      'uppdrag',
      'all',
    ])
    .describe('Typ av dokument'),
  departement: z.string().optional().describe('Departement'),
  avsandare: z.string().optional().describe('Avsändare'),
  kategorier: z.array(z.string()).optional().describe('Kategorier'),
  from_date: z.string().optional().describe('Från datum'),
  to_date: z.string().optional().describe('Till datum'),
  limit: z.number().optional().default(50).describe('Max antal resultat'),
  sort_by: z
    .enum(['publicerad_datum', 'relevans', 'titel'])
    .optional()
    .default('publicerad_datum')
    .describe('Sortering'),
});

export async function advancedGovernmentSearch(
  args: z.infer<typeof advancedGovernmentSearchSchema>
) {
  const supabase = getSupabase();

  const tableMap: Record<string, string> = {
    pressmeddelanden: 'regeringskansliet_pressmeddelanden',
    propositioner: 'regeringskansliet_propositioner',
    sou: 'regeringskansliet_sou',
    ds: 'regeringskansliet_ds',
    remisser: 'regeringskansliet_remisser',
    tal: 'regeringskansliet_tal',
    uppdrag: 'regeringskansliet_uppdrag',
  };

  const searchTables =
    args.document_type === 'all'
      ? Object.values(tableMap)
      : [tableMap[args.document_type]];

  const allResults: any[] = [];

  for (const table of searchTables) {
    let query = supabase.from(table).select('*').limit(args.limit);

    // Full-text search on title
    if (args.sort_by === 'relevans') {
      query = query.textSearch('titel', args.query, {
        type: 'websearch',
        config: 'swedish',
      });
    } else {
      query = query.ilike('titel', `%${args.query}%`);
    }

    // Filters
    if (args.departement) {
      query = query.ilike('departement', `%${args.departement}%`);
    }

    if (args.avsandare) {
      query = query.ilike('avsandare', `%${args.avsandare}%`);
    }

    if (args.from_date) {
      query = query.gte('publicerad_datum', args.from_date);
    }

    if (args.to_date) {
      query = query.lte('publicerad_datum', args.to_date);
    }

    // Sorting
    if (args.sort_by === 'publicerad_datum') {
      query = query.order('publicerad_datum', { ascending: false });
    } else if (args.sort_by === 'titel') {
      query = query.order('titel', { ascending: true });
    }

    const { data, error } = await query;

    if (!error && data) {
      allResults.push(
        ...data.map((doc) => ({
          ...doc,
          source_table: table,
          document_type: Object.keys(tableMap).find((k) => tableMap[k] === table),
        }))
      );
    }
  }

  // Sort all results if needed
  if (args.sort_by === 'publicerad_datum') {
    allResults.sort((a, b) => {
      const dateA = new Date(a.publicerad_datum);
      const dateB = new Date(b.publicerad_datum);
      return dateB.getTime() - dateA.getTime();
    });
  }

  return {
    query: args.query,
    filters: {
      document_type: args.document_type,
      departement: args.departement,
      avsandare: args.avsandare,
      period: {
        from: args.from_date,
        to: args.to_date,
      },
    },
    total: allResults.length,
    results: allResults.slice(0, args.limit),
  };
}

/**
 * Find related documents across government and parliament
 */
export const findRelatedDocumentsSchema = z.object({
  reference: z
    .string()
    .describe('Referens (t.ex. propositionsnummer, SOU-nummer)'),
  include_riksdag: z
    .boolean()
    .optional()
    .default(true)
    .describe('Inkludera Riksdagens dokument'),
});

export async function findRelatedDocuments(
  args: z.infer<typeof findRelatedDocumentsSchema>
) {
  const supabase = getSupabase();

  // Search in government documents
  const govQueries = [
    'regeringskansliet_propositioner',
    'regeringskansliet_sou',
    'regeringskansliet_ds',
  ].map((table) =>
    supabase
      .from(table)
      .select('*')
      .or(`beteckning.ilike.%${args.reference}%,titel.ilike.%${args.reference}%`)
      .limit(10)
  );

  const govResults = await Promise.all(govQueries);

  const governmentDocs = govResults
    .flatMap((r) => r.data || [])
    .map((doc) => ({
      ...doc,
      source: 'Regeringen',
    }));

  let parliamentDocs: any[] = [];

  if (args.include_riksdag) {
    // Search in Riksdagen documents
    const { data: riksdagDocs } = await supabase
      .from('riksdagen_dokument')
      .select('*')
      .or(`beteckning.ilike.%${args.reference}%,titel.ilike.%${args.reference}%`)
      .limit(20);

    if (riksdagDocs) {
      parliamentDocs = riksdagDocs.map((doc) => ({
        ...doc,
        source: 'Riksdagen',
      }));
    }
  }

  // Find connections
  const connections: Array<{
    government_doc: any;
    parliament_docs: any[];
    connection_type: string;
  }> = [];

  governmentDocs.forEach((govDoc) => {
    const related = parliamentDocs.filter(
      (parlDoc) =>
        parlDoc.beteckning?.includes(govDoc.beteckning) ||
        govDoc.beteckning?.includes(parlDoc.beteckning)
    );

    if (related.length > 0) {
      connections.push({
        government_doc: govDoc,
        parliament_docs: related,
        connection_type: 'Beteckning',
      });
    }
  });

  return {
    reference: args.reference,
    government: {
      count: governmentDocs.length,
      documents: governmentDocs,
    },
    parliament: {
      count: parliamentDocs.length,
      documents: parliamentDocs,
    },
    connections: {
      count: connections.length,
      items: connections,
    },
    summary: {
      total: governmentDocs.length + parliamentDocs.length,
      hasConnections: connections.length > 0,
    },
  };
}
