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
  limit: z.number().min(1).max(100).optional().default(20).describe('Max antal resultat per kategori (Riksdagen dokument/anföranden)'),
  regeringenLimit: z.number().min(1).max(20).optional().default(5).describe('Max antal resultat per regeringskategori (för att begränsa response-storlek)'),
  includeRegeringen: z.boolean().optional().default(true).describe('Inkludera resultat från Regeringskansliet'),
});

// Helper function to normalize titles for comparison
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to find duplicates between Riksdagen and Regeringen
function findDuplicates(riksdagenDocs: any[], regeringenDocs: any[]): Map<string, { riksdag: any, regering: any }> {
  const duplicates = new Map();

  for (const rdDoc of riksdagenDocs) {
    const rdTitle = normalizeTitle(rdDoc.titel);
    const rdDate = rdDoc.datum?.substring(0, 10); // YYYY-MM-DD

    for (const rgDoc of regeringenDocs) {
      const rgTitle = normalizeTitle(rgDoc.title);
      const rgDate = rgDoc.published?.substring(0, 10);

      // Check if titles are similar (at least 80% match) and dates are close
      if (rdTitle && rgTitle && rdTitle.includes(rgTitle.substring(0, 20)) || rgTitle.includes(rdTitle.substring(0, 20))) {
        if (rdDate === rgDate || Math.abs(new Date(rdDate).getTime() - new Date(rgDate).getTime()) < 7 * 24 * 60 * 60 * 1000) {
          duplicates.set(rdDoc.dok_id, { riksdag: rdDoc, regering: rgDoc });
        }
      }
    }
  }

  return duplicates;
}

export async function enhancedGovernmentSearch(args: z.infer<typeof enhancedSearchSchema>) {
  const limit = normalizeLimit(args.limit, 20);
  const regeringenLimit = normalizeLimit(args.regeringenLimit, 5, 20);

  // Fetch Riksdagen data
  const [documents, anforanden, ledamoter] = await Promise.all([
    fetchDokumentDirect({ sok: args.query, sz: limit * 2 }), // Fetch extra to account for person pages
    fetchAnforandenDirect({ sok: args.query, sz: limit }),
    fetchLedamoterDirect({ fnamn: args.query, enamn: args.query, sz: limit }),
  ]);

  // Fetch Regeringen data if requested
  let regeringen: any = {
    pressmeddelanden: [],
    propositioner: [],
    sou: [],
    ds: [],
    rapporter: [],
    tal: [],
    remisser: [],
  };

  if (args.includeRegeringen) {
    const rawRegeringen = await searchG0vAllTypes(args.query, {
      limit: regeringenLimit,
      types: ['pressmeddelanden', 'propositioner', 'sou', 'ds', 'rapporter', 'tal', 'remisser'],
    });

    // Strip unnecessary metadata to reduce response size
    const stripMetadata = (docs: any[]) => docs.map((doc: any) => ({
      title: doc.title,
      url: doc.url,
      published: doc.published,
      sender: doc.sender,
      type: doc.type,
    }));

    regeringen = {
      pressmeddelanden: stripMetadata(rawRegeringen.pressmeddelanden || []),
      propositioner: stripMetadata(rawRegeringen.propositioner || []),
      sou: stripMetadata(rawRegeringen.sou || []),
      ds: stripMetadata(rawRegeringen.ds || []),
      rapporter: stripMetadata(rawRegeringen.rapporter || []),
      tal: stripMetadata(rawRegeringen.tal || []),
      remisser: stripMetadata(rawRegeringen.remisser || []),
    };
  }

  // Filter out person pages (they don't have dok_id)
  const documentsOnly = documents.data.filter((doc) => doc.dok_id).slice(0, limit);

  // Find duplicates between Riksdagen propositions and Regeringen propositions
  const regeringenPropositioner = regeringen.propositioner || [];
  const duplicates = findDuplicates(documentsOnly, regeringenPropositioner);

  // Map documents and mark duplicates
  const riksdagDokument = documentsOnly.map((doc) => {
    const duplicate = duplicates.get(doc.dok_id);
    return {
      dok_id: doc.dok_id,
      titel: doc.titel,
      datum: doc.datum,
      summary: doc.summary,
      ...(duplicate ? {
        duplicate: true,
        primarySource: 'riksdagen',
        alsoFoundIn: 'regeringen',
        regeringenUrl: duplicate.regering.url,
      } : {}),
    };
  });

  // Calculate total results
  const totalRegeringenResults = args.includeRegeringen
    ? Object.values(regeringen).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  const totalRiksdagenResults = riksdagDokument.length + anforanden.data.length + ledamoter.data.length;

  return {
    query: args.query,
    riksdagen: {
      dokument: riksdagDokument,
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
    deduplication: {
      duplicatesFound: duplicates.size,
      notice: duplicates.size > 0
        ? `Hittade ${duplicates.size} dokument som finns i båda källorna. Dessa är markerade med 'duplicate: true' och visar vilken källa som är primär.`
        : 'Inga dubbletter hittades mellan Riksdagen och Regeringen.',
    },
    summary: {
      totalResults: totalRiksdagenResults + totalRegeringenResults,
      riksdagenResults: totalRiksdagenResults,
      regeringenResults: totalRegeringenResults,
      notice: `Resultat begränsade för att undvika enorma responses. Riksdagen: max ${limit} per kategori. Regeringen: max ${regeringenLimit} per kategori (7 kategorier). Använd 'limit' och 'regeringenLimit' för att justera, eller 'includeRegeringen: false' för att bara söka i Riksdagen.`,
    },
  };
}
