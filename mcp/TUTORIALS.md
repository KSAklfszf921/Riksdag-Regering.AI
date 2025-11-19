# 📖 Tutorials & Usage Examples

Praktiska guider och exempel för vanliga användningsfall med Riksdag & Regering MCP.

---

## 📋 Table of Contents

1. [Snabbstart - Första 5 Minuterna](#snabbstart)
2. [Use Case: Spåra Ledamöters Aktivitet](#use-case-1-spåra-ledamöters-aktivitet)
3. [Use Case: Analysera Partiröstning](#use-case-2-analysera-partiröstning)
4. [Use Case: Dokumentsökning & Jämförelse](#use-case-3-dokumentsökning--jämförelse)
5. [Use Case: Trendanalys](#use-case-4-trendanalys)
6. [Use Case: Regeringsdokumentation](#use-case-5-regeringsdokumentation)
7. [Avancerade Patterns](#avancerade-patterns)
8. [Integrationsexempel](#integrationsexempel)

---

## Snabbstart

### Installation (3 minuter)

**Alternativ 1: Remote HTTP (Snabbast)**
```bash
claude mcp add riksdag-regering --transport http https://riksdag-regering-ai.onrender.com/mcp
```

**Alternativ 2: npm Package**
```bash
npm install -g riksdag-regering-mcp
```

**Alternativ 3: Lokal Installation**
```bash
git clone https://github.com/KSAklfszf921/Riksdag-Regering-MCP.git
cd Riksdag-Regering-MCP/mcp
npm install && npm run build
```

### Din Första Query (2 minuter)

**Exempel 1: Hitta Alla Socialdemokrater**
```javascript
// I Claude Desktop, ChatGPT, eller annan MCP-klient
search_ledamoter({
  parti: "S",
  limit: 10
})

// Resultat: Lista med 10 socialdemokratiska ledamöter
```

**Exempel 2: Sök Klimatmotioner**
```javascript
search_dokument({
  doktyp: "mot",
  titel: "klimat",
  rm: "2024/25",
  limit: 20
})

// Resultat: 20 motioner om klimat från 2024/25
```

**Exempel 3: Partifördelning**
```javascript
analyze_partifordelning()

// Resultat: Antal ledamöter per parti med procent
```

---

## Use Case 1: Spåra Ledamöters Aktivitet

### Scenario
Du vill analysera en specifik ledamots aktivitet i riksdagen och jämföra med andra ledamöter.

### Steg 1: Hitta Ledamoten

```javascript
// Sök efter namn
const result = search_ledamoter({
  namn: "Andersson",
  parti: "S",
  limit: 5
});

// Resultat innehåller intressent_id
const ledamotId = result.data[0].intressent_id;
```

### Steg 2: Hämta Fullständig Profil

```javascript
const profil = get_ledamot({
  intressent_id: ledamotId
});

console.log(`
Namn: ${profil.data.personinfo.fornamn} ${profil.data.personinfo.efternamn}
Parti: ${profil.data.nuvarande_uppdrag.parti}
Valkrets: ${profil.data.nuvarande_uppdrag.valkrets}
Utskott: ${profil.data.utskott.join(', ')}
`);
```

### Steg 3: Analysera Aktivitet

```javascript
const aktivitet = analyze_ledamot({
  intressent_id: ledamotId,
  from_date: "2024-01-01",
  to_date: "2024-10-31"
});

console.log(`
Statistik (Jan-Okt 2024):
- Anföranden: ${aktivitet.data.statistik.anforanden}
- Voteringar: ${aktivitet.data.statistik.voteringar}
- Motioner: ${aktivitet.data.statistik.dokument.motioner}
- Interpellationer: ${aktivitet.data.statistik.dokument.interpellationer}
`);
```

### Steg 4: Jämför med Annan Ledamot

```javascript
// Hitta en andra ledamot
const ledamot2Result = search_ledamoter({
  namn: "Bengtsson",
  parti: "M",
  limit: 1
});

const ledamot2Id = ledamot2Result.data[0].intressent_id;

// Jämför
const jamforelse = compare_ledamoter({
  intressent_id_1: ledamotId,
  intressent_id_2: ledamot2Id
});

console.log(`
Jämförelse:
- ${jamforelse.data.ledamot_1.namn}: ${jamforelse.data.ledamot_1.anforanden} anföranden
- ${jamforelse.data.ledamot_2.namn}: ${jamforelse.data.ledamot_2.anforanden} anföranden
- Skillnad: ${jamforelse.data.jamforelse.anforanden_skillnad}
`);
```

---

## Use Case 2: Analysera Partiröstning

### Scenario
Analysera hur partier röstar i specifika frågor och identifiera samarbetsmönster.

### Steg 1: Hitta Relevanta Voteringar

```javascript
// Sök voteringar om klimat
const voteringar = search_voteringar({
  titel: "klimat",
  rm: "2024/25",
  limit: 5
});

// Välj första voteringen
const voteringId = voteringar.data[0].votering_id;
```

### Steg 2: Detaljerad Voteringsanalys

```javascript
const analys = analyze_votering({
  votering_id: voteringId
});

console.log(`
Votering: ${analys.data.titel}
Datum: ${analys.data.datum}
Resultat: ${analys.data.resultat.utgång}

Röstfördelning:
- Ja: ${analys.data.resultat.ja}
- Nej: ${analys.data.resultat.nej}
- Avstående: ${analys.data.resultat.avstående}
`);

// Visa partistatistik
analys.data.partistatistik.forEach(parti => {
  console.log(`${parti.parti}: Ja=${parti.ja}, Nej=${parti.nej}, Avstående=${parti.avstående}`);
});
```

### Steg 3: Jämför med Relaterad Votering

```javascript
// Hitta en andra votering
const votering2Id = voteringar.data[1].votering_id;

// Jämför hur partier röstade
const rostJamforelse = compare_parti_rostning({
  votering_id_1: voteringId,
  votering_id_2: votering2Id
});

// Identifiera partier som ändrat position
const andradePosition = rostJamforelse.data.partijamforelse.filter(
  p => !p.konsekvens
);

console.log(`Partier som ändrade röstning: ${andradePosition.length}`);
```

### Steg 4: Analysera Partiaktivitet

```javascript
// Djupanalys av ett parti
const partiAnalys = analyze_parti_activity({
  parti: "S",
  from_date: "2024-01-01",
  to_date: "2024-10-31"
});

console.log(`
Socialdemokraternas aktivitet 2024:
- Anföranden: ${partiAnalys.data.aktivitet.anforanden}
- Motioner: ${partiAnalys.data.aktivitet.dokument.motioner}
- Deltagande i voteringar: ${partiAnalys.data.aktivitet.voteringar.deltagande}%
- Mest aktiv ledamot: ${partiAnalys.data.ledamoter.mest_aktiva[0].namn}
`);
```

---

## Use Case 3: Dokumentsökning & Jämförelse

### Scenario
Hitta och analysera riksdagsdokument, jämför med regeringsdokument.

### Steg 1: Sök Motioner om Specifikt Ämne

```javascript
// Sök klimatmotioner från specifikt utskott
const motioner = search_dokument({
  doktyp: "mot",
  titel: "klimat",
  organ: "MJU",  // Miljö- och jordbruksutskottet
  rm: "2024/25",
  limit: 10
});

console.log(`Hittade ${motioner.meta.count} motioner`);
```

### Steg 2: Hämta Fullständigt Dokument

```javascript
const dokId = motioner.data[0].dok_id;

const dokument = get_dokument({
  dok_id: dokId
});

console.log(`
Titel: ${dokument.data.titel}
Datum: ${dokument.data.datum}
Undertecknare: ${dokument.data.undertecknare.join(', ')}

Sammanfattning:
${dokument.data.sammanfattning}
`);
```

### Steg 3: Korsreferera med Regeringsdokument

```javascript
// Sök relaterade regeringsdokument
const riksdagRegering = compare_riksdag_regering({
  searchTerm: "klimat",
  limit: 5
});

console.log(`
Riksdagsdokument: ${riksdagRegering.data.riksdagen.length}
Regeringsdokument: ${riksdagRegering.data.regeringen.length}

Identifierade korrelationer:
`);

riksdagRegering.data.korrelationer.forEach(korr => {
  console.log(`- Likhet: ${(korr.likhetsscore * 100).toFixed(0)}%`);
});
```

### Steg 4: Sök Regeringsdokumentation

```javascript
// Sök pressmeddelanden från klimatdepartementet
const pressmed = search_regering({
  dataType: "pressmeddelanden",
  titel: "klimat",
  departement: "Klimat- och näringslivsdepartementet",
  from_date: "2024-10-01",
  limit: 10
});

// Sök SOU-betänkanden
const sou = search_regering({
  dataType: "sou",
  titel: "klimat",
  limit: 5
});
```

### Steg 5: Dokumentstatistik

```javascript
// Analysera dokumenttrender
const statistik = analyze_dokument_statistik({
  doktyp: "mot",
  rm: "2024/25"
});

console.log(`
Total motioner 2024/25: ${statistik.data.total_dokument}

Per utskott:
${Object.entries(statistik.data.per_organ).map(
  ([organ, antal]) => `- ${organ}: ${antal}`
).join('\n')}

Trender:
${statistik.data.trender.map(
  t => `${t.manad}: ${t.antal} dokument`
).join('\n')}
`);
```

---

## Use Case 4: Trendanalys

### Scenario
Analysera trender i parlamentarisk aktivitet över tid.

### Steg 1: Anförandetrender per Månad

```javascript
const anforandeTrend = analyze_trend({
  dataType: "anforanden",
  groupBy: "month",
  from_date: "2024-01-01",
  to_date: "2024-10-31"
});

// Visualisera trend
console.log("Anföranden per månad 2024:");
anforandeTrend.data.tidserie.forEach(period => {
  console.log(`${period.period}: ${period.antal} (avg ${period.genomsnitt_per_dag}/dag)`);
});

console.log(`
Statistik:
- Total: ${anforandeTrend.data.statistik.total}
- Medel: ${anforandeTrend.data.statistik.medelvärde.toFixed(0)}/månad
- Max: ${anforandeTrend.data.statistik.max}
- Min: ${anforandeTrend.data.statistik.min}
`);
```

### Steg 2: Dokumenttrender per Vecka

```javascript
const dokumentTrend = analyze_trend({
  dataType: "dokument",
  groupBy: "week",
  from_date: "2024-09-01",
  to_date: "2024-10-31"
});

// Identifiera mest aktiva veckor
const sorterad = [...dokumentTrend.data.tidserie].sort(
  (a, b) => b.antal - a.antal
);

console.log("Top 5 mest aktiva veckor:");
sorterad.slice(0, 5).forEach((vecka, i) => {
  console.log(`${i+1}. Vecka ${vecka.period}: ${vecka.antal} dokument`);
});
```

### Steg 3: Årsjämförelse

```javascript
// Jämför 2023 vs 2024
const trend2023 = analyze_trend({
  dataType: "voteringar",
  groupBy: "year",
  from_date: "2023-01-01",
  to_date: "2023-12-31"
});

const trend2024 = analyze_trend({
  dataType: "voteringar",
  groupBy: "year",
  from_date: "2024-01-01",
  to_date: "2024-10-31"
});

console.log(`
Voteringar:
- 2023: ${trend2023.data.tidserie[0].antal}
- 2024 (t.o.m. okt): ${trend2024.data.tidserie[0].antal}
`);
```

---

## Use Case 5: Regeringsdokumentation

### Scenario
Spåra regeringens kommunikation och utredningar.

### Steg 1: Senaste Pressmeddelanden

```javascript
const senastePM = search_regering({
  dataType: "pressmeddelanden",
  from_date: "2024-10-01",
  limit: 20
});

console.log(`Senaste ${senastePM.data.length} pressmeddelanden:`);
senastePM.data.forEach(pm => {
  console.log(`${pm.datum}: ${pm.titel} (${pm.departement})`);
});
```

### Steg 2: SOU-betänkanden

```javascript
// Sök alla SOU från 2024
const souLista = search_regering({
  dataType: "sou",
  from_date: "2024-01-01",
  limit: 50
});

// Gruppera per departement
const perDepartement = souLista.data.reduce((acc, sou) => {
  const dept = sou.departement || "Övrigt";
  acc[dept] = (acc[dept] || 0) + 1;
  return acc;
}, {});

console.log("SOU-betänkanden per departement:");
Object.entries(perDepartement).forEach(([dept, antal]) => {
  console.log(`- ${dept}: ${antal}`);
});
```

### Steg 3: Propositioner från Regeringen

```javascript
// Jämför regeringens propositioner med riksdagens behandling
const regProp = search_regering({
  dataType: "propositioner",
  from_date: "2024-09-01",
  limit: 10
});

// Hitta motsvarande dokument i riksdagen
for (const prop of regProp.data) {
  const riksdagProp = search_dokument({
    doktyp: "prop",
    titel: prop.titel.substring(0, 20), // Sök på början av titeln
    limit: 1
  });

  if (riksdagProp.data.length > 0) {
    console.log(`✓ ${prop.titel} - Finns i riksdagen`);
  } else {
    console.log(`⚠ ${prop.titel} - Ej ännu i riksdagen`);
  }
}
```

---

## Avancerade Patterns

### Pattern 1: Bulk Data Collection

```javascript
// Samla data för hela riksmötet
async function samlaRiksmoteData(riksmote) {
  const data = {
    ledamoter: [],
    dokument: [],
    voteringar: [],
    anforanden: []
  };

  // Hämta i parallell
  const [ledamoter, dokument, voteringar] = await Promise.all([
    search_ledamoter({ limit: 500 }),
    search_dokument({ rm: riksmote, limit: 500 }),
    search_voteringar({ rm: riksmote, limit: 500 })
  ]);

  data.ledamoter = ledamoter.data;
  data.dokument = dokument.data;
  data.voteringar = voteringar.data;

  return data;
}

// Användning
const riksmoteData = await samlaRiksmoteData("2024/25");
console.log(`Samlade ${riksmoteData.dokument.length} dokument`);
```

### Pattern 2: Progressiv Sökning

```javascript
// Hämta alla resultat med pagination
async function hamtaAllaResultat(searchFunc, params, maxLimit = 1000) {
  const resultat = [];
  let offset = 0;
  const batchSize = 100;

  while (offset < maxLimit) {
    const batch = await searchFunc({
      ...params,
      limit: batchSize,
      offset: offset
    });

    resultat.push(...batch.data);

    if (batch.data.length < batchSize) {
      break; // Inga fler resultat
    }

    offset += batchSize;
  }

  return resultat;
}

// Användning
const allaMotioner = await hamtaAllaResultat(
  search_dokument,
  { doktyp: "mot", rm: "2024/25" }
);
```

### Pattern 3: Caching Strategy

```javascript
// Enkel cache-implementation
class MCPCache {
  constructor(ttl = 3600000) { // 1 timme default
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }
}

// Användning
const cache = new MCPCache();

async function getCachedLedamot(id) {
  const cacheKey = `ledamot:${id}`;
  let ledamot = cache.get(cacheKey);

  if (!ledamot) {
    const result = await get_ledamot({ intressent_id: id });
    ledamot = result.data;
    cache.set(cacheKey, ledamot);
  }

  return ledamot;
}
```

---

## Integrationsexempel

### TypeScript Integration

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

interface Ledamot {
  intressent_id: string;
  fornamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
}

class RiksdagAPI {
  private client: MCPClient;

  constructor(serverUrl: string) {
    this.client = new MCPClient({
      url: serverUrl,
      transport: 'http'
    });
  }

  async searchLedamoter(params: {
    parti?: string;
    valkrets?: string;
    limit?: number;
  }): Promise<Ledamot[]> {
    const result = await this.client.callTool('search_ledamoter', params);
    return result.data as Ledamot[];
  }

  async analyzeTrend(
    dataType: 'dokument' | 'anforanden' | 'voteringar',
    groupBy: 'day' | 'week' | 'month' | 'year',
    dateRange?: { from: string; to: string }
  ) {
    return this.client.callTool('analyze_trend', {
      dataType,
      groupBy,
      from_date: dateRange?.from,
      to_date: dateRange?.to
    });
  }
}

// Användning
const api = new RiksdagAPI('https://riksdag-regering-ai.onrender.com/mcp');
const socialdemokrater = await api.searchLedamoter({ parti: 'S' });
```

### React Hook

```typescript
import { useState, useEffect } from 'react';
import { MCPClient } from '@modelcontextprotocol/sdk';

function useMCPQuery<T>(
  tool: string,
  params: any,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const client = new MCPClient({
      url: 'https://riksdag-regering-ai.onrender.com/mcp',
      transport: 'http'
    });

    setLoading(true);
    client.callTool(tool, params)
      .then(result => {
        setData(result.data as T);
        setError(null);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, dependencies);

  return { data, loading, error };
}

// Användning i component
function LedamoterList({ parti }: { parti: string }) {
  const { data, loading, error } = useMCPQuery(
    'search_ledamoter',
    { parti, limit: 20 },
    [parti]
  );

  if (loading) return <div>Laddar...</div>;
  if (error) return <div>Fel: {error.message}</div>;

  return (
    <ul>
      {data?.map(ledamot => (
        <li key={ledamot.intressent_id}>
          {ledamot.fornamn} {ledamot.efternamn}
        </li>
      ))}
    </ul>
  );
}
```

### Python Integration

```python
from mcp import Client
from datetime import datetime, timedelta

class RiksdagClient:
    def __init__(self, server_url):
        self.client = Client(url=server_url, transport='http')

    def search_recent_activity(self, days=7):
        """Hämta senaste aktiviteten"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        return self.client.call_tool('recent_aktivitet', {
            'period': f'{days}d'
        })

    def analyze_member_activity(self, member_id, start_date, end_date):
        """Analysera ledamots aktivitet"""
        return self.client.call_tool('analyze_ledamot', {
            'intressent_id': member_id,
            'from_date': start_date.strftime('%Y-%m-%d'),
            'to_date': end_date.strftime('%Y-%m-%d')
        })

# Användning
client = RiksdagClient('https://riksdag-regering-ai.onrender.com/mcp')
activity = client.search_recent_activity(days=30)
print(f"Nya dokument: {activity['statistik']['nya_dokument']}")
```

---

## Tips & Best Practices

### 1. Effektiv Frågeställning
- Använd specifika filter för att minska resultatmängd
- Kombinera `from_date` och `to_date` för tidsavgränsning
- Sätt lämplig `limit` baserat på användningsfall

### 2. Performance
- Cachea statisk data (ledamöter, utskott)
- Använd parallella requests när möjligt
- Begränsa resultatmängder i första hand

### 3. Felsökning
```javascript
// Aktivera detaljerad logging
const result = await mcp.callTool('search_dokument', params);

if (!result.success) {
  console.error('Error:', result.error);
  console.error('Code:', result.error.code);
  console.error('Details:', result.error.details);
}
```

### 4. Rate Limiting
- Remote HTTP har för närvarande ingen rate limiting
- Planerat: 1000 req/timme per IP
- Använd caching för att minimera requests

---

## Resurser

- **API Reference:** [API_REFERENCE.md](API_REFERENCE.md)
- **GitHub:** https://github.com/KSAklfszf921/Riksdag-Regering-MCP
- **Live Server:** https://riksdag-regering-ai.onrender.com
- **npm Package:** https://www.npmjs.com/package/riksdag-regering-mcp

---

**Version:** 2.0.0
**Last Updated:** 2025-11-19
**Need Help?** [GitHub Issues](https://github.com/KSAklfszf921/Riksdag-Regering-MCP/issues)
