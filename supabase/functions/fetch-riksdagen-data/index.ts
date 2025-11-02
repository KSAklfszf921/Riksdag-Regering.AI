import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'
import { XMLParser } from 'npm:fast-xml-parser@4.3.2'
import {
  ExtendedLedamotData,
  ExtendedDokumentData,
  ExtendedAnforandeData,
  ExtendedVoteringData,
  APIFilterParams,
  buildFilteredAPIUrl
} from './extended-types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sanitize file paths to remove invalid characters for Supabase Storage
function sanitizeStoragePath(path: string): string {
  // Remove or replace invalid characters: : " * ? < > | and leading/trailing spaces
  return path
    .replace(/:/g, '-')  // Replace colons with hyphens
    .replace(/["\*\?<>\|]/g, '_')  // Replace other invalid chars with underscores
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/\/+/g, '/')  // Collapse multiple slashes
    .replace(/^\/|\/$/g, '');  // Remove leading/trailing slashes
}

// Nu använder vi de utökade typerna från extended-types.ts
// ExtendedLedamotData, ExtendedDokumentData, ExtendedAnforandeData, ExtendedVoteringData

// Lägg till fil i nedladdningskö istället för att ladda ner direkt
async function enqueueFileDownload(
  supabaseClient: any,
  fileUrl: string,
  bucket: string,
  path: string,
  tableName: string,
  recordId: string,
  columnName: string
) {
  try {
    await supabaseClient
      .from('file_download_queue')
      .insert({
        file_url: fileUrl,
        bucket,
        storage_path: sanitizeStoragePath(path),  // Sanitize path before storing
        table_name: tableName,
        record_id: recordId,
        column_name: columnName,
        status: 'pending'
      });
    console.log(`Fil tillagd i kö: ${sanitizeStoragePath(path)}`);
  } catch (err) {
    console.error('Fel vid tillägg i filkö:', err);
  }
}

// Kontrollera om hämtning ska stoppas
async function shouldStop(supabaseClient: any, dataType: string): Promise<boolean> {
  const { data } = await supabaseClient
    .from('data_fetch_control')
    .select('should_stop')
    .eq('source', 'riksdagen')
    .eq('data_type', dataType)
    .maybeSingle();
  
  return data?.should_stop === true;
}

// Uppdatera progress
async function updateProgress(
  supabaseClient: any,
  dataType: string,
  updates: any
) {
  await supabaseClient
    .from('data_fetch_progress')
    .upsert({
      source: 'riksdagen',
      data_type: dataType,
      ...updates,
      last_fetched_at: new Date().toISOString()
    }, { onConflict: 'source,data_type' });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError?.message, 'User:', user?.id);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id, user.email);

    // Check if user has admin role (using service role to bypass RLS)
    const { data: adminRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('Admin check result:', { adminRole, roleError, userId: user.id });

    if (roleError || !adminRole) {
      console.error('Admin check failed:', roleError?.message, 'Role found:', adminRole);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const requestBody = await req.json();
    if (!requestBody || typeof requestBody.dataType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: dataType required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawDataType = requestBody.dataType.trim();
    if (rawDataType.length === 0 || rawDataType.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid dataType length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalisera dataType - konvertera understreck till bindestreck för konsistens
    const dataType = rawDataType.replace(/_/g, "-");

    const paginate = requestBody.paginate ?? true;
    const maxPages = requestBody.maxPages ?? null;
    
    // Filtreringsparametrar från Riksdagens API - använd utökade parametrar nu
    const filters: APIFilterParams = {
      rm: requestBody.rm || '',              // Riksmöte (t.ex. "2024/25")
      parti: requestBody.parti || '',         // Parti (t.ex. "S", "M", "SD")
      iid: requestBody.iid || '',             // Intressent ID (ledamots-ID)
      from: requestBody.from || '',           // Från datum
      tom: requestBody.tom || '',             // Till datum
      ts: requestBody.ts || '',               // Tidsperiod
      doktyp: requestBody.doktyp || '',       // Dokumenttyp
      sz: requestBody.sz || '500',            // Antal resultat per sida (default 500, max för Riksdagens API)
      // Nya utökade parametrar från extended-types.ts
      organ: requestBody.organ || '',         // T.ex. 'KU', 'FiU'
      bet: requestBody.bet || '',             // Beteckning
      debattnamn: requestBody.debattnamn || '', // För anföranden
      talare: requestBody.talare || '',       // För anföranden
      utskottet: requestBody.utskottet || '', // Utskott
      kat: requestBody.kat || '',             // Kategori
      kommittemotion: requestBody.kommittemotion || '',
      mottagare: requestBody.mottagare || '', // Departement
      aktivitet: requestBody.aktivitet || '', // Aktivitet
      datum: requestBody.datum || '',         // Specifikt datum
      searchterm: requestBody.searchterm || '', // Fritext-sökning
      sort: requestBody.sort || '',           // Sortering
      sortorder: requestBody.sortorder || '', // asc/desc
    };

    console.log(`Hämtar ${dataType} data från Riksdagens API (paginering: ${paginate}, original: ${rawDataType})...`);
    console.log(`Filtreringsparametrar:`, filters);

    let apiUrl = '';
    let tableName = '';

    if (dataType === 'dokument') {
      // Använd buildFilteredAPIUrl från extended-types.ts
      apiUrl = buildFilteredAPIUrl('https://data.riksdagen.se/dokumentlista/', filters, 'json');
      tableName = 'riksdagen_dokument';
    } else if (dataType === 'ledamoter') {
      // Ledamöter har sitt eget format
      apiUrl = 'https://data.riksdagen.se/personlista/?utformat=json&rdlstatus=samtliga';
      // Lägg till parti-filter om det finns
      if (filters.parti) {
        apiUrl += `&parti=${filters.parti}`;
      }
      tableName = 'riksdagen_ledamoter';
    } else if (dataType === 'anforanden') {
      // Anföranden använder XML-format
      apiUrl = buildFilteredAPIUrl('https://data.riksdagen.se/anforandelista/', filters, 'xml');
      tableName = 'riksdagen_anforanden';
    } else if (dataType === 'voteringar') {
      apiUrl = buildFilteredAPIUrl('https://data.riksdagen.se/voteringlista/', filters, 'json');
      tableName = 'riksdagen_voteringar';
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Okänd datatyp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`API URL: ${apiUrl}`);

    let totalInserted = 0;
    let totalErrors = 0;
    let currentPage = 1;
    let nextPageUrl: string | null = apiUrl;
    let totalPages = 0;
    let totalItems = 0;
    
    // Limit pages per execution to prevent resource exhaustion
    const MAX_PAGES_PER_EXECUTION = 20;  // Process max 20 pages (10,000 items with sz=500) per execution
    let pagesProcessedThisExecution = 0;

    // Helper function to fetch with retries
    const fetchWithRetry = async (url: string, maxRetries = 3): Promise<Response> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Försök ${attempt}/${maxRetries} för ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SvensktPolitikArkiv/1.0)',
              'Accept': 'application/json, text/xml, */*',
              'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
            },
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          const isLastAttempt = attempt === maxRetries;
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          console.error(`Försök ${attempt} misslyckades:`, errorMessage);
          
          if (isLastAttempt) {
            throw new Error(`Kunde inte hämta data efter ${maxRetries} försök: ${errorMessage}`);
          }
          
          console.log(`Väntar ${waitTime}ms innan nästa försök...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      throw new Error('Unexpected error in fetchWithRetry');
    };

    // Hämta sidor med begränsning för att undvika resursutmattning
    while (nextPageUrl && (maxPages === null || currentPage <= maxPages) && pagesProcessedThisExecution < MAX_PAGES_PER_EXECUTION) {
      // Kontrollera stoppsignal
      if (await shouldStop(supabaseClient, dataType)) {
        console.log('Stoppsignal mottagen, avbryter hämtning');
        await updateProgress(supabaseClient, dataType, {
          status: 'stopped',
          error_message: 'Manuellt stoppad av användare'
        });
        break;
      }
      
      console.log(`Hämtar sida ${currentPage}... (${pagesProcessedThisExecution + 1}/${MAX_PAGES_PER_EXECUTION} i denna körning)`);
      
      // Add delay between requests to avoid rate limiting (except first page)
      if (currentPage > 1) {
        const delay = 1000; // 1 second between requests
        console.log(`Väntar ${delay}ms mellan förfrågningar...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response: Response = await fetchWithRetry(nextPageUrl);

      // Anföranden - parse XML with fast-xml-parser
      let data: any;
      if (dataType === 'anforanden') {
        const xmlText = await response.text();
        console.log('Anföranden-data mottagen (XML format)');
        console.log(`Raw XML preview (first 500 chars): ${xmlText.substring(0, 500)}`);
        
        try {
          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@'
          });
          
          const parsed = parser.parse(xmlText);
          console.log('XML parsed successfully');
          
          // Extract anföranden list
          let anforanden = [];
          if (parsed.anforandelista?.anforande) {
            anforanden = Array.isArray(parsed.anforandelista.anforande)
              ? parsed.anforandelista.anforande
              : [parsed.anforandelista.anforande];
          }
          
          console.log(`Found ${anforanden.length} anföranden in XML`);
          
          // Convert to expected structure
          data = {
            anforandelista: {
              '@sidor': parsed.anforandelista?.['@sidor'] || '0',
              '@traffar': parsed.anforandelista?.['@traffar'] || '0',
              '@nasta_sida': parsed.anforandelista?.['@nasta_sida'] || null,
              anforande: anforanden
            }
          };
          
          console.log(`Metadata - Sidor: ${data.anforandelista['@sidor']}, Träffar: ${data.anforandelista['@traffar']}`);
        } catch (err) {
          console.error('XML-parsing error:', err);
          console.error('Error details:', err instanceof Error ? err.message : String(err));
          data = { anforandelista: { anforande: [] } };
          nextPageUrl = null;
        }
      } else {
        data = await response.json();
      }
      
      // Sätt totalt antal sidor och poster från första sidan
      if (currentPage === 1) {
        if (dataType === 'dokument' && data.dokumentlista) {
          totalPages = parseInt(data.dokumentlista['@sidor'] || '0');
          totalItems = parseInt(data.dokumentlista['@traffar'] || '0');
          console.log(`Totalt: ${totalItems} dokument över ${totalPages} sidor`);
        } else if (dataType === 'anforanden' && data.anforandelista) {
          totalPages = parseInt(data.anforandelista['@sidor'] || '0');
          totalItems = parseInt(data.anforandelista['@traffar'] || '0');
          console.log(`Totalt: ${totalItems} anföranden över ${totalPages} sidor`);
        } else if (dataType === 'voteringar' && data.voteringlista) {
          totalPages = parseInt(data.voteringlista['@sidor'] || '0');
          totalItems = parseInt(data.voteringlista['@traffar'] || '0');
          console.log(`Totalt: ${totalItems} voteringar över ${totalPages} sidor`);
        }
        
        await updateProgress(supabaseClient, dataType, {
          current_page: currentPage,
          total_pages: totalPages,
          total_items: totalItems,
          items_fetched: 0,
          status: 'in_progress'
        });
      }

      let insertedThisPage = 0;
      let errorsThisPage = 0;

      if (dataType === 'dokument' && data.dokumentlista?.dokument) {
        const dokument = Array.isArray(data.dokumentlista.dokument) 
          ? data.dokumentlista.dokument 
          : [data.dokumentlista.dokument];

        for (const dok of dokument) {
          try {
            // Använd ExtendedDokumentData med alla nya fält
            const dokumentData: ExtendedDokumentData = {
              dok_id: dok.dok_id || dok.id,
              rm: dok.rm,
              beteckning: dok.beteckning,
              doktyp: dok.doktyp,
              typ: dok.typ,
              subtyp: dok.subtyp,
              organ: dok.organ,
              nummer: dok.nummer,
              datum: dok.datum,
              systemdatum: dok.systemdatum,
              publicerad: dok.publicerad,
              titel: dok.titel,
              subtitel: dok.subtitel,
              status: dok.status,
              dokument_url_text: dok.dokument_url_text,
              dokument_url_html: dok.dokument_url_html,
              dokument_url_xml: dok.dokument_url_xml,
              traff_url: dok.traff_url,
              summary: dok.summary,
              html: dok.html,
              klockslag: dok.klockslag,
              relateradHandling: dok.relateradHandling,
              hangar_id: dok.hangar_id,
              debattdag: dok.debattdag,
              debattgrupptitel: dok.debattgrupptitel,
              beslutad: dok.beslutad,
              beredningsdag: dok.beredningsdag,
              expeditionsdag: dok.expeditionsdag,
              motionstid: dok.motionstid,
            };

            // Lägg till PDF i nedladdningskö istället för att ladda ner direkt
            const { data: insertedDoc, error: insertError } = await supabaseClient
              .from(tableName)
              .upsert(dokumentData, { onConflict: 'dok_id' })
              .select('id')
              .single();

            if (insertedDoc && dok.dokument_url_text) {
              const pdfPath = `dokument/${dok.dok_id || dok.id}.pdf`;
              await enqueueFileDownload(
                supabaseClient,
                dok.dokument_url_text,
                'riksdagen-images',
                pdfPath,
                tableName,
                insertedDoc.id,
                'local_pdf_url'
              );
            }

            if (insertError) {
              console.error('Fel vid insättning:', insertError);
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av dokument:', err);
            errorsThisPage++;
          }
        }
        
        // Hämta nästa sida - fallback om @nasta_sida saknas men fler sidor finns
        nextPageUrl = paginate ? data.dokumentlista['@nasta_sida'] : null;
        if (!nextPageUrl && paginate && currentPage < totalPages) {
          console.log(`@nasta_sida saknas, genererar URL manuellt för sida ${currentPage + 1}`);
          const url = new URL(apiUrl);
          url.searchParams.set('p', String(currentPage + 1));
          nextPageUrl = url.toString();
        }
        
      } else if (dataType === 'ledamoter' && data.personlista?.person) {
        const personer = Array.isArray(data.personlista.person) 
          ? data.personlista.person 
          : [data.personlista.person];

        for (const person of personer) {
          try {
            // Använd ExtendedLedamotData med alla nya fält
            const ledamotData: ExtendedLedamotData = {
              intressent_id: person.intressent_id,
              fornamn: person.fornamn,
              efternamn: person.efternamn,
              tilltalsnamn: person.tilltalsnamn,
              parti: person.parti,
              valkrets: person.valkrets,
              status: person.status,
              bild_url: person.bild_url_192 || person.bild_url_80,
              iort: person.iort,
              kon: person.kon,
              fodelsear: person.fodelsear,
              webbadress: person.webbadress,
              bloggadress: person.bloggadress,
              email: person.email,
              telefonnummer: person.telefonnummer,
              facebook: person.facebook,
              twitter: person.twitter,
              instagram: person.instagram,
              riksdagsnamn: person.riksdagsnamn,
            };

            // Lägg till bild i nedladdningskö istället för att ladda ner direkt
            const { data: insertedLedamot, error: insertError } = await supabaseClient
              .from(tableName)
              .upsert(ledamotData, { onConflict: 'intressent_id' })
              .select('id')
              .single();

            if (insertedLedamot && ledamotData.bild_url) {
              const bildPath = `ledamoter/${person.intressent_id}.jpg`;
              await enqueueFileDownload(
                supabaseClient,
                ledamotData.bild_url,
                'riksdagen-images',
                bildPath,
                tableName,
                insertedLedamot.id,
                'local_bild_url'
              );
            }

            if (insertError) {
              console.error('Fel vid insättning av ledamot:', insertError);
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av ledamot:', err);
            errorsThisPage++;
          }
        }
        
        // Ledamöter har ingen paginering
        nextPageUrl = null;
        
      } else if (dataType === 'anforanden' && data.anforandelista?.anforande) {
        const anforanden = Array.isArray(data.anforandelista.anforande) 
          ? data.anforandelista.anforande 
          : [data.anforandelista.anforande];

        console.log(`Processing ${anforanden.length} anföranden from this page`);

        for (const anf of anforanden) {
          try {
            // Map XML fields correctly according to Riksdagen API structure
            const anforandeData: ExtendedAnforandeData = {
              anforande_id: anf.anforande_id,
              intressent_id: anf.intressent_id,
              dok_id: anf.dok_id,
              debattnamn: anf.debattnamn,
              debattsekund: anf.debattsekund ? parseInt(anf.debattsekund) : undefined,
              anftext: anf.anftext,
              anfdatum: anf.anfdatum,
              avsnittsrubrik: anf.avsnittsrubrik,
              parti: anf.parti,
              talare: anf.talare,
              video_url: anf.video_url,
              audio_url: anf.audio_url,
              anforande_nummer: anf.anforande_nummer,
              replik: anf.replik,
              systemtid: anf.systemtid,
              kammaraktivitet: anf.kammaraktivitet,
              protokollstatus: anf.protokollstatus,
              talartid: anf.talartid ? parseInt(anf.talartid) : undefined,
            };

            const { error } = await supabaseClient
              .from(tableName)
              .upsert(anforandeData, { onConflict: 'anforande_id' });

            if (error) {
              console.error('Fel vid insättning av anförande:', error);
              console.error('Anförande data:', anforandeData);
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av anförande:', err);
            console.error('Raw anförande object:', anf);
            errorsThisPage++;
          }
        }
        
        console.log(`Page complete: ${insertedThisPage} inserted, ${errorsThisPage} errors`);
        
        // Hämta nästa sida - fallback om @nasta_sida saknas men fler sidor finns
        nextPageUrl = paginate ? data.anforandelista['@nasta_sida'] : null;
        if (!nextPageUrl && paginate && currentPage < totalPages) {
          console.log(`@nasta_sida saknas, genererar URL manuellt för sida ${currentPage + 1}`);
          const url = new URL(apiUrl);
          url.searchParams.set('p', String(currentPage + 1));
          nextPageUrl = url.toString();
        }
        
      } else if (dataType === 'voteringar' && data.voteringlista?.votering) {
        const voteringar = Array.isArray(data.voteringlista.votering) 
          ? data.voteringlista.votering 
          : [data.voteringlista.votering];

        for (const vot of voteringar) {
          try {
            const voteringData: ExtendedVoteringData = {
              votering_id: vot.votering_id,
              rm: vot.rm,
              beteckning: vot.beteckning,
              punkt: vot.punkt ? parseInt(vot.punkt) : undefined,
              titel: vot.titel,
              votering_datum: vot.datum,
              voteringstyp: vot.voteringstyp,
              voteringlista: vot.voteringlista,
              gruppering: vot.gruppering,
              dokument_url: vot.dokument_url,
              antal_ja: vot.antal_ja ? parseInt(vot.antal_ja) : undefined,
              antal_nej: vot.antal_nej ? parseInt(vot.antal_nej) : undefined,
              antal_frånvarande: vot.antal_frånvarande ? parseInt(vot.antal_frånvarande) : undefined,
              antal_avstående: vot.antal_avstående ? parseInt(vot.antal_avstående) : undefined,
            };

            const { error } = await supabaseClient
              .from(tableName)
              .upsert(voteringData, { onConflict: 'votering_id' });

            if (error) {
              console.error('Fel vid insättning av votering:', error);
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av votering:', err);
            errorsThisPage++;
          }
        }
        
        // Hämta nästa sida - fallback om @nasta_sida saknas men fler sidor finns
        nextPageUrl = paginate ? data.voteringlista['@nasta_sida'] : null;
        if (!nextPageUrl && paginate && currentPage < totalPages) {
          console.log(`@nasta_sida saknas, genererar URL manuellt för sida ${currentPage + 1}`);
          const url = new URL(apiUrl);
          url.searchParams.set('p', String(currentPage + 1));
          nextPageUrl = url.toString();
        }
      }

      totalInserted += insertedThisPage;
      totalErrors += errorsThisPage;

      console.log(`Sida ${currentPage} klar: ${insertedThisPage} infogade, ${errorsThisPage} fel`);
      
      // Uppdatera progress med next_page_url och pages_processed
      await updateProgress(supabaseClient, dataType, {
        current_page: currentPage,
        items_fetched: totalInserted,
        pages_processed: pagesProcessedThisExecution,
        next_page_url: nextPageUrl,
        status: nextPageUrl ? 'in_progress' : 'completed'
      });

      currentPage++;
      pagesProcessedThisExecution++;  // Increment batch counter

      // Logga var 10:e sida
      if (currentPage % 10 === 0) {
        console.log(`Progress: ${currentPage}/${totalPages} sidor, ${totalInserted}/${totalItems} poster`);
      }

      // Pausa lite mellan requests för att inte överbelasta API:et
      if (nextPageUrl) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Check if we hit the batch limit and more pages remain
    const hasMorePages = nextPageUrl !== null && pagesProcessedThisExecution >= MAX_PAGES_PER_EXECUTION;
    const finalStatus = hasMorePages ? 'partial' : 'completed';
    
    console.log(`Paginering slutförd: nextPageUrl=${nextPageUrl ? 'finns' : 'null'}, pagesProcessed=${pagesProcessedThisExecution}/${MAX_PAGES_PER_EXECUTION}`);
    
    // Update final progress with next_page_url for resumption
    await updateProgress(supabaseClient, dataType, {
      current_page: currentPage - 1,
      items_fetched: totalInserted,
      pages_processed: pagesProcessedThisExecution,
      next_page_url: hasMorePages ? nextPageUrl : null,
      status: finalStatus
    });

    // Logga API-anropet
    await supabaseClient.from('riksdagen_api_log').insert({
      endpoint: dataType,
      status: hasMorePages ? 'partial' : 'success',
      antal_poster: totalInserted,
      felmeddelande: totalErrors > 0 ? `${totalErrors} fel uppstod` : null,
    });

    const completionMessage = hasMorePages 
      ? `Bearbetade ${pagesProcessedThisExecution} sidor i denna batch. Fler sidor kvarstår. Anropa funktionen igen för att fortsätta.`
      : `Hämtade och sparade ${totalInserted} ${dataType} över ${currentPage - 1} sidor`;
    
    console.log(`Batch slutfört! Infogade ${totalInserted} poster över ${pagesProcessedThisExecution} sidor, ${totalErrors} fel. Status: ${finalStatus}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: totalInserted,
        errors: totalErrors,
        pages: pagesProcessedThisExecution,
        complete: !hasMorePages,
        message: completionMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error for debugging
    console.error('Edge function error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    const requestId = crypto.randomUUID();
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An error occurred processing your request',
        requestId: requestId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
