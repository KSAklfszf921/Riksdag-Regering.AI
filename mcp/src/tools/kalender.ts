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
        notice: 'Kalendern returnerade HTML. Ange andra filter eller överväg att tolka rawHtml.',
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
      error: `Kunde inte hämta kalenderdata: ${errorMsg}. API:et kan ha returnerat ogiltig data eller vara tillfälligt otillgängligt.`,
      notice: 'Riksdagens kalender-API kan ibland returnera felaktigt formaterad data. Försök med andra datum eller parametrar.',
    };
  }
}
