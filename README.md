<img width="1360" height="497" alt="Skärmavbild 2025-11-20 kl  09 01 01" src="https://github.com/user-attachments/assets/2d1daf29-80f0-4404-b01a-4cc3705bcf69" />

# Riksdag & Regering MCP-server  

[![Server Status](https://img.shields.io/website?url=https%3A%2F%2Friksdag-regering-ai.onrender.com%2Fhealth&label=Server%20Status&up_message=online&down_message=offline)](https://riksdag-regering-ai.onrender.com/health)
[![MCP Protocol](https://img.shields.io/badge/MCP%20Protocol-2024--11--05-blue?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTEyIDJMMiA3VjE3TDEyIDIyTDIyIDE3VjdMMTIgMloiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🇺🇸 Open-source MCP-server for local self-hosting or remote deployment. Enables LLMs to query and retrieve real-time open data, documents, protocols, and records from accessible API:s and open databases from the Parliament and Government Offices of Sweden.

🇸🇪 MCP-server som ger LLMs möjlighet att söka, hitta och extrahera öppen data och information från Riksdagen och Regeringskansliet. Ansluten till samtliga öppna API:er från Riksdagen och nyttjar g0v.se för att tillgå data från Regeringskansliet. 

---

## Snabbstart

### Alternativ 1: Remote Server (Rekommenderat)

Använd den hostade servern utan installation - alltid uppdaterad och tillgänglig!

**Fördelar:**
- ✅ Ingen installation eller konfiguration
- ✅ Alltid senaste versionen
- ✅ Fungerar direkt i alla MCP-klienter

#### För Claude Desktop (macOS/Windows)

```bash
claude mcp add riksdag-regering --transport http https://riksdag-regering-ai.onrender.com/mcp
```

<details>
<summary>Eller lägg till manuellt i config</summary>

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "transport": "http",
      "url": "https://riksdag-regering-ai.onrender.com/mcp"
    }
  }
}
```
</details>

#### För ChatGPT (GPT-4.5+)

1. Gå till **ChatGPT Settings → MCP Servers**
2. Klicka på **"Add Server"**
3. Välj **"Remote Server (HTTP)"**
4. Ange URL: `https://riksdag-regering-ai.onrender.com/mcp`
5. Namn: `riksdag-regering`
6. Klicka **"Save"**

#### För OpenAI Codex / Claude Code

```bash
# Via MCP CLI
mcp add riksdag-regering https://riksdag-regering-ai.onrender.com/mcp

# Eller testa direkt med curl
curl -X POST https://riksdag-regering-ai.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

### 📦 Alternativ 2: npm Package (Rekommenderat för utvecklare)

Installera direkt från npm registry:

**Fördelar:**
- ✅ Enkel installation med ett kommando
- ✅ Automatiska uppdateringar via npm
- ✅ Fungerar i alla MCP-kompatibla miljöer

```bash
# Installera globalt
npm install -g riksdag-regering-mcp

# Eller installera lokalt i ditt projekt
npm install riksdag-regering-mcp
```

#### STDIO-konfiguration för Claude Desktop

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "command": "npx",
      "args": ["riksdag-regering-mcp"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

---

### 💻 Alternativ 3: Lokal Installation från Källkod

För utveckling eller om du vill modifiera servern lokalt:

**Fördelar:**
- ✅ Full kontroll över data och prestanda
- ✅ Kan anpassa och utöka funktionalitet
- ✅ Fungerar offline (efter initial setup)

```bash
# Klona repository
git clone https://github.com/KSAklfszf921/Riksdag-Regering.AI.git
cd Riksdag-Regering.AI

# Installera dependencies
npm run mcp:install

# Konfigurera miljövariabler
cd mcp
cp .env.example .env
# Redigera .env med dina Supabase-credentials

# Bygg och starta
npm run build
npm start
```

<details>
<summary>Lokal STDIO-konfiguration för Claude Desktop</summary>

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "command": "node",
      "args": ["/absolut/sökväg/till/Riksdag-Regering.AI/mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```
</details>

---

## Funktioner

### 📊 27 Verktyg

Servern erbjuder drygt 35 olika verktyg som kan fördelas i 5 kategorier. Här här några exempel:

**Sökverktyg (5)**
- `search_ledamoter` - Sök ledamöter efter namn, parti, valkrets
- `search_dokument` - Sök riksdagsdokument (motioner, propositioner, betänkanden)
- `search_anforanden` - Hitta anföranden och debatter

**Analysverktyg (6)**
- `analyze_partifordelning` - Analysera partifördelning i riksdagen
- `analyze_votering` - Detaljerad voteringsstatistik
- `analyze_ledamot` - Ledamots aktivitetsanalys (anföranden, röster, dokument)

**Jämförelseverktyg (4)**
- `compare_ledamoter` - Jämför två ledamöters aktiviteter
- `compare_parti_rostning` - Jämför partiers röstmönster
- `compare_riksdag_regering` - Korsreferera riksdags- och regeringsdokument


**Aggregeringsverktyg (6)**
- `get_top_lists` - Topplistor för talare, partier, utskott
- `analyze_riksmote` - Analysera specifikt riksmöte
- `recent_aktivitet` - Senaste parlamentariska aktiviteten
- `global_search` - Sök över alla datakällor samtidigt


**Detaljverktyg (6)**
- `get_ledamot` - Fullständig ledamotsprofil med uppdrag
- `get_dokument` - Komplett dokumentinformation
- `get_motioner` - Hämta motioner från riksdagen

###  4 Resurser

Strukturerad referensdata tillgänglig via `resources/list`:

- `riksdagen://ledamoter` - Alla nuvarande riksdagsledamöter
- `riksdagen://partier` - Översikt över politiska partier

### 📝 5 Promptmallar

Färdiga mallar för vanliga uppgifter via `prompts/list`:

- `analyze_member_activity` - Analysera ledamots aktivitet
- `compare_party_votes` - Jämför partiers röstmönster
- `search_topic` - Sök över riksdag och regering samtidigt
- `riksmote_summary` - Sammanfatta ett riksmöte
- `trend_analysis` - Analysera trender över tid

---

## 📖 Användningsområden

### För policynörden
- Spåra voteringsmönster över partier
- Analysera ledamöters aktivitet och engagemang

### För den nyfikkne
- Korsreferera riksdags- och regeringsdokument
- Hitta relevanta anföranden och debatter

### För konspiratören
- Tidsserieanalys av parlamentarisk aktivitet
- Partijämförelser och koalitionsanalys

### För vibekodaren
- Utöka LLM:er med svensk politisk data
- Bygg konversationsgränssnitt för medborgardata

---


### Teknisk Stack

- **Runtime:** Node.js 20+ med ESM
- **Språk:** TypeScript 5.0+
- **MCP SDK:** @modelcontextprotocol/sdk ^0.5.0
- **HTTP Server:** Express.js 4.x
- **Database:** Supabase PostgreSQL
- **Validering:** Zod 3.x
- **Logging:** Winston 3.x

---

## Licens

MIT License - Se [LICENSE](LICENSE) för detaljer.

---

## Erkännanden

- **g0v.se** - Tack till Pierre för din insats med [g0v.se](https://g0v.se/)

---

## 📞Support

### Kontakt
- **Email:** [isak.skogstad@me.com](mailto:isak.skogstad@me.com)

**Version 2.0.0** | MCP JSON-RPC 2.0 | Remote HTTP Support | 27 Tools | 4 Resources | 5 Prompts
