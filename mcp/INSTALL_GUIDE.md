# Installationsguide - Riksdag-Regering MCP Server

Denna guide hjälper dig att installera och konfigurera MCP servern steg för steg.

## Snabbstart

### 1. Förutsättningar

Kontrollera att du har:
- **Node.js** version 20 eller senare
- **npm** version 9 eller senare
- **Git** för att klona projektet

**API-Only Mode:** Inga databas-credentials behövs! All data hämtas live från Riksdagen och Regeringskansliet.

Verifiera dina installationer:
```bash
node --version  # Ska visa v20.0.0 eller senare
npm --version   # Ska visa 9.0.0 eller senare
```

### 2. Installation

#### Alternativ A: Från källkod (Utveckling)

```bash
# Klona repository
git clone https://github.com/KSAklfszf921/Riksdag-Regering.AI.git
cd Riksdag-Regering.AI/mcp

# Installera dependencies
npm install

# Bygg projektet
npm run build
```

#### Alternativ B: Global installation (Produktion)

```bash
# Installera globalt från katalogen
cd Riksdag-Regering.AI/mcp
npm install -g .

# Eller via npm (när publicerats)
npm install -g @riksdag-regering/mcp-server
```

### 3. Konfiguration

#### Ingen konfiguration krävs!

**API-Only Mode:** MCP-servern fungerar direkt utan några environment variables eller credentials.

Om du vill anpassa server-inställningar (valfritt):

```bash
cp .env.example .env
```

Redigera `.env` med din texteditor:

```env
# Alla inställningar är valfria
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### 4. Konfigurera MCP Client

#### För Claude Desktop

**MacOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Lägg till följande konfiguration:

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "command": "node",
      "args": ["/FULL/PATH/TO/Riksdag-Regering-MCP/mcp/dist/index.js"]
    }
  }
}
```

**Viktigt:** Ersätt `/FULL/PATH/TO/` med den faktiska sökvägen till projektet!

**Hitta din sökväg:**
```bash
# I projektkatalogen, kör:
pwd
# Kopiera utdatan och använd den i konfigurationen
```

#### För Cline (VS Code)

Lägg till i ditt projekt `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "riksdag-regering": {
      "command": "node",
      "args": ["/path/to/Riksdag-Regering-MCP/mcp/dist/index.js"]
    }
  }
}
```

### 5. Starta och testa

#### Manuell start (för testning)

```bash
cd Riksdag-Regering.AI/mcp
npm start
```

Om allt fungerar bör du se:
```
Riksdag-Regering MCP Server startad
```

#### Testa med Claude Desktop

1. Starta om Claude Desktop
2. Öppna en ny konversation
3. Testa med: "Sök efter ledamöter från Socialdemokraterna"
4. Claude bör nu kunna använda MCP servern

#### Verifiera installationen

Prova dessa kommandon i Claude:

```
"Visa alla partier i Riksdagen"
"Sök efter ledamöter från Stockholm"
"Analysera partifördelningen"
"Hämta statistik om Riksdagen"
```

## Felsökning

### Problem: "Cannot find module '@modelcontextprotocol/sdk'"

**Lösning:**
```bash
cd Riksdag-Regering.AI/mcp
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem: "Server kraschar vid start"

**Lösning:**
1. Kontrollera att Node.js version är 20 eller senare: `node --version`
2. Verifiera att projektet är byggt: `npm run build`
3. Kontrollera logs för specifika felmeddelanden
4. Starta om Claude Desktop efter att ha uppdaterat konfigurationen

### Problem: "Command failed with exit code 1"

**Lösning:**
1. Kontrollera att sökvägen till `index.js` är korrekt och absolut
2. Verifiera att filen är exekverbar:
   ```bash
   chmod +x /path/to/mcp/dist/index.js
   ```
3. Testa att köra direkt:
   ```bash
   node /path/to/mcp/dist/index.js
   ```

### Problem: "Timeout vid API-anrop"

**Lösning:**
1. Kontrollera din internetanslutning
2. Verifiera att Riksdagens API är tillgängligt: https://data.riksdagen.se
3. Kontrollera att g0v.se API fungerar
4. API:erna kan ibland vara långsamma - öka timeout-värden om nödvändigt

### Problem: TypeScript compilation errors

**Lösning:**
```bash
# Rensa och bygg om
npm run build

# Om problem kvarstår
rm -rf dist
npx tsc
```

### Problem: Claude Desktop ser inte servern

**Lösning:**
1. Kontrollera att konfigurationsfilen har korrekt JSON-syntax
2. Starta om Claude Desktop
3. Kolla Claude Desktop logs:
   - **MacOS:** `~/Library/Logs/Claude/`
   - **Windows:** `%APPDATA%\Claude\logs\`

## Uppdatering

### Uppdatera till senaste versionen

```bash
cd Riksdag-Regering.AI/mcp

# Hämta senaste koden
git pull origin main

# Installera nya dependencies
npm install

# Bygg om
npm run build

# Starta om Claude Desktop
```

## Avinstallation

### Ta bort MCP servern

```bash
# Ta bort från Claude Desktop config
# Redigera claude_desktop_config.json och ta bort "riksdag-regering" delen

# Ta bort projektet
rm -rf Riksdag-Regering.AI

# Om globalt installerad
npm uninstall -g @riksdag-regering/mcp-server
```

## Nästa steg

Efter installation, se:
- [README.md](README.md) för översikt
- [USAGE_GUIDE.md](USAGE_GUIDE.md) för användarexempel
- [CHANGELOG.md](CHANGELOG.md) för versionsinformation

## Support

Om du får problem:

1. Kontrollera [felsökningssektionen](#felsökning) ovan
2. Läs igenom [README.md](README.md) för mer detaljer
3. Öppna ett issue på GitHub
4. Kontakta projektets maintainers

## Tips för framgång

- **Använd absoluta sökvägar** i all MCP konfiguration
- **Starta om klienten** efter konfigurationsändringar
- **Kolla logs** vid problem
- **Testa stegvis** - börja med enkla kommandona
- **Backup konfiguration** innan du gör ändringar
