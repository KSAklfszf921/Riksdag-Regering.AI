import { z } from 'zod';
import { normalizeLimit } from '../utils/helpers.js';
import { safeFetch } from '../utils/apiHelpers.js';

export const reportSchema = z.object({
  report: z.enum([
    'ledamotsstatistik',
    'kontaktutskott',
    'aldersstatistik',
    'konstatsstatistik',
    'mandatperiod',
    'diarium',
  ]),
  limit: z.number().min(1).max(500).optional().default(200),
});

const REPORT_ENDPOINTS: Record<
  string,
  { url: string; params?: Record<string, string>; format: 'json' | 'text' }
> = {
  ledamotsstatistik: {
    url: 'https://data.riksdagen.se/dokumentlista/',
    params: { utformat: 'json', aktivi: 'rdl', avd: 'ledamot' },
    format: 'json',
  },
  kontaktutskott: {
    url: 'https://data.riksdagen.se/dokumentlista/',
    params: { utformat: 'kontaktutskott', aktivi: 'rdl', avd: 'ledamot' },
    format: 'text',
  },
  aldersstatistik: {
    url: 'https://data.riksdagen.se/sv/rapport-alder',
    format: 'text',
  },
  konstatsstatistik: {
    url: 'https://data.riksdagen.se/personlista/',
    params: { utformat: 'statkon' },
    format: 'text',
  },
  mandatperiod: {
    url: 'https://data.riksdagen.se/uttag/mandatperiod',
    format: 'text',
  },
  diarium: {
    url: 'https://data.riksdagen.se/dataset/diarium/',
    format: 'text',
  },
};

export async function fetchReport(args: z.infer<typeof reportSchema>) {
  const entry = REPORT_ENDPOINTS[args.report];
  if (!entry) {
    throw new Error(`Rapport ${args.report} saknas`);
  }

  const url = new URL(entry.url);
  if (entry.params) {
    Object.entries(entry.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  if (args.limit && entry.url.includes('dokumentlista')) {
    url.searchParams.set('sz', String(normalizeLimit(args.limit, 200)));
  }

  let data: unknown;
  let summary: string;

  if (entry.format === 'json') {
    data = await safeFetch(url.toString());
    summary = 'JSON data received';
  } else {
    const response = await fetch(url.toString(), { headers: { Accept: 'text/html' } });
    const fullText = await response.text();

    // Limit HTML content to prevent large responses
    const maxChars = 500;
    if (fullText.length > maxChars) {
      data = fullText.substring(0, maxChars) + '...\n[Content truncated - visit URL for full report]';
      summary = `HTML report truncated (${fullText.length} chars total, showing first ${maxChars})`;
    } else {
      data = fullText;
      summary = `HTML report (${fullText.length} chars)`;
    }
  }

  return {
    report: args.report,
    url: url.toString(),
    summary,
    data,
    notice: entry.format === 'text'
      ? 'HTML reports are truncated for MCP efficiency. Visit the URL for the complete report.'
      : undefined,
  };
}

export function listReports() {
  return [
    { id: 'ledamotsstatistik', title: 'Ledamotsstatistik (rdlstat)', description: 'Statistik per ledamot med uppdrag och parti (JSON).' },
    { id: 'kontaktutskott', title: 'Kontaktuppgifter till utskott', description: 'Kontaktinfo för utskottsledamöter (HTML, truncated preview).' },
    { id: 'aldersstatistik', title: 'Åldersstatistik', description: 'Åldersfördelning bland ledamöter (HTML, truncated preview).' },
    { id: 'konstatsstatistik', title: 'Könsstatistik', description: 'Könsfördelning via specialrapport (HTML, truncated preview).' },
    { id: 'mandatperiod', title: 'Mandatperioder', description: 'Lista över mandatperioder och tillhörande ledamöter (HTML, truncated preview).' },
    { id: 'diarium', title: 'Diarium', description: 'Länkar till årliga diarium-dataset (HTML, truncated preview).' },
  ];
}
