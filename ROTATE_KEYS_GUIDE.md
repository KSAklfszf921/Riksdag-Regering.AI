# 🚨 KRITISKT: Rotera Supabase API-nycklar NU!

## Problem
Din anon key är fortfarande samma som den exponerade nyckeln:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Zmtwc295Z2l4amFvdG1hZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzY1MjIsImV4cCI6MjA3NzUxMjUyMn0.gvnJSZ4qYRE7ndKIljoc0xWL5RpP1Im7JIQLASDAsCc
```

**DENNA NYCKEL ÄR KOMPROMETTERAD OCH MÅSTE BYTAS UT!**

## Steg-för-steg guide för att rotera nycklar

### 1. Öppna Supabase Dashboard
Gå till: https://supabase.com/dashboard/project/kufkpsoygixjaotmadvw/settings/api

### 2. Generera nya nycklar
1. Scrolla ner till **"JWT Settings"** sektionen
2. Klicka på **"Generate new JWT Secret"** knappen
3. Du får en varning - bekräfta genom att klicka **"Generate new secret"**

### 3. Vänta på att nycklarna regenereras
- Det tar cirka 30 sekunder
- Sidan kommer att ladda om automatiskt
- NYA nycklar kommer att visas

### 4. Kopiera de NYA nycklarna
Efter regenerering, kopiera:
- **anon (public)** - Den nya publika nyckeln (ska INTE vara samma som ovan!)
- **service_role** - Om du använder den någonstans

### 5. Verifiera att nycklarna är NYA
Den nya anon-nyckeln ska:
- Ha ett ANNAT värde än den gamla
- Fortfarande börja med `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- Men ha en helt annan slutdel

## Varför detta är kritiskt

De gamla nycklarna är exponerade i:
- Git-historiken (även om vi rensat den, kan folk ha gamla kopior)
- Potentiellt i cacher, loggar, etc.

Vem som helst med den gamla nyckeln kan:
- Läsa data från din databas
- Potentiellt skriva data (beroende på RLS policies)
- Förbruka din Supabase-kvot

## När du har de NYA nycklarna

Säg till mig så hjälper jag dig att:
1. Uppdatera .env filen
2. Uppdatera GitHub Secrets
3. Verifiera att allt fungerar

**VIKTIGT: Gör detta NU innan någon utnyttjar de exponerade nycklarna!**