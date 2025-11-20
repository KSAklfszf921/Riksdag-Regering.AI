/**
 * Hjälpfunktioner för att sanera och strukturera svar från MCP-verktygen
 */

import { stripHtml, truncate } from './helpers.js';

const TIMESTAMP_FIELDS = new Set([
  'created_at',
  'updated_at',
  'inserted_at',
  'modified_at',
  'publicerad_datum_uppdaterad',
]);

type CleanOptions = {
  removeTimestamps?: boolean;
};

/**
 * Ta bort null/undefined, tomma arrayer och tidsstämplar från ett record
 */
export function cleanRecord<T extends Record<string, any>>(
  record: T,
  options?: CleanOptions
): Record<string, any> {
  const result: Record<string, any> = {};
  const removeTimestamps = options?.removeTimestamps ?? true;

  for (const [key, value] of Object.entries(record)) {
    if (removeTimestamps && TIMESTAMP_FIELDS.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue;

    result[key] = value;
  }

  return result;
}

/**
 * Begränsa ett record till specifika fält. Saknade fält ignoreras.
 * Mandatory fields inkluderas alltid om de finns.
 */
export function selectFields(
  record: Record<string, any>,
  fields?: string[],
  mandatory: string[] = []
): Record<string, any> {
  if (!fields || fields.length === 0) {
    return record;
  }

  const uniqueFields = Array.from(new Set([...mandatory, ...fields]));
  const picked: Record<string, any> = {};

  for (const field of uniqueFields) {
    if (field in record) {
      picked[field] = record[field];
    }
  }

  return picked;
}

/**
 * Skapa ett kort textutdrag utan HTML och med begränsad längd
 */
export function createPreview(text?: string | null, maxLength = 140): string | undefined {
  if (!text) return undefined;
  const cleanText = stripHtml(String(text)).trim();
  if (!cleanText) return undefined;
  return truncate(cleanText, maxLength);
}

/**
 * Bygg en konsekvent lista-respons
 */
export function buildListResponse<T>(
  items: T[],
  limit: number,
  extra?: Record<string, any>
) {
  return {
    ...(extra || {}),
    items,
    count: items.length,
    limit,
    has_more: items.length === limit,
  };
}

/**
 * Välj bästa bild-URL för listor (Supabase cache före originalkälla)
 */
export function selectImageUrl(record: Record<string, any>) {
  return record.local_bild_url || record.image_url || record.bild_url || undefined;
}
