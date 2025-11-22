import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchLedamoterDirect, fetchDokumentDirect } from '../utils/riksdagenApi.js';
import { fetchG0vDocuments } from '../utils/g0vApi.js';
import { DATA_DICTIONARY } from '../data/dictionary.js';
import { WORKFLOW_GUIDE } from '../data/workflow.js';
import { loadToolGuide } from '../data/toolGuide.js';
import { RIKSMOTEN } from '../data/riksmoten.js';

async function loadLedamoterSample() {
  const response = await fetchLedamoterDirect({ sz: 400 });
  return {
    total: response.hits,
    ledamoter: response.data,
  };
}

async function loadDokumentSample() {
  const response = await fetchDokumentDirect({ sz: 200 });
  return {
    total: response.hits,
    dokument: response.data,
  };
}

export async function listResources() {
  return [
    {
      uri: 'riksdagen://ledamoter',
      name: 'Riksdagens ledamöter',
      description: 'Lista över aktuella ledamöter hämtade direkt från personlista API',
      mimeType: 'application/json',
    },
    {
      uri: 'riksdagen://partier',
      name: 'Politiska partier',
      description: 'Partistatistik baserad på ledamöternas parti-etiketter',
      mimeType: 'application/json',
    },
    {
      uri: 'riksdagen://dokument/typer',
      name: 'Dokumenttyper',
      description: 'Aktuella dokumenttyper från dokumentlistan',
      mimeType: 'application/json',
    },
    {
      uri: 'riksdagen://riksmoten',
      name: 'Riksmöten',
      description: 'Lista över koder för riksmöten/år',
      mimeType: 'application/json',
    },
    {
      uri: 'regeringen://departement',
      name: 'Regeringens departement',
      description: 'Departementsaktivitet baserat på pressmeddelanden och propositioner (via g0v.se)',
      mimeType: 'application/json',
    },
    {
      uri: 'riksdagen://statistik',
      name: 'Riksdagsstatistik',
      description: 'Sammanfattning av antal dokument och ledamöter från API:erna',
      mimeType: 'application/json',
    },
    {
      uri: 'docs://data-dictionary',
      name: 'Begrepp och dataprodukter',
      description: 'Definitioner och fältbeskrivningar',
      mimeType: 'application/json',
    },
    {
      uri: 'docs://workflow-guide',
      name: 'Processguide',
      description: 'Steg-för-steg hur lagstiftningsprocessen fungerar',
      mimeType: 'application/json',
    },
    {
      uri: 'docs://tool-guide',
      name: 'Verktygsguide',
      description: 'En detaljerad guide för hur man använder MCP-serverns verktyg',
      mimeType: 'text/markdown',
    },
    {
      uri: 'docs://readme',
      name: 'README',
      description: 'Projektets README renderad som text',
      mimeType: 'text/markdown',
    },
  ];
}

export async function getResource(uri: string) {
  switch (uri) {
    case 'riksdagen://ledamoter': {
      const sample = await loadLedamoterSample();
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(sample, null, 2),
      };
    }

    case 'riksdagen://partier': {
      const sample = await loadLedamoterSample();
      const stats: Record<string, number> = {};
      sample.ledamoter.forEach((person: any) => {
        if (person.parti) {
          stats[person.parti] = (stats[person.parti] || 0) + 1;
        }
      });

      const partier = Object.keys(stats).sort().map((parti) => ({
        parti,
        ledamoter: stats[parti],
        andel: stats[parti] / sample.total,
      }));

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ totalPartier: partier.length, partier }, null, 2),
      };
    }

    case 'riksdagen://dokument/typer': {
      const sample = await loadDokumentSample();
      const typStats: Record<string, number> = {};
      sample.dokument.forEach((doc: any) => {
        if (doc.doktyp) {
          typStats[doc.doktyp] = (typStats[doc.doktyp] || 0) + 1;
        }
      });

      const typer = Object.keys(typStats).sort().map((kod) => ({
        kod,
        antal: typStats[kod],
      }));

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ totalTyper: typer.length, typer }, null, 2),
      };
    }

    case 'riksdagen://riksmoten': {
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(RIKSMOTEN, null, 2),
      };
    }

    case 'regeringen://departement': {
      const press = await fetchG0vDocuments('pressmeddelanden', { limit: 500 });
      const prop = await fetchG0vDocuments('propositioner', { limit: 500 });
      const stats: Record<string, number> = {};
      [...press, ...prop].forEach((doc) => {
        if (doc.sender) {
          stats[doc.sender] = (stats[doc.sender] || 0) + 1;
        }
      });
      const departement = Object.keys(stats).sort().map((namn) => ({ namn, antalDokument: stats[namn] }));
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ totalDepartement: departement.length, departement }, null, 2),
      };
    }

    case 'riksdagen://statistik': {
      const [ledamoter, dokument] = await Promise.all([
        fetchLedamoterDirect({ sz: 1 }),
        fetchDokumentDirect({ sz: 1 }),
      ]);

      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          generated_at: new Date().toISOString(),
          totals: {
            ledamoter: ledamoter.hits,
            dokument: dokument.hits,
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

    case 'docs://tool-guide': {
      const toolGuideContent = await loadToolGuide(); // Load from file
      return {
        uri,
        mimeType: 'text/markdown',
        text: toolGuideContent,
      };
    }

    case 'docs://readme': {
      const readmePath = path.resolve(process.cwd(), '..', 'README.md');
      const content = await fs.readFile(readmePath, 'utf-8');
      return {
        uri,
        mimeType: 'text/markdown',
        text: content,
      };
    }

    default:
      throw new Error(`Resource ${uri} saknas`);
  }
}