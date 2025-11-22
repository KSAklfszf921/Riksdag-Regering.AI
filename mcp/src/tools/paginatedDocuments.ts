/**
 * Paginerad dokumenthämtning direkt från Riksdagens API
 * Hanterar stora dataset effektivt
 */

import { z } from 'zod';
import { fetchDokumentDirect, fetchAnforandenDirect } from '../utils/riksdagenApi.js';
import { fetchAllPages, PaginatedResponse } from '../utils/apiHelpers.js';
import { normalizeLimit } from '../utils/helpers.js';

/**
 * Hämta dokument med paginering
 */
export const fetchPaginatedDocumentsSchema = z.object({
  doktyp: z.string().optional().describe('Dokumenttyp (mot, prop, bet, etc.)'),
  sok: z.string().optional().describe('Sökterm'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  page: z.number().min(1).max(10_000).optional().default(1).describe('Sidnummer (1-indexerad)'),
  pageSize: z.number().min(1).max(200).optional().default(50).describe('Antal resultat per sida'),
  fetchAll: z.boolean().optional().default(false).describe('Hämta alla sidor (varning: kan vara långsamt!)'),
  maxPages: z.number().min(1).max(50).optional().default(10).describe('Max antal sidor att hämta om fetchAll=true'),
});

function normalizeDocumentUrl(doc: any): string {
  if (doc.dokument_url_html) {
    return doc.dokument_url_html.startsWith('http')
      ? doc.dokument_url_html
      : `https:${doc.dokument_url_html}`;
  }
  return doc.relurl || '';
}

export async function fetchPaginatedDocuments(
  args: z.infer<typeof fetchPaginatedDocumentsSchema>
) {
  const pageSize = normalizeLimit(args.pageSize, 50, 200);
  const maxPages = normalizeLimit(args.maxPages, 10, 50);
  const page = normalizeLimit(args.page, 1, 10_000);

  if (args.fetchAll) {
    // Fetch all pages
    const allDocuments = await fetchAllPages(
      async (page) =>
        fetchDokumentDirect({
          doktyp: args.doktyp,
          sok: args.sok,
          rm: args.rm,
          p: page,
          sz: pageSize,
        }),
      maxPages
    );

    // Normalize URLs in documents
    const normalizedDocuments = allDocuments.map((doc) => ({
      ...doc,
      dokument_url_html: normalizeDocumentUrl(doc),
    }));

    return {
      documents: normalizedDocuments,
      total: normalizedDocuments.length,
      message: `Hämtade ${normalizedDocuments.length} dokument från ${maxPages} sidor`,
    };
  } else {
    // Single page fetch
    const result = await fetchDokumentDirect({
      doktyp: args.doktyp,
      sok: args.sok,
      rm: args.rm,
      p: page,
      sz: pageSize,
    });

    // Normalize URLs in documents
    const normalizedDocuments = result.data.map((doc) => ({
      ...doc,
      dokument_url_html: normalizeDocumentUrl(doc),
    }));

    return {
      documents: normalizedDocuments,
      pagination: {
        hits: result.hits,
        page: result.page,
        hasMore: result.hasMore,
        nextPage: result.hasMore ? result.page + 1 : null,
      },
      message: `Sida ${result.page} av ~${Math.ceil(result.hits / pageSize)} (${result.hits} totalt)`,
    };
  }
}

/**
 * Hämta anföranden med paginering
 */
export const fetchPaginatedAnforandenSchema = z.object({
  sok: z.string().optional().describe('Sökterm i anförande-text'),
  talare: z.string().optional().describe('Talarens namn'),
  parti: z.string().optional().describe('Parti'),
  rm: z.string().optional().describe('Riksmöte'),
  page: z.number().min(1).max(10_000).optional().default(1).describe('Sidnummer'),
  pageSize: z.number().min(1).max(200).optional().default(100).describe('Antal per sida'),
  fetchAll: z.boolean().optional().default(false).describe('Hämta alla sidor'),
  maxPages: z.number().min(1).max(50).optional().default(10).describe('Max antal sidor'),
});

export async function fetchPaginatedAnforanden(
  args: z.infer<typeof fetchPaginatedAnforandenSchema>
) {
  const pageSize = normalizeLimit(args.pageSize, 100, 200);
  const maxPages = normalizeLimit(args.maxPages, 10, 50);
  const page = normalizeLimit(args.page, 1, 10_000);

  if (args.fetchAll) {
    const allAnforanden = await fetchAllPages(
      async (page) =>
        fetchAnforandenDirect({
          sok: args.sok,
          talare: args.talare,
          parti: args.parti,
          rm: args.rm,
          p: page,
          sz: pageSize,
        }),
      maxPages
    );

    // Ensure anforandetext is included
    const enrichedAnforanden = allAnforanden.map((anf: any) => ({
      ...anf,
      anforandetext: anf.anforandetext || anf.anforandetext_html || '',
    }));

    return {
      anforanden: enrichedAnforanden,
      total: enrichedAnforanden.length,
      message: `Hämtade ${enrichedAnforanden.length} anföranden`,
    };
  } else {
    const result = await fetchAnforandenDirect({
      sok: args.sok,
      talare: args.talare,
      parti: args.parti,
      rm: args.rm,
      p: page,
      sz: pageSize,
    });

    // Ensure anforandetext is included
    const enrichedAnforanden = result.data.map((anf: any) => ({
      ...anf,
      anforandetext: anf.anforandetext || anf.anforandetext_html || '',
    }));

    return {
      anforanden: enrichedAnforanden,
      pagination: {
        hits: result.hits,
        page: result.page,
        hasMore: result.hasMore,
        nextPage: result.hasMore ? result.page + 1 : null,
      },
      message: `Sida ${result.page} (${result.hits} totalt)`,
    };
  }
}

/**
 * Batch-hämta dokument för flera riksmöten
 */
export const batchFetchDocumentsSchema = z.object({
  doktyp: z.string().describe('Dokumenttyp'),
  riksmoten: z.array(z.string()).describe('Lista av riksmöten'),
  maxPerRiksmote: z.number().min(1).max(300).optional().default(100).describe('Max dokument per riksmöte'),
});

export async function batchFetchDocuments(args: z.infer<typeof batchFetchDocumentsSchema>) {
  const maxPerRiksmote = normalizeLimit(args.maxPerRiksmote, 100, 300);
  const results: Record<string, any[]> = {};

  for (const rm of args.riksmoten) {
    const result = await fetchDokumentDirect({
      doktyp: args.doktyp,
      rm,
      sz: maxPerRiksmote,
      p: 1,
    });

    results[rm] = result.data;

    // Rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const totalDocuments = Object.values(results).reduce((sum, docs) => sum + docs.length, 0);

  return {
    results,
    summary: {
      riksmoten: args.riksmoten.length,
      totalDocuments,
      averagePerRiksmote: Math.round(totalDocuments / args.riksmoten.length),
    },
  };
}
