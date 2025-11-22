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
  organ?: string;
  bet?: string;
  tempbeteckning?: string;
  nr?: string;
  nummer?: string;
  iid?: string;
  parti?: string;
  talare?: string;
  mottagare?: string;
  typ?: string;
  subtyp?: string;
  from?: string;
  tom?: string;
  status?: string;
  subtitle?: string;
  relaterat_id?: string;
  avd?: string;
  webbtv?: 'true' | 'false';
  exakt?: 'true' | 'false';
  planering?: 'true' | 'false';
  facets?: string;
  rapport?: string;
  sort?: string;
  sortorder?: 'asc' | 'desc';
  p?: number;
  sz?: number;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    doktyp: params.doktyp?.toLowerCase(),
    typ: params.typ,
    subtyp: params.subtyp,
    sok: params.sok,
    rm: params.rm,
    organ: params.organ,
    bet: params.bet,
    tempbeteckning: params.tempbeteckning,
    nummer: params.nummer || params.nr,
    iid: params.iid,
    parti: params.parti,
    talare: params.talare,
    mottagare: params.mottagare,
    from: params.from,
    tom: params.tom,
    status: params.status,
    subtitle: params.subtitle,
    relaterat_id: params.relaterat_id,
    avd: params.avd,
    webbtv: params.webbtv,
    exakt: params.exakt,
    planering: params.planering,
    facets: params.facets,
    rapport: params.rapport,
    sort: params.sort,
    sortorder: params.sortorder,
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
    rm: params.rm,
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
  votering_id?: string;
  rm?: string;
  bet?: string;
  punkt?: string;
  iid?: string;
  parti?: string;
  valkrets?: string;
  rost?: string;
  avser?: string;
  gruppering?: 'namn' | 'parti' | 'valkrets';
  p?: number;
  sz?: number;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    votering_id: params.votering_id,
    rm: params.rm,
    bet: params.bet,
    punkt: params.punkt,
    iid: params.iid,
    parti: params.parti,
    valkrets: params.valkrets,
    rost: params.rost,
    avser: params.avser,
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
  iid?: string;
  p?: number;
  sz?: number;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    fnamn: params.fnamn,
    enamn: params.enamn,
    parti: params.parti?.toUpperCase(),
    iid: params.iid,
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

export async function fetchVoteringGroup(params: {
  rm?: string;
  bet?: string;
  punkt?: string;
  gruppering?: string; // Corrected typo
  sz?: number;
  utformat?: string;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    rm: params.rm,
    bet: params.bet,
    punkt: params.punkt,
    gruppering: params.gruppering, // Now correctly uses params.gruppering
    sz: params.sz || 500,
    utformat: params.utformat || 'json',
  });

  const url = `${API_BASE}/voteringlistagrupp/?${queryString}`;
  const data = await safeFetch(url);

  return buildPaginatedResponse(data, 'voteringlista');
}

export async function fetchKalenderDirect(params: {
  from?: string;
  tom?: string;
  akt?: string;
  org?: string;
  sz?: number;
  sort?: string;
}): Promise<PaginatedResponse<any>> {
  await rateLimiter.waitForToken();

  const queryString = buildQueryString({
    from: params.from,
    tom: params.tom,
    akt: params.akt,
    org: params.org,
    sz: params.sz || 200,
    sort: params.sort,
    utformat: 'json',
  });

  const url = `${API_BASE}/kalenderlista/?${queryString}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await response.text();

  try {
    const data = JSON.parse(text);
    return buildPaginatedResponse(data, 'kalender');
  } catch (e) {
    throw new Error(`Riksdagens kalender-API returnerade icke-JSON-innehåll. URL: ${url}. Fel: ${e instanceof Error ? e.message : String(e)}`);
  }
}
