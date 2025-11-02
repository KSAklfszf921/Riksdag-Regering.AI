// =====================================================
// UTÖKADE TYPDEFINITIONER FÖR RIKSDAGENS API
// =====================================================

// Ledamöter med alla fält
export interface ExtendedLedamotData {
  intressent_id: string;
  fornamn?: string;
  efternamn?: string;
  tilltalsnamn?: string;
  parti?: string;
  valkrets?: string;
  status?: string;
  bild_url?: string;
  local_bild_url?: string;
  // Nya fält
  iort?: string;
  kon?: string;
  fodelsear?: number;
  webbadress?: string;
  epostadress?: string;
  telefonnummer?: string;
  titel?: string;
}

// Ledamots uppdrag
export interface LedamotUppdrag {
  intressent_id: string;
  uppdragets_typ?: string;
  uppdragets_organ?: string;
  roll_i_uppdraget?: string;
  uppdrag_fran?: string;
  uppdrag_till?: string;
  status?: string;
}

// Utökade dokumenttyper
export interface DirektivData {
  dokument_id: string;
  beteckningsnummer?: string;
  titel?: string;
  publicerad_datum?: string;
  departement?: string;
  url?: string;
  local_files?: any;
  innehall?: string;
  kategorier?: string[];
}

export interface DepartementsserieData {
  dokument_id: string;
  beteckningsnummer?: string;
  titel?: string;
  publicerad_datum?: string;
  departement?: string;
  url?: string;
  local_files?: any;
  innehall?: string;
  kategorier?: string[];
}

export interface SOUData {
  dokument_id: string;
  beteckningsnummer?: string;
  titel?: string;
  publicerad_datum?: string;
  utredare?: string;
  departement?: string;
  url?: string;
  local_files?: any;
  innehall?: string;
  kategorier?: string[];
}

export interface EUForslagData {
  dokument_id: string;
  kom_nummer?: string;
  titel?: string;
  publicerad_datum?: string;
  eu_organ?: string;
  amnesomrade?: string[];
  url?: string;
  local_files?: any;
  innehall?: string;
  kategorier?: string[];
}

// Utökade voteringstyper
export interface ExtendedVoteringData {
  votering_id: string;
  rm?: string;
  beteckning?: string;
  punkt?: number;
  titel?: string;
  votering_datum?: string;
  // Nya fält
  voteringstyp?: string;
  beslut?: string;
  ja_roster?: number;
  nej_roster?: number;
  avstande_roster?: number;
  franvarande_roster?: number;
  dokument_id?: string;
}

export interface VoteringRostData {
  votering_id: string;
  intressent_id: string;
  rost: 'Ja' | 'Nej' | 'Avstår' | 'Frånvarande';
  parti?: string;
  valkrets?: string;
}

// Utökade anförandetyper
export interface ExtendedAnforandeData {
  anforande_id: string;
  intressent_id?: string;
  dok_id?: string;
  debattnamn?: string;
  debattsekund?: number;
  anftext?: string;
  anfdatum?: string;
  avsnittsrubrik?: string;
  parti?: string;
  talare?: string;
  // Nya fält
  anforande_nummer?: number;
  kammaraktivitet?: string;
  protokoll_id?: string;
}

// Mappning av dokumenttyper till tabeller
export const DOKUMENT_TYP_TABELLER: Record<string, string> = {
  'mot': 'riksdagen_motioner',
  'prop': 'riksdagen_propositioner', 
  'bet': 'riksdagen_betankanden',
  'ip': 'riksdagen_interpellationer',
  'fr': 'riksdagen_fragor',
  'prot': 'riksdagen_protokoll',
  'dir': 'riksdagen_direktiv',
  'ds': 'riksdagen_departementsserien',
  'sou': 'riksdagen_sou',
  'kom': 'riksdagen_eu_forslag',
  // Fallback för övriga
  'default': 'riksdagen_dokument'
};

// Helper-funktion för att bestämma rätt tabell
export function getDokumentTabell(doktyp?: string): string {
  if (!doktyp) return DOKUMENT_TYP_TABELLER.default;
  const normalizedType = doktyp.toLowerCase();
  return DOKUMENT_TYP_TABELLER[normalizedType] || DOKUMENT_TYP_TABELLER.default;
}

// Filtreringsparametrar för API-anrop
export interface APIFilterParams {
  rm?: string;           // Riksmöte (t.ex. "2024/25")
  parti?: string;        // Parti (t.ex. "S", "M", "SD")
  iid?: string;          // Intressent ID (ledamots-ID)
  from?: string;         // Från datum
  tom?: string;          // Till datum
  ts?: string;           // Tidsperiod
  doktyp?: string;       // Dokumenttyp
  sz?: string;           // Antal resultat per sida (max 500)
  sort?: string;         // Sortering
  sortorder?: string;    // Sorteringsordning
  utskott?: string;      // Utskott
  bet?: string;          // Beteckning
  punkt?: string;        // Punkt (för voteringar)
  valkrets?: string;     // Valkrets
  rost?: string;         // Röst (för voteringar)
  gruppering?: string;   // Gruppering (för voteringar)
  rdlstatus?: string;    // Status för riksdagsledamot
  org?: string;          // Organisation/organ
}

// Helper-funktion för att bygga API URL med filter
export function buildFilteredAPIUrl(
  baseUrl: string, 
  filters: APIFilterParams, 
  format: string = 'json'
): string {
  const params = new URLSearchParams({
    utformat: format,
    sz: filters.sz || '500',
    p: '1'
  });
  
  // Lägg till alla definierade filter
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== 'sz') {
      params.append(key, value);
    }
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// Validering av datum
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

// Normalisera partinamn
export function normalizeParti(parti?: string): string | undefined {
  if (!parti) return undefined;
  
  const partiMap: Record<string, string> = {
    'socialdemokraterna': 'S',
    's': 'S',
    'moderaterna': 'M',
    'm': 'M',
    'sverigedemokraterna': 'SD',
    'sd': 'SD',
    'centerpartiet': 'C',
    'c': 'C',
    'vänsterpartiet': 'V',
    'v': 'V',
    'kristdemokraterna': 'KD',
    'kd': 'KD',
    'liberalerna': 'L',
    'l': 'L',
    'miljöpartiet': 'MP',
    'mp': 'MP'
  };
  
  const normalized = parti.toLowerCase();
  return partiMap[normalized] || parti.toUpperCase();
}

// Extrahera dokument-ID från URL
export function extractDokumentId(url?: string): string | undefined {
  if (!url) return undefined;
  
  // Exempel: https://data.riksdagen.se/dokument/ABC123
  const match = url.match(/\/dokument\/([A-Z0-9]+)/i);
  return match ? match[1] : undefined;
}