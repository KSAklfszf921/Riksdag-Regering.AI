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
    fetchDokumentDirect({ sok: args.query, sz: limit }),
    fetchAnforandenDirect({ sok: args.query, sz: limit }),
    fetchLedamoterDirect({ fnamn: args.query, enamn: args.query, sz: limit }),
    searchG0vAllTypes(args.query, { limit, types: ['pressmeddelanden', 'propositioner', 'sou', 'tal'] }),
  ]);

  return {
    query: args.query,
    riksdagen: {
      dokument: documents.data.map((doc) => ({
        dok_id: doc.dok_id,
        titel: doc.titel,
        datum: doc.datum,
        summary: doc.summary,
      })),
      anforanden: anforanden.data.map((item: any) => ({
        anforande_id: item.anforande_id,
        talare: item.talare,
        parti: item.parti,
        datum: item.anforandedatum,
        snippet: stripHtml(item.anforandetext || '').slice(0, 200),
      })),
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
