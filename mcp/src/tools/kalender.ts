import { z } from 'zod';
import { fetchKalenderDirect } from '../utils/riksdagenApi.js';
import { normalizeLimit } from '../utils/helpers.js';

export const getCalendarEventsSchema = z.object({
  from: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  tom: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
  akt: z.string().optional().describe('Aktivitetstyp eller kombinationskod'),
  org: z.string().optional().describe('Organ (UTSK, kammaren etc.)'),
  limit: z.number().min(1).max(500).optional().default(200),
  sort: z.string().optional().describe('Sorteringsordning (t.ex. "DTSTART")'),
});

export async function getCalendarEvents(args: z.infer<typeof getCalendarEventsSchema>) {
  try {
    const limit = normalizeLimit(args.limit, 200, 500);
    const response = await fetchKalenderDirect({
      from: args.from,
      tom: args.tom,
      akt: args.akt,
      org: args.org,
      sz: limit,
      sort: args.sort,
    });

    if ('raw' in response) {
      return {
        count: 0,
        events: [],
        rawHtml: response.raw,
        error: 'Riksdagens kalender-API returnerade HTML istället för JSON.',
        notice: 'API:et fungerar inte korrekt för närvarande. Detta är ett känt problem med Riksdagens externa API. Försök igen senare eller använd andra verktyg för att hämta kalenderdata.',
        suggestions: [
          'Använd search_dokument för att hitta kommande debatter och voteringar',
          'Prova med andra datumintervall',
          'Kontakta Riksdagens IT-support om problemet kvarstår',
        ],
      };
    }

    return {
      count: response.hits,
      events: response.data,
    };
  } catch (error) {
    // Return a helpful error message instead of internal error
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      count: 0,
      events: [],
      error: `Kunde inte hämta kalenderdata: ${errorMsg}`,
      notice: 'Riksdagens kalender-API kan ibland returnera felaktigt formaterad data eller vara tillfälligt otillgängligt.',
      suggestions: [
        'Kontrollera att datum-formatet är korrekt (YYYY-MM-DD)',
        'Försök med ett kortare datumintervall',
        'Använd search_dokument som alternativ',
      ],
    };
  }
}
