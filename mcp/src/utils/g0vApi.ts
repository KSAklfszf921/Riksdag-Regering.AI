/**
 * Integration med g0v.se - Öppna data från regeringen.se
 * g0v.se tillhandahåller JSON API för regeringens dokument
 */

import { RateLimiter } from './rateLimiter.js';
import { safeFetch, buildQueryString, PaginatedResponse } from './apiHelpers.js';

const G0V_BASE = 'https://g0v.se';
const G0V_API_BASE = `${G0V_BASE}/api`;
const rateLimiter = new RateLimiter(60, 60000); // 60 req/min

export const G0V_TYPE_ALIASES: Record<string, string> = {
  pressmeddelanden: 'pressmeddelanden',
  propositioner: 'rattsliga-dokument/proposition',
  proposition: 'rattsliga-dokument/proposition',
  sou: 'rattsliga-dokument/statens-offentliga-utredningar',
  'statens-offentliga-utredningar': 'rattsliga-dokument/statens-offentliga-utredningar',
  ds: 'rattsliga-dokument/departementsserien-och-promemorior',
  departementsserien: 'rattsliga-dokument/departementsserien-och-promemorior',
  dir: 'rattsliga-dokument/kommittedirektiv',
  kommittedirektiv: 'rattsliga-dokument/kommittedirektiv',
  remisser: 'remisser',
  regeringsuppdrag: 'regeringsuppdrag',
  regeringsarenden: 'regeringsarenden',
  rapporter: 'rapporter',
  tal: 'tal',
  uttalanden: 'uttalanden',
  debattartiklar: 'debattartiklar',
  overenskommelser: 'overenskommelser-och-avtal',
  'overenskommelser-och-avtal': 'overenskommelser-och-avtal',
  rattsakter: 'rattsliga-dokument/sveriges-internationella-overenskommelser',
  'sveriges-internationella-overenskommelser': 'rattsliga-dokument/sveriges-internationella-overenskommelser',
  granskningar: 'internationella-mr-granskningar-av-sverige',
  'internationella-mr-granskningar-av-sverige': 'internationella-mr-granskningar-av-sverige',
  faktapromemoria: 'faktapromemoria',
  informationsmaterial: 'informationsmaterial',
  artiklar: 'artiklar',
  'ud-avrader': 'ud-avrader',
  'kommenterade-dagordningar': 'kommenterade-dagordningar',
  arendeforteckningar: 'arendeforteckningar',
  sakrad: 'sakrad',
  'strategier-for-internationellt-bistand': 'strategier-for-internationellt-bistand',
  'forordningsmotiv': 'rattsliga-dokument/forordningsmotiv',
  'lagradsremiss': 'rattsliga-dokument/lagradsremiss',
  'skrivelse': 'rattsliga-dokument/skrivelse',
};

export type G0vDocumentType = keyof typeof G0V_TYPE_ALIASES | string;

function resolveG0vType(type: G0vDocumentType): string {
  const key = String(type).toLowerCase();
  return G0V_TYPE_ALIASES[key] || String(type);
}

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

  const slug = resolveG0vType(type).replace(/^\/+/, '');
  const url = `${G0V_BASE}/${slug}.json`;
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
  codes: number;
}> {
  await rateLimiter.waitForToken();
  const url = `${G0V_API_BASE}/latest_updated.json`;
  const data = await safeFetch(url);

  return {
    updated: data.latest_updated || data.updated || '',
    totalDocuments: data.items ?? data.totalDocuments ?? 0,
    codes: data.codes ?? 0,
  };
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
    'rapporter',
    'tal',
    'debattartiklar',
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
 * Extract department name from document
 */
function extractDepartment(doc: G0vDocument): string {
  const DEFAULT_SENDER = 'Okänt departement';

  // First, try sender field
  if (doc.sender && doc.sender.trim()) {
    return doc.sender.trim();
  }

  // Then, try to extract from categories
  if (doc.categories && Array.isArray(doc.categories)) {
    for (const cat of doc.categories) {
      const catLower = cat.toLowerCase();
      // Check if category contains a department name
      if (catLower.includes('departement')) {
        return cat;
      }
      // Map known category codes to departments
      if (catLower.includes('1286')) return 'Försvarsdepartementet';
      if (catLower.includes('1285')) return 'Finansdepartementet';
      if (catLower.includes('1284')) return 'Utbildningsdepartementet';
      if (catLower.includes('1283')) return 'Justitiedepartementet';
      if (catLower.includes('1282')) return 'Miljödepartementet';
      if (catLower.includes('1281')) return 'Näringsdepartementet';
      if (catLower.includes('1280')) return 'Socialdepartementet';
    }
  }

  // Try to extract from URL
  if (doc.url) {
    const urlLower = doc.url.toLowerCase();
    if (urlLower.includes('forsvarsdepartementet')) return 'Försvarsdepartementet';
    if (urlLower.includes('finansdepartementet')) return 'Finansdepartementet';
    if (urlLower.includes('utbildningsdepartementet')) return 'Utbildningsdepartementet';
    if (urlLower.includes('justitiedepartementet')) return 'Justitiedepartementet';
    if (urlLower.includes('miljodepartementet')) return 'Miljödepartementet';
    if (urlLower.includes('naringsdepartementet')) return 'Näringsdepartementet';
    if (urlLower.includes('socialdepartementet')) return 'Socialdepartementet';
  }

  return DEFAULT_SENDER;
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
    const sender = extractDepartment(doc);
    if (!departments[sender]) {
      departments[sender] = {
        count: 0,
        pressReleases: 0,
        propositions: 0,
        speeches: 0,
      };
    }
    departments[sender].count++;
    departments[sender].pressReleases++;
  });

  // Analyze propositions
  propositioner.forEach((doc) => {
    const sender = extractDepartment(doc);
    if (!departments[sender]) {
      departments[sender] = {
        count: 0,
        pressReleases: 0,
        propositions: 0,
        speeches: 0,
      };
    }
    departments[sender].count++;
    departments[sender].propositions++;
  });

  // Analyze speeches
  tal.forEach((doc) => {
    const sender = extractDepartment(doc);
    if (!departments[sender]) {
      departments[sender] = {
        count: 0,
        pressReleases: 0,
        propositions: 0,
        speeches: 0,
      };
    }
    departments[sender].count++;
    departments[sender].speeches++;
  });

  const total =
    pressmeddelanden.length + propositioner.length + tal.length;

  return {
    departments,
    total,
  };
}
