/**
 * Integration med g0v.se - Öppna data från regeringen.se
 * g0v.se tillhandahåller JSON API för regeringens dokument
 */

import { RateLimiter } from './rateLimiter.js';
import { safeFetch, buildQueryString, PaginatedResponse } from './apiHelpers.js';

const G0V_API_BASE = 'https://g0v.se/api';
const rateLimiter = new RateLimiter(60, 60000); // 60 req/min

/**
 * Dokumenttyper från g0v.se
 */
export type G0vDocumentType =
  | 'propositioner'
  | 'sou'
  | 'ds'
  | 'dir'
  | 'remisser'
  | 'regeringsuppdrag'
  | 'pressmeddelanden'
  | 'tal'
  | 'uttalanden'
  | 'debattartiklar'
  | 'overenskommelser'
  | 'rattsakter'
  | 'granskningar';

/**
 * G0v dokument-struktur
 */
export interface G0vDocument {
  url: string;
  title: string;
  published: string;
  updated?: string;
  type: string;
  categories: string[];
  sender?: string;
  reference?: string;
  attachments?: Array<{
    url: string;
    title: string;
    type?: string;
  }>;
}

/**
 * Hämta dokument från g0v.se API
 */
export async function fetchG0vDocuments(
  type: G0vDocumentType,
  options?: {
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<G0vDocument[]> {
  await rateLimiter.waitForToken();

  const url = `${G0V_API_BASE}/${type}.json`;
  const data = await safeFetch(url);

  let documents: G0vDocument[] = data;

  // Filter by search term
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    documents = documents.filter((doc) =>
      doc.title.toLowerCase().includes(searchLower)
    );
  }

  // Filter by date range
  if (options?.dateFrom) {
    documents = documents.filter((doc) => doc.published >= options.dateFrom!);
  }

  if (options?.dateTo) {
    documents = documents.filter((doc) => doc.published <= options.dateTo!);
  }

  // Apply limit
  if (options?.limit) {
    documents = documents.slice(0, options.limit);
  }

  return documents;
}

/**
 * Hämta alla tillgängliga dokument (VARNING: stor fil!)
 */
export async function fetchAllG0vDocuments(): Promise<G0vDocument[]> {
  await rateLimiter.waitForToken();
  const url = `${G0V_API_BASE}/items.json`;
  return safeFetch(url);
}

/**
 * Hämta senast uppdaterade metadata
 */
export async function fetchG0vLatestUpdate(): Promise<{
  updated: string;
  totalDocuments: number;
  documentTypes: Record<string, number>;
}> {
  await rateLimiter.waitForToken();
  const url = `${G0V_API_BASE}/latest_updated.json`;
  return safeFetch(url);
}

/**
 * Hämta kategori-koder
 */
export async function fetchG0vCodes(): Promise<Record<string, string>> {
  await rateLimiter.waitForToken();
  const url = `${G0V_API_BASE}/codes.json`;
  return safeFetch(url);
}

/**
 * Hämta dokument-innehåll i Markdown
 */
export async function fetchG0vDocumentContent(
  regeringenUrl: string
): Promise<string> {
  await rateLimiter.waitForToken();

  // Convert regeringen.se URL to g0v.se Markdown URL
  const g0vUrl = regeringenUrl
    .replace('https://www.regeringen.se', 'https://g0v.se')
    .replace(/\/$/, '.md');

  const response = await fetch(g0vUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch document content: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Sök i alla dokumenttyper
 */
export async function searchG0vAllTypes(
  searchTerm: string,
  options?: {
    types?: G0vDocumentType[];
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Record<G0vDocumentType, G0vDocument[]>> {
  const types: G0vDocumentType[] = options?.types || [
    'propositioner',
    'pressmeddelanden',
    'sou',
    'ds',
    'remisser',
    'tal',
  ];

  const results: Record<string, G0vDocument[]> = {};

  // Fetch from each type in parallel
  const promises = types.map(async (type) => {
    try {
      const docs = await fetchG0vDocuments(type, {
        search: searchTerm,
        limit: options?.limit,
        dateFrom: options?.dateFrom,
        dateTo: options?.dateTo,
      });
      return { type, docs };
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      return { type, docs: [] };
    }
  });

  const allResults = await Promise.all(promises);

  allResults.forEach(({ type, docs }) => {
    results[type] = docs;
  });

  return results as Record<G0vDocumentType, G0vDocument[]>;
}

/**
 * Analysera dokument per departement
 */
export async function analyzeByDepartment(
  options?: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{
  departments: Record<
    string,
    {
      count: number;
      pressReleases: number;
      propositions: number;
      speeches: number;
    }
  >;
  total: number;
}> {
  const [pressmeddelanden, propositioner, tal] = await Promise.all([
    fetchG0vDocuments('pressmeddelanden', options),
    fetchG0vDocuments('propositioner', options),
    fetchG0vDocuments('tal', options),
  ]);

  const departments: Record<
    string,
    {
      count: number;
      pressReleases: number;
      propositions: number;
      speeches: number;
    }
  > = {};

  // Analyze press releases
  pressmeddelanden.forEach((doc) => {
    if (doc.sender) {
      if (!departments[doc.sender]) {
        departments[doc.sender] = {
          count: 0,
          pressReleases: 0,
          propositions: 0,
          speeches: 0,
        };
      }
      departments[doc.sender].count++;
      departments[doc.sender].pressReleases++;
    }
  });

  // Analyze propositions
  propositioner.forEach((doc) => {
    if (doc.sender) {
      if (!departments[doc.sender]) {
        departments[doc.sender] = {
          count: 0,
          pressReleases: 0,
          propositions: 0,
          speeches: 0,
        };
      }
      departments[doc.sender].count++;
      departments[doc.sender].propositions++;
    }
  });

  // Analyze speeches
  tal.forEach((doc) => {
    if (doc.sender) {
      if (!departments[doc.sender]) {
        departments[doc.sender] = {
          count: 0,
          pressReleases: 0,
          propositions: 0,
          speeches: 0,
        };
      }
      departments[doc.sender].count++;
      departments[doc.sender].speeches++;
    }
  });

  const total =
    pressmeddelanden.length + propositioner.length + tal.length;

  return {
    departments,
    total,
  };
}
