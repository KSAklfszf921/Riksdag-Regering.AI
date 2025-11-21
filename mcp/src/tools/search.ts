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
  if (!name) return {};
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { fnamn: parts[0], enamn: parts[0] };
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
  limit: z.number().min(1).max(200).optional().default(50).describe('Max antal resultat'),
});

export async function searchLedamoter(args: z.infer<typeof searchLedamoterSchema>) {
  const limit = normalizeLimit(args.limit, 50);
  const { fnamn, enamn } = splitName(args.namn);

  const response = await fetchLedamoterDirect({
    fnamn,
    enamn,
    parti: args.parti,
    valkrets: args.valkrets,
    rdlstatus: args.status,
    sz: limit,
  });

  const ledamoter = response.data.map((person) => ({
    intressent_id: person.intressent_id,
    namn: `${person.tilltalsnamn} ${person.efternamn}`.trim(),
    parti: person.parti,
    valkrets: person.valkrets,
    status: person.status,
    bild_url: person.bild_url_192 || person.bild_url_80,
  }));

  return {
    count: response.hits,
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
  limit: z.number().min(1).max(200).optional().default(20),
});

export async function searchDokumentFulltext(args: z.infer<typeof searchDokumentFulltextSchema>) {
  const limit = normalizeLimit(args.limit, 20);
  const result = await fetchDokumentDirect({
    sok: args.query,
    sz: limit,
  });

  const hits = result.data.map((doc) => ({
    dok_id: doc.dok_id,
    titel: doc.titel,
    doktyp: doc.doktyp,
    rm: doc.rm,
    datum: doc.datum,
    snippet: truncate(stripHtml(doc.summary || doc.notis || ''), 200),
    url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
  }));

  return {
    count: result.hits,
    hits,
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
  const response = await fetchAnforandenDirect({
    talare: args.talare,
    parti: args.parti,
    sok: args.text,
    rm: args.rm,
    p: 1,
    sz: limit,
  });

  const anforanden = response.data.map((item: any) => ({
    anforande_id: item.anforande_id,
    talare: item.talare,
    parti: item.parti,
    anftyp: item.anftyp,
    anforandetext: stripHtml(item.anforandetext || ''),
    datum: item.anforandedatum,
    debatt: item.avsnittsrubrik,
  }));

  return {
    count: response.hits,
    anforanden,
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

  const voteringar = response.data.map((item: any) => ({
    votering_id: item.votering_id || item.id,
    rm: item.rm,
    beteckning: item.beteckning,
    datum: item.systemdatum || item.datum,
    parti: item.parti,
    valkrets: item.valkrets || item.valkrets,
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
    .enum(['pressmeddelanden', 'propositioner', 'sou', 'tal', 'remisser'])
    .optional()
    .describe('Dokumenttyp'),
  limit: z.number().min(1).max(200).optional().default(20),
});

export async function searchRegering(args: z.infer<typeof searchRegeringSchema>) {
  const limit = normalizeLimit(args.limit, 20);

  if (args.type) {
    const documents = await fetchG0vDocuments(args.type as any, {
      limit,
      search: args.title,
      dateFrom: undefined,
      dateTo: undefined,
    });

    const filtered = args.departement
      ? documents.filter((doc) => (doc.sender || '').toLowerCase().includes(args.departement!.toLowerCase()))
      : documents;

    return {
      type: args.type,
      count: filtered.length,
      documents: filtered,
    };
  }

  const results = await searchG0vAllTypes(args.title || '', {
    limit,
    types: ['pressmeddelanden', 'propositioner', 'sou', 'tal'],
  });

  if (args.departement) {
    Object.keys(results).forEach((key) => {
      results[key as keyof typeof results] = results[key as keyof typeof results].filter((doc) =>
        (doc.sender || '').toLowerCase().includes(args.departement!.toLowerCase())
      );
    });
  }

  const totals = Object.fromEntries(
    Object.entries(results).map(([key, docs]) => [key, docs.length])
  );

  return {
    totals,
    results,
  };
}
