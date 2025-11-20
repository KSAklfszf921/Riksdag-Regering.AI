/**
 * Validation script for Supabase backfill data.
 *
 * This script validates that the backfill process completed successfully
 * by checking row counts and data integrity for all imported entities.
 *
 * Usage:
 * npx tsx scripts/validate-backfill.ts
 *
 * Environment variables required:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role API key for authentication
 */

import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running validation.');
  process.exit(1);
}

interface ValidationResult {
  table: string;
  count: number;
  status: 'success' | 'warning' | 'error';
  message: string;
}

async function getCount(table: string, filter?: string): Promise<number> {
  const url = filter
    ? `${SUPABASE_URL}/rest/v1/${table}?select=count&${filter}`
    : `${SUPABASE_URL}/rest/v1/${table}?select=count`;

  const response = await fetch(url, {
    method: 'HEAD',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'count=exact',
    },
  });

  const contentRange = response.headers.get('content-range');
  if (!contentRange) {
    return 0;
  }

  const match = contentRange.match(/\/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

async function validateTable(
  table: string,
  minExpected: number,
  description: string,
  filter?: string
): Promise<ValidationResult> {
  try {
    const count = await getCount(table, filter);

    if (count === 0) {
      return {
        table,
        count,
        status: 'error',
        message: `❌ ${description}: NO DATA (expected at least ${minExpected})`,
      };
    } else if (count < minExpected) {
      return {
        table,
        count,
        status: 'warning',
        message: `⚠️  ${description}: ${count} rows (expected at least ${minExpected})`,
      };
    } else {
      return {
        table,
        count,
        status: 'success',
        message: `✅ ${description}: ${count} rows`,
      };
    }
  } catch (error) {
    return {
      table,
      count: 0,
      status: 'error',
      message: `❌ ${description}: ERROR - ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function validateDokumentIntegrity(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Check motioner
  results.push(
    await validateTable(
      'riksdagen_dokument',
      50,
      'Motioner',
      'doktyp=eq.mot'
    )
  );

  // Check propositioner
  results.push(
    await validateTable(
      'riksdagen_dokument',
      20,
      'Propositioner (Riksdagen)',
      'doktyp=eq.prop'
    )
  );

  // Check betänkanden
  results.push(
    await validateTable(
      'riksdagen_dokument',
      50,
      'Betänkanden',
      'doktyp=eq.bet'
    )
  );

  // Check dokument med organ-fält populerat
  results.push(
    await validateTable(
      'riksdagen_dokument',
      10,
      'Dokument med organ-kod',
      'organ=not.is.null&organ=neq.'
    )
  );

  return results;
}

async function validateVoteringData(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Check voteringar
  results.push(
    await validateTable(
      'riksdagen_voteringar',
      5,
      'Voteringar (summaries)'
    )
  );

  // Check votering_ledamoter
  results.push(
    await validateTable(
      'riksdagen_votering_ledamoter',
      100,
      'Votering Ledamöter (individual votes)'
    )
  );

  return results;
}

async function validateBaseData(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Check ledamöter
  results.push(
    await validateTable(
      'riksdagen_ledamoter',
      300,
      'Ledamöter'
    )
  );

  // Check frågor
  results.push(
    await validateTable(
      'riksdagen_fragor',
      10,
      'Frågor'
    )
  );

  // Check interpellationer
  results.push(
    await validateTable(
      'riksdagen_interpellationer',
      10,
      'Interpellationer'
    )
  );

  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RIKSDAG-REGERING MCP BACKFILL VALIDATION');
  console.log('═══════════════════════════════════════════════════════\n');

  const allResults: ValidationResult[] = [];

  console.log('📊 Validating Base Data...');
  const baseResults = await validateBaseData();
  allResults.push(...baseResults);
  baseResults.forEach(r => console.log(r.message));

  console.log('\n📄 Validating Dokument Data...');
  const dokumentResults = await validateDokumentIntegrity();
  allResults.push(...dokumentResults);
  dokumentResults.forEach(r => console.log(r.message));

  console.log('\n🗳️  Validating Voting Data...');
  const votingResults = await validateVoteringData();
  allResults.push(...votingResults);
  votingResults.forEach(r => console.log(r.message));

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const successCount = allResults.filter(r => r.status === 'success').length;
  const warningCount = allResults.filter(r => r.status === 'warning').length;
  const errorCount = allResults.filter(r => r.status === 'error').length;

  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  console.log('\n═══════════════════════════════════════════════════════\n');

  if (errorCount > 0) {
    console.error('❌ Validation FAILED - some tables have critical issues');
    process.exit(1);
  } else if (warningCount > 0) {
    console.warn('⚠️  Validation PASSED with warnings - review data counts');
    process.exit(0);
  } else {
    console.log('✅ Validation PASSED - all tables populated correctly');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});
