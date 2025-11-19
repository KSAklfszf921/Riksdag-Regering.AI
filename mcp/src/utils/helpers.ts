/**
 * Hjälpfunktioner för databearbetning
 */

/**
 * Formatera datum till YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Bygg en WHERE-klausul från filterobjekt
 */
export function buildWhereClause(filters: Record<string, any>): string {
  const conditions: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        conditions.push(`${key} ILIKE '%${value}%'`);
      } else {
        conditions.push(`${key} = ${value}`);
      }
    }
  }

  return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
}

/**
 * Beräkna statistik från en array av objekt
 */
export function calculateStatistics(data: any[], field: string): {
  count: number;
  unique: number;
  distribution: Record<string, number>;
} {
  const values = data.map(item => item[field]).filter(v => v !== null && v !== undefined);
  const uniqueValues = new Set(values);

  const distribution: Record<string, number> = {};
  for (const value of values) {
    distribution[value] = (distribution[value] || 0) + 1;
  }

  return {
    count: values.length,
    unique: uniqueValues.size,
    distribution
  };
}

/**
 * Gruppera data efter ett fält
 */
export function groupBy<T>(data: T[], field: keyof T): Record<string, T[]> {
  return data.reduce((groups, item) => {
    const key = String(item[field]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sortera efter ett fält
 */
export function sortBy<T>(data: T[], field: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Extrahera text från HTML
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Trunkera text till en viss längd
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
