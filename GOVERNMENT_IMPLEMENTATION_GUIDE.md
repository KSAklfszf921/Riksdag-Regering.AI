# 🏛️ Regeringskansliet Implementation Guide - Riksdag-Regering MCP v2.2

## 📋 Översikt

Detta dokument beskriver alla förbättringar för Regeringskansliet-data, inklusive integration med g0v.se API och nya analysverktyg.

## 🎯 Nya Funktioner

### 1. g0v.se API Integration

**Problem:** Regeringskansliet har inget officiellt öppet API
**Lösning:** Integration med g0v.se som skrapat data från regeringen.se

**Fil:** `mcp/src/utils/g0vApi.ts`

**Tillgängliga dokumenttyper:**
- Propositioner
- SOU (Statens offentliga utredningar)
- Ds (Departementsserien)
- Remisser
- Regeringsuppdrag
- Pressmeddelanden
- Tal
- Uttalanden
- Debattartiklar
- Överenskommelser

**Exempel:**
```typescript
import { fetchG0vDocuments, searchG0vAllTypes } from './utils/g0vApi.js';

// Hämta propositioner
const props = await fetchG0vDocuments('propositioner', {
  search: 'klimat',
  dateFrom: '2024-01-01',
  limit: 20
});

// Sök över alla typer
const all = await searchG0vAllTypes('digitalisering', {
  types: ['pressmeddelanden', 'propositioner', 'tal'],
  limit: 10
});
```

### 2. Nya Analysverktyg

**Fil:** `mcp/src/tools/governmentAnalysis.ts`

#### A. Departement-analys
```typescript
const result = await analyzeDepartments({
  from_date: '2024-01-01',
  to_date: '2024-12-31'
});
```

**Output:**
- Antal dokument per departement
- Fördelning: pressmeddelanden, propositioner, tal
- Topplista över mest aktiva departement

#### B. Propositions-flöde
```typescript
const flow = await trackPropositionFlow({
  proposition_reference: 'Prop. 2024/25:1'
});
```

**Spårar:**
1. Regeringens proposition
2. Riksdagens behandling
3. Utskottsbetänkanden
4. Voteringar
5. Relaterade motioner

#### C. Policy-tidslinje
```typescript
const timeline = await analyzePolicyTimeline({
  topic: 'klimat',
  from_date: '2020-01-01',
  to_date: '2024-12-31'
});
```

**Visar:**
- Kronologisk ordning av alla dokument
- Månatlig aktivitet
- Fördelning per dokumenttyp

#### D. Regering vs Riksdag
```typescript
const comparison = await compareGovernmentParliament({
  topic: 'migration',
  from_date: '2024-01-01'
});
```

**Jämför:**
- Antal dokument från varje källa
- Fördelning per typ
- Aktivitetsnivå över tid

#### E. Senaste uppdateringar
```typescript
const updates = await getLatestGovernmentUpdates({
  limit: 20,
  types: ['pressmeddelanden', 'propositioner']
});
```

### 3. Förbättrad Sökning

**Fil:** `mcp/src/tools/enhancedGovernmentSearch.ts`

#### A. Unified Search
Söker i både Supabase och g0v.se samtidigt:
```typescript
const results = await searchGovernmentAll({
  query: 'försvar',
  departement: 'Försvarsdepartementet',
  from_date: '2024-01-01',
  use_g0v: true
});
```

#### B. Advanced Search
Med fulltext-sökning och filtrering:
```typescript
const results = await advancedGovernmentSearch({
  query: 'digitalisering',
  document_type: 'propositioner',
  departement: 'Finansdepartementet',
  sort_by: 'relevans'
});
```

#### C. Find Related Documents
Hitta kopplingar mellan Regering och Riksdag:
```typescript
const related = await findRelatedDocuments({
  reference: 'SOU 2024:15',
  include_riksdag: true
});
```

### 4. Supabase Schema-förbättringar

**Fil:** `mcp/migrations/002_enhance_government_data.sql`

**Nya kolumner:**
- `avsandare` - Vem som skickat dokumentet
- `kategorier` - Array av kategorier
- `url` - Länk till originaldokument
- `uppdaterad_datum` - Senaste uppdatering
- `beteckning` - Officiell beteckning (t.ex. Prop. 2024/25:1)

**Nya tabeller:**
- `regeringskansliet_tal` - Tal och anföranden
- `regeringskansliet_uppdrag` - Regeringsuppdrag

**Nya views:**
- `regeringen_all_documents` - Alla dokument samlade
- `departement_statistik` - Statistik per departement
- `propositioner_riksdag_status` - Propositioner med Riksdagsstatus

**Nya index:**
- Full-text search på titlar (svensk konfiguration)
- Index på datum, departement, beteckning
- GIN-index för snabb textsökning

## 📊 API-endpoints från g0v.se

### Tillgängliga endpoints:

1. **Dokument per typ:**
   - `/api/propositioner.json`
   - `/api/pressmeddelanden.json`
   - `/api/sou.json`
   - `/api/tal.json`
   - `/api/remisser.json`
   - m.fl.

2. **Metadata:**
   - `/api/latest_updated.json` - Senaste uppdatering
   - `/api/codes.json` - Kategori-koder
   - `/api/items.json` - Alla dokument (stor fil!)

3. **Markdown-innehåll:**
   ```
   https://www.regeringen.se/pressmeddelanden/2024/01/test/
   → https://g0v.se/pressmeddelanden/2024/01/test.md
   ```

## 🔄 Migration

### Steg 1: Uppdatera Supabase Schema
```bash
cd /tmp/riksdag-regering-mcp/mcp
supabase db push --linked

# Eller via Supabase Dashboard:
# Kör migrations/002_enhance_government_data.sql i SQL Editor
```

### Steg 2: Verifiera Nya Tabeller
```sql
-- Kolla att nya tabeller finns
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'regeringskansliet_%';

-- Kolla views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';
```

### Steg 3: Testa g0v.se Integration
```typescript
// Test basic fetch
const props = await fetchG0vDocuments('propositioner', { limit: 5 });
console.log(`Hittade ${props.length} propositioner`);

// Test search
const results = await searchG0vAllTypes('klimat');
console.log('Träffar per typ:', Object.keys(results));
```

## 🎯 Användningsexempel

### Exempel 1: Spåra en proposition från start till slut
```typescript
// 1. Sök proposition i regeringens system
const govSearch = await advancedGovernmentSearch({
  query: 'Statsbudget',
  document_type: 'propositioner',
  from_date: '2024-09-01'
});

// 2. Spåra dess väg genom systemet
const flow = await trackPropositionFlow({
  proposition_reference: govSearch.results[0].beteckning
});

// 3. Visa tidslinje
console.log('Regeringen:', flow.timeline[0].status);
console.log('Riksdagen:', flow.timeline[1].status);
console.log('Betänkanden:', flow.timeline[2].count);
console.log('Voteringar:', flow.timeline[3].count);
```

### Exempel 2: Analysera departementens aktivitet
```typescript
const analysis = await analyzeDepartments({
  from_date: '2024-01-01',
  to_date: '2024-12-31'
});

console.log('Mest aktiva departement:');
analysis.topDepartments.forEach((dept, i) => {
  console.log(`${i+1}. ${dept.departement}: ${dept.count} dokument`);
  console.log(`   - Pressmeddelanden: ${dept.pressReleases}`);
  console.log(`   - Propositioner: ${dept.propositions}`);
});
```

### Exempel 3: Jämför Regering och Riksdag
```typescript
const comparison = await compareGovernmentParliament({
  topic: 'migration',
  from_date: '2024-01-01'
});

console.log('Regeringen:', comparison.government.total, 'dokument');
console.log('Riksdagen:', comparison.parliament.total, 'dokument');
console.log('Förhållande:', comparison.comparison.ratio);
```

### Exempel 4: Hitta relaterade dokument
```typescript
const related = await findRelatedDocuments({
  reference: 'SOU 2024:15',
  include_riksdag: true
});

console.log('Regeringsdokument:', related.government.count);
console.log('Riksdagsdokument:', related.parliament.count);
console.log('Kopplingar:', related.connections.count);

related.connections.items.forEach(conn => {
  console.log(`\n${conn.government_doc.titel}`);
  console.log('→ Relaterade Riksdagsdokument:');
  conn.parliament_docs.forEach(doc => {
    console.log(`  - ${doc.titel} (${doc.doktyp})`);
  });
});
```

## 📈 Prestanda

### Cache-strategier för Regeringskansliet:
```typescript
CACHE_STRATEGIES.pressmeddelanden = 300000;  // 5 min (uppdateras ofta)
CACHE_STRATEGIES.propositioner = 3600000;    // 1 timme
CACHE_STRATEGIES.sou = 86400000;             // 24 timmar (ändras sällan)
CACHE_STRATEGIES.g0v_metadata = 3600000;     // 1 timme
```

### Rate Limiting:
- g0v.se: 60 requests/minut
- Supabase: Ingen specifik begränsning (Connection pooling)

### Index-optimering:
- Full-text search på titlar (GIN index)
- B-tree index på datum, departement
- Trigram index för fuzzy search (TODO)

## 🆕 Nya MCP Tools

### 1. `analyze_departments`
Analysera departementens aktivitet över tid.

**Parameters:**
- `from_date` - Från datum (optional)
- `to_date` - Till datum (optional)
- `includeSpeeches` - Inkludera tal (default: true)

### 2. `track_proposition_flow`
Spåra en propositions väg från Regering till Riksdag.

**Parameters:**
- `proposition_reference` - Propositionsbeteckning (required)

### 3. `analyze_policy_timeline`
Analysera policyutveckling över tid.

**Parameters:**
- `topic` - Ämne/policy-område (required)
- `from_date` - Från datum (optional)
- `to_date` - Till datum (optional)
- `include_types` - Dokumenttyper (optional)

### 4. `compare_government_parliament`
Jämför regeringens och riksdagens aktivitet.

**Parameters:**
- `topic` - Ämne (required)
- `from_date` - Från datum (optional)
- `to_date` - Till datum (optional)

### 5. `get_latest_government_updates`
Hämta senaste uppdateringar från regeringen.

**Parameters:**
- `limit` - Antal uppdateringar (default: 20)
- `types` - Dokumenttyper (optional)

### 6. `search_government_all`
Unified search i alla regeringsdokument.

**Parameters:**
- `query` - Sökfråga (required)
- `types` - Dokumenttyper (optional)
- `departement` - Departement (optional)
- `from_date`, `to_date` - Datumintervall (optional)
- `use_g0v` - Använd g0v.se API (default: true)

### 7. `advanced_government_search`
Avancerad sökning med fulltext och filtrering.

**Parameters:**
- `query` - Sökfråga (required)
- `document_type` - Dokumenttyp (required)
- `departement`, `avsandare`, `kategorier` - Filter (optional)
- `sort_by` - Sortering (default: publicerad_datum)

### 8. `find_related_documents`
Hitta relaterade dokument mellan Regering och Riksdag.

**Parameters:**
- `reference` - Referens (required)
- `include_riksdag` - Inkludera Riksdagsdokument (default: true)

## 🔗 Datakällor

### g0v.se
- **URL:** https://g0v.se/
- **GitHub:** https://github.com/civictechsweden/g0vse
- **License:** AGPLv3
- **Uppdatering:** Daglig skrapning från regeringen.se
- **Omfattning:** 26+ dokumenttyper

### Regeringen.se
- **URL:** https://www.regeringen.se/
- **Inget officiellt API** (därför används g0v.se)
- **Dokumenttyper:** Propositioner, pressmeddelanden, SOU, Ds, remisser, m.m.

### Riksdagen.se
- **URL:** https://data.riksdagen.se/
- **Officiellt API:** JA
- **Dokumenttyper:** Propositioner, motioner, betänkanden, voteringar, m.m.

## 🐛 Kända Begränsningar

### g0v.se:
- Ingen garanterad uppdateringsfrekvens
- Kan missa dokument om regeringen.se ändrar struktur
- Historisk data begränsad till när skrapningen startade

### Supabase Schema:
- Gamla tabeller kan sakna nya kolumner (kör migration)
- Full-text search kräver PostgreSQL 12+
- Views kan vara långsamma för stora dataset (använd index)

## 💡 Nästa Steg

1. **Kör migrations:**
   ```bash
   supabase db push --linked
   ```

2. **Populate data från g0v.se:**
   ```typescript
   // Skapa ett script för att fylla Supabase med g0v.se data
   const types: G0vDocumentType[] = ['propositioner', 'pressmeddelanden'];

   for (const type of types) {
     const docs = await fetchG0vDocuments(type, { limit: 100 });
     // Insert into Supabase...
   }
   ```

3. **Testa nya verktyg:**
   - analyze_departments
   - track_proposition_flow
   - compare_government_parliament

4. **Uppdatera MCP prompts:**
   - Lägg till de 8 nya verktygen
   - Uppdatera beskrivningar

5. **Dokumentera i README:**
   - g0v.se integration
   - Nya analysverktyg
   - Exempel

---

**Version:** 2.2.0
**Datum:** 2025-01-20
**Fokus:** Regeringskansliet-integration och analys
**Datakällor:** g0v.se (skrapat från regeringen.se), Supabase
