#!/usr/bin/env node

/**
 * MCP Server för Riksdagen och Regeringskansliet
 *
 * En professionell MCP server som ENDAST använder data från:
 * - Sveriges Riksdag (data.riksdagen.se)
 * - Regeringskansliet (g0v.se)
 *
 * Denna server tillhandahåller verktyg och resurser för att:
 * - Söka efter ledamöter, dokument, anföranden och voteringar
 * - Analysera partifördelning, röstningsstatistik och dokumentstatistik
 * - Jämföra ledamöter, partier och voteringar
 * - Hämta specifika dokument och data
 * - Få aggregerad statistik och toplistor
 * - Global sökning över alla datakällor
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { initSupabase } from './utils/supabase.js';
import { listResources, getResource } from './resources/index.js';

// Search tools
import {
  searchLedamoter, searchLedamoterSchema,
  searchDokument, searchDokumentSchema,
  searchAnforanden, searchAnforandenSchema,
  searchVoteringar, searchVoteringarSchema,
  searchRegering, searchRegeringSchema,
} from './tools/search.js';

// Analysis tools
import {
  analyzePartifordelning, analyzePartifordelningSchema,
  analyzeVotering, analyzeVoteringSchema,
  analyzeLedamot, analyzeLedamotSchema,
  analyzeDokumentStatistik, analyzeDokumentStatistikSchema,
  analyzeTrend, analyzeTrendSchema,
} from './tools/analyze.js';

// Comparison tools
import {
  compareLedamoter, compareLedamoterSchema,
  comparePartiRostning, comparePartiRostningSchema,
  compareRiksdagRegering, compareRiksdagRegeringSchema,
  comparePartier, comparePartierSchema,
} from './tools/compare.js';

// Fetch tools
import {
  getDokument, getDokumentSchema,
  getLedamot, getLedamotSchema,
  getMotioner, getMotionerSchema,
  getPropositioner, getPropositionerSchema,
  getBetankanden, getBetankandenSchema,
  getFragor, getFragorSchema,
  getInterpellationer, getInterpellationerSchema,
  getUtskott, getUtskottSchema,
} from './tools/fetch.js';

// Aggregate tools
import {
  getDataSummary, getDataSummarySchema,
  analyzePartiActivity, analyzePartiActivitySchema,
  analyzeRiksmote, analyzeRiksmoteSchema,
  getTopLists, getTopListsSchema,
  globalSearch, globalSearchSchema,
} from './tools/aggregate.js';

/**
 * Skapa och konfigurera MCP servern
 */
function createServer() {
  const server = new Server(
    {
      name: 'riksdag-regering-mcp',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  /**
   * Lista alla tillgängliga verktyg
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // ========== SÖKVERKTYG ==========
        {
          name: 'search_ledamoter',
          description: 'Sök efter ledamöter i Riksdagen baserat på namn, parti, valkrets eller status',
          inputSchema: searchLedamoterSchema,
        },
        {
          name: 'search_dokument',
          description: 'Sök efter dokument från Riksdagen (motioner, propositioner, betänkanden, etc.)',
          inputSchema: searchDokumentSchema,
        },
        {
          name: 'search_anforanden',
          description: 'Sök efter anföranden i Riksdagen baserat på talare, parti, debattnamn eller text',
          inputSchema: searchAnforandenSchema,
        },
        {
          name: 'search_voteringar',
          description: 'Sök efter voteringar i Riksdagen',
          inputSchema: searchVoteringarSchema,
        },
        {
          name: 'search_regering',
          description: 'Sök i Regeringskansliets dokument (pressmeddelanden, propositioner, SOU, etc.)',
          inputSchema: searchRegeringSchema,
        },

        // ========== ANALYSVERKTYG ==========
        {
          name: 'analyze_partifordelning',
          description: 'Analysera fördelningen av ledamöter per parti',
          inputSchema: analyzePartifordelningSchema,
        },
        {
          name: 'analyze_votering',
          description: 'Analysera röstningsstatistik för en specifik votering',
          inputSchema: analyzeVoteringSchema,
        },
        {
          name: 'analyze_ledamot',
          description: 'Analysera en ledamots aktivitet (anföranden och röstningar)',
          inputSchema: analyzeLedamotSchema,
        },
        {
          name: 'analyze_dokument_statistik',
          description: 'Analysera statistik över dokument från Riksdagen',
          inputSchema: analyzeDokumentStatistikSchema,
        },
        {
          name: 'analyze_trend',
          description: 'Analysera trender över tid för dokument, anföranden eller voteringar',
          inputSchema: analyzeTrendSchema,
        },

        // ========== JÄMFÖRELSEVERKTYG ==========
        {
          name: 'compare_ledamoter',
          description: 'Jämför två ledamöters aktivitet och röstningsstatistik',
          inputSchema: compareLedamoterSchema,
        },
        {
          name: 'compare_parti_rostning',
          description: 'Jämför partiernas röstbeteende mellan två voteringar',
          inputSchema: comparePartiRostningSchema,
        },
        {
          name: 'compare_riksdag_regering',
          description: 'Jämför dokument från Riksdagen och Regeringen om samma ämne',
          inputSchema: compareRiksdagRegeringSchema,
        },
        {
          name: 'compare_partier',
          description: 'Jämför aktivitet och statistik mellan två partier',
          inputSchema: comparePartierSchema,
        },

        // ========== HÄMTNINGSVERKTYG ==========
        {
          name: 'get_dokument',
          description: 'Hämta ett specifikt dokument med alla detaljer',
          inputSchema: getDokumentSchema,
        },
        {
          name: 'get_ledamot',
          description: 'Hämta fullständig information om en ledamot inkl. uppdrag',
          inputSchema: getLedamotSchema,
        },
        {
          name: 'get_motioner',
          description: 'Hämta motioner från Riksdagen',
          inputSchema: getMotionerSchema,
        },
        {
          name: 'get_propositioner',
          description: 'Hämta propositioner från Riksdagen',
          inputSchema: getPropositionerSchema,
        },
        {
          name: 'get_betankanden',
          description: 'Hämta betänkanden från utskotten',
          inputSchema: getBetankandenSchema,
        },
        {
          name: 'get_fragor',
          description: 'Hämta frågor (muntliga och skriftliga) från Riksdagen',
          inputSchema: getFragorSchema,
        },
        {
          name: 'get_interpellationer',
          description: 'Hämta interpellationer från Riksdagen',
          inputSchema: getInterpellationerSchema,
        },
        {
          name: 'get_utskott',
          description: 'Hämta lista över alla utskott',
          inputSchema: getUtskottSchema,
        },

        // ========== AGGREGERINGSVERKTYG ==========
        {
          name: 'get_data_summary',
          description: 'Hämta sammanställning av all data i systemet',
          inputSchema: getDataSummarySchema,
        },
        {
          name: 'analyze_parti_activity',
          description: 'Detaljerad analys av ett partis aktivitet över tid',
          inputSchema: analyzePartiActivitySchema,
        },
        {
          name: 'analyze_riksmote',
          description: 'Analysera ett specifikt riksmöte (dokument, voteringar, anföranden)',
          inputSchema: analyzeRiksmoteSchema,
        },
        {
          name: 'get_top_lists',
          description: 'Få toplistor för talare, partier, utskott eller dokumenttyper',
          inputSchema: getTopListsSchema,
        },
        {
          name: 'global_search',
          description: 'Sök över alla tabeller (dokument, anföranden, ledamöter, pressmeddelanden)',
          inputSchema: globalSearchSchema,
        },
      ],
    };
  });

  /**
   * Hantera verktygsanrop
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      // Search tools
      switch (name) {
        case 'search_ledamoter':
          result = await searchLedamoter(args as any);
          break;
        case 'search_dokument':
          result = await searchDokument(args as any);
          break;
        case 'search_anforanden':
          result = await searchAnforanden(args as any);
          break;
        case 'search_voteringar':
          result = await searchVoteringar(args as any);
          break;
        case 'search_regering':
          result = await searchRegering(args as any);
          break;

        // Analysis tools
        case 'analyze_partifordelning':
          result = await analyzePartifordelning(args as any);
          break;
        case 'analyze_votering':
          result = await analyzeVotering(args as any);
          break;
        case 'analyze_ledamot':
          result = await analyzeLedamot(args as any);
          break;
        case 'analyze_dokument_statistik':
          result = await analyzeDokumentStatistik(args as any);
          break;
        case 'analyze_trend':
          result = await analyzeTrend(args as any);
          break;

        // Comparison tools
        case 'compare_ledamoter':
          result = await compareLedamoter(args as any);
          break;
        case 'compare_parti_rostning':
          result = await comparePartiRostning(args as any);
          break;
        case 'compare_riksdag_regering':
          result = await compareRiksdagRegering(args as any);
          break;
        case 'compare_partier':
          result = await comparePartier(args as any);
          break;

        // Fetch tools
        case 'get_dokument':
          result = await getDokument(args as any);
          break;
        case 'get_ledamot':
          result = await getLedamot(args as any);
          break;
        case 'get_motioner':
          result = await getMotioner(args as any);
          break;
        case 'get_propositioner':
          result = await getPropositioner(args as any);
          break;
        case 'get_betankanden':
          result = await getBetankanden(args as any);
          break;
        case 'get_fragor':
          result = await getFragor(args as any);
          break;
        case 'get_interpellationer':
          result = await getInterpellationer(args as any);
          break;
        case 'get_utskott':
          result = await getUtskott(args as any);
          break;

        // Aggregate tools
        case 'get_data_summary':
          result = await getDataSummary(args as any);
          break;
        case 'analyze_parti_activity':
          result = await analyzePartiActivity(args as any);
          break;
        case 'analyze_riksmote':
          result = await analyzeRiksmote(args as any);
          break;
        case 'get_top_lists':
          result = await getTopLists(args as any);
          break;
        case 'global_search':
          result = await globalSearch(args as any);
          break;

        default:
          throw new Error(`Okänt verktyg: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error in tool ${name}:`, errorMessage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: errorMessage,
                tool: name,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  /**
   * Lista alla tillgängliga resurser
   */
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await listResources();
    return { resources };
  });

  /**
   * Läs en specifik resurs
   */
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      const resource = await getResource(uri);
      return {
        contents: [resource],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Fel vid läsning av resurs ${uri}: ${errorMessage}`);
    }
  });

  return server;
}

/**
 * Starta servern
 */
async function main() {
  try {
    // Initialisera Supabase
    initSupabase();

    // Skapa och starta servern
    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    console.error('Riksdag-Regering MCP Server v2.0 startad');
    console.error('Använder ENDAST data från Riksdagen och Regeringskansliet');
  } catch (error) {
    console.error('Fel vid start av server:', error);
    process.exit(1);
  }
}

main();
