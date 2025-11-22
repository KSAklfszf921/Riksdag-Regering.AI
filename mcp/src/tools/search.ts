/**
 * Sökverktyg för Riksdagen och Regeringskansliet
 */

import { z } from 'zod';
import {
  fetchLedamoterDirect,
  fetchDokumentDirect,
  fetchAnforandenDirect,
  fetchVoteringarDirect,
} from '../utils/riksdagenApi.js';
import { normalizeLimit, stripHtml, truncate } from '../utils/helpers.js';
import { fetchG0vDocuments, searchG0vAllTypes } from '../utils/g0vApi.js';

function splitName(name?: string): { fnamn?: string; enamn?: string } {
  if (!name || !name.trim()) return {};
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    // For single word searches, don't specify both - let API search broadly
    // We'll filter client-side instead
    return {};
  }
  return {
    fnamn: parts[0],
    enamn: parts.slice(1).join(' '),
  };
}

export const searchLedamoterSchema = z.object({
  namn: z.string().optional().describe('Namn att söka efter (förnamn eller efternamn)'),
  parti: z.string().optional().describe('Parti (t.ex. S, M, SD, V, MP, C, L, KD)'),
  valkrets: z.string().optional().describe('Valkrets'),
  status: z.string().optional().describe('Status (tjänstgörande, tjänstledig, etc.)'),
  intressent_id: z.string().optional().describe('Ledamots-ID'),
  page: z.number().min(1).optional().default(1).describe('Sida för paginering'),
  limit: z.number().min(1).max(200).optional().default(50).describe('Max antal resultat'),
});

export async function searchLedamoter(args: z.infer<typeof searchLedamoterSchema>) {
  const limit = normalizeLimit(args.limit, 50);
  const { fnamn, enamn } = splitName(args.namn);

  // For single word name search, fetch broader results and filter client-side
  const searchTerm = args.namn?.trim().toLowerCase();
  const isSingleWordSearch = searchTerm && !fnamn && !enamn;

  const response = await fetchLedamoterDirect({
    fnamn: fnamn || undefined,
    enamn: enamn || undefined,
    parti: args.parti || undefined,
    valkrets: args.valkrets || undefined,
    rdlstatus: args.status || undefined,
    iid: args.intressent_id || undefined,
    p: args.page,
    sz: isSingleWordSearch ? 200 : limit, // Fetch more for client-side filtering
  });

  let filteredData = response.data;

  // Client-side filtering for single word name searches
  if (isSingleWordSearch && searchTerm) {
    filteredData = response.data.filter((person) => {
      const fullName = `${person.tilltalsnamn} ${person.efternamn}`.toLowerCase();
      const firstName = person.tilltalsnamn?.toLowerCase() || '';
      const lastName = person.efternamn?.toLowerCase() || '';
      return fullName.includes(searchTerm) ||
             firstName.includes(searchTerm) ||
             lastName.includes(searchTerm);
    });
  }

  // Apply limit after filtering
  const limitedData = filteredData.slice(0, limit);

  const ledamoter = limitedData.map((person) => ({
    intressent_id: person.intressent_id,
    namn: `${person.tilltalsnamn} ${person.efternamn}`.trim(),
    parti: person.parti,
    valkrets: person.valkrets,
    status: person.status,
    bild_url: person.bild_url_192 || person.bild_url_80,
  }));

  return {
    count: isSingleWordSearch ? filteredData.length : response.hits,
    ledamoter,
  };
}

export const searchDokumentSchema = z.object({
  titel: z.string().optional().describe('Titel eller fritext att söka efter'),
  doktyp: z.string().optional().describe('Dokumenttyp (t.ex. mot, prop, bet, skr)'),
  typ: z.string().optional().describe('Huvudtyp för dokumentet'),
  subtyp: z.string().optional().describe('Undertyp'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  organ: z.string().optional().describe('Organ (t.ex. KU, FiU, UU)'),
  bet: z.string().optional().describe('Beteckning (t.ex. AU10)'),
  tempbeteckning: z.string().optional().describe('Temporär beteckning'),
  nummer: z.string().optional().describe('Dokumentnummer'),
  iid: z.string().optional().describe('Ledamots-ID'),
  parti: z.string().optional().describe('Parti'),
  talare: z.string().optional().describe('Talare'),
  mottagare: z.string().optional().describe('Mottagare'),
  status: z.string().optional().describe('Status (planerat, antaget etc.)'),
  subtitle: z.string().optional().describe('Undertitel'),
  relaterat_id: z.string().optional().describe('Relaterat dokument-ID'),
  avd: z.string().optional().describe('Avdelning'),
  webbtv: z.boolean().optional().describe('Hitta dokument med webbtv'),
  exakt: z.boolean().optional().describe('Kräv exakt matchning'),
  planering: z.boolean().optional().describe('Inkludera planeringsdata'),
  facets: z.string().optional().describe('Facetteringar'),
  rapport: z.string().optional().describe('Rapporttyp (rdlstat etc.)'),
  sort: z.string().optional().describe('Sorteringsordning'),
  sortorder: z.enum(['asc', 'desc']).optional().describe('Sorteringsriktning'),
  from_date: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  limit: z.number().min(1).max(200).optional().default(50).describe('Max antal resultat'),
});

export async function searchDokument(args: z.infer<typeof searchDokumentSchema>) {
  const limit = normalizeLimit(args.limit, 50);
  const result = await fetchDokumentDirect({
    doktyp: args.doktyp,
    typ: args.typ,
    subtyp: args.subtyp,
    sok: args.titel,
    rm: args.rm,
    organ: args.organ,
    bet: args.bet,
    tempbeteckning: args.tempbeteckning,
    nummer: args.nummer,
    iid: args.iid,
    parti: args.parti,
    talare: args.talare,
    mottagare: args.mottagare,
    from: args.from_date,
    tom: args.to_date,
    status: args.status,
    subtitle: args.subtitle,
    relaterat_id: args.relaterat_id,
    avd: args.avd,
    webbtv: args.webbtv ? 'true' : undefined,
    exakt: args.exakt ? 'true' : undefined,
    planering: args.planering ? 'true' : undefined,
    facets: args.facets,
    rapport: args.rapport,
    sort: args.sort,
    sortorder: args.sortorder,
    sz: limit,
  });

  const dokument = result.data.map((doc) => ({
    dok_id: doc.dok_id,
    titel: doc.titel,
    datum: doc.datum,
    doktyp: doc.doktyp,
    rm: doc.rm,
    organ: doc.organ,
    summary: doc.summary,
    url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
  }));

  return {
    count: result.hits,
    dokument,
  };
}

export const searchDokumentFulltextSchema = z.object({
  query: z.string().min(2).describe('Text att söka efter'),
  limit: z.number().min(1).max(200).optional().default(50).describe('Max antal resultat (ökad från 20 till 50)'),
});

export async function searchDokumentFulltext(args: z.infer<typeof searchDokumentFulltextSchema>) {
  const limit = normalizeLimit(args.limit, 50);
  const result = await fetchDokumentDirect({
    sok: args.query,
    sz: limit * 2, // Fetch extra to account for filtering out person pages
  });

  // Filter out person pages (they don't have dok_id)
  const documentsOnly = result.data.filter((doc) => doc.dok_id);

  const hits = documentsOnly.slice(0, limit).map((doc) => ({
    dok_id: doc.dok_id,
    titel: doc.titel,
    doktyp: doc.doktyp,
    rm: doc.rm,
    datum: doc.datum,
    snippet: truncate(stripHtml(doc.summary || doc.notis || ''), 200),
    url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
  }));

  return {
    count: hits.length,
    totalMatches: result.hits, // Total antal träffar i databasen
    showing: hits.length,
    hits,
    notice: result.hits > hits.length ? `Visar ${hits.length} av ${result.hits} träffar. Öka 'limit' parametern för fler resultat.` : undefined,
  };
}

export const searchAnforandenSchema = z.object({
  talare: z.string().optional().describe('Talare att söka efter'),
  parti: z.string().optional().describe('Parti'),
  debattnamn: z.string().optional().describe('Debattnamn'),
  text: z.string().optional().describe('Text att söka i anförandet'),
  rm: z.string().optional().describe('Riksmöte'),
  limit: z.number().min(1).max(200).optional().default(50).describe('Max antal resultat'),
});

export async function searchAnforanden(args: z.infer<typeof searchAnforandenSchema>) {
  const limit = normalizeLimit(args.limit, 50);

  // Fetch more results if we need client-side filtering
  const needsFiltering = !!args.talare || !!args.text;
  const fetchSize = needsFiltering ? Math.min(limit * 3, 200) : limit;

  const response = await fetchAnforandenDirect({
    parti: args.parti,
    rm: args.rm,
    sok: args.text, // Try using API search
    p: 1,
    sz: fetchSize,
  });

  let filteredData = response.data;

  // Apply client-side filtering for talare if specified
  if (args.talare) {
    const talareLower = args.talare.toLowerCase();
    filteredData = filteredData.filter((item: any) =>
      item.talare?.toLowerCase().includes(talareLower)
    );
  }

  // Apply client-side filtering for text if specified and sok didn't work
  if (args.text && args.text.length > 2) {
    const textLower = args.text.toLowerCase();
    filteredData = filteredData.filter((item: any) => {
      const anforandetext = stripHtml(item.anforandetext || '').toLowerCase();
      const debatt = (item.avsnittsrubrik || '').toLowerCase();
      return anforandetext.includes(textLower) || debatt.includes(textLower);
    });
  }

  // Apply limit after filtering
  const limitedData = filteredData.slice(0, limit);

  const anforanden = limitedData.map((item: any) => ({
    anforande_id: item.anforande_id,
    talare: item.talare,
    parti: item.parti,
    anftyp: item.anftyp,
    anforandetext: stripHtml(item.anforandetext || ''),
    datum: item.anforandedatum,
    debatt: item.avsnittsrubrik,
  }));

  // Check if any anföranden have empty text
  const hasEmptyText = anforanden.some(a => !a.anforandetext || a.anforandetext.trim() === '');

  return {
    count: filteredData.length, // Return actual filtered count
    anforanden,
    notice: hasEmptyText ? 'OBS: Vissa eller alla anföranden kan ha tomt textfält. Detta är en begränsning i Riksdagens API som inte alltid returnerar fulltext för anföranden. Använd anforande_id och debatt-namn för att identifiera anföranden.' : undefined,
  };
}

export const searchVoteringarSchema = z.object({
  rm: z.string().optional().describe('Riksmöte'),
  bet: z.string().optional().describe('Beteckning'),
  punkt: z.string().optional().describe('Punkt'),
  iid: z.string().optional().describe('Ledamots-ID'),
  parti: z.string().optional().describe('Parti'),
  valkrets: z.string().optional().describe('Valkrets'),
  rost: z.string().optional().describe('Röst (Ja, Nej, Avstår, Frånvarande)'),
  avser: z.string().optional().describe('Vad voteringen avser'),
  limit: z.number().min(1).max(200).optional().default(20),
  groupBy: z.enum(['parti', 'valkrets', 'namn']).optional().describe('Vill du gruppera resultatet?'),
});

export async function searchVoteringar(args: z.infer<typeof searchVoteringarSchema>) {
  const limit = normalizeLimit(args.limit, 20);

  const response = await fetchVoteringarDirect({
    rm: args.rm,
    bet: args.bet,
    punkt: args.punkt,
    iid: args.iid,
    parti: args.parti,
    valkrets: args.valkrets,
    rost: args.rost,
    avser: args.avser,
    gruppering: args.groupBy,
    sz: limit,
  });

  // If groupBy is specified, aggregate the results
  if (args.groupBy && response.data.length > 0) {
    const grouped: Record<string, any> = {};

    response.data.forEach((item: any) => {
      const key = item[args.groupBy!] || 'Okänt';
      if (!grouped[key]) {
        grouped[key] = {
          [args.groupBy!]: key,
          ja: 0,
          nej: 0,
          avstar: 0,
          franvarande: 0,
          total: 0,
        };
      }

      const rost = (item.rost || '').toLowerCase();
      if (rost === 'ja') grouped[key].ja++;
      else if (rost === 'nej') grouped[key].nej++;
      else if (rost === 'avstår') grouped[key].avstar++;
      else if (rost === 'frånvarande') grouped[key].franvarande++;

      grouped[key].total++;
    });

    const groupedResults = Object.values(grouped);

    return {
      count: groupedResults.length,
      groupBy: args.groupBy,
      voteringar: groupedResults,
    };
  }

  // Otherwise return individual votes
  const voteringar = response.data.map((item: any) => ({
    votering_id: item.votering_id || item.id,
    rm: item.rm,
    beteckning: item.beteckning,
    datum: item.systemdatum || item.datum,
    parti: item.parti,
    valkrets: item.valkrets,
    namn: item.namn,
    rost: item.rost,
    avser: item.avser,
    punkt: item.punkt,
  }));

  return {
    count: response.hits,
    voteringar,
  };
}

export const searchRegeringSchema = z.object({
  title: z.string().optional().describe('Titel att söka efter'),
  departement: z.string().optional().describe('Departement'),
  type: z
    .string()
    .optional()
    .describe(
      'Dokumenttyp (t.ex. pressmeddelanden, propositioner, sou, ds, dir, remisser, regeringsuppdrag, rapporter, tal, debattartiklar, uttalanden, artiklar)'
    ),
  dateFrom: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  dateTo: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  limit: z.number().min(1).max(200).optional().default(10).describe('Max antal resultat (default: 10 för att minska response-storlek)'),
});

function generateDocumentId(doc: any): string {
  if (doc.url) {
    // Extract the last part of the URL as ID
    const urlParts = doc.url.split('/').filter(Boolean);
    return urlParts[urlParts.length - 1] || `doc-${doc.published || 'unknown'}`;
  }
  // Fallback: create ID from title and date
  const titleSlug = (doc.title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50);
  return `${titleSlug}-${doc.published || 'unknown'}`;
}

function matchesDepartement(doc: any, departementQuery: string): boolean {
  const query = departementQuery.toLowerCase();

  // Check sender field
  if (doc.sender && doc.sender.toLowerCase().includes(query)) {
    return true;
  }

  // Check categories array
  if (doc.categories && Array.isArray(doc.categories)) {
    for (const cat of doc.categories) {
      if (cat.toLowerCase().includes(query)) {
        return true;
      }
    }
  }

  // Check if query is a department code (e.g., "1286" for Försvarsdepartementet)
  // Common department codes mapping
  const deptCodeMap: Record<string, string[]> = {
    '1286': ['försvarsdepartementet', 'försvars'],
    '1285': ['finansdepartementet', 'finans'],
    '1284': ['utbildningsdepartementet', 'utbildnings'],
    '1283': ['justitiedepartementet', 'justifie'],
    '1282': ['miljödepartementet', 'miljö'],
    '1281': ['näringsdepartementet', 'närings'],
    '1280': ['socialdepartementet', 'social'],
  };

  if (deptCodeMap[query]) {
    const deptNames = deptCodeMap[query];
    const senderLower = (doc.sender || '').toLowerCase();
    return deptNames.some((name) => senderLower.includes(name));
  }

  return false;
}

/**
 * Create a compact summary of a G0vDocument
 */
function summarizeDocument(doc: any) {
  return {
    id: generateDocumentId(doc),
    title: doc.title,
    published: doc.published,
    url: doc.url,
    sender: doc.sender,
    type: doc.type,
  };
}

export async function searchRegering(args: z.infer<typeof searchRegeringSchema>) {
  const limit = normalizeLimit(args.limit, 10); // Reduced default from 20 to 10

  if (args.type) {
    const documents = await fetchG0vDocuments(args.type as any, {
      limit: args.departement ? limit * 3 : limit, // Fetch more if filtering
      search: args.title,
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
    });

    const filtered = args.departement
      ? documents.filter((doc) => matchesDepartement(doc, args.departement!))
      : documents;

    // Return only essential fields
    const summaries = filtered.slice(0, limit).map(summarizeDocument);

    return {
      type: args.type,
      count: summaries.length,
      documents: summaries,
    };
  }

  const results = await searchG0vAllTypes(args.title || '', {
    limit,
    types: ['pressmeddelanden', 'propositioner', 'sou', 'ds', 'rapporter', 'tal', 'remisser'],
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
  });

  // Apply department filtering and create summaries
  const processedResults: any = {};
  Object.keys(results).forEach((key) => {
    let docs = results[key as keyof typeof results];

    if (args.departement) {
      docs = docs.filter((doc) => matchesDepartement(doc, args.departement!));
    }

    // Return only essential fields
    processedResults[key] = docs.map(summarizeDocument);
  });

  const totals = Object.fromEntries(
    Object.entries(processedResults).map(([key, docs]) => [key, (docs as any[]).length])
  );

  return {
    totals,
    results: processedResults,
  };
}
