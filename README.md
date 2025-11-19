# 🏛️ Riksdag-Regering MCP Server

[![Server Status](https://img.shields.io/website?url=https%3A%2F%2Friksdag-regering-ai.onrender.com%2Fhealth&label=Server%20Status&up_message=online&down_message=offline)](https://riksdag-regering-ai.onrender.com/health)
[![MCP Protocol](https://img.shields.io/badge/MCP%20Protocol-2024--11--05-blue?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTEyIDJMMiA3VjE3TDEyIDIyTDIyIDE3VjdMMTIgMloiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/KSAklfszf921/Riksdag-Regering.AI?style=social)](https://github.com/KSAklfszf921/Riksdag-Regering.AI/stargazers)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Issues](https://img.shields.io/github/issues/KSAklfszf921/Riksdag-Regering.AI)](https://github.com/KSAklfszf921/Riksdag-Regering.AI/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/KSAklfszf921/Riksdag-Regering.AI/pulls)
[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://riksdag-regering-ai.onrender.com)

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger AI-assistenter tillgång till Sveriges Riksdags- och Regeringskansliets öppna data. Sök, analysera och jämför dokument, ledam

öter, anföranden, voteringar och mycket mer.

**Skapad av:** Isak Skogstad ([isak.skogstad@me.com](mailto:isak.skogstad@me.com))

---

## 🚀 Snabbstart

### 🌐 Alternativ 1: Remote Server (Rekommenderat)

Använd den hostade servern utan installation - alltid uppdaterad och tillgänglig!

**Fördelar:**
- ✅ Ingen installation eller konfiguration
- ✅ Alltid senaste versionen
- ✅ Ingen lokal resursanvändning
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

### 💻 Alternativ 2: Lokal Installation

För utveckling eller om du vill köra servern lokalt:

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

## ✨ Funktioner

### 📊 27 Verktyg

Servern erbjuder 27 specialiserade verktyg organiserade i 5 kategorier:

**Sökverktyg (5)**
- `search_ledamoter` - Sök ledamöter efter namn, parti, valkrets
- `search_dokument` - Sök riksdagsdokument (motioner, propositioner, betänkanden)
- `search_anforanden` - Hitta anföranden och debatter
- `search_voteringar` - Sök voteringshistorik
- `search_regering` - Sök regeringsdokument (pressmeddelanden, SOU, direktiv)

**Analysverktyg (6)**
- `analyze_partifordelning` - Analysera partifördelning i riksdagen
- `analyze_votering` - Detaljerad voteringsstatistik
- `analyze_ledamot` - Ledamots aktivitetsanalys (anföranden, röster, dokument)
- `analyze_dokument_statistik` - Dokumentstatistik och trender
- `analyze_trend` - Tidsserieanalys av aktivitet
- `analyze_parti_activity` - Partis totala aktivitet över tid

**Jämförelseverktyg (4)**
- `compare_ledamoter` - Jämför två ledamöters aktiviteter
- `compare_parti_rostning` - Jämför partiers röstmönster
- `compare_riksdag_regering` - Korsreferera riksdags- och regeringsdokument
- `compare_partier` - Jämför två partiers aktiviteter

**Aggregeringsverktyg (6)**
- `get_top_lists` - Topplistor för talare, partier, utskott
- `analyze_riksmote` - Analysera specifikt riksmöte
- `recent_aktivitet` - Senaste parlamentariska aktiviteten
- `global_search` - Sök över alla datakällor samtidigt
- `top_anforanden` - Mest impaktfulla anföranden
- `top_voteringar` - Mest betydelsefulla voteringar

**Detaljverktyg (6)**
- `get_ledamot` - Fullständig ledamotsprofil med uppdrag
- `get_dokument` - Komplett dokumentinformation
- `get_motioner` - Hämta motioner från riksdagen
- `get_propositioner` - Hämta propositioner
- `get_betankanden` - Hämta utskottsbetänkanden
- `get_utskott` - Lista alla riksdagens utskott

### 📦 4 Resurser

Strukturerad referensdata tillgänglig via `resources/list`:

- `riksdagen://ledamoter` - Alla nuvarande riksdagsledamöter
- `riksdagen://partier` - Översikt över politiska partier
- `riksdagen://dokument/typer` - Dokumenttypsreferens
- `regeringen://departement` - Regeringsdepartement

### 📝 5 Promptmallar

Färdiga mallar för vanliga uppgifter via `prompts/list`:

- `analyze_member_activity` - Analysera ledamots aktivitet
- `compare_party_votes` - Jämför partiers röstmönster
- `search_topic` - Sök över riksdag och regering samtidigt
- `riksmote_summary` - Sammanfatta ett riksmöte
- `trend_analysis` - Analysera trender över tid

---

## 🔌 API-integrationer

Servern kopplar till tre av Sveriges viktigaste öppna data-API:er:

**Riksdagens Öppna Data API** ([data.riksdagen.se](https://data.riksdagen.se/))
Tillgång till läroplaner (LGR11, GY11), ämnen, kurser och gymnasieprogram. API:et täcker Sveriges kompletta utbildningssystem från grundskola till gymnasiet.

**g0v.se Regeringskansliets Data** ([g0v.se](https://g0v.se/))
Aggregerad data från regeringskansliet inklusive pressmeddelanden, propositioner, SOU-betänkanden, direktiv och departementsserier.

**Supabase Real-time Database**
Cachad och optimerad datalagring med real-time uppdateringar. Snabb åtkomst till 48 tabeller med över 500,000 poster.

---

## 📖 Användningsområden

### 👨‍🎓 För Politiker och Beslutsfattare
- Spåra voteringsmönster över partier
- Analysera ledamöters aktivitet och engagemang
- Övervaka dokumenttrender över tid
- Identifiera samarbetsmönster

### 📰 För Journalister och Forskare
- Korsreferera riksdags- och regeringsdokument
- Hitta relevanta anföranden och debatter
- Identifiera mest aktiva ledamöter inom specifika frågor
- Analysera politiska trender

### 📊 För Dataanalytiker
- Tidsserieanalys av parlamentarisk aktivitet
- Partijämförelser och koalitionsanalys
- Dokumentpåverkansanalys
- Röstningsbeteendeanalys

### 🤖 För AI-utvecklare
- Utöka LLM:er med svensk politisk data
- Bygg konversationsgränssnitt för medborgardata
- Skapa faktakontrollverktyg
- Automatisera politisk rapportering

---

## 📚 Dokumentation

- **[Installation Guide](mcp/INSTALL_GUIDE.md)** - Detaljerade installationsinstruktioner
- **[Usage Guide](mcp/USAGE_GUIDE.md)** - Verktygsanvändning och exempel
- **[Deployment Guide](mcp/DEPLOYMENT.md)** - Cloud deployment (Render, Railway, Fly.io)
- **[API Reference](mcp/README.md)** - Komplett teknisk dokumentation
- **[Changelog](mcp/CHANGELOG.md)** - Versionshistorik

---

## 🛠️ Utveckling

```bash
# Installera workspace
npm install

# Kör MCP server i dev-läge
npm run mcp:dev

# Bygg MCP server
npm run mcp:build

# Kör tester
npm run mcp:test

# Lint och format
npm run mcp:lint
npm run mcp:format
```

### Teknisk Stack

- **Runtime:** Node.js 20+ med ESM
- **Språk:** TypeScript 5.0+
- **MCP SDK:** @modelcontextprotocol/sdk ^0.5.0
- **HTTP Server:** Express.js 4.x
- **Database:** Supabase PostgreSQL
- **Validering:** Zod 3.x
- **Logging:** Winston 3.x

---

## 🤝 Bidra

Bidrag välkomnas! Vänligen:

1. Forka repository
2. Skapa en feature branch (`git checkout -b feature/fantastisk-funktion`)
3. Commita dina ändringar (`git commit -m 'Lägg till fantastisk funktion'`)
4. Pusha till branchen (`git push origin feature/fantastisk-funktion`)
5. Öppna en Pull Request

**Utvecklingsriktlinjer:**
- Följ befintlig kodstil
- Lägg till tester för ny funktionalitet
- Uppdatera dokumentation
- Håll commits små och fokuserade

---

## 📄 Licens

MIT License - Se [LICENSE](LICENSE) för detaljer.

**Varning:** Detta projekt är inte officiellt affilierat med Sveriges Riksdag eller Regeringskansliet. All data hämtas från offentliga API:er.

---

## 🙏 Erkännanden

- **Sveriges Riksdag** - Öppen data API på [data.riksdagen.se](https://data.riksdagen.se/)
- **g0v.se** - Regeringsdata-aggregering på [g0v.se](https://g0v.se/)
- **Anthropic** - Model Context Protocol specifikation
- **Supabase** - Real-time databas och hosting

---

## 📞 Support

### Kontakt
- **Email:** [isak.skogstad@me.com](mailto:isak.skogstad@me.com)
- **GitHub Issues:** [Rapportera problem](https://github.com/KSAklfszf921/Riksdag-Regering.AI/issues)
- **GitHub Discussions:** [Diskussioner och frågor](https://github.com/KSAklfszf921/Riksdag-Regering.AI/discussions)

### Länkar
- **🌐 Live Server:** [riksdag-regering-ai.onrender.com](https://riksdag-regering-ai.onrender.com)
- **💻 GitHub:** [github.com/KSAklfszf921/Riksdag-Regering.AI](https://github.com/KSAklfszf921/Riksdag-Regering.AI)
- **📖 MCP Protocol:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **🏛️ Riksdagen API:** [data.riksdagen.se](https://data.riksdagen.se/)
- **🏢 Regeringen Data:** [g0v.se](https://g0v.se/)

---

**Version 2.0.0** | MCP JSON-RPC 2.0 | Remote HTTP Support | 27 Tools | 4 Resources | 5 Prompts
