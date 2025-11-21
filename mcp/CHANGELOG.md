# Changelog

Alla betydande ändringar i detta projekt dokumenteras i denna fil.

Formatet baseras på [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
och detta projekt följer [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-19

### ⚠️ BREAKING CHANGES
- Version 2.0 med omfattande förbättringar och nya funktioner
- Uppdaterad arkitektur med säkerhetsvalidering

### Tillagd

#### Säkerhet och Validering
- **Tabellvalidering**: Ny `validation.ts` modul som säkerställer att MCP servern ENDAST använder data från Riksdagen och Regeringskansliet
- Lista över 48 tillåtna tabeller (20 för Riksdagen, 28 för Regeringskansliet)
- `validateTable()` funktion som blockerar åtkomst till icke-auktoriserade tabeller
- `safeQuery()` helper för säkra databasanrop

#### Nya Verktygsgrupper (13 nya verktyg)

**Hämtningsverktyg (Fetch Tools) - 8 st:**
- `get_dokument`: Hämta specifikt dokument med alla detaljer
- `get_ledamot`: Hämta fullständig information om ledamot inkl. uppdrag
- `get_motioner`: Hämta motioner från Riksdagen
- `get_propositioner`: Hämta propositioner från Riksdagen
- `get_betankanden`: Hämta betänkanden från utskotten
- `get_fragor`: Hämta frågor (muntliga och skriftliga)
- `get_interpellationer`: Hämta interpellationer
- `get_utskott`: Hämta lista över alla utskott

**Aggregeringsverktyg (Aggregate Tools) - 5 st:**
- `get_data_summary`: Sammanställning av all data i systemet
- `analyze_parti_activity`: Detaljerad partiaktivitetsanalys över tid
- `analyze_riksmote`: Analysera specifikt riksmöte
- `get_top_lists`: Toplistor för talare, partier, utskott, dokumenttyper
- `global_search`: Sök över alla tabeller samtidigt

#### Förbättrade Funktioner
- Automatisk fallback till `riksdagen_dokument` för specialiserade tabeller
- Bättre felhantering med specifika felmeddelanden
- Utökad statistik och aggregering
- Support för fler dokumenttyper från båda källor

### Ändrad

#### Arkitekturförbättringar
- Uppdaterad `index.ts` med stöd för totalt 27 verktyg (från 14)
- Förbättrad modulär struktur med separata filer för olika verktygstyper
- Bättre typsäkerhet genom hela kodbasen
- Utökad dokumentation i kodfiler

#### Prestanda
- Optimerade databas-queries
- Bättre hantering av stora datamängder
- Reducerad minnesanvändning

### Statistik

**Kodstorlek:**
- Totalt: ~2200 rader kompilerad TypeScript
- 5 verktygsmoduler
- 3 utils-moduler
- 1 resources-modul

**Verktyg:**
- 5 sökverktyg
- 5 analysverktyg
- 4 jämförelseverktyg
- 8 hämtningsverktyg
- 5 aggregeringsverktyg
= **27 verktyg totalt**

**Resources:**
- 5 tillgängliga resurser

**Databastabeller:**
- 48 tillåtna tabeller
- 20 Riksdagen-tabeller
- 28 Regeringskansliet-tabeller

### Säkerhet
- ✅ Validering av alla tabellåtkomster
- ✅ Endast data från Riksdagen och Regeringskansliet tillåts
- ✅ Blockering av icke-auktoriserade datakällor
- ✅ Förbättrad error handling

---

## [1.0.0] - 2025-11-19

### Tillagd

#### Core funktionalitet
- Initial release av Riksdag-Regering MCP Server
- Komplett TypeScript implementation
- Supabase integration för dataåtkomst

#### Sökverktyg (Search Tools)
- `search_ledamoter` - Sök efter ledamöter med filter för namn, parti, valkrets och status
- `search_dokument` - Sök efter Riksdagsdokument med stöd för dokumenttyp, riksmöte, organ och datum
- `search_anforanden` - Sök efter anföranden med filter för talare, parti och text
- `search_voteringar` - Sök efter voteringar med filter för titel, riksmöte och datum
- `search_regering` - Sök i Regeringskansliets dokument (pressmeddelanden, propositioner, SOU, etc.)

#### Analysverktyg (Analysis Tools)
- `analyze_partifordelning` - Analysera fördelning av ledamöter per parti
- `analyze_votering` - Detaljerad analys av röstningsresultat med partifördelning
- `analyze_ledamot` - Analysera en ledamots aktivitet och röstningsstatistik
- `analyze_dokument_statistik` - Statistisk analys av dokument per typ och organ
- `analyze_trend` - Trendanalys över tid med gruppering per dag, vecka, månad eller år

#### Jämförelseverktyg (Comparison Tools)
- `compare_ledamoter` - Jämför två ledamöters aktivitet och röstningsstatistik
- `compare_parti_rostning` - Jämför partiernas röstbeteende mellan två voteringar
- `compare_riksdag_regering` - Jämför dokument från Riksdagen och Regeringen om samma ämne
- `compare_partier` - Jämför aktivitet och statistik mellan två partier

#### Resources
- `riksdagen://ledamoter` - Lista över alla ledamöter
- `riksdagen://partier` - Översikt över alla partier med antal ledamöter
- `riksdagen://dokument/typer` - Lista över dokumenttyper med antal dokument
- `regeringen://departement` - Lista över departement med antal dokument
- `riksdagen://statistik` - Sammanställd statistik över all data

#### Dokumentation
- Omfattande README.md med installation och användning
- USAGE_GUIDE.md med praktiska exempel och användarfall
- INSTALL_GUIDE.md med steg-för-steg installation
- Inline JSDoc kommentarer i all kod

---

## [Unreleased]

### Planerat
- Caching för bättre prestanda
- Webhooks för realtidsuppdateringar
- Export-funktionalitet (CSV, Excel, PDF)
- Visualiseringsverktyg
- AI-driven sammanfattning av dokument
- Sentiment-analys av anföranden
- Prediktiv analys av röstningar
- GraphQL API
- WebSocket support för realtidsdata
- Multispråksstöd (Svenska/Engelska)

### Under utveckling
- Rate limiting
- Advanced logging och monitoring
- Comprehensive test suite
- Performance benchmarks
- API usage analytics

---

## Versionshistorik Format

### [Version] - YYYY-MM-DD

#### Tillagd (Added)
För ny funktionalitet

#### Ändrad (Changed)
För ändringar i befintlig funktionalitet

#### Föråldrad (Deprecated)
För funktioner som snart kommer tas bort

#### Borttagen (Removed)
För borttagna funktioner

#### Fixad (Fixed)
För buggfixar

#### Säkerhet (Security)
För säkerhetsuppdateringar

## 2.1.0 - 2025-11-21
- 🔥 Tog bort samtliga Supabase-beroenden. Servern använder nu endast öppna API:er.
- ✨ Omskriven verktygslista (21 verktyg) baserad på direkta anrop.
- 🧹 Dokumentation och exempel uppdaterade för den nya arkitekturen.
