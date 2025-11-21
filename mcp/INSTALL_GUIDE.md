# Installationsguide

## Krav
- Node.js 20+
- npm eller pnpm

## Steg

1. **Kloning och installation**
   ```bash
   git clone https://github.com/KSAklfszf921/Riksdag-Regering.AI.git
   cd Riksdag-Regering.AI/mcp
   npm install
   ```

2. **Bygg**
   ```bash
   npm run build
   ```

3. **Kör STDIO (lokalt)**
   ```bash
   node dist/index.js
   ```
   Lägg till kommandot i `claude_desktop_config.json` eller motsvarande MCP-klient.

4. **Kör HTTP**
   ```bash
   node dist/server.js
   ```
   Sätt valfri `API_KEY` för att skydda endpointen.

## Felsökning

- Kontrollera att `https://data.riksdagen.se` svarar – servern kräver internet mot detta API.
- Sätt `RIKSDAG_USER_AGENT` om du behöver imitera annan user agent (default är `Wget/1.21`).
- Använd `DEBUG=1 node dist/server.js` för extra loggar.
