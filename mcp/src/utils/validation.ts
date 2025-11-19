/**
 * Valideringsverktyg för att säkerställa att endast rätt tabeller används
 */

/**
 * Lista över tillåtna tabeller som MCP servern får använda
 * ENDAST data från Riksdagen och Regeringskansliet
 */
export const ALLOWED_TABLES: Record<string, string[]> = {
  // Riksdagens tabeller
  riksdagen: [
    'riksdagen_ledamoter',
    'riksdagen_ledamoter_uppdrag',
    'riksdagen_dokument',
    'riksdagen_anforanden',
    'riksdagen_voteringar',
    'riksdagen_voteringar_roster',
    'riksdagen_motioner',
    'riksdagen_propositioner',
    'riksdagen_betankanden',
    'riksdagen_fragor',
    'riksdagen_interpellationer',
    'riksdagen_protokoll',
    'riksdagen_utskott',
    'riksdagen_sagt_och_gjort',
    'riksdagen_departementsserien',
    'riksdagen_direktiv',
    'riksdagen_sou',
    'riksdagen_eu_forslag',
    'riksdagen_data_koppling',
    'riksdagen_api_log',
  ],

  // Regeringskansliets tabeller
  regeringskansliet: [
    'regeringskansliet_pressmeddelanden',
    'regeringskansliet_propositioner',
    'regeringskansliet_departementsserien',
    'regeringskansliet_sou',
    'regeringskansliet_remisser',
    'regeringskansliet_rapporter',
    'regeringskansliet_kommittedirektiv',
    'regeringskansliet_lagradsremiss',
    'regeringskansliet_skrivelse',
    'regeringskansliet_internationella_overenskommelser',
    'regeringskansliet_faktapromemoria',
    'regeringskansliet_informationsmaterial',
    'regeringskansliet_mr_granskningar',
    'regeringskansliet_dagordningar',
    'regeringskansliet_regeringsuppdrag',
    'regeringskansliet_regeringsarenden',
    'regeringskansliet_sakrad',
    'regeringskansliet_bistands_strategier',
    'regeringskansliet_overenskommelser_avtal',
    'regeringskansliet_arendeforteckningar',
    'regeringskansliet_artiklar',
    'regeringskansliet_debattartiklar',
    'regeringskansliet_tal',
    'regeringskansliet_ud_avrader',
    'regeringskansliet_uttalanden',
    'regeringskansliet_kategorier',
    'regeringskansliet_dokument',
    'regeringskansliet_forordningsmotiv',
    'regeringskansliet_api_log',
  ],
};

/**
 * Alla tillåtna tabeller i en flat lista
 */
export const ALL_ALLOWED_TABLES: string[] = [
  ...ALLOWED_TABLES.riksdagen,
  ...ALLOWED_TABLES.regeringskansliet,
];

/**
 * Kontrollera om ett tabellnamn är tillåtet
 */
export function isAllowedTable(tableName: string): boolean {
  return ALL_ALLOWED_TABLES.includes(tableName);
}

/**
 * Validera att en tabell är tillåten, kasta fel om inte
 */
export function validateTable(tableName: string): void {
  if (!isAllowedTable(tableName)) {
    throw new Error(
      `Säkerhetsfel: Tabell "${tableName}" är inte tillåten. ` +
      `MCP servern får endast använda data från Riksdagen och Regeringskansliet.`
    );
  }
}

/**
 * Hämta alla tillgängliga tabellkategorier
 */
export function getTableCategories(): Record<string, string[]> {
  return {
    riksdagen: ALLOWED_TABLES.riksdagen,
    regeringskansliet: ALLOWED_TABLES.regeringskansliet,
  };
}

/**
 * Kontrollera om en tabell tillhör Riksdagen
 */
export function isRiksdagenTable(tableName: string): boolean {
  return ALLOWED_TABLES.riksdagen.includes(tableName);
}

/**
 * Kontrollera om en tabell tillhör Regeringskansliet
 */
export function isRegeringskanlietTable(tableName: string): boolean {
  return ALLOWED_TABLES.regeringskansliet.includes(tableName);
}
