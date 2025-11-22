import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { performance } from 'node:perf_hooks';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ZodError } from 'zod';
import { listResources, getResource } from '../resources/index.js';
import {
  validateResponseSize,
  sanitizeToolResponse,
  createSafeErrorResponse,
  ResponseTooLargeError,
} from '../utils/responseSafety.js';
import { logger } from '../utils/logger.js';
import {
  searchLedamoter,
  searchLedamoterSchema,
  searchDokument,
  searchDokumentSchema,
  searchDokumentFulltext,
  searchDokumentFulltextSchema,
  searchAnforanden,
  searchAnforandenSchema,
  searchVoteringar,
  searchVoteringarSchema,
  searchRegering,
  searchRegeringSchema,
} from '../tools/search.js';
import {
  getDokument,
  getDokumentSchema,
  getLedamot,
  getLedamotSchema,
  getMotioner,
  getMotionerSchema,
  getPropositioner,
  getPropositionerSchema,
  getBetankanden,
  getBetankandenSchema,
  getFragor,
  getFragorSchema,
  getInterpellationer,
  getInterpellationerSchema,
  getUtskott,
  getUtskottSchema,
} from '../tools/fetch.js';
import {
  getPressmeddelande,
  getPressmeddelandeSchema,
  getDokumentInnehall,
  getDokumentInnehallSchema,
  summarizePressmeddelande,
  summarizePressmeddelandeSchema,
} from '../tools/content.js';
import {
  fetchPaginatedDocuments,
  fetchPaginatedDocumentsSchema,
  fetchPaginatedAnforanden,
  fetchPaginatedAnforandenSchema,
  batchFetchDocuments,
  batchFetchDocumentsSchema,
} from '../tools/paginatedDocuments.js';
import { enhancedGovernmentSearch, enhancedSearchSchema } from '../tools/enhancedGovernmentSearch.js';
import { getCalendarEvents, getCalendarEventsSchema } from '../tools/kalender.js';
import { fetchReport, listReports, reportSchema } from '../tools/reports.js';
import { getSyncStatus, getSyncStatusSchema } from '../tools/health.js';
import { getDataDictionary, getDataDictionarySchema } from '../tools/metadata.js';
import { getVotingGroup, getVotingGroupSchema } from '../tools/votingGroup.js';
import { logToolCall } from '../utils/telemetry.js';
import {
  getG0vDocumentTypes,
  getG0vDocumentTypesSchema
} from '../tools/g0vTypes.js';
import {
  getG0vCategoryCodes,
  getG0vCategoryCodesSchema
} from '../tools/g0vCategoryCodes.js';
import {
  getG0vLatestUpdate,
  getG0vLatestUpdateSchema
} from '../tools/g0vLatestUpdate.js';
import {
  getG0vDocumentContent,
  getG0vDocumentContentSchema
} from '../tools/g0vDocumentContent.js';
import {
  analyzeG0vByDepartment,
  analyzeG0vByDepartmentSchema
} from '../tools/g0vDepartmentAnalysis.js';

const TOOL_DEFINITIONS = [
  { name: 'search_ledamoter', description: 'Sök efter ledamöter i Riksdagen', inputSchema: searchLedamoterSchema },
  { name: 'search_dokument', description: 'Sök efter riksdagsdokument', inputSchema: searchDokumentSchema },
  { name: 'search_dokument_fulltext', description: 'Fulltextsök i dokument', inputSchema: searchDokumentFulltextSchema },
  { name: 'search_anforanden', description: 'Sök efter anföranden', inputSchema: searchAnforandenSchema },
  { name: 'search_voteringar', description: 'Sök efter voteringar och röster', inputSchema: searchVoteringarSchema },
  { name: 'search_regering', description: 'Sök i Regeringskansliets dokument via g0v.se', inputSchema: searchRegeringSchema },
  { name: 'get_g0v_document_types', description: 'Hämta en lista över tillgängliga dokumenttyper från Regeringskansliet (via g0v.se)', inputSchema: getG0vDocumentTypesSchema },
  { name: 'get_g0v_category_codes', description: 'Hämta en lista över kategorikoder från Regeringskansliet (via g0v.se)', inputSchema: getG0vCategoryCodesSchema },
  { name: 'get_g0v_latest_update', description: 'Hämta information om senaste uppdateringen från Regeringskansliet (via g0v.se)', inputSchema: getG0vLatestUpdateSchema },
  { name: 'get_g0v_document_content', description: 'Hämta innehållet i ett specifikt dokument från Regeringskansliet (via g0v.se) i Markdown-format', inputSchema: getG0vDocumentContentSchema },
  { name: 'analyze_g0v_by_department', description: 'Analysera dokument från Regeringskansliet (via g0v.se) per departement', inputSchema: analyzeG0vByDepartmentSchema },
  // REMOVED: get_all_g0v_documents - unsafe function that could fetch 10,000+ documents
  { name: 'get_dokument', description: 'Hämta detaljer om ett specifikt riksdagsdokument', inputSchema: getDokumentSchema },
  { name: 'get_ledamot', description: 'Hämta detaljer om en ledamot', inputSchema: getLedamotSchema },
  { name: 'get_motioner', description: 'Senaste motionerna', inputSchema: getMotionerSchema },
  { name: 'get_propositioner', description: 'Senaste propositionerna', inputSchema: getPropositionerSchema },
  { name: 'get_betankanden', description: 'Senaste betänkandena', inputSchema: getBetankandenSchema },
  { name: 'get_fragor', description: 'Skriftliga frågor', inputSchema: getFragorSchema },
  { name: 'get_interpellationer', description: 'Interpellationer', inputSchema: getInterpellationerSchema },
  { name: 'get_utskott', description: 'Lista kända utskott', inputSchema: getUtskottSchema },
  { name: 'get_pressmeddelande', description: 'Hämta pressmeddelande via g0v.se', inputSchema: getPressmeddelandeSchema },
  { name: 'summarize_pressmeddelande', description: 'Enkel sammanfattning av pressmeddelande', inputSchema: summarizePressmeddelandeSchema },
  { name: 'get_dokument_innehall', description: 'Hämta dokumentinnehåll och sammanfattning', inputSchema: getDokumentInnehallSchema },
  { name: 'fetch_paginated_documents', description: 'Paginerad hämtning av dokument', inputSchema: fetchPaginatedDocumentsSchema },
  { name: 'fetch_paginated_anforanden', description: 'Paginerad hämtning av anföranden', inputSchema: fetchPaginatedAnforandenSchema },
  { name: 'batch_fetch_documents', description: 'Batch-hämta dokument för flera riksmöten', inputSchema: batchFetchDocumentsSchema },
  { name: 'get_calendar_events', description: 'Hämta kalenderhändelser', inputSchema: getCalendarEventsSchema },
  { name: 'get_voting_group', description: 'Hämta voteringar grupperade per parti/valkrets', inputSchema: getVotingGroupSchema },
  { name: 'list_reports', description: 'Lista tillgängliga rapporter', inputSchema: z.object({}) },
  { name: 'fetch_report', description: 'Hämta en rapport (HTML/JSON)', inputSchema: reportSchema },
  { name: 'enhanced_government_search', description: 'Kombinerad sökning i Riksdagen och Regeringen', inputSchema: enhancedSearchSchema },
  { name: 'get_sync_status', description: 'Visa enklare status för datakällor', inputSchema: getSyncStatusSchema },
  { name: 'get_data_dictionary', description: 'Visa dataset och fältbeskrivningar', inputSchema: getDataDictionarySchema },
];

export function createMCPServer(externalLogger?: any) {
  const server = new Server(
    {
      name: 'riksdag-regering-mcp',
      version: '2.2.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        logging: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const start = performance.now();
    const toolName = request.params.name;
    const def = TOOL_DEFINITIONS.find((tool) => tool.name === toolName);

    if (!def) {
      const error = createSafeErrorResponse(
        new Error(`Unknown tool: ${toolName}`),
        toolName,
        { availableTools: TOOL_DEFINITIONS.map((t) => t.name) }
      );
      throw error;
    }

    try {
      // Parse and validate arguments
      const args = def.inputSchema.parse(request.params.arguments || {}) as any;

      logger.info(`Executing tool: ${toolName}`, { args });

      let result: unknown;
      switch (def.name) {
        case 'search_ledamoter':
          result = await searchLedamoter(args);
          break;
        case 'search_dokument':
          result = await searchDokument(args);
          break;
        case 'search_dokument_fulltext':
          result = await searchDokumentFulltext(args);
          break;
        case 'search_anforanden':
          result = await searchAnforanden(args);
          break;
        case 'search_regering':
          result = await searchRegering(args);
          break;
        case 'get_g0v_document_types':
          result = await getG0vDocumentTypes();
          break;
        case 'get_g0v_category_codes':
          result = await getG0vCategoryCodes();
          break;
        case 'get_g0v_latest_update':
          result = await getG0vLatestUpdate();
          break;
        case 'get_g0v_document_content':
          result = await getG0vDocumentContent(args);
          break;
        case 'analyze_g0v_by_department':
          result = await analyzeG0vByDepartment(args);
          break;
        // REMOVED: get_all_g0v_documents case - unsafe function removed in v2.2.0
        case 'search_voteringar':
          result = await searchVoteringar(args);
          break;
        case 'get_dokument':
          result = await getDokument(args);
          break;
        case 'get_ledamot':
          result = await getLedamot(args);
          break;
        case 'get_motioner':
          result = await getMotioner(args);
          break;
        case 'get_propositioner':
          result = await getPropositioner(args);
          break;
        case 'get_betankanden':
          result = await getBetankanden(args);
          break;
        case 'get_fragor':
          result = await getFragor(args);
          break;
        case 'get_interpellationer':
          result = await getInterpellationer(args);
          break;
        case 'get_utskott':
          result = await getUtskott();
          break;
        case 'get_pressmeddelande':
          result = await getPressmeddelande(args);
          break;
        case 'summarize_pressmeddelande':
          result = await summarizePressmeddelande(args);
          break;
        case 'get_dokument_innehall':
          result = await getDokumentInnehall(args);
          break;
        case 'fetch_paginated_documents':
          result = await fetchPaginatedDocuments(args);
          break;
        case 'fetch_paginated_anforanden':
          result = await fetchPaginatedAnforanden(args);
          break;
        case 'batch_fetch_documents':
          result = await batchFetchDocuments(args);
          break;
        case 'get_calendar_events':
          result = await getCalendarEvents(args);
          break;
        case 'get_voting_group':
          result = await getVotingGroup(args);
          break;
        case 'list_reports':
          result = listReports();
          break;
        case 'fetch_report':
          result = await fetchReport(args);
          break;
        case 'enhanced_government_search':
          result = await enhancedGovernmentSearch(args);
          break;
        case 'get_sync_status':
          result = await getSyncStatus();
          break;
        case 'get_data_dictionary':
          result = getDataDictionary(args);
          break;
        default:
          throw new Error(`Verktyget ${def.name} är inte implementerat.`);
      }

      // Sanitize and validate response before returning
      const sanitizedResult = sanitizeToolResponse(result, {
        maxItems: 500,
        truncateStrings: true,
      });

      // Log successful execution
      await logToolCall({
        tool_name: toolName,
        status: 'success',
        duration_ms: performance.now() - start,
      });

      logger.info(`Tool executed successfully: ${toolName}`, {
        duration: performance.now() - start,
      });

      // Return compact JSON to reduce token usage (with sanitized result)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(sanitizedResult),
          },
        ],
      };
    } catch (error) {
      const duration = performance.now() - start;

      // Log error
      await logToolCall({
        tool_name: toolName,
        status: 'error',
        duration_ms: duration,
        error_message: (error as Error).message,
      });

      logger.error(`Tool execution failed: ${toolName}`, {
        error: (error as Error).message,
        duration,
      });

      // Create safe error response
      if (error instanceof ZodError) {
        const safeError = createSafeErrorResponse(
          new Error(`Invalid arguments for ${toolName}`),
          toolName,
          {
            validationErrors: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          }
        );
        throw new Error(JSON.stringify(safeError));
      }

      if (error instanceof ResponseTooLargeError) {
        const safeError = createSafeErrorResponse(error, toolName, {
          actualSize: error.actualSize,
          maxSize: error.maxSize,
        });
        throw new Error(JSON.stringify(safeError));
      }

      // Generic error
      const safeError = createSafeErrorResponse(
        error as Error,
        toolName
      );
      throw new Error(JSON.stringify(safeError));
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: await listResources() }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = await getResource(request.params.uri);
    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: resource.text,
          type: resource.mimeType.includes('json') ? 'application/json' : 'text',
        },
      ],
    };
  });

  return server;
}
