# Rapport: Supabase-borttagning och API-baserad MCP

## Vad som ändrades
- MCP-startpunkterna (STDIO och HTTP) kör nu utan Supabase-konfiguration och loggar att all data hämtas direkt från Riksdagen/Regeringskansliet, vilket matchar den nya driftsmodellen.
- Supabase-klienten har ersatts av en pseudo-klient som översätter befintliga "from"-anrop till direkta API-kall mot `data.riksdagen.se` och g0v.se. Läsoperationer filtreras i minnet och skrivoperationer (`insert`, `upsert`) är no-ops.

## Syfte
- Eliminera beroendet av Supabase-konton och credientials.
- Säkerställa att dokument och hämtningar bara hanteras via öppna API-anrop från Riksdagen och Regeringskansliet.
- Behålla befintliga kodvägar ("supabase.from(...)") men låta dem konsumera direkta API-svar, så att övriga verktyg kan köras utan schemaändringar.

## Vidare instruktioner för färdigställande
1. **Verifiera runtime utan Supabase-nycklar**
   - Starta MCP:n via `npm run mcp:dev` eller motsvarande och kontrollera att loggraden om "Pseudo-Supabase" visas vid start.
2. **Bekräfta API-täckning per verktyg**
   - Kör några manuella verktygskall (t.ex. `tools/call` för dokument, anföranden, ledamöter) och säkerställ att filtrering och sortering fungerar som väntat trots att de nu sker i minnet.
3. **Planera cachning och felhantering**
   - Bedöm behov av caching/throttling eftersom all data hämtas live. Lägg till cachelager om API:erna når hastighetsbegränsningar.
4. **Stäng av kvarvarande Supabase-sekretess**
   - Ta bort eventuella SUPABASE_* miljövariabler i deployment-miljöer så att konfigurationen inte skapar förvirring.
