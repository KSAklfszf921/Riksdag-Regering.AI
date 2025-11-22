import { z } from 'zod';
import {
  fetchDokumentDirect,
  fetchAnforandenDirect,
  fetchLedamoterDirect,
} from '../utils/riksdagenApi.js';
import { searchG0vAllTypes } from '../utils/g0vApi.js';
import { normalizeLimit, stripHtml } from '../utils/helpers.js';

export const enhancedSearchSchema = z.object({
  query: z.string().min(2).describe('Sökterm som används mot alla källor'),
  limit: z.number().min(1).max(100).optional().default(20),
});

export async function enhancedGovernmentSearch(args: z.infer<typeof enhancedSearchSchema>) {
  const limit = normalizeLimit(args.limit, 20);

  const [documents, anforanden, ledamoter, regeringen] = await Promise.all([
    fetchDokumentDirect({ sok: args.query, sz: limit * 2 }), // Fetch extra to account for person pages
    fetchAnforandenDirect({ sok: args.query, sz: limit }),
    fetchLedamoterDirect({ fnamn: args.query, enamn: args.query, sz: limit }),
    searchG0vAllTypes(args.query, {
      limit,
      types: ['pressmeddelanden', 'propositioner', 'sou', 'ds', 'rapporter', 'tal', 'remisser'],
    }),
  ]);

  // Filter out person pages (they don't have dok_id)
  const documentsOnly = documents.data.filter((doc) => doc.dok_id).slice(0, limit);

  return {
    query: args.query,
    riksdagen: {
      dokument: documentsOnly.map((doc) => ({
        dok_id: doc.dok_id,
        titel: doc.titel,
        datum: doc.datum,
        summary: doc.summary,
      })),
      anforanden: anforanden.data.map((item: any) => {
        // Ensure snippet is not empty by using avsnittsrubrik as fallback
        const text = stripHtml(item.anforandetext || item.anforandetext_html || '');
        const snippet = text.slice(0, 200) || item.avsnittsrubrik || '(Ingen textsammanfattning tillgänglig)';
        return {
          anforande_id: item.anforande_id,
          talare: item.talare,
          parti: item.parti,
          datum: item.anforandedatum,
          snippet,
        };
      }),
      ledamoter: ledamoter.data.map((person: any) => ({
        intressent_id: person.intressent_id,
        namn: `${person.tilltalsnamn} ${person.efternamn}`.trim(),
        parti: person.parti,
        valkrets: person.valkrets,
      })),
    },
    regeringen,
  };
}
