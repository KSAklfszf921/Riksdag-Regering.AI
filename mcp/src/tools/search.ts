/**
 * Sökverktyg för Riksdagen och Regeringskansliet
 */

import { getSupabase } from '../utils/supabase.js';
import { resolveLimit, DEFAULT_LIMIT } from '../utils/limits.js';
import { stripHtml, truncate } from '../utils/helpers.js';
import { cleanRecord, selectFields, buildListResponse, createPreview, selectImageUrl } from '../utils/response.js';
import { z } from 'zod';
type ListFormatOptions = {
  summary?: boolean;
  fields?: string[];
};

/**
 * Sök efter ledamöter
 */
export const searchLedamoterSchema = z.object({
  namn: z.string().optional().describe('Namn att söka efter (förnamn eller efternamn)'),
  parti: z.string().optional().describe('Parti (t.ex. S, M, SD, V, MP, C, L, KD)'),
  valkrets: z.string().optional().describe('Valkrets'),
  status: z.string().optional().describe('Status (tjänstgörande, tjänstledig, etc.)'),
  summary: z.boolean().optional().describe('Returnera endast identifierande fält och kort metadata'),
  fields: z.array(z.string()).optional().describe('Lista över fält som ska inkluderas i svaret'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function searchLedamoter(args: z.infer<typeof searchLedamoterSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);
  const summary = args.summary ?? false;
  const fields = args.fields;

  let query = supabase
    .from('riksdagen_ledamoter')
    .select('*')
    .limit(limit);

  if (args.namn) {
    query = query.or(`tilltalsnamn.ilike.%${args.namn}%,efternamn.ilike.%${args.namn}%`);
  }

  if (args.parti) {
    query = query.eq('parti', args.parti.toUpperCase());
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

  const items = (data || []).map(ledamot =>
    formatLedamotResult(ledamot, { summary, fields })
  );

  return buildListResponse(items, limit);
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
  summary: z.boolean().optional().describe('Returnera endast identifierande fält och utdrag'),
  fields: z.array(z.string()).optional().describe('Lista över fält som ska inkluderas i svaret'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function searchDokument(args: z.infer<typeof searchDokumentSchema>, log?: (text: string) => Promise<void>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);
  const summary = args.summary ?? false;
  const fields = args.fields;

  let query = supabase
    .from('riksdagen_dokument')
    .select('*')
    .limit(limit)
    .order('datum', { ascending: false });

  if (args.titel) {
    query = query.ilike('titel', `%${args.titel}%`);
  }

  if (args.doktyp) {
    query = query.eq('doktyp', args.doktyp);
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

  const dokument = data || [];

  if (log) {
    await log(`📄 Hittade ${dokument.length} dokument`);
  }

  const items = dokument.map(dok => formatDokumentResult(dok, { summary, fields }));

  const chunkSize = 20;
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    chunks.push({
      type: 'text' as const,
      text: JSON.stringify({ chunk: Math.floor(i / chunkSize) + 1, items: chunk }),
    });
  }

  return {
    ...buildListResponse(items, limit),
    chunks,
  };
}

/**
 * Fulltextsökning i Riksdagens dokument
 */
export const searchDokumentFulltextSchema = z.object({
  query: z.string().min(2).describe('Sökterm som används mot dokumenttitel, sammanfattning och cachad fulltext'),
  doktyp: z.string().optional().describe('Dokumenttyp (t.ex. mot, prop, bet, skr)'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  organ: z.string().optional().describe('Organ eller utskott (t.ex. KU, FiU, UU)'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  summary: z.boolean().optional().describe('Returnera endast identifierande fält'),
  fields: z.array(z.string()).optional().describe('Lista över fält som ska inkluderas i svaret'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat (max 50)'),
  include_full_text: z.boolean().optional().describe('Inkludera hela fulltexten i svaret (kan bli stora svar)'),
  snippet_length: z.number().optional().describe('Önskad längd på utdrag/snippet i tecken (standard: 280)'),
});

export async function searchDokumentFulltext(args: z.infer<typeof searchDokumentFulltextSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);
  const snippetLength = Math.min(Math.max(args.snippet_length || 280, 80), 1200);
  const includeFullText = args.include_full_text ?? false;
  const summary = args.summary ?? false;
  const fields = args.fields;
  const sanitizedQuery = sanitizeSearchTerm(args.query);

  if (includeFullText && limit > 1) {
    throw new Error('include_full_text kan endast användas när limit = 1. Hämta annars hela texten via get_dokument_innehall eller liknande verktyg.');
  }

  const baseQuery = () => {
    let query = supabase
      .from('riksdagen_dokument')
      .select('*')
      .limit(limit)
      .order('datum', { ascending: false });

    if (args.doktyp) {
      query = query.eq('doktyp', args.doktyp);
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

    return query;
  };

  const runSearch = async (columns: string[]) => {
    const filters = columns.map(col => `${col}.ilike.%${sanitizedQuery}%`).join(',');
    return baseQuery().or(filters);
  };

  const executeSearch = async (columns: string[]) => {
    const { data, error } = await runSearch(columns);
    return { data, error };
  };

  let { data, error } = await executeSearch(['titel', 'summary', 'text']);

  // Om summary-kolumnen saknas (nuvarande schema) faller vi tillbaka till titel + text
  if (error && error.message && error.message.toLowerCase().includes('summary')) {
    ({ data, error } = await executeSearch(['titel', 'text']));
  }

  // Om text-kolumnen saknas faller vi tillbaka till endast titel
  if (error && error.message && error.message.toLowerCase().includes('text')) {
    ({ data, error } = await executeSearch(['titel']));
  }

  if (error) {
    throw new Error(`Fel vid fulltextsökning: ${error.message}`);
  }

  const items = (data || []).map(doc =>
    formatFulltextDocument(doc, {
      summary,
      fields,
      query: args.query,
      snippetLength,
      includeFullText,
    })
  );

  const sortedResults = items.sort((a, b) => {
    if (b.score === a.score) {
      return (b.datum || '').localeCompare(a.datum || '');
    }
    return b.score - a.score;
  });

  return {
    query: args.query,
    filters: {
      doktyp: args.doktyp,
      rm: args.rm,
      organ: args.organ,
      from_date: args.from_date,
      to_date: args.to_date,
    },
    include_full_text: includeFullText,
    snippet_length: snippetLength,
    analysis: `Hittade ${sortedResults.length} dokument som matchar "${args.query}" med fulltextsökning.`,
    ...buildListResponse(sortedResults, limit),
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
  summary: z.boolean().optional().describe('Returnera endast identifierande fält och kort utdrag'),
  fields: z.array(z.string()).optional().describe('Lista över fält som ska inkluderas i svaret'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function searchAnforanden(args: z.infer<typeof searchAnforandenSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);
  const summary = args.summary ?? false;
  const fields = args.fields;

  let query = supabase
    .from('riksdagen_anforanden')
    .select('*')
    .limit(limit)
    .order('created_at', { ascending: false });

  if (args.talare) {
    query = query.ilike('talare', `%${args.talare}%`);
  }

  if (args.parti) {
    query = query.eq('parti', args.parti.toUpperCase());
  }

  if (args.debattnamn) {
    query = query.ilike('avsnittsrubrik', `%${args.debattnamn}%`);
  }

  if (args.text) {
    query = query.ilike('replik', `%${args.text}%`);
  }

  if (args.from_date) {
    query = query.gte('created_at', args.from_date);
  }

  if (args.to_date) {
    query = query.lte('created_at', args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid sökning av anföranden: ${error.message}`);
  }

  const items = (data || []).map(anf =>
    formatAnforandeResult(anf, { summary, fields })
  );

  return buildListResponse(items, limit);
}

/**
 * Sök efter voteringar
 */
export const searchVoteringarSchema = z.object({
  titel: z.string().optional().describe('Titel att söka efter'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  summary: z.boolean().optional().describe('Returnera endast identifierande fält'),
  fields: z.array(z.string()).optional().describe('Lista över fält som ska inkluderas i svaret'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function searchVoteringar(args: z.infer<typeof searchVoteringarSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);
  const summary = args.summary ?? false;
  const fields = args.fields;

  let query = supabase
    .from('riksdagen_voteringar')
    .select('*')
    .limit(limit)
    .order('created_at', { ascending: false });

  if (args.titel) {
    query = query.ilike('beteckning', `%${args.titel}%`);
  }

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  if (args.from_date) {
    query = query.gte('created_at', args.from_date);
  }

  if (args.to_date) {
    query = query.lte('created_at', args.to_date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid sökning av voteringar: ${error.message}`);
  }

  const items = (data || []).map(vot =>
    formatVoteringResult(vot, { summary, fields })
  );

  return buildListResponse(items, limit);
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
  summary: z.boolean().optional().describe('Returnera endast identifierande fält och kort utdrag'),
  fields: z.array(z.string()).optional().describe('Lista över fält som ska inkluderas i svaret'),
  limit: z.number().optional().default(DEFAULT_LIMIT).describe('Max antal resultat'),
});

export async function searchRegering(args: z.infer<typeof searchRegeringSchema>) {
  const supabase = getSupabase();
  const limit = resolveLimit(args.limit);
  const summary = args.summary ?? false;
  const fields = args.fields;

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
    .limit(limit)
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

  const items = (data || []).map(dok =>
    formatRegeringsDokument(dok, { summary, fields, dataType: args.dataType })
  );

  return {
    dataType: args.dataType,
    ...buildListResponse(items, limit),
  };
}

function formatLedamotResult(ledamot: Record<string, any>, options: ListFormatOptions) {
  const namn = [
    ledamot.tilltalsnamn || ledamot.fornamn,
    ledamot.efternamn,
  ].filter(Boolean).join(' ').trim();

  const summaryRecord = cleanRecord({
    intressent_id: ledamot.intressent_id,
    namn: namn || ledamot.efternamn,
    parti: ledamot.parti,
    valkrets: ledamot.valkrets,
    status: ledamot.status,
    image_url: selectImageUrl(ledamot),
  });

  if (options.summary) {
    return selectFields(summaryRecord, options.fields, ['intressent_id']);
  }

  const detailed = cleanRecord({
    ...ledamot,
    namn: namn || ledamot.efternamn,
    image_url: selectImageUrl(ledamot),
  });

  delete detailed.local_bild_url;
  delete detailed.bild_url;

  return selectFields(detailed, options.fields, ['intressent_id']);
}

function formatDokumentResult(dok: Record<string, any>, options: ListFormatOptions) {
  const summaryPreview = createPreview(dok.summary || dok.text, options.summary ? 160 : 220);

  const summaryRecord = cleanRecord({
    dok_id: dok.dok_id,
    titel: dok.titel,
    doktyp: dok.doktyp,
    rm: dok.rm,
    organ: dok.organ,
    datum: dok.datum,
    beteckning: dok.beteckning,
    summary_preview: summaryPreview,
  });

  if (options.summary) {
    return selectFields(summaryRecord, options.fields, ['dok_id']);
  }

  const detailed = cleanRecord({
    dok_id: dok.dok_id,
    titel: dok.titel,
    doktyp: dok.doktyp,
    rm: dok.rm,
    organ: dok.organ,
    datum: dok.datum,
    beteckning: dok.beteckning,
    status: dok.status,
    summary_preview: summaryPreview,
    summary: createPreview(dok.summary, 400),
    dokument_url_text: dok.dokument_url_text,
    dokument_url_html: dok.dokument_url_html,
  });

  return selectFields(detailed, options.fields, ['dok_id']);
}

type FulltextFormatOptions = ListFormatOptions & {
  query: string;
  snippetLength: number;
  includeFullText: boolean;
};

function formatFulltextDocument(
  doc: Record<string, any>,
  options: FulltextFormatOptions
) {
  const cleanText = extractDocumentText(doc);
  const fallbackText = doc.summary ? stripHtml(String(doc.summary)) : '';
  const snippetSource = cleanText || fallbackText || doc.titel || '';
  const snippet = createFulltextSnippet(snippetSource, options.query, options.snippetLength);
  const highlightScore = calculateRelevanceScore(cleanText || fallbackText || '', options.query);

  const baseRecord = cleanRecord({
    dok_id: doc.dok_id,
    titel: doc.titel,
    doktyp: doc.doktyp,
    organ: doc.organ,
    rm: doc.rm,
    datum: doc.datum,
    beteckning: doc.beteckning,
    dokument_url_text: doc.dokument_url_text,
    dokument_url_html: doc.dokument_url_html,
    snippet,
    has_cached_text: Boolean(cleanText),
    score: highlightScore,
  });

  if (options.includeFullText && cleanText) {
    baseRecord.full_text = cleanText;
  }

  const summaryRecord = cleanRecord({
    dok_id: doc.dok_id,
    titel: doc.titel,
    doktyp: doc.doktyp,
    datum: doc.datum,
    snippet,
    score: highlightScore,
  });

  const result = options.summary ? summaryRecord : baseRecord;
  return selectFields(result, options.fields, ['dok_id']);
}

function formatAnforandeResult(anforande: Record<string, any>, options: ListFormatOptions) {
  const datum = anforande.created_at ? anforande.created_at.split('T')[0] : undefined;
  const textPreview = createPreview(anforande.replik, options.summary ? 160 : 240);

  const summaryRecord = cleanRecord({
    anforande_id: anforande.anforande_id,
    talare: anforande.talare,
    parti: anforande.parti,
    avsnittsrubrik: anforande.avsnittsrubrik,
    datum,
    text_preview: textPreview,
  });

  if (options.summary) {
    return selectFields(summaryRecord, options.fields, ['anforande_id']);
  }

  const detailed = cleanRecord({
    anforande_id: anforande.anforande_id,
    talare: anforande.talare,
    parti: anforande.parti,
    avsnittsrubrik: anforande.avsnittsrubrik,
    dok_id: anforande.dok_id,
    intressent_id: anforande.intressent_id,
    datum,
    text_preview: textPreview,
    text: createPreview(anforande.replik, 800),
  });

  return selectFields(detailed, options.fields, ['anforande_id']);
}

function formatVoteringResult(votering: Record<string, any>, options: ListFormatOptions) {
  const datum = votering.created_at ? votering.created_at.split('T')[0] : votering.votering_datum;

  const summaryRecord = cleanRecord({
    votering_id: votering.votering_id,
    beteckning: votering.beteckning,
    titel: votering.titel,
    rm: votering.rm,
    datum,
  });

  if (options.summary) {
    return selectFields(summaryRecord, options.fields, ['votering_id']);
  }

  const detailed = cleanRecord({
    votering_id: votering.votering_id,
    beteckning: votering.beteckning,
    titel: votering.titel,
    rm: votering.rm,
    datum,
    ja_roster: votering.ja_roster,
    nej_roster: votering.nej_roster,
    avstar_roster: votering.avstar_roster,
    franvarande_roster: votering.franvarande_roster,
  });

  return selectFields(detailed, options.fields, ['votering_id']);
}

type RegeringsOptions = ListFormatOptions & { dataType: string };

function formatRegeringsDokument(dok: Record<string, any>, options: RegeringsOptions) {
  const preview = createPreview(dok.innehall || dok.summary, options.summary ? 150 : 220);

  const summaryRecord = cleanRecord({
    document_id: dok.document_id,
    titel: dok.titel,
    publicerad_datum: dok.publicerad_datum,
    departement: dok.departement,
    data_type: options.dataType,
    innehall_preview: preview,
  });

  if (options.summary) {
    return selectFields(summaryRecord, options.fields, ['document_id']);
  }

  const detailed = cleanRecord({
    document_id: dok.document_id,
    titel: dok.titel,
    publicerad_datum: dok.publicerad_datum,
    departement: dok.departement,
    data_type: options.dataType,
    url: dok.url,
    pdf_url: dok.pdf_url,
    kategorier: dok.kategorier,
    innehall_preview: preview,
  });

  return selectFields(detailed, options.fields, ['document_id']);
}

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%_,]/g, ' ');
}

function extractDocumentText(doc: Record<string, any>): string {
  const candidates = [
    doc.text,
    doc.fulltext,
    doc.full_text,
    doc.text_content,
    doc.innehall,
    doc.content,
    doc.body,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return stripHtml(candidate);
    }
  }

  return '';
}

function calculateRelevanceScore(text: string, query: string): number {
  if (!text || !query) return 0;
  const normalizedText = text.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) return 0;

  let score = 0;

  for (const token of tokens) {
    let index = normalizedText.indexOf(token);
    while (index !== -1) {
      score += token.length;
      index = normalizedText.indexOf(token, index + token.length);
    }
  }

  return score;
}

function createFulltextSnippet(text: string, query: string, length: number): string {
  if (!text) return '';

  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!query) {
    return truncate(normalizedText, length);
  }

  const lowerText = normalizedText.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return truncate(normalizedText, length);
  }

  const halfWindow = Math.max(Math.floor((length - lowerQuery.length) / 2), 20);
  const start = Math.max(0, index - halfWindow);
  const end = Math.min(normalizedText.length, index + lowerQuery.length + halfWindow);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < normalizedText.length ? '…' : '';

  return `${prefix}${normalizedText.slice(start, end)}${suffix}`;
}
