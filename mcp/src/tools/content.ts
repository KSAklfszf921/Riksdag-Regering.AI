import { z } from 'zod';
import { stripHtml, truncate } from '../utils/helpers.js';
import { fetchDokumentDirect } from '../utils/riksdagenApi.js';
import { fetchG0vDocuments, fetchG0vDocumentContent } from '../utils/g0vApi.js';

async function loadDocument(dokId: string) {
  const result = await fetchDokumentDirect({ sok: dokId, sz: 5 });
  return result.data.find((doc: any) => doc.dok_id?.toLowerCase() === dokId.toLowerCase()) || null;
}

async function loadDocumentText(doc: any): Promise<string | null> {
  if (!doc) return null;
  const url = doc.dokument_url_text || doc.dokument_url_html;
  if (!url) return null;
  const absoluteUrl = url.startsWith('http') ? url : `https:${url}`;
  const response = await fetch(absoluteUrl, {
    headers: { 'User-Agent': 'Wget/1.21 (riksdag-regering-mcp)' },
  });
  if (!response.ok) {
    return null;
  }
  return await response.text();
}

export const getPressmeddelandeSchema = z.object({
  document_id: z.string().describe('ID eller URL-del för pressmeddelandet'),
});

export async function getPressmeddelande(args: z.infer<typeof getPressmeddelandeSchema>) {
  const data = await fetchG0vDocuments('pressmeddelanden', { limit: 500, search: args.document_id });
  const match = data.find((doc) =>
    doc.url?.toLowerCase().includes(args.document_id.toLowerCase()) ||
    doc.title?.toLowerCase().includes(args.document_id.toLowerCase())
  );

  if (!match) {
    throw new Error(`Pressmeddelandet ${args.document_id} hittades inte via g0v.se`);
  }

  const content = await fetchG0vDocumentContent(match.url);

  return {
    titel: match.title,
    publicerad: match.published,
    avsandare: match.sender,
    url: match.url,
    typ: match.type,
    markdown: content,
  };
}

export const getDokumentInnehallSchema = z.object({
  dok_id: z.string().describe('Dokument ID'),
  include_full_text: z.boolean().optional().default(false),
});

export async function getDokumentInnehall(args: z.infer<typeof getDokumentInnehallSchema>) {
  const doc = await loadDocument(args.dok_id);
  if (!doc) {
    throw new Error(`Dokument ${args.dok_id} hittades inte.`);
  }

  const text = await loadDocumentText(doc);
  const cleanText = text ? stripHtml(text) : null;

  return {
    dok_id: doc.dok_id,
    titel: doc.titel,
    datum: doc.datum,
    doktyp: doc.doktyp,
    rm: doc.rm,
    summary: doc.summary,
    snippet: cleanText ? truncate(cleanText, 400) : null,
    text: args.include_full_text ? cleanText : null,
    url: doc.dokument_url_html ? `https:${doc.dokument_url_html}` : doc.relurl,
  };
}

export const summarizePressmeddelandeSchema = z.object({
  document_id: z.string(),
  max_length: z.number().optional().default(500),
});

export async function summarizePressmeddelande(args: z.infer<typeof summarizePressmeddelandeSchema>) {
  const data = await fetchG0vDocuments('pressmeddelanden', { limit: 300, search: args.document_id });
  const match = data.find((doc) =>
    doc.url?.toLowerCase().includes(args.document_id.toLowerCase()) ||
    doc.title?.toLowerCase().includes(args.document_id.toLowerCase())
  );

  if (!match) {
    throw new Error(`Pressmeddelandet ${args.document_id} hittades inte.`);
  }

  const markdown = await fetchG0vDocumentContent(match.url);
  const clean = stripHtml(markdown || '');

  return {
    meta: {
      titel: match.title,
      publicerad: match.published,
      url: match.url,
      departement: match.sender,
    },
    summary: truncate(clean, args.max_length || 500),
  };
}
