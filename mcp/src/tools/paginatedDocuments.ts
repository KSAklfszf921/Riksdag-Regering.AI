/**
 * Paginerad dokumenthämtning direkt från Riksdagens API
 * Hanterar stora dataset effektivt
 */

import { z } from 'zod';
import { fetchDokumentDirect, fetchAnforandenDirect } from '../utils/riksdagenApi.js';
import { fetchAllPages, PaginatedResponse } from '../utils/apiHelpers.js';

/**
 * Hämta dokument med paginering
 */
export const fetchPaginatedDocumentsSchema = z.object({
  doktyp: z.string().optional().describe('Dokumenttyp (mot, prop, bet, etc.)'),
  sok: z.string().optional().describe('Sökterm'),
  rm: z.string().optional().describe('Riksmöte (t.ex. 2024/25)'),
  page: z.number().optional().default(1).describe('Sidnummer (1-indexerad)'),
  pageSize: z.number().optional().default(50).describe('Antal resultat per sida'),
  fetchAll: z.boolean().optional().default(false).describe('Hämta alla sidor (varning: kan vara långsamt!)'),
  maxPages: z.number().optional().default(10).describe('Max antal sidor att hämta om fetchAll=true'),
});

export async function fetchPaginatedDocuments(
  args: z.infer<typeof fetchPaginatedDocumentsSchema>
) {
  if (args.fetchAll) {
    // Fetch all pages
    const allDocuments = await fetchAllPages(
      async (page) =>
        fetchDokumentDirect({
          doktyp: args.doktyp,
          sok: args.sok,
          rm: args.rm,
          p: page,
          sz: args.pageSize,
        }),
      args.maxPages
    );

    return {
      documents: allDocuments,
      total: allDocuments.length,
      message: `Hämtade ${allDocuments.length} dokument från ${args.maxPages} sidor`,
    };
  } else {
    // Single page fetch
    const result = await fetchDokumentDirect({
      doktyp: args.doktyp,
      sok: args.sok,
      rm: args.rm,
      p: args.page,
      sz: args.pageSize,
    });

    return {
      documents: result.data,
      pagination: {
        hits: result.hits,
        page: result.page,
        hasMore: result.hasMore,
        nextPage: result.hasMore ? result.page + 1 : null,
      },
      message: `Sida ${result.page} av ~${Math.ceil(result.hits / args.pageSize)} (${result.hits} totalt)`,
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
  page: z.number().optional().default(1).describe('Sidnummer'),
  pageSize: z.number().optional().default(100).describe('Antal per sida'),
  fetchAll: z.boolean().optional().default(false).describe('Hämta alla sidor'),
  maxPages: z.number().optional().default(10).describe('Max antal sidor'),
});

export async function fetchPaginatedAnforanden(
  args: z.infer<typeof fetchPaginatedAnforandenSchema>
) {
  if (args.fetchAll) {
    const allAnforanden = await fetchAllPages(
      async (page) =>
        fetchAnforandenDirect({
          sok: args.sok,
          talare: args.talare,
          parti: args.parti,
          rm: args.rm,
          p: page,
          sz: args.pageSize,
        }),
      args.maxPages
    );

    return {
      anforanden: allAnforanden,
      total: allAnforanden.length,
      message: `Hämtade ${allAnforanden.length} anföranden`,
    };
  } else {
    const result = await fetchAnforandenDirect({
      sok: args.sok,
      talare: args.talare,
      parti: args.parti,
      rm: args.rm,
      p: args.page,
      sz: args.pageSize,
    });

    return {
      anforanden: result.data,
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
  maxPerRiksmote: z.number().optional().default(100).describe('Max dokument per riksmöte'),
});

export async function batchFetchDocuments(args: z.infer<typeof batchFetchDocumentsSchema>) {
  const results: Record<string, any[]> = {};

  for (const rm of args.riksmoten) {
    const result = await fetchDokumentDirect({
      doktyp: args.doktyp,
      rm,
      sz: args.maxPerRiksmote,
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
