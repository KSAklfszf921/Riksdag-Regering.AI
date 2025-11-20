/**
 * Clean duplicate entries from Supabase tables.
 *
 * This script identifies and removes duplicate entries that may have been
 * created if backfill scripts were run multiple times without proper
 * upsert handling.
 *
 * Usage:
 * npx tsx scripts/clean-duplicates.ts [--table TABLE_NAME] [--dry-run]
 *
 * Examples:
 * - Clean all tables: npx tsx scripts/clean-duplicates.ts
 * - Clean specific table: npx tsx scripts/clean-duplicates.ts --table riksdagen_dokument
 * - Dry run (no changes): npx tsx scripts/clean-duplicates.ts --dry-run
 *
 * Environment variables required:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role API key for authentication
 */

import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}

const args = process.argv.slice(2);
const tableArg = args.find(arg => arg.startsWith('--table='));
const specificTable = tableArg ? tableArg.split('=')[1] : null;
const isDryRun = args.includes('--dry-run');

interface TableConfig {
  name: string;
  primaryKey: string;
  description: string;
}

const TABLES: TableConfig[] = [
  {
    name: 'riksdagen_dokument',
    primaryKey: 'dokument_id',
    description: 'Riksdagen Documents (motioner, propositioner, betänkanden)',
  },
  {
    name: 'riksdagen_ledamoter',
    primaryKey: 'intressent_id',
    description: 'Riksdagen Members',
  },
  {
    name: 'riksdagen_voteringar',
    primaryKey: 'votering_id',
    description: 'Voting Summaries',
  },
  {
    name: 'riksdagen_votering_ledamoter',
    primaryKey: 'votering_id,intressent_id',
    description: 'Individual Member Votes',
  },
  {
    name: 'riksdagen_fragor',
    primaryKey: 'dokument_id',
    description: 'Questions (Frågor)',
  },
  {
    name: 'riksdagen_interpellationer',
    primaryKey: 'dokument_id',
    description: 'Interpellations',
  },
];

async function findDuplicates(table: string, primaryKey: string): Promise<any[]> {
  // For composite keys, we need to handle differently
  const isComposite = primaryKey.includes(',');

  if (isComposite) {
    // For composite keys, fetch all data and find duplicates in memory
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
    }

    const data = await response.json();
    const keys = primaryKey.split(',');
    const seen = new Map<string, any>();
    const duplicates: any[] = [];

    for (const row of data as any[]) {
      const compositeKey = keys.map(k => row[k]).join('|');
      if (seen.has(compositeKey)) {
        duplicates.push(row);
      } else {
        seen.set(compositeKey, row);
      }
    }

    return duplicates;
  } else {
    // For single primary keys, use SQL query via RPC or direct query
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${primaryKey},created_at&order=${primaryKey}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
    }

    const data = await response.json();
    const seen = new Map<string, any>();
    const duplicates: any[] = [];

    for (const row of data as any[]) {
      const keyValue = row[primaryKey];
      if (seen.has(keyValue)) {
        // Keep the older one (first seen), mark newer as duplicate
        duplicates.push(row);
      } else {
        seen.set(keyValue, row);
      }
    }

    return duplicates;
  }
}

async function deleteDuplicates(
  table: string,
  primaryKey: string,
  duplicates: any[]
): Promise<number> {
  if (duplicates.length === 0) {
    return 0;
  }

  const isComposite = primaryKey.includes(',');
  let deletedCount = 0;

  for (const dup of duplicates) {
    if (isComposite) {
      // Build filter for composite key
      const keys = primaryKey.split(',');
      const filters = keys.map(k => `${k}=eq.${dup[k]}`).join('&');

      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      if (response.ok) {
        deletedCount++;
      }
    } else {
      // Simple primary key delete
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${primaryKey}=eq.${dup[primaryKey]}`,
        {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }
      );

      if (response.ok) {
        deletedCount++;
      }
    }
  }

  return deletedCount;
}

async function cleanTable(config: TableConfig) {
  console.log(`\n🔍 Checking ${config.description} (${config.name})...`);

  try {
    const duplicates = await findDuplicates(config.name, config.primaryKey);

    if (duplicates.length === 0) {
      console.log(`   ✅ No duplicates found`);
      return;
    }

    console.log(`   ⚠️  Found ${duplicates.length} duplicate(s)`);

    if (isDryRun) {
      console.log(`   🔸 DRY RUN - would delete ${duplicates.length} row(s)`);
      return;
    }

    const deletedCount = await deleteDuplicates(
      config.name,
      config.primaryKey,
      duplicates
    );

    console.log(`   ✅ Deleted ${deletedCount} duplicate row(s)`);
  } catch (error) {
    console.error(
      `   ❌ Error processing ${config.name}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RIKSDAG-REGERING MCP DUPLICATE CLEANER');
  console.log('═══════════════════════════════════════════════════════');

  if (isDryRun) {
    console.log('\n🔸 DRY RUN MODE - No changes will be made\n');
  }

  const tablesToClean = specificTable
    ? TABLES.filter(t => t.name === specificTable)
    : TABLES;

  if (tablesToClean.length === 0) {
    console.error(`❌ Table '${specificTable}' not found in configuration`);
    process.exit(1);
  }

  for (const table of tablesToClean) {
    await cleanTable(table);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('❌ Cleanup script failed:', error);
  process.exit(1);
});
