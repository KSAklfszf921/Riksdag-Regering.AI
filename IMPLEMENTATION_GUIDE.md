# Implementationsguide (uppdaterad)

Den här guiden har uppdaterats i och med version 2.1 där alla Supabase-beroenden har tagits bort. MCP-servern hämtar nu data direkt från:

- `https://data.riksdagen.se` för dokument, ledamöter och anföranden
- `https://g0v.se/api` för Regeringskansliets pressmeddelanden, propositioner och SOU

## Vad innebär förändringen?

- Ingen databas behöver provisioneras. All data hämtas live vid varje anrop.
- `.env` behöver inte längre innehålla Supabase URL eller nycklar.
- Alla tidigare instruktioner om migrationer, policies och RLS är borttagna.
- Logging sker via standardutmatning (stdout/stderr) och kan fångas upp av din hosting-plattform.

## Lokal utveckling

1. Klona projektet och installera beroenden:
   ```bash
   git clone https://github.com/KSAklfszf921/Riksdag-Regering.AI.git
   cd Riksdag-Regering.AI
   npm run mcp:install
   ```
2. Bygg och starta MCP-servern:
   ```bash
   cd mcp
   npm run build
   npm start
   ```
3. Lägg till servern i din MCP-klient (Claude, ChatGPT, Codex) via STDIO eller HTTP.

## Deployment

- Remote-servern som hostas på Render använder samma build-kommandon (`npm run build` följt av `node dist/server.js`).
- Valfri hosting-plattform fungerar så länge Node.js 20+ finns tillgängligt.
- Sätt miljövariabeln `API_KEY` om du vill kräva `x-api-key` för `/mcp`-endpointen.

## Vidare läsning

- [README.md](README.md) – detaljerade funktioner och verktyg
- [SECURITY.md](SECURITY.md) – säkerhetsrekommendationer för den nya arkitekturen
- [mcp/README.md](mcp/README.md) – paketbeskrivning på npm
