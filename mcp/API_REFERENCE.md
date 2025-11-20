# 📚 API Reference - Riksdag & Regering MCP

Komplett referens för alla 27 verktyg i Riksdag & Regering MCP Server.

---

## 📋 Table of Contents

1. [Sökverktyg (5)](#sökverktyg)
2. [Analysverktyg (6)](#analysverktyg)
3. [Jämförelseverktyg (4)](#jämförelseverktyg)
4. [Aggregeringsverktyg (6)](#aggregeringsverktyg)
5. [Detaljverktyg (6)](#detaljverktyg)
6. [Common Parameters](#common-parameters)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Sökverktyg

### 🔍 search_ledamoter

Sök ledamöter i riksdagen efter namn, parti, valkrets eller status.

**Parameters:**
```typescript
{
  namn?: string;        // Namn att söka efter (förnamn eller efternamn)
  parti?: string;       // Parti (S, M, SD, V, MP, C, L, KD)
  valkrets?: string;    // Valkrets
  status?: string;      // Status (tjänstgörande, tjänstledig, etc.)
  summary?: boolean;    // Returnera kortfattat svar
  fields?: string[];    // Lista över fält att inkludera
  limit?: number;       // Max antal resultat (default: 10, max: 50)
}
```

**Response:**
```json
{
  "items": [
    {
      "intressent_id": "0123456789012",
      "fornamn": "Anna",
      "efternamn": "Andersson",
      "parti": "S",
      "valkrets": "Stockholms kommun",
      "status": "Tjänstgörande riksdagsledamot"
    }
  ],
  "count": 1,
  "limit": 10,
  "has_more": false
}
```

**Use Cases:**
- Hitta alla ledamöter från ett specifikt parti
- Sök ledamöter från en viss valkrets
- Lista alla nuvarande tjänstgörande ledamöter

**Example:**
```javascript
// Sök alla socialdemokrater från Stockholm
{
  "parti": "S",
  "valkrets": "Stockholm",
  "limit": 20
}
```

---

### 🔍 search_dokument

Sök riksdagsdokument som motioner, propositioner, betänkanden.

**Parameters:**
```typescript
{
  doktyp?: string;      // Dokumenttyp (mot, prop, bet, skr)
  rm?: string;          // Riksmöte (t.ex. "2024/25")
  titel?: string;       // Titel att söka efter
  organ?: string;       // Organ (t.ex. KU, FiU, UU)
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
  summary?: boolean;    // Returnera endast ID/titel och utdrag
  fields?: string[];    // Lista över fält att inkludera
  limit?: number;       // Max antal resultat (default: 10, max: 50)
}
```

**Response:**
```json
{
  "items": [
    {
      "dok_id": "HB01234",
      "doktyp": "mot",
      "rm": "2024/25",
      "titel": "Motion om klimatåtgärder",
      "datum": "2024-10-15",
      "organ": "MJU",
      "summary_preview": "Kort textutdrag…"
    }
  ],
  "count": 1,
  "limit": 10,
  "has_more": false
}
```

**Document Types:**
- `mot` - Motion
- `prop` - Proposition
- `bet` - Betänkande
- `skr` - Skrivelse
- `ip` - Interpellation
- `frs` - Fråga (skriftlig)
- `fr` - Fråga (muntlig)

**Use Cases:**
- Hitta alla motioner om ett specifikt ämne
- Sök propositioner från ett visst riksmöte
- Lista betänkanden från ett utskott

**Example:**
```javascript
// Sök alla propositioner från 2024/25
{
  "doktyp": "prop",
  "rm": "2024/25",
  "limit": 100
}
```

---

### 🔍 search_dokument_fulltext

Fulltextsökning mot titel, sammanfattning och cachelagrad fulltext. Returnerar alltid ett tydligt textutdrag (snippet) och kan även bifoga hela texten.

**Parameters:**
```typescript
{
  query: string;            // REQUIRED: sökterm (minst 2 tecken)
  doktyp?: string;          // Dokumenttyp (mot, prop, bet, skr, ...)
  rm?: string;              // Riksmöte
  organ?: string;           // Organ/utskott (KU, FiU, UU, ...)
  from_date?: string;       // Från datum (YYYY-MM-DD)
  to_date?: string;         // Till datum (YYYY-MM-DD)
  summary?: boolean;        // Returnera endast ID, titel och snippet
  fields?: string[];        // Lista över fält att inkludera
  limit?: number;           // Max resultat (default 10, max 50)
  include_full_text?: boolean; // Returnera hela texten (kan bli stora svar)
  snippet_length?: number;  // Antal tecken i utdrag (default 280)
}
```

> Obs! `include_full_text: true` kräver `limit: 1`. Använd `get_dokument_innehall` om du behöver hela texten för flera dokument.

**Response:**
```json
{
  "query": "klimatmål",
  "snippet_length": 280,
  "include_full_text": false,
  "items": [
    {
      "dok_id": "HB01234",
      "titel": "Motion om långsiktiga klimatmål",
      "doktyp": "mot",
      "rm": "2024/25",
      "datum": "2024-10-15",
      "organ": "MJU",
      "snippet": "…motionen föreslår att klimatmålen skärps för att uppnå netto noll utsläpp…",
      "summary": "Motion om klimatomställning",
      "dokument_url_text": "https://data.riksdagen.se/...",
      "has_cached_text": true,
      "score": 37
    }
  ],
  "count": 2,
  "limit": 10,
  "has_more": false,
  "analysis": "Hittade 2 dokument som matchar \"klimatmål\" med fulltextsökning."
}
```

**Tips:**
- Använd `include_full_text: true` om du vill få hela dokumenttexten direkt i svaret.
- Justera `snippet_length` (t.ex. 500) när du behöver längre utdrag till redaktionellt arbete.
- Kombinera med `doktyp` eller `rm` för att begränsa sökträffen.

---

### 🔍 search_anforanden

Sök anföranden i riksdagens debatter.

**Parameters:**
```typescript
{
  talare?: string;      // Talare att söka efter
  parti?: string;       // Parti
  debattnamn?: string;  // Debattnamn
  text?: string;        // Text att söka i anförandet
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
  summary?: boolean;    // Returnera kort utdrag
  fields?: string[];    // Lista över fält
  limit?: number;       // Max antal resultat (default: 10, max: 50)
}
```

**Response:**
```json
{
  "items": [
    {
      "anforande_id": "H901234",
      "talare": "Anna Andersson (S)",
      "parti": "S",
      "avsnittsrubrik": "Klimatpolitik",
      "text_preview": "Herr talman! Vi står inför...",
      "datum": "2024-10-20",
      "dok_id": "HB01234"
    }
  ],
  "count": 1,
  "limit": 10,
  "has_more": false
}
```

**Use Cases:**
- Hitta alla anföranden från en specifik ledamot
- Sök debatter om ett visst ämne
- Analysera partiers retorik kring en fråga

---

### 🔍 search_voteringar

Sök voteringshistorik i riksdagen.

**Parameters:**
```typescript
{
  rm?: string;          // Riksmöte (t.ex. "2024/25")
  titel?: string;       // Titel att söka efter
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
  summary?: boolean;    // Returnera kort resultat
  fields?: string[];    // Lista över fält
  limit?: number;       // Max antal resultat (default: 10, max: 50)
}
```

**Response:**
```json
{
  "items": [
    {
      "votering_id": "H901ABC123",
      "rm": "2024/25",
      "titel": "Klimatlag",
      "datum": "2024-10-25"
    }
  ],
  "count": 1,
  "limit": 10,
  "has_more": false
}
```

**Use Cases:**
- Hitta alla voteringar i ett riksmöte
- Analysera röstningsutfall
- Spåra partiernas röstmönster

---

### 🔍 search_regering

Sök regeringsdokument (pressmeddelanden, SOU, direktiv).

**Parameters:**
```typescript
{
  dataType: string;       // REQUIRED: "pressmeddelanden", "propositioner",
                          // "departementsserien", "sou", "remisser", "rapporter"
  titel?: string;         // Titel att söka efter
  departement?: string;   // Departement
  from_date?: string;     // Från datum (YYYY-MM-DD)
  to_date?: string;       // Till datum (YYYY-MM-DD)
  summary?: boolean;      // Returnera kort resultat
  fields?: string[];      // Lista över fält
  limit?: number;         // Max antal resultat (default: 10, max: 50)
}
```

**Response:**
```json
{
  "items": [
    {
      "document_id": "PM-2024-1234",
      "titel": "Ny klimatsatsning presenterad",
      "departement": "Klimat- och näringslivsdepartementet",
      "publicerad_datum": "2024-10-30",
      "innehall_preview": "Pressmeddelandet i korthet…"
    }
  ],
  "count": 1,
  "limit": 10,
  "has_more": false
}
```

**Data Types:**
- `pressmeddelanden` - Pressmeddelanden
- `propositioner` - Propositioner
- `departementsserien` - Departementsserien (Ds)
- `sou` - Statens offentliga utredningar
- `remisser` - Remisser
- `rapporter` - Rapporter

**Use Cases:**
- Hitta alla pressmeddelanden från ett departement
- Sök SOU-betänkanden om ett ämne
- Lista propositioner från regeringen

---

## Analysverktyg

### 📊 analyze_partifordelning

Analysera fördelningen av ledamöter per parti i riksdagen.

**Parameters:**
```typescript
{
  valkrets?: string;    // Filtrera efter valkrets (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_ledamoter": 349,
    "fordelning": [
      {
        "parti": "S",
        "antal": 107,
        "procent": 30.7
      },
      {
        "parti": "M",
        "antal": 68,
        "procent": 19.5
      }
      // ... fler partier
    ]
  },
  "meta": {
    "valkrets": null,
    "datum": "2024-11-19"
  }
}
```

**Use Cases:**
- Visa partifördelning i riksdagen
- Jämför partifördelning mellan valkretsar
- Analysera majoritetsförhållanden

---

### 📊 analyze_votering

Detaljerad analys av en specifik votering.

**Parameters:**
```typescript
{
  votering_id: string;  // REQUIRED: ID för voteringen
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "votering_id": "H901ABC123",
    "titel": "Klimatlag",
    "datum": "2024-10-25",
    "resultat": {
      "ja": 175,
      "nej": 152,
      "avstående": 22,
      "frånvarande": 0,
      "utgång": "Bifall"
    },
    "partistatistik": [
      {
        "parti": "S",
        "ja": 107,
        "nej": 0,
        "avstående": 0
      }
      // ... fler partier
    ]
  }
}
```

**Use Cases:**
- Analysera röstningsutfall
- Visa hur partier röstade
- Identifiera avvikare från partilinjen

---

### 📊 analyze_ledamot

Analysera en ledamots aktivitet (anföranden, röster, dokument).

**Parameters:**
```typescript
{
  intressent_id: string;  // REQUIRED: Ledamotens intressent ID
  from_date?: string;     // Från datum (YYYY-MM-DD)
  to_date?: string;       // Till datum (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ledamot": {
      "intressent_id": "0123456789012",
      "namn": "Anna Andersson",
      "parti": "S"
    },
    "statistik": {
      "anforanden": 45,
      "voteringar": 234,
      "dokument": {
        "motioner": 12,
        "interpellationer": 5
      }
    },
    "aktivitetstrender": [
      {
        "manad": "2024-10",
        "anforanden": 8,
        "voteringar": 42
      }
    ]
  }
}
```

**Use Cases:**
- Mät ledamots aktivitetsnivå
- Jämför aktivitet över tid
- Identifiera mest aktiva ledamöter

---

### 📊 analyze_dokument_statistik

Statistik över dokument från riksdagen.

**Parameters:**
```typescript
{
  doktyp?: string;      // Dokumenttyp att analysera
  rm?: string;          // Riksmöte
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_dokument": 1234,
    "per_typ": {
      "mot": 456,
      "prop": 123,
      "bet": 234
    },
    "per_organ": {
      "KU": 89,
      "FiU": 67
    },
    "trender": [
      {
        "manad": "2024-10",
        "antal": 145
      }
    ]
  }
}
```

---

### 📊 analyze_trend

Tidsserieanalys av parlamentarisk aktivitet.

**Parameters:**
```typescript
{
  dataType: string;       // REQUIRED: "dokument", "anforanden", "voteringar"
  groupBy: string;        // REQUIRED: "day", "week", "month", "year"
  from_date?: string;     // Från datum (YYYY-MM-DD)
  to_date?: string;       // Till datum (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dataType": "anforanden",
    "groupBy": "month",
    "tidserie": [
      {
        "period": "2024-01",
        "antal": 456,
        "genomsnitt_per_dag": 14.7
      },
      {
        "period": "2024-02",
        "antal": 523,
        "genomsnitt_per_dag": 18.0
      }
    ],
    "statistik": {
      "total": 4567,
      "medelvärde": 380.6,
      "max": 523,
      "min": 234
    }
  }
}
```

---

### 📊 analyze_parti_activity

Detaljerad analys av ett partis totala aktivitet över tid.

**Parameters:**
```typescript
{
  parti: string;        // REQUIRED: Parti (S, M, SD, V, MP, C, L, KD)
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "parti": "S",
    "period": {
      "from": "2024-01-01",
      "to": "2024-10-31"
    },
    "aktivitet": {
      "anforanden": 1234,
      "dokument": {
        "motioner": 234,
        "interpellationer": 67
      },
      "voteringar": {
        "deltagande": 98.5,
        "ja": 567,
        "nej": 234,
        "avstående": 12
      }
    },
    "ledamoter": {
      "antal": 107,
      "mest_aktiva": [
        {
          "namn": "Anna Andersson",
          "anforanden": 89
        }
      ]
    }
  }
}
```

---

## Jämförelseverktyg

### ⚖️ compare_ledamoter

Jämför två ledamöters aktiviteter och röstningsstatistik.

**Parameters:**
```typescript
{
  intressent_id_1: string;  // REQUIRED: Första ledamotens ID
  intressent_id_2: string;  // REQUIRED: Andra ledamotens ID
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ledamot_1": {
      "namn": "Anna Andersson",
      "parti": "S",
      "anforanden": 45,
      "voteringar": 234
    },
    "ledamot_2": {
      "namn": "Bengt Bengtsson",
      "parti": "M",
      "anforanden": 32,
      "voteringar": 229
    },
    "jamforelse": {
      "anforanden_skillnad": 13,
      "voteringar_overensstammelse": 65.2
    }
  }
}
```

---

### ⚖️ compare_parti_rostning

Jämför partiers röstbeteende mellan två voteringar.

**Parameters:**
```typescript
{
  votering_id_1: string;  // REQUIRED: Första voteringens ID
  votering_id_2: string;  // REQUIRED: Andra voteringens ID
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "votering_1": {
      "titel": "Klimatlag",
      "datum": "2024-10-25"
    },
    "votering_2": {
      "titel": "Energipolitik",
      "datum": "2024-11-15"
    },
    "partijamforelse": [
      {
        "parti": "S",
        "votering_1": "ja",
        "votering_2": "ja",
        "konsekvens": true
      }
    ]
  }
}
```

---

### ⚖️ compare_riksdag_regering

Korsreferera dokument från riksdagen och regeringen om samma ämne.

**Parameters:**
```typescript
{
  searchTerm: string;   // REQUIRED: Sökterm för att hitta relaterade dokument
  limit?: number;       // Max antal dokument från varje källa (default: 10)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "searchTerm": "klimat",
    "riksdagen": [
      {
        "typ": "motion",
        "titel": "Motion om klimatåtgärder",
        "datum": "2024-10-15"
      }
    ],
    "regeringen": [
      {
        "typ": "pressmeddelande",
        "titel": "Ny klimatsatsning",
        "datum": "2024-10-30"
      }
    ],
    "korrelationer": [
      {
        "riksdag_dok": "HB01234",
        "regering_dok": "PM-2024-1234",
        "likhetsscore": 0.85
      }
    ]
  }
}
```

---

### ⚖️ compare_partier

Jämför två partiers aktiviteter och statistik.

**Parameters:**
```typescript
{
  parti_1: string;      // REQUIRED: Första partiet (S, M, SD, etc.)
  parti_2: string;      // REQUIRED: Andra partiet
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "parti_1": {
      "namn": "S",
      "ledamoter": 107,
      "anforanden": 1234,
      "dokument": 234
    },
    "parti_2": {
      "namn": "M",
      "ledamoter": 68,
      "anforanden": 856,
      "dokument": 178
    },
    "jamforelse": {
      "anforanden_per_ledamot": {
        "S": 11.5,
        "M": 12.6
      }
    }
  }
}
```

---

## Aggregeringsverktyg

### 📈 get_top_lists

Topplistor för talare, partier, utskott eller dokumenttyper.

**Parameters:**
```typescript
{
  category: string;     // REQUIRED: "talare", "partier", "utskott", "dokumenttyper"
  limit?: number;       // Antal i listan (default: 10)
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "talare",
    "topplista": [
      {
        "rang": 1,
        "namn": "Anna Andersson (S)",
        "antal_anforanden": 89,
        "procent": 2.3
      }
    ]
  }
}
```

---

### 📈 analyze_riksmote

Analysera ett specifikt riksmöte (dokument, voteringar, anföranden).

**Parameters:**
```typescript
{
  rm: string;  // REQUIRED: Riksmöte (t.ex. "2024/25")
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "riksmote": "2024/25",
    "statistik": {
      "dokument": {
        "total": 1234,
        "motioner": 456,
        "propositioner": 123,
        "betankanden": 234
      },
      "voteringar": 234,
      "anforanden": 4567
    },
    "mest_aktiva": {
      "ledamoter": [...],
      "partier": [...]
    }
  }
}
```

---

### 📈 recent_aktivitet

Senaste parlamentariska aktiviteten (sista 24h, 7 dagar, 30 dagar).

**Parameters:**
```typescript
{
  period?: string;  // "24h", "7d", "30d" (default: "7d")
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "statistik": {
      "nya_dokument": 45,
      "nya_anforanden": 234,
      "nya_voteringar": 12
    },
    "senaste_dokument": [...],
    "senaste_voteringar": [...]
  }
}
```

---

### 📈 global_search

Sök över alla datakällor samtidigt (dokument, anföranden, ledamöter, pressmeddelanden).

**Parameters:**
```typescript
{
  query: string;      // REQUIRED: Sökterm
  limit?: number;     // Max resultat per tabell (default: 20)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "klimat",
    "resultat": {
      "dokument": [...],
      "anforanden": [...],
      "ledamoter": [...],
      "regeringsdokument": [...]
    },
    "totalt": 234
  }
}
```

---

### 📈 top_anforanden

Mest impaktfulla anföranden baserat på längd, reaktioner eller refererade.

**Parameters:**
```typescript
{
  metric?: string;      // "length", "references" (default: "length")
  limit?: number;       // Antal anföranden (default: 10)
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
}
```

---

### 📈 top_voteringar

Mest betydelsefulla voteringar baserat på marginaler eller deltagande.

**Parameters:**
```typescript
{
  metric?: string;      // "margin", "turnout" (default: "margin")
  limit?: number;       // Antal voteringar (default: 10)
  from_date?: string;   // Från datum (YYYY-MM-DD)
  to_date?: string;     // Till datum (YYYY-MM-DD)
}
```

---

## Detaljverktyg

### 📄 get_ledamot

Fullständig ledamotsprofil med uppdrag och historik.

**Parameters:**
```typescript
{
  intressent_id: string;  // REQUIRED: Ledamotens intressent ID
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intressent_id": "0123456789012",
    "personinfo": {
      "fornamn": "Anna",
      "efternamn": "Andersson",
      "fodd_ar": 1975,
      "kon": "kvinna"
    },
    "nuvarande_uppdrag": {
      "parti": "S",
      "valkrets": "Stockholms kommun",
      "status": "Tjänstgörande riksdagsledamot"
    },
    "tidigare_uppdrag": [...],
    "utskott": ["KU", "FiU"]
  }
}
```

---

### 📄 get_dokument

Komplett dokumentinformation med innehåll och metadata.

**Parameters:**
```typescript
{
  dok_id: string;  // REQUIRED: Dokument ID
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dok_id": "HB01234",
    "doktyp": "mot",
    "rm": "2024/25",
    "titel": "Motion om klimatåtgärder",
    "datum": "2024-10-15",
    "organ": "MJU",
    "undertecknare": ["Anna Andersson (S)"],
    "dokument_url_text": "https://...",
    "dokument_url_html": "https://...",
    "sammanfattning": "Motion om...",
    "fulltext": "..."
  }
}
```

---

### 📄 get_motioner

Hämta motioner från riksdagen.

**Parameters:**
```typescript
{
  rm?: string;     // Riksmöte
  parti?: string;  // Filtrera efter parti
  limit?: number;  // Max antal (default: 50)
}
```

---

### 📄 get_propositioner

Hämta propositioner från riksdagen.

**Parameters:**
```typescript
{
  rm?: string;    // Riksmöte
  limit?: number; // Max antal (default: 50)
}
```

---

### 📄 get_betankanden

Hämta utskottsbetänkanden.

**Parameters:**
```typescript
{
  rm?: string;       // Riksmöte
  utskott?: string;  // Utskott (KU, FiU, etc.)
  limit?: number;    // Max antal (default: 50)
}
```

---

### 📄 get_utskott

Lista alla riksdagens utskott.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "kod": "KU",
      "namn": "Konstitutionsutskottet",
      "beskrivning": "Ansvarar för grundlagsfrågor..."
    }
  ]
}
```

---

## Common Parameters

### Date Format
Alla datum använder format: `YYYY-MM-DD`
```
Exempel: "2024-10-15"
```

### Limit Parameter
Alla verktyg med resultat-listor har `limit` parameter:
- Default: 10
- Max: 50
- Min: 1

### Summary & Fields
- `summary` (bool, valfri): Returnerar korta resultat (ID, titel/namn, preview). Använd när du bara behöver översikt.
- `fields` (string[], valfri): Begränsa svar till specifika fält. `id`-fältet för respektive verktyg skickas alltid med.

### Riksmöte Format
Riksmöten anges som: `YYYY/YY`
```
Exempel: "2024/25" (riksmötet 2024-2025)
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Parameter 'parti' must be one of: S, M, SD, V, MP, C, L, KD",
    "details": {
      "parameter": "parti",
      "value": "XYZ"
    }
  }
}
```

### Error Codes
- `INVALID_PARAMETER` - Ogiltig parameter
- `MISSING_REQUIRED_PARAMETER` - Saknad obligatorisk parameter
- `NOT_FOUND` - Resurs hittades inte
- `DATABASE_ERROR` - Databasfel
- `RATE_LIMIT_EXCEEDED` - För många requests
- `INTERNAL_ERROR` - Internt serverfel

---

## Rate Limiting

**Current Limits:**
- **Remote HTTP:** Ingen rate limiting (fri användning)
- **npm Package (lokal):** Ingen rate limiting

**Planned:**
- **Future:** 1000 requests/hour per IP för remote server

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1730458800
```

---

## Best Practices

### Effektiv Sökning
1. Använd `limit` parameter för att begränsa resultat
2. Kombinera flera filter för specifika sökningar
3. Använd datum-filter för tidsavgränsade sökningar

### Caching
- Cachea resultat lokalt när möjligt
- Statisk data (ledamöter, utskott) ändras sällan
- Dokument kan cachas permanent efter publicering

### Felhantering
```javascript
try {
  const result = await mcp.call('search_dokument', {
    doktyp: 'mot',
    rm: '2024/25'
  });

  if (!result.success) {
    console.error('Error:', result.error.message);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

---

**Version:** 2.0.0
**Last Updated:** 2025-11-19
**Support:** [GitHub Issues](https://github.com/KSAklfszf921/Riksdag-Regering-MCP/issues)
