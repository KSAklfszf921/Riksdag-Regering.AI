/**
 * Pseudo-Supabaseklient som bara använder öppna API:er (data.riksdagen.se och g0v.se).
 *
 * Detta gör att MCP-servern kan köras helt utan Supabase-anslutning men behåller
 * samma anropsyta som tidigare kodbas. Select-frågor översätts till direkta
 * API-anrop och skrivoperationer blir no-ops.
 */

import {
  fetchAnforandenDirect,
  fetchDokumentDirect,
  fetchLedamoterDirect,
  fetchVoteringarDirect
} from './riksdagenApi.js';
import { fetchG0vDocuments } from './g0vApi.js';

export type SupabaseClient = ReturnType<typeof createPseudoClient>;

type Filter = { type: 'eq' | 'ilike' | 'gte' | 'lte' | 'in'; field: string; value: any };

type QueryOptions = {
  count?: 'exact' | 'planned' | null;
  head?: boolean;
};

type QueryResult<T> = { data: any; error: Error | null; count?: number };

type OrderConfig = { field?: string; ascending: boolean };

type OrFilter = { field: string; comparator: 'ilike' | 'eq'; value: string }[];

class ApiQueryBuilder<T = any> {
  private filters: Filter[] = [];
  private limitValue?: number;
  private orderConfig: OrderConfig = { ascending: true };
  private singleMode = false;
  private orFilters: OrFilter = [];
  private selectOptions: QueryOptions = {};

  constructor(private table: string) {}

  select(_columns = '*', options?: QueryOptions) {
    this.selectOptions = options || {};
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ type: 'eq', field, value });
    return this;
  }

  ilike(field: string, pattern: string) {
    this.filters.push({ type: 'ilike', field, value: pattern });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ type: 'gte', field, value });
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push({ type: 'lte', field, value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ type: 'in', field, value: values });
    return this;
  }

  or(filterString: string) {
    // Supabase-format: f1.ilike.%abc%,f2.ilike.%abc%
    this.orFilters = filterString.split(',').map(part => {
      const [field, comparator, value] = part.split('.');
      return { field, comparator: comparator as 'ilike' | 'eq', value };
    });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderConfig = { field, ascending: options?.ascending ?? true };
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  async insert(payload: any) {
    console.warn(`[telemetry] Ignorerar insert mot ${this.table} (Supabase ersatt av API).`);
    return { data: payload, error: null };
  }

  async upsert(payload: any, _options?: any) {
    console.warn(`[telemetry] Ignorerar upsert mot ${this.table} (Supabase ersatt av API).`);
    return { data: payload, error: null };
  }

  private async execute(): Promise<QueryResult<T>> {
    try {
      const data = await fetchTableData<T>(this.table, this.filters, this.orFilters, this.limitValue);
      const sorted = applyOrdering(data, this.orderConfig);
      const limited = typeof this.limitValue === 'number' ? sorted.slice(0, this.limitValue) : sorted;

      if (this.selectOptions.head && this.selectOptions.count === 'exact') {
        return { data: null, error: null, count: limited.length };
      }

      if (this.singleMode) {
        return { data: limited.length ? limited[0] : null, error: null };
      }

      return { data: limited, error: null, count: limited.length };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  lt(field: string, value: any) {
    this.filters.push({ type: 'lte', field, value });
    return this;
  }

  not(_field: string, _operator: any, _value: any) {
    // Not-stöd saknas i API:erna; returnera buildern utan att filtrera.
    return this;
  }

  textSearch(_column: string, _query: string, _options?: any) {
    // Textsökning hanteras redan via "sok"-parametrar i API-anropen.
    return this;
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null) {
    return this.execute().finally(onfinally);
  }
}

async function fetchTableData<T>(
  table: string,
  filters: Filter[],
  orFilters: OrFilter,
  limit?: number
): Promise<T[]> {
  switch (table) {
    case 'riksdagen_dokument':
      return filterDokument(await fetchDokumentDirect(buildDokumentParams(filters, limit)), filters, orFilters) as T[];
    case 'riksdagen_motioner':
      return filterDokument(await fetchDokumentDirect({ doktyp: 'mot', ...buildDokumentParams(filters, limit) }), filters, orFilters) as T[];
    case 'riksdagen_propositioner':
      return filterDokument(await fetchDokumentDirect({ doktyp: 'prop', ...buildDokumentParams(filters, limit) }), filters, orFilters) as T[];
    case 'riksdagen_betankanden':
      return filterDokument(await fetchDokumentDirect({ doktyp: 'bet', ...buildDokumentParams(filters, limit) }), filters, orFilters) as T[];
    case 'riksdagen_anforanden':
      return filterLocal(await fetchAnforandenDirect(buildAnforandeParams(filters, orFilters, limit)).then(r => r.data), filters, orFilters, limit) as T[];
    case 'riksdagen_ledamoter':
      return filterLocal(await fetchLedamoterDirect(buildLedamotParams(filters, limit)).then(r => r.data), filters, orFilters, limit) as T[];
    case 'riksdagen_voteringar':
      return filterLocal(await fetchVoteringarDirect(buildVoteringParams(filters, limit)).then(r => r.data), filters, orFilters, limit) as T[];
    case 'regeringskansliet_pressmeddelanden':
      return filterLocal(await fetchG0vDocuments('pressmeddelanden', { limit: limit ?? 50 }), filters, orFilters, limit) as T[];
    case 'regeringskansliet_propositioner':
      return filterLocal(await fetchG0vDocuments('propositioner', { limit: limit ?? 50 }), filters, orFilters, limit) as T[];
    default:
      return [];
  }
}

function buildDokumentParams(filters: Filter[], limit?: number) {
  const params: Record<string, any> = { sz: limit ?? 50 };
  for (const filter of filters) {
    if (filter.type === 'eq') {
      if (filter.field === 'doktyp') params.doktyp = filter.value;
      if (filter.field === 'rm') params.rm = filter.value;
      if (filter.field === 'organ') params.organ = filter.value;
    }
    if (filter.type === 'ilike' && filter.field === 'titel') {
      params.sok = stripWildcards(filter.value);
    }
  }
  return params;
}

function buildAnforandeParams(filters: Filter[], orFilters: OrFilter, limit?: number) {
  const params: Record<string, any> = { sz: limit ?? 100 };
  for (const filter of filters) {
    if (filter.type === 'eq') {
      if (filter.field === 'parti') params.parti = filter.value;
      if (filter.field === 'rm') params.rm = filter.value;
    }
    if (filter.type === 'ilike') {
      if (filter.field === 'talare') params.talare = stripWildcards(filter.value);
      if (filter.field === 'text') params.sok = stripWildcards(filter.value);
    }
  }
  const textFilter = orFilters.find(f => f.field === 'text');
  if (textFilter) {
    params.sok = stripWildcards(textFilter.value);
  }
  return params;
}

function buildLedamotParams(filters: Filter[], limit?: number) {
  const params: Record<string, any> = { sz: limit ?? 50 };
  for (const filter of filters) {
    if (filter.type === 'eq') {
      if (filter.field === 'parti') params.parti = filter.value;
      if (filter.field === 'valkrets') params.valkrets = filter.value;
    }
    if (filter.type === 'ilike') {
      if (filter.field === 'tilltalsnamn' || filter.field === 'efternamn') {
        params.fnamn = stripWildcards(filter.value);
        params.enamn = stripWildcards(filter.value);
      }
    }
  }
  return params;
}

function buildVoteringParams(filters: Filter[], limit?: number) {
  const params: Record<string, any> = { sz: limit ?? 200 };
  for (const filter of filters) {
    if (filter.type === 'eq') {
      if (filter.field === 'rm') params.rm = filter.value;
      if (filter.field === 'bet') params.bet = filter.value;
      if (filter.field === 'punkt') params.punkt = filter.value;
    }
  }
  return params;
}

function filterDokument(data: any, filters: Filter[], orFilters: OrFilter): any[] {
  const items = data?.data || [];
  let filtered = filterLocal(items, filters, orFilters);
  return filtered;
}

function filterLocal<T>(items: T[], filters: Filter[], orFilters: OrFilter, limit?: number): T[] {
  let filtered = [...(items || [])];

  filters.forEach(filter => {
    filtered = filtered.filter(item => applyFilter(item as Record<string, any>, filter));
  });

  if (orFilters.length) {
    filtered = filtered.filter(item =>
      orFilters.some(orFilter => applyFilter(item as Record<string, any>, { type: orFilter.comparator, field: orFilter.field, value: orFilter.value }))
    );
  }

  if (typeof limit === 'number') {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

function applyFilter(record: Record<string, any>, filter: Filter): boolean {
  const value = record[filter.field];
  if (value === undefined) return false;

  switch (filter.type) {
    case 'eq':
      return value === filter.value;
    case 'ilike': {
      const needle = stripWildcards(filter.value).toLowerCase();
      return String(value).toLowerCase().includes(needle);
    }
    case 'gte':
      return String(value) >= String(filter.value);
    case 'lte':
      return String(value) <= String(filter.value);
    case 'in':
      return Array.isArray(filter.value) ? filter.value.includes(value) : false;
    default:
      return true;
  }
}

function applyOrdering<T>(items: T[], order: OrderConfig): T[] {
  if (!order.field) return items;
  return [...items].sort((a: any, b: any) => {
    const av = a[order.field as keyof typeof a];
    const bv = b[order.field as keyof typeof b];
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    return order.ascending ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}

function stripWildcards(pattern: string) {
  return pattern.replace(/%/g, '').trim();
}

function createPseudoClient() {
  return {
    from: (table: string) => new ApiQueryBuilder(table),
  } as const;
}

let singletonClient: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient {
  if (!singletonClient) {
    singletonClient = createPseudoClient();
    console.error('Pseudo-Supabase aktiverad: alla frågor går direkt mot Riksdagen/g0v API');
  }
  return singletonClient;
}

export function getSupabase(): SupabaseClient {
  if (!singletonClient) {
    return initSupabase();
  }
  return singletonClient;
}
