# Deployment Guide - Riksdag-Regering.AI

## 📋 Förberedelser

### 1. Miljövariabler
Se till att följande miljövariabler är konfigurerade i `.env`:
```env
VITE_SUPABASE_PROJECT_ID="kufkpsoygixjaotmadvw"
VITE_SUPABASE_PUBLISHABLE_KEY="[din-anon-key]"
VITE_SUPABASE_URL="https://kufkpsoygixjaotmadvw.supabase.co"
```

### 2. Supabase CLI Installation
```bash
# Om du inte har Supabase CLI installerad
npm install -g supabase

# Logga in på Supabase
supabase login

# Länka till projektet
supabase link --project-ref kufkpsoygixjaotmadvw
```

## 🚀 Deployment Steg

### Steg 1: Kör Database Migrations

Kör migrations i följande ordning för att uppdatera databasen med alla nya fält och tabeller:

```bash
# 1. Basstruktur för Riksdagen data
supabase db push --file supabase/migrations/20251101201500_riksdagen_basdata.sql

# 2. Dokumenttyper
supabase db push --file supabase/migrations/20251101223000_riksdagen_dokumenttyper.sql

# 3. Ledamöter utökad info
supabase db push --file supabase/migrations/20251101223300_riksdagen_ledamoter_extended.sql

# 4. Sagt och Gjort CSV-import
supabase db push --file supabase/migrations/20251101223500_riksdagen_sagt_och_gjort.sql

# 5. NYA: Utökade API-fält och nya tabeller
supabase db push --file supabase/migrations/20251102_extended_riksdagen_data.sql
```

### Steg 2: Uppdatera Edge Functions

```bash
# Deploy uppdaterad Edge Function med nya typer
supabase functions deploy fetch-riksdagen-data --project-ref kufkpsoygixjaotmadvw
```

### Steg 3: Uppdatera Frontend

```bash
# Bygg produktionsversion
npm run build

# Deploy till din hosting (t.ex. Vercel, Netlify)
npm run deploy
```

## 🔍 Verifiera Deployment

### Test 1: Kontrollera Databastabeller
```sql
-- Kör i Supabase SQL Editor
-- Kontrollera nya fält i ledamöter
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'riksdagen_ledamoter'
ORDER BY ordinal_position;

-- Kontrollera nya tabeller
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'riksdagen_%'
ORDER BY table_name;
```

### Test 2: Testa Edge Functions
```bash
# Testa med nya parametrar
curl -X POST https://kufkpsoygixjaotmadvw.supabase.co/functions/v1/fetch-riksdagen-data \
  -H "Authorization: Bearer [din-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "dokument",
    "rm": "2024/25",
    "organ": "KU",
    "searchterm": "demokrati",
    "maxPages": 1
  }'
```

### Test 3: Verifiera Frontend
1. Öppna applikationen
2. Logga in som admin
3. Gå till Admin Dashboard
4. Testa "Hämta Data" med nya filterparametrar
5. Verifiera att nya fält visas i resultaten

## 📊 Nya Funktioner

### Utökade API-parametrar
- **Dokumentsökning**: organ, searchterm, mottagare, aktivitet
- **Ledamöter**: kontaktinfo, sociala medier, uppdrag
- **Anföranden**: video/audio-URL, talartid, replik
- **Voteringar**: röstningsstatistik, individuella röster

### Nya Databastabeller
- `riksdagen_ledamoter_uppdrag` - Ledamöters uppdrag
- `riksdagen_dokument_forslag` - Förslagspunkter i dokument
- `riksdagen_dokument_referenser` - Referenser mellan dokument
- `riksdagen_voteringar_roster` - Individuella röster
- `riksdagen_parti_statistik` - Partistatistik
- `riksdagen_dokument_sou` - SOU-dokument
- `riksdagen_dokument_direktiv` - Direktiv
- `riksdagen_dokument_eu` - EU-dokument
- `riksdagen_sagt_och_gjort_link` - Kopplingar för CSV-data

### Nya Views
- `riksdagen_dokument_full` - Fullständig dokumentvy
- `riksdagen_sagt_och_gjort_aggregated` - Aggregerad statistik

## 🐛 Felsökning

### Problem: Migration misslyckas
```bash
# Kontrollera status
supabase db migrations list

# Återställ om nödvändigt
supabase db reset --db-url postgresql://[connection-string]
```

### Problem: Edge Function fel
```bash
# Kontrollera loggar
supabase functions logs fetch-riksdagen-data --project-ref kufkpsoygixjaotmadvw
```

### Problem: TypeScript-fel
```bash
# Generera nya typer från databasen
supabase gen types typescript --project-id kufkpsoygixjaotmadvw > src/types/supabase.ts
```

## 📚 Dokumentation

För mer information om de nya funktionerna, se:
- [API Improvements](./API_IMPROVEMENTS_2025-11.md)
- [Extended Types](../supabase/functions/fetch-riksdagen-data/extended-types.ts)
- [Migration Scripts](../supabase/migrations/)

## ✅ Checklist

- [ ] Miljövariabler konfigurerade
- [ ] Supabase CLI installerad och konfigurerad
- [ ] Database migrations körda i rätt ordning
- [ ] Edge Functions uppdaterade
- [ ] Frontend byggd och deployad
- [ ] Funktionstester genomförda
- [ ] Admin-användare har tillgång till nya funktioner
- [ ] CSV-import förberett (om tillämpligt)

## 🆘 Support

Vid problem eller frågor:
1. Kontrollera loggarna i Supabase Dashboard
2. Se felsökningsavsnittet ovan
3. Öppna en issue på GitHub