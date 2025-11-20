/**
 * Direkt API-anrop till Riksdagens öppna API:er
 * Används för real-time data och sökning
 */

import { RateLimiter } from './rateLimiter.js';
import {
  buildPaginatedResponse,
  safeFetch,
  buildQueryString,
  PaginatedResponse,
  encodeRiksmote,
} from './apiHelpers.js';

const API_BASE = 'https://data.riksdagen.se';
const rateLimiter = new RateLimiter(100, 60000); // 100 req/min

/**
 * Hämta dokument direkt från Riksdagens API med paginering
 */
export async function fetchDokumentDirect(params: {
  doktyp?: string;
  sok?: string;
  rm?: string;
  p?: number;
  sz?: number;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    doktyp: params.doktyp?.toLowerCase(), // API uses lowercase
    sok: params.sok,
    rm: params.rm ? encodeRiksmote(params.rm) : undefined,
    p: params.p || 1,
    sz: params.sz || 50,
    utformat: 'json',
  });

  const url = `${API_BASE}/dokumentlista/?${queryString}`;
  const data = await safeFetch(url);

  return buildPaginatedResponse(data, 'dokumentlista');
}

/**
 * Hämta anföranden direkt från Riksdagens API med paginering
 */
export async function fetchAnforandenDirect(params: {
  sok?: string;
  talare?: string;
  parti?: string;
  rm?: string;
  p?: number;
  sz?: number;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    sok: params.sok,
    talare: params.talare,
    parti: params.parti?.toUpperCase(),
    rm: params.rm ? encodeRiksmote(params.rm) : undefined,
    p: params.p || 1,
    sz: params.sz || 100,
    utformat: 'json',
  });

  const url = `${API_BASE}/anforandelista/?${queryString}`;
  const data = await safeFetch(url);

  return buildPaginatedResponse(data, 'anforandelista');
}

/**
 * Hämta voteringar direkt från Riksdagens API med paginering
 */
export async function fetchVoteringarDirect(params: {
  rm?: string;
  bet?: string;
  punkt?: string;
  gruppering?: 'namn' | 'parti' | 'valkrets';
  p?: number;
  sz?: number;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    rm: params.rm ? encodeRiksmote(params.rm) : undefined,
    bet: params.bet,
    punkt: params.punkt,
    gruppering: params.gruppering,
    p: params.p || 1,
    sz: params.sz || 500,
    utformat: 'json',
    sort: 'datum',
  });

  const url = `${API_BASE}/voteringlista/?${queryString}`;
  const data = await safeFetch(url);

  return buildPaginatedResponse(data, 'voteringlista');
}

/**
 * Hämta ledamöter direkt från Riksdagens API med paginering
 * Note: API uses 'fnamn' and 'enamn' parameters (not tilltalsnamn/efternamn)
 */
export async function fetchLedamoterDirect(params: {
  fnamn?: string;
  enamn?: string;
  parti?: string;
  valkrets?: string;
  rdlstatus?: string;
  p?: number;
  sz?: number;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    fnamn: params.fnamn,
    enamn: params.enamn,
    parti: params.parti?.toUpperCase(),
    valkrets: params.valkrets,
    rdlstatus: params.rdlstatus || 'samtliga',
    p: params.p || 1,
    sz: params.sz || 50,
    utformat: 'json',
    sort: 'sorteringsnamn',
    sortorder: 'asc',
  });

  const url = `${API_BASE}/personlista/?${queryString}`;
  const data = await safeFetch(url);

  return buildPaginatedResponse(data, 'personlista');
}
