/**
 * Shared MCP Server Configuration
 *
 * Denna modul innehåller den gemensamma logiken för både STDIO och HTTP servrar.
 * Detta eliminerar duplicering mellan index.ts och server.ts.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { listResources, getResource } from '../resources/index.js';

// Search tools
import {
  searchLedamoter, searchLedamoterSchema,
  searchDokument, searchDokumentSchema,
  searchDokumentFulltext, searchDokumentFulltextSchema,
  searchAnforanden, searchAnforandenSchema,
  searchVoteringar, searchVoteringarSchema,
  searchRegering, searchRegeringSchema,
} from '../tools/search.js';

// Analysis tools
import {
  analyzePartifordelning, analyzePartifordelningSchema,
  analyzeVotering, analyzeVoteringSchema,
  analyzeLedamot, analyzeLedamotSchema,
  analyzeDokumentStatistik, analyzeDokumentStatistikSchema,
  analyzeTrend, analyzeTrendSchema,
} from '../tools/analyze.js';

// Comparison tools
import {
  compareLedamoter, compareLedamoterSchema,
  comparePartiRostning, comparePartiRostningSchema,
  compareRiksdagRegering, compareRiksdagRegeringSchema,
  comparePartier, comparePartierSchema,
} from '../tools/compare.js';

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
} from '../tools/fetch.js';

// Aggregate tools
import {
  getDataSummary, getDataSummarySchema,
  analyzePartiActivity, analyzePartiActivitySchema,
  analyzeRiksmote, analyzeRiksmoteSchema,
  getTopLists, getTopListsSchema,
  globalSearch, globalSearchSchema,
} from '../tools/aggregate.js';
import {
  getPressmeddelande, getPressmeddelandeSchema,
  getDokumentInnehall, getDokumentInnehallSchema,
} from '../tools/content.js';
import {
  getVoteringRosterSummary,
  getVoteringRosterSummarySchema,
  summarizePressmeddelande,
  summarizePressmeddelandeSchema,
  getSyncStatus,
  getSyncStatusSchema,
  getDataDictionary,
  getDataDictionarySchema,
} from '../tools/insights.js';
import { logToolCall } from '../utils/telemetry.js';

/**
 * Tool definitions - samma för alla transporter
 */
const TOOL_DEFINITIONS = [
  // SÖKVERKTYG
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
    name: 'search_dokument_fulltext',
    description: 'Fulltextsök i Riksdagens dokument och få utdrag/snippets från cachelagrat innehåll',
    inputSchema: searchDokumentFulltextSchema,
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

  // ANALYSVERKTYG
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

  // JÄMFÖRELSEVERKTYG
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

  // HÄMTNINGSVERKTYG
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

  // AGGREGERINGSVERKTYG
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
  {
    name: 'get_pressmeddelande',
    description: 'Returnera pressmeddelande med fulltext och sammanfattning',
    inputSchema: getPressmeddelandeSchema,
  },
  {
    name: 'get_dokument_innehall',
    description: 'Returnera riksdagens dokument med fulltext (cacha lokalt)',
    inputSchema: getDokumentInnehallSchema,
  },

  // INSIGHTS
  {
    name: 'get_votering_roster_summary',
    description: 'Summerar röster per parti för en given votering',
    inputSchema: getVoteringRosterSummarySchema,
  },
  {
    name: 'summarize_pressmeddelande',
    description: 'Generera en kort sammanfattning av ett pressmeddelande',
    inputSchema: summarizePressmeddelandeSchema,
  },
  {
    name: 'get_sync_status',
    description: 'Visa senaste status för Riksdagens/Regeringens datapipelines',
    inputSchema: getSyncStatusSchema,
  },
  {
    name: 'get_data_dictionary',
    description: 'Returnerar definitioner och anvisningar för MCP-serverns dataset',
    inputSchema: getDataDictionarySchema,
  },
];

/**
 * Tool handler - kopplar verktygsnamn till funktioner
 */
async function handleToolCall(name: string, args: any, logger?: { sendLog?: (text: string) => Promise<void> }) {
  const sendLog = logger?.sendLog;
  switch (name) {
    // Search tools
    case 'search_ledamoter':
      return await searchLedamoter(args);
    case 'search_dokument':
      await sendLog?.('🔎 Hämtar dokument…');
      return await searchDokument(args, sendLog);
    case 'search_dokument_fulltext':
      return await searchDokumentFulltext(args);
    case 'search_anforanden':
      return await searchAnforanden(args);
    case 'search_voteringar':
      return await searchVoteringar(args);
    case 'search_regering':
      return await searchRegering(args);

    // Analysis tools
    case 'analyze_partifordelning':
      return await analyzePartifordelning(args);
    case 'analyze_votering':
      return await analyzeVotering(args);
    case 'analyze_ledamot':
      return await analyzeLedamot(args);
    case 'analyze_dokument_statistik':
      return await analyzeDokumentStatistik(args);
    case 'analyze_trend':
      return await analyzeTrend(args);

    // Comparison tools
    case 'compare_ledamoter':
      return await compareLedamoter(args);
    case 'compare_parti_rostning':
      return await comparePartiRostning(args);
    case 'compare_riksdag_regering':
      return await compareRiksdagRegering(args);
    case 'compare_partier':
      return await comparePartier(args);

    // Fetch tools
    case 'get_dokument':
      return await getDokument(args);
    case 'get_ledamot':
      return await getLedamot(args);
    case 'get_motioner':
      return await getMotioner(args);
    case 'get_propositioner':
      return await getPropositioner(args);
    case 'get_betankanden':
      return await getBetankanden(args);
    case 'get_fragor':
      return await getFragor(args);
    case 'get_interpellationer':
      return await getInterpellationer(args);
    case 'get_utskott':
      return await getUtskott(args);

    // Aggregate tools
    case 'get_data_summary':
      return await getDataSummary(args);
    case 'analyze_parti_activity':
      return await analyzePartiActivity(args);
    case 'analyze_riksmote':
      return await analyzeRiksmote(args);
    case 'get_top_lists':
      return await getTopLists(args);
    case 'global_search':
      return await globalSearch(args);
    case 'get_pressmeddelande':
      return await getPressmeddelande(args);
    case 'get_dokument_innehall':
      return await getDokumentInnehall(args, sendLog);

    // Insights
    case 'get_votering_roster_summary':
      return await getVoteringRosterSummary(args);
    case 'summarize_pressmeddelande':
      return await summarizePressmeddelande(args);
    case 'get_sync_status':
      return await getSyncStatus();
    case 'get_data_dictionary':
      return await getDataDictionary(args);

    default:
      throw new Error(`Okänt verktyg: ${name}`);
  }
}

/**
 * Skapa och konfigurera MCP servern med alla handlers
 */
export function createMCPServer(logger?: { error: (msg: string, ...args: any[]) => void }) {
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

  // Lista alla tillgängliga verktyg
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Konvertera Zod-scheman till JSON Schema
    const toolsWithJsonSchema = TOOL_DEFINITIONS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema, {
        target: 'jsonSchema7',
        $refStrategy: 'none'
      })
    }));

    return { tools: toolsWithJsonSchema };
  });

  // Hantera verktygsanrop
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const start = Date.now();
    try {
      const logMessages: string[] = [];
      const result = await handleToolCall(name, args as any, {
        sendLog: async (text: string) => {
          logMessages.push(text);
        },
      });

      logToolCall({
        tool_name: name,
        status: 'success',
        duration_ms: Date.now() - start,
        args: args as Record<string, unknown>,
      }).catch(() => {});

      (result as any).meta = {
        ...(result as any).meta,
        duration_ms: Date.now() - start,
      };

      const contentBlocks: { type: 'text'; text: string }[] = [];
      if (logMessages.length > 0) {
        for (const message of logMessages) {
          contentBlocks.push({ type: 'text', text: message });
        }
      }

      if ((result as any)?.chunks) {
        const chunks = (result as any).chunks;
        delete (result as any).chunks;
        contentBlocks.push(...chunks);
      }

      contentBlocks.push({
        type: 'text',
        text: JSON.stringify(result, null, 2),
      });

      return {
        content: contentBlocks,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logToolCall({
        tool_name: name,
        status: 'error',
        duration_ms: Date.now() - start,
        error_message: errorMessage,
        args: args as Record<string, unknown>,
      }).catch(() => {});

      // Använd logger om tillgänglig, annars console.error
      if (logger) {
        logger.error(`Error in tool ${name}:`, errorMessage);
      } else {
        console.error(`Error in tool ${name}:`, errorMessage);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: errorMessage,
              tool: name,
              tip: 'Kör get_data_dictionary eller docs://workflow-guide för mer kontext.',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Lista alla tillgängliga resurser
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await listResources();
    return { resources };
  });

  // Läs en specifik resurs
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
