/**
 * MCP Resources för att exponera data
 */

import { getSupabase } from '../utils/supabase.js';
import { DATA_DICTIONARY } from '../data/dictionary.js';
import { WORKFLOW_GUIDE } from '../data/workflow.js';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Hämta lista över alla tillgängliga resources
 */
export async function listResources() {
  return [
    {
      uri: 'riksdagen://ledamoter',
      name: 'Riksdagens ledamöter',
      description: 'Lista över alla ledamöter i Sveriges Riksdag',
      mimeType: 'application/json',
    },
    {
      uri: 'riksdagen://partier',
      name: 'Politiska partier',
      description: 'Översikt över alla politiska partier i Riksdagen',
      mimeType: 'application/json',
    },
    {
      uri: 'riksdagen://dokument/typer',
      name: 'Dokumenttyper',
      description: 'Lista över alla typer av dokument från Riksdagen',
      mimeType: 'application/json',
    },
    {
      uri: 'regeringen://departement',
      name: 'Regeringens departement',
      description: 'Lista över alla departement i Regeringskansliet',
      mimeType: 'application/json',
    },
    {
      uri: 'riksdagen://statistik',
      name: 'Riksdagsstatistik',
      description: 'Sammanställd statistik över Riksdagens verksamhet',
      mimeType: 'application/json',
    },
    {
      uri: 'docs://data-dictionary',
      name: 'Begrepp och dataprodukter',
      description: 'Definitioner, instruktioner och fältbeskrivningar för alla dataset i MCP-servern',
      mimeType: 'application/json',
    },
    {
      uri: 'docs://workflow-guide',
      name: 'Processguide',
      description: 'Steg-för-steg hur propositioner blir betänkanden, anföranden och voteringar',
      mimeType: 'application/json',
    },
    {
      uri: 'docs://readme',
      name: 'README',
      description: 'Renderad README direkt från GitHub-repot',
      mimeType: 'text/markdown',
    },
  ];
}

/**
 * Hämta innehåll för en specifik resource
 */
export async function getResource(uri: string) {
  const supabase = getSupabase();

  switch (uri) {
    case 'riksdagen://ledamoter': {
      const { data, error } = await supabase
        .from('riksdagen_ledamoter')
        .select('*')
        .order('efternamn');

      if (error) throw new Error(`Fel vid hämtning av ledamöter: ${error.message}`);

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          total: data?.length || 0,
          ledamoter: data || [],
        }, null, 2),
      };
    }

    case 'riksdagen://partier': {
      const { data, error } = await supabase
        .from('riksdagen_ledamoter')
        .select('parti');

      if (error) throw new Error(`Fel vid hämtning av partier: ${error.message}`);

      const partier: string[] = [...new Set((data || []).map(l => String(l.parti)).filter(Boolean))].sort() as string[];

      // Räkna ledamöter per parti
      const partiStats: Record<string, number> = {};
      data?.forEach(l => {
        if (l.parti) {
          partiStats[l.parti] = (partiStats[l.parti] || 0) + 1;
        }
      });

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          total: partier.length,
          partier: partier.map(p => ({
            namn: p,
            antalLedamoter: partiStats[p] || 0,
          })),
        }, null, 2),
      };
    }

    case 'riksdagen://dokument/typer': {
      const { data, error } = await supabase
        .from('riksdagen_dokument')
        .select('doktyp');

      if (error) throw new Error(`Fel vid hämtning av dokumenttyper: ${error.message}`);

      const typer: string[] = [...new Set((data || []).map(d => String(d.doktyp)).filter(Boolean))].sort() as string[];

      // Räkna dokument per typ
      const typStats: Record<string, number> = {};
      data?.forEach(d => {
        if (d.doktyp) {
          typStats[d.doktyp] = (typStats[d.doktyp] || 0) + 1;
        }
      });

      const dokumentTyper: Record<string, string> = {
        'mot': 'Motion',
        'prop': 'Proposition',
        'bet': 'Betänkande',
        'skr': 'Skrivelse',
        'dir': 'Direktiv',
        'fpm': 'Faktapromemoria',
        'ds': 'Departementsserien',
        'sou': 'Statens offentliga utredningar',
      };

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          total: typer.length,
          dokumenttyper: typer.map(t => ({
            kod: t,
            namn: dokumentTyper[t] || t,
            antal: typStats[t] || 0,
          })),
        }, null, 2),
      };
    }

    case 'regeringen://departement': {
      const { data: pressData } = await supabase
        .from('regeringskansliet_pressmeddelanden')
        .select('departement');

      const { data: propData } = await supabase
        .from('regeringskansliet_propositioner')
        .select('departement');

      const allDepartement = [
        ...(pressData?.map(p => p.departement).filter(Boolean) || []),
        ...(propData?.map(p => p.departement).filter(Boolean) || []),
      ];

      const departement = [...new Set(allDepartement)].sort();

      // Räkna dokument per departement
      const depStats: Record<string, number> = {};
      allDepartement.forEach(d => {
        if (d) {
          depStats[d] = (depStats[d] || 0) + 1;
        }
      });

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          total: departement.length,
          departement: departement.map(d => ({
            namn: d,
            antalDokument: depStats[d] || 0,
          })),
        }, null, 2),
      };
    }

    case 'riksdagen://statistik': {
      // Hämta sammanfattande statistik
      const { count: ledamoterCount } = await supabase
        .from('riksdagen_ledamoter')
        .select('*', { count: 'exact', head: true });

      const { count: dokumentCount } = await supabase
        .from('riksdagen_dokument')
        .select('*', { count: 'exact', head: true });

      const { count: anforandenCount } = await supabase
        .from('riksdagen_anforanden')
        .select('*', { count: 'exact', head: true });

      const { count: voteringarCount } = await supabase
        .from('riksdagen_voteringar')
        .select('*', { count: 'exact', head: true });

      const { count: pressCount } = await supabase
        .from('regeringskansliet_pressmeddelanden')
        .select('*', { count: 'exact', head: true });

      const { count: propCount } = await supabase
        .from('regeringskansliet_propositioner')
        .select('*', { count: 'exact', head: true });

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          riksdagen: {
            ledamoter: ledamoterCount || 0,
            dokument: dokumentCount || 0,
            anforanden: anforandenCount || 0,
            voteringar: voteringarCount || 0,
          },
          regeringen: {
            pressmeddelanden: pressCount || 0,
            propositioner: propCount || 0,
          },
          total: {
            poster: (ledamoterCount || 0) + (dokumentCount || 0) + (anforandenCount || 0) +
                    (voteringarCount || 0) + (pressCount || 0) + (propCount || 0),
          },
        }, null, 2),
      };
    }

    case 'docs://data-dictionary': {
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(DATA_DICTIONARY, null, 2),
      };
    }

    case 'docs://workflow-guide': {
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(WORKFLOW_GUIDE, null, 2),
      };
    }
    case 'docs://readme': {
      const readmePath = path.join(process.cwd(), 'README.md');
      const markdown = await fs.readFile(readmePath, 'utf-8');
      return {
        uri,
        mimeType: 'text/markdown',
        text: markdown,
      };
    }

    default:
      throw new Error(`Okänd resource URI: ${uri}`);
  }
}
