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

### Alternativ 3: Individuella Skript (Rekommenderat för granulär kontroll)

Kör varje entitet separat för att följa testrapportens ordning och få detaljerad statistik per steg.

#### Steg 1: Motioner (1–2 minuter)

```bash
npx tsx scripts/backfill-motioner.ts --rm=2025/26
# Med limit
npx tsx scripts/backfill-motioner.ts --rm=2024/25 --limit=1000
```

- Riksmöte-specifik import
- Automatisk utskottskods-extrahering från beteckning
- Statistik per utskott efter import

#### Steg 2: Propositioner (1–2 minuter)

```bash
npx tsx scripts/backfill-propositioner.ts --rm=2025/26
```

- Riksmöte-specifik import
- Organ-kod extrahering och statistik

#### Steg 3: Betänkanden (2–3 minuter)

```bash
# Alla betänkanden för ett riksmöte
npx tsx scripts/backfill-betankanden.ts --rm=2025/26

# Specifikt utskott
npx tsx scripts/backfill-betankanden.ts --rm=2025/26 --utskott=KU
```

- Riksmöte-specifik import
- Utskott-filter (--utskott=KU/FiU/UU/etc.)
- Utskottskod-extrahering från beteckning ("2024/25:KU5" → "KU")

#### Steg 4: Individuella röster (3–5 minuter)

```bash
# För riksmöte
npx tsx scripts/backfill-votering-ledamoter.ts --riksmote=2025/26

# För specifik votering
npx tsx scripts/backfill-votering-ledamoter.ts --votering-id=55D02CA6-1543-4CB5-822E-D3A5B44B49D9
```

- Batch-processing i chunkar om 1000 röster
- Progress per votering och parti-statistik (Ja/Nej/Avstår/Frånvarande)
- Automatisk fördröjning mellan API-anrop (100 ms)
- ⚠️ Resurskrävande – uppskattat 3–5 min för 100 voteringar

#### Steg 5: Organ-kod population (<1 minut)

```bash
# Populera alla riksmöten
npx tsx scripts/backfill-organ-codes.ts --all-riksmotes

# Dry run (ingen ändring)
npx tsx scripts/backfill-organ-codes.ts --all-riksmotes --dry-run

# Specifikt riksmöte
npx tsx scripts/backfill-organ-codes.ts --rm=2025/26
```

- Extraherar organ-kod från dok_id och beteckning
- Känner igen 15+ svenska utskottskoder (KU, FiU, SkU, UU, SoU, JuU, CU, NU, KrU, UbU, AU, FöU, TU, BoU, SfU, MJU)
- Dry-run mode för säker testning

#### Steg 6: Validera

```bash
npx tsx scripts/validate-backfill.ts
```

**Förväntat resultat per steg:**
- Motioner: ~500 poster per riksmöte, utskottsfördelning loggas
- Propositioner: ~75 poster
- Betänkanden: ~200–300 poster eller färre med utskottsfilter
- Votering Ledamöter: ~2,800+ individuella röster för 100 voteringar
- Organ-koder: majoriteten av dokument får utskottskod

### Estimerad Total Tid

| Steg | Datamängd | Tid |
|------|-----------|-----|
| Motioner | ~500 | 1–2 min |
| Propositioner | ~75 | 1–2 min |
| Betänkanden | ~200–300 | 2–3 min |
| Votering Ledamöter | ~2,800 | 3–5 min |
| Organ-kod population | ~500–800 | <1 min |
| **TOTALT** | **~4,000–5,000** | **~10 min** |

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
