/**
 * Hämtningsverktyg baserade på öppna API:er
 */

import { z } from 'zod';
import {
  fetchDokumentDirect,
  fetchLedamoterDirect,
} from '../utils/riksdagenApi.js';
import { normalizeLimit } from '../utils/helpers.js';
import { safeFetch } from '../utils/apiHelpers.js';

const RIKSDAG_API_BASE = 'https://data.riksdagen.se';

async function fetchDocumentById(dokId: string) {
  const url = `${RIKSDAG_API_BASE}/dokument/${dokId}.json`;
  try {
    const data = await safeFetch(url);
    return data?.dokumentstatus?.dokument ?? null;
  } catch {
    return null;
  }
}

async function fetchText(url?: string | null): Promise<string | null> {
  if (!url) return null;
  const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https:${url}`;
  const response = await fetch(absoluteUrl, {
    headers: { 'User-Agent': 'Wget/1.21 (riksdag-regering-mcp)' },
  });
  if (!response.ok) {
    return null;
  }
  return await response.text();
}

export const getDokumentSchema = z.object({
  dok_id: z.string().min(2).describe('Dokument ID, t.ex. H901FiU1'),
});

export async function getDokument(args: z.infer<typeof getDokumentSchema>) {
  const dokument = await fetchDocumentById(args.dok_id);
  if (!dokument) {
    throw new Error(`Dokument ${args.dok_id} hittades inte i Riksdagens API.`);
  }

  const text = await fetchText(dokument.dokument_url_text || dokument.dokument_url_html);

  return {
    dok_id: dokument.dok_id,
    titel: dokument.titel,
    datum: dokument.datum,
    doktyp: dokument.doktyp,
    rm: dokument.rm,
    organ: dokument.organ,
    summary: dokument.summary,
    text,
    attachments: dokument.filbilaga?.fil || [],
    url: dokument.dokument_url_html ? `https:${dokument.dokument_url_html}` : dokument.relurl,
  };
}

export const getLedamotSchema = z.object({
  intressent_id: z.string().describe('Ledamotens intressent ID'),
});

export async function getLedamot(args: z.infer<typeof getLedamotSchema>) {
  const response = await fetchLedamoterDirect({ iid: args.intressent_id, sz: 1 });
  if (response.data.length === 0) {
    throw new Error(`Ledamot ${args.intressent_id} hittades inte.`);
  }
  const person = response.data[0];
  return {
    intressent_id: person.intressent_id,
    namn: `${person.tilltalsnamn} ${person.efternamn}`.trim(),
    parti: person.parti,
    valkrets: person.valkrets,
    status: person.status,
    bild_url: person.bild_url_max || person.bild_url_192,
    uppdrag: person.personuppdrag?.uppdrag || [],
    biografi: person.personuppgift?.uppgift || [],
  };
}

function buildDokumentFetcher(doktyp: string) {
  return async function fetcher(args: { rm?: string; organ?: string; limit?: number }) {
    const limit = normalizeLimit(args.limit, 50);
    const result = await fetchDokumentDirect({
      doktyp,
      rm: args.rm,
      organ: args.organ,
      sz: limit,
    });

    const dokument = result.data.map((doc) => ({
      dok_id: doc.dok_id,
      titel: doc.titel,
      datum: doc.datum,
      rm: doc.rm,
      organ: doc.organ,
      summary: doc.summary,
      url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
    }));

    return {
      count: result.hits,
      dokument,
    };
  };
}

export const getMotionerSchema = z.object({
  rm: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
});
export const getMotioner = buildDokumentFetcher('mot');

export const getPropositionerSchema = z.object({
  rm: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
});
export const getPropositioner = buildDokumentFetcher('prop');

export const getBetankandenSchema = z.object({
  rm: z.string().optional(),
  organ: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
});

export async function getBetankanden(args: z.infer<typeof getBetankandenSchema>) {
  const limit = normalizeLimit(args.limit, 50);

  // Fetch more if organ filter is specified to account for client-side filtering
  const fetchLimit = args.organ ? Math.min(limit * 3, 200) : limit;

  const result = await fetchDokumentDirect({
    doktyp: 'bet',
    rm: args.rm,
    organ: args.organ,
    sz: fetchLimit,
  });

  let filteredData = result.data;

  // Apply client-side filtering for organ to ensure exact match
  if (args.organ) {
    const organUpper = args.organ.toUpperCase();
    filteredData = result.data.filter((doc) =>
      doc.organ?.toUpperCase() === organUpper
    );
  }

  // Apply limit after filtering
  const limitedData = filteredData.slice(0, limit);

  const dokument = limitedData.map((doc) => ({
    dok_id: doc.dok_id,
    titel: doc.titel,
    datum: doc.datum,
    rm: doc.rm,
    organ: doc.organ,
    summary: doc.summary,
    url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
  }));

  return {
    count: filteredData.length,
    dokument,
  };
}

export const getFragorSchema = z.object({
  rm: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
});

export async function getFragor(args: z.infer<typeof getFragorSchema>) {
  const limit = normalizeLimit(args.limit, 50);
  const result = await fetchDokumentDirect({
    doktyp: 'fr',
    rm: args.rm,
    sz: limit,
  });

  const dokument = result.data.map((doc) => ({
    dok_id: doc.dok_id,
    titel: doc.titel,
    datum: doc.datum,
    rm: doc.rm,
    parti: doc.organ, // Note: For questions, 'organ' field contains the party of the asker
    summary: doc.summary,
    url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
  }));

  return {
    count: result.hits,
    dokument,
  };
}

export const getInterpellationerSchema = z.object({
  rm: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
});

export async function getInterpellationer(args: z.infer<typeof getInterpellationerSchema>) {
  const limit = normalizeLimit(args.limit, 50);
  const result = await fetchDokumentDirect({
    doktyp: 'ip',
    rm: args.rm,
    sz: limit,
  });

  const dokument = result.data.map((doc) => ({
    dok_id: doc.dok_id,
    titel: doc.titel,
    datum: doc.datum,
    rm: doc.rm,
    parti: doc.organ, // Note: For interpellations, 'organ' field contains the party of the asker
    summary: doc.summary,
    url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
  }));

  return {
    count: result.hits,
    dokument,
  };
}

export const getUtskottSchema = z.object({});

const UTSKOTT = [
  'KU', 'FiU', 'UU', 'JuU', 'SkU', 'MJU', 'NU', 'SoU', 'SfU',
  'KrU', 'UbU', 'TU', 'FöU', 'AU', 'KrigsU', 'KlimatU',
];

export async function getUtskott() {
  return {
    antal: UTSKOTT.length,
    utskott: UTSKOTT.map((kod) => ({ kod })),
  };
}
