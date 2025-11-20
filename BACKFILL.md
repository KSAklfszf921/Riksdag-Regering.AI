# Backfill Guide - Riksdag & Regering MCP Server

## Översikt

Detta dokument beskriver hur man kör backfill-processen för att populera Supabase-databasen med historisk och aktuell data från Riksdagen och Regeringskansliet.

## Status

✅ **Systemet är backfill-ready** - Alla funktioner implementerade och testade.

## Implementerade Funktioner

### Riksdagen Data

| Funktion | Beskrivning | Status |
|----------|-------------|--------|
| `backfillLedamoter` | Importerar riksdagsledamöter | ✅ Klar |
| `backfillVoteringar` | Importerar voteringssammanfattningar | ✅ Klar |
| `backfillFragor` | Importerar frågor till regeringen | ✅ Klar |
| `backfillInterpellationer` | Importerar interpellationer | ✅ Klar |
| `backfillMotioner` | Importerar motioner med organ-extrahering | ✅ Klar |
| `backfillPropositioner` | Importerar propositioner | ✅ Klar |
| `backfillBetankanden` | Importerar betänkanden med utskottskod-extrahering | ✅ Klar |
| `backfillVoteringLedamoter` | Importerar individuella röstningsdata | ✅ Klar |

### Specialfunktioner

- **Organ-kod extrahering**: Automatisk extrahering av utskottskoder från beteckning (ex: "2024/25:KU5" → organ="KU")
- **Duplicate handling**: Upsert med `resolution=merge-duplicates` förhindrar dubbletter
- **Felhantering**: Graceful degradation vid API-fel

## Förutsättningar

### 1. Miljövariabler

Skapa `.env` fil eller exportera miljövariabler:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Viktigt:** Använd **SERVICE_ROLE_KEY**, inte ANON_KEY, för backfill-operationer.

### 2. Node.js Dependencies

```bash
# Installera dependencies
npm install

# Eller i mcp-mappen
cd mcp && npm install
```

### 3. Verifiera databas-access

```bash
# Testa anslutning
curl "${SUPABASE_URL}/rest/v1/riksdagen_ledamoter?select=count" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Prefer: count=exact"
```

## Körning av Backfill

### Alternativ 1: Importera alla entiteter (Standard)

```bash
npx tsx scripts/backfill_supabase.ts
```

Detta importerar:
- Ledamöter
- Voteringar
- Frågor
- Interpellationer

### Alternativ 2: Importera specifika entiteter

```bash
# Endast nya dokumenttyper
npx tsx scripts/backfill_supabase.ts \
  --entities=motioner,propositioner,betankanden,votering_ledamoter

# Endast motioner
npx tsx scripts/backfill_supabase.ts --entities=motioner

# Endast röstningsdata
npx tsx scripts/backfill_supabase.ts --entities=votering_ledamoter
```

### Alternativ 3: Steg-för-steg Import

#### Steg 1: Grunddata (1-2 minuter)

```bash
npx tsx scripts/backfill_supabase.ts \
  --entities=ledamoter,voteringar,fragor,interpellationer
```

**Förväntat resultat:**
- ~300-350 ledamöter
- ~100+ voteringar
- ~50+ frågor
- ~50+ interpellationer

#### Steg 2: Motioner (1-2 minuter)

```bash
npx tsx scripts/backfill_supabase.ts --entities=motioner
```

**Förväntat resultat:**
- ~500 motioner från senaste riksmötet
- Organ-kod extraherad för betänkanden

#### Steg 3: Propositioner (1-2 minuter)

```bash
npx tsx scripts/backfill_supabase.ts --entities=propositioner
```

**Förväntat resultat:**
- ~75+ propositioner
- Mappade till Riksdagsbehandling

#### Steg 4: Betänkanden (2-3 minuter)

```bash
npx tsx scripts/backfill_supabase.ts --entities=betankanden
```

**Förväntat resultat:**
- ~200-300 betänkanden
- Utskottskoder extraherade (KU, FiU, UU, etc.)

#### Steg 5: Individuella röster (3-5 minuter)

```bash
npx tsx scripts/backfill_supabase.ts --entities=votering_ledamoter
```

**Förväntat resultat:**
- ~2,800+ individuella röster (100 voteringar × ~349 ledamöter)
- Parti-aggregering tillgänglig

**⚠️ Notering:** Detta steg är resurskrävande - kör under lågtrafik-tid.

### Estimerad Total Tid

| Steg | Datamängd | Tid |
|------|-----------|-----|
| Grunddata | ~500-600 | 1-2 min |
| Motioner | ~500 | 1-2 min |
| Propositioner | ~75 | 1-2 min |
| Betänkanden | ~200-300 | 2-3 min |
| Votering Ledamöter | ~2,800 | 3-5 min |
| **TOTALT** | **~4,000-5,000** | **~10 min** |

## Validering

### Efter varje import

```bash
npx tsx scripts/validate-backfill.ts
```

**Output exempel:**
```
═══════════════════════════════════════════════════════
  RIKSDAG-REGERING MCP BACKFILL VALIDATION
═══════════════════════════════════════════════════════

📊 Validating Base Data...
✅ Ledamöter: 349 rows
✅ Frågor: 152 rows
✅ Interpellationer: 89 rows

📄 Validating Dokument Data...
✅ Motioner: 512 rows
✅ Propositioner (Riksdagen): 78 rows
✅ Betänkanden: 267 rows
✅ Dokument med organ-kod: 345 rows

🗳️  Validating Voting Data...
✅ Voteringar (summaries): 108 rows
✅ Votering Ledamöter (individual votes): 2,847 rows

═══════════════════════════════════════════════════════
  SUMMARY
═══════════════════════════════════════════════════════
✅ Success: 9
⚠️  Warnings: 0
❌ Errors: 0

✅ Validation PASSED - all tables populated correctly
```

### Validera specifik tabell

Du kan också validera manuellt via Supabase REST API:

```bash
# Räkna motioner
curl "${SUPABASE_URL}/rest/v1/riksdagen_dokument?select=count&doktyp=eq.mot" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Prefer: count=exact"

# Räkna röster
curl "${SUPABASE_URL}/rest/v1/riksdagen_votering_ledamoter?select=count" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Prefer: count=exact"
```

## Felsökning

### Problem 1: "API timeout" eller långsamma anrop

**Orsak:** data.riksdagen.se API är långsamt eller har rate limiting.

**Lösning:**
```bash
# Vänta och försök igen
sleep 300  # 5 minuter
npx tsx scripts/backfill_supabase.ts --entities=motioner
```

### Problem 2: Dubbletter efter omkörd import

**Orsak:** Skriptet kördes flera gånger utan merge.

**Lösning:**
```bash
# Hitta och radera dubbletter
npx tsx scripts/clean-duplicates.ts

# Dry run först
npx tsx scripts/clean-duplicates.ts --dry-run

# Rensa specifik tabell
npx tsx scripts/clean-duplicates.ts --table riksdagen_dokument
```

### Problem 3: "Supabase upsert failed"

**Orsak:** Fel API-key eller saknad tabell i schema.

**Lösning:**
```bash
# Verifiera API-key
echo $SUPABASE_SERVICE_ROLE_KEY | cut -c1-20

# Kontrollera tabeller finns
curl "${SUPABASE_URL}/rest/v1/riksdagen_dokument?select=count&limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
```

### Problem 4: Röstningsdata tom efter import

**Orsak:** Inga voteringar i API:et eller ID-mapping misslyckades.

**Lösning:**
```bash
# Kör om med verbose logging
NODE_ENV=development npx tsx scripts/backfill_supabase.ts \
  --entities=votering_ledamoter
```

## Säkerhetskopiering

### Före backfill

```bash
# Exportera nuvarande data
curl "${SUPABASE_URL}/rest/v1/riksdagen_dokument?select=*" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" > backup-before-backfill.json
```

### Efter backfill

```bash
# Skapa PostgreSQL dump (om direkt access finns)
pg_dump riksdag_regering > backup-after-backfill-$(date +%Y%m%d).sql

# Eller via Supabase Dashboard:
# Dashboard → Database → Backups → Create Backup
```

## Rollback

Om något går fel:

### Alternativ 1: Ta bort importerade poster

```bash
# Radera alla motioner
curl -X DELETE "${SUPABASE_URL}/rest/v1/riksdagen_dokument?doktyp=eq.mot" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

# Radera alla röster
curl -X DELETE "${SUPABASE_URL}/rest/v1/riksdagen_votering_ledamoter" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

### Alternativ 2: Återställ från backup

```bash
# Om PostgreSQL dump finns
psql -d riksdag_regering < backup-pre-backfill.sql

# Eller via Supabase Dashboard:
# Dashboard → Database → Backups → Restore
```

## Automatisk Uppdatering (Framtida)

För kontinuerlig synkronisering, sätt upp cron job:

```bash
# Uppdatera dagligen kl. 02:00
0 2 * * * cd /path/to/Riksdag-Regering-MCP && \
  npx tsx scripts/backfill_supabase.ts \
  --entities=motioner,propositioner,betankanden,votering_ledamoter
```

## Nästa Steg Efter Backfill

1. ✅ Verifiera data med `validate-backfill.ts`
2. ✅ Testa MCP API-endpoints
3. ✅ Uppdatera dokumentation med faktiska datamängder
4. ✅ Aktivera monitoring (om tillämpligt)
5. ✅ Säkerhetskopiera databasen

## Support

Vid problem:
1. Kontrollera miljövariabler är korrekt satta
2. Verifiera databas-access med curl
3. Kolla logs för specifika felmeddelanden
4. Använd `--dry-run` mode för testning
5. Kontakta [isak.skogstad@me.com](mailto:isak.skogstad@me.com)

## Referenser

- [Riksdagens Öppna Data API](https://data.riksdagen.se/)
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [MCP Server Implementation](./mcp/README.md)

---

**Version:** 2.0.0
**Senast uppdaterad:** 2025-11-20
**Status:** ✅ Production Ready
