/**
 * Datatyper för Riksdagen och Regeringskansliet
 */

export interface Ledamot {
  intressent_id: string;
  fornamn: string;
  efternamn: string;
  tilltalsnamn?: string;
  parti: string;
  valkrets?: string;
  status: string;
  bild_url?: string;
  local_bild_url?: string;
  iort?: string;
  kon?: string;
  fodelsear?: number;
  webbadress?: string;
  email?: string;
  telefonnummer?: string;
}

export interface Dokument {
  dok_id: string;
  rm?: string;
  beteckning?: string;
  doktyp?: string;
  typ?: string;
  organ?: string;
  datum?: string;
  titel?: string;
  subtitel?: string;
  status?: string;
  dokument_url_text?: string;
  dokument_url_html?: string;
  summary?: string;
}

export interface Anforande {
  anforande_id: string;
  intressent_id?: string;
  dok_id?: string;
  debattnamn?: string;
  anftext?: string;
  anfdatum?: string;
  parti?: string;
  talare?: string;
  avsnittsrubrik?: string;
}

export interface Votering {
  votering_id: string;
  rm?: string;
  beteckning?: string;
  punkt?: number;
  titel?: string;
  votering_datum?: string;
  antal_ja?: number;
  antal_nej?: number;
  antal_frånvarande?: number;
  antal_avstående?: number;
}

export interface Pressmeddelande {
  document_id: string;
  titel?: string;
  publicerad_datum?: string;
  departement?: string;
  url?: string;
  innehall?: string;
}

export interface Proposition {
  document_id: string;
  titel?: string;
  publicerad_datum?: string;
  beteckningsnummer?: string;
  departement?: string;
  url?: string;
  pdf_url?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
  sortBy?: string;
}

export interface AnalysisResult {
  summary: string;
  statistics: Record<string, number | string>;
  insights: string[];
}

export interface ComparisonResult {
  source1: string;
  source2: string;
  differences: Array<{
    field: string;
    value1: any;
    value2: any;
  }>;
  similarities: string[];
  conclusion: string;
}
