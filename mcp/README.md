# Riksdag-Regering MCP Server v2.0

En professionell Model Context Protocol (MCP) server för att hämta, söka, analysera och jämföra data från Sveriges Riksdag och Regeringskansliet.

**Version 2.0** - Omfattande förbättring med säkerhetsvalidering och 13 nya verktyg!

> 🌐 **Remote MCP Server** - Denna server stödjer både lokal STDIO och remote HTTP deployment!

## 📋 Innehåll

- [Översikt](#översikt)
- [Funktioner](#funktioner)
- [Installation](#installation)
- [Deployment](#deployment)
- [Konfiguration](#konfiguration)
- [Användning](#användning)
- [Tillgängliga Verktyg](#tillgängliga-verktyg)
- [Resources](#resources)
- [Exempel](#exempel)
- [API-dokumentation](#api-dokumentation)
- [Säkerhet](#säkerhet)

## 🎯 Översikt



### MCP Protocol Support
- ✅ **Remote HTTP Server** - Deploy till molnet (Render.com, Google Cloud, AWS, etc.)
- ✅ **Dual Transport** - Stödjer både Streamable HTTP (modern) och HTTP+SSE (legacy)
- ✅ **OAuth 2.1 Authentication** - Med PKCE för säker access
- ✅ **Session Management** - Persistent conversational state
- ✅ **Rate Limiting** - Skydd mot overuse
- ✅ **Caching** - Optimerad prestanda
- ✅ **Logging & Monitoring** - Structured logging med Winston

### Data Capabilities
- **Sökning**: Sök efter ledamöter, dokument, anföranden, voteringar och regeringsdokument
- **Analys**: Analysera partifördelning, röstningsstatistik, ledamötsaktivitet och dokumenttrender
- **Jämförelse**: Jämför ledamöter, partier, voteringar och dokument
- **Hämtning**: Hämta specifika dokument och data med fullständig information
- **Aggregering**: Få toplistor, statistik och global sökning
- **Resources**: Hämta strukturerad data om partier, departement och statistik
- **Säkerhet**: Inbyggd validering som endast tillåter data från Riksdagen och Regeringskansliet

### Datakällor (48 tabeller)

- **Riksdagen** (20 tabeller): data.riksdagen.se API
  - Ledamöter och uppdrag
  - Dokument (motioner, propositioner, betänkanden, frågor, interpellationer)
  - Anföranden
  - Voteringar och röstningsdata
  - Utskott och protokoll
  - SOU, direktiv och EU-förslag

- **Regeringskansliet** (28 tabeller): g0v.se API
  - Pressmeddelanden
  - Propositioner
  - Statens offentliga utredningar (SOU)
  - Departementsserien och forordningsmotiv
  - Remisser, rapporter och regeringsuppdrag
  - Tal, artiklar och debattartiklar
  - Internationella dokument

## 📦 Installation

### Förutsättningar

- Node.js 18 eller senare
- npm eller yarn
- Tillgång till en Supabase-databas med data från Riksdagen och Regeringskansliet

### Steg 1: Installera paketet

```bash
# Klona repository
cd mcp

# Installera dependencies
npm install

# Bygg projektet
npm run build
```

### Steg 2: Konfigurera miljövariabler

Kopiera `.env.example` till `.env` och fyll i dina Supabase-uppgifter:

```bash
cp .env.example .env
```

Redigera `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## 🚀 Deployment

Denna server kan deployas som en remote HTTP server till molnet för enkel integration med LLM-klienter som Claude.

### Quick Deploy till Render.com

1. **Pusha till GitHub**
   ```bash
   git push origin main
   ```

2. **Skapa Web Service på Render**
   - Gå till [Render Dashboard](https://dashboard.render.com)
   - Klicka "New +" > "Web Service"
   - Anslut GitHub repository
   - Render detekterar `render.yaml` automatiskt

3. **Konfigurera Environment Variables**
   ```
   SUPABASE_URL=your-url
   SUPABASE_ANON_KEY=your-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

4. **Deploy**
   - URL blir: `https://riksdag-regering-mcp.onrender.com`
   - Health check: `https://your-app.onrender.com/health`

### Deploy med Docker

```bash
# Bygg image
docker build -t riksdag-regering-mcp .

# Kör container
docker run -p 3000:3000 --env-file .env riksdag-regering-mcp
```

### Andra Cloud Providers

Se [DEPLOYMENT.md](./DEPLOYMENT.md) för detaljer om:
- Google Cloud Run
- AWS ECS
- Azure App Service
- Digital Ocean

### Database Setup

Innan deployment, kör SQL-migration i Supabase:
```bash
cat src/database/migrations/001_create_oauth_tables.sql
```

Kopiera SQL och kör i Supabase SQL Editor för att skapa OAuth-tabeller.

## ⚙️ Konfiguration

### Local STDIO (Claude Desktop)

För lokal användning med Claude Desktop:

### Claude Desktop

För att använda MCP servern med Claude Desktop, lägg till följande i din konfigurationsfil:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "command": "node",
      "args": ["/path/to/Riksdag-Regering.AI/mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key-here"
      }
    }
  }
}
```

### Cline (VS Code)

För Cline i VS Code, lägg till i `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "riksdag-regering": {
      "command": "node",
      "args": ["/path/to/Riksdag-Regering.AI/mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key-here"
      }
    }
  }
}
```

## 🚀 Användning

Efter installation kan du använda servern direkt i Claude Desktop eller andra MCP-kompatibla klienter.

### Starta servern manuellt

```bash
npm start
```

## 🔧 Tillgängliga Verktyg

### Sökverktyg

#### `search_ledamoter`
Sök efter ledamöter i Riksdagen.

**Parametrar:**
- `namn` (valfritt): Namn att söka efter
- `parti` (valfritt): Parti (S, M, SD, V, MP, C, L, KD)
- `valkrets` (valfritt): Valkrets
- `status` (valfritt): Status (tjänstgörande, tjänstledig, etc.)
- `limit` (valfritt): Max antal resultat (standard: 50)

**Exempel:**
```json
{
  "namn": "Andersson",
  "parti": "S",
  "limit": 10
}
```

#### `search_dokument`
Sök efter dokument från Riksdagen.

**Parametrar:**
- `titel` (valfritt): Titel att söka efter
- `doktyp` (valfritt): Dokumenttyp (mot, prop, bet, skr)
- `rm` (valfritt): Riksmöte (t.ex. "2024/25")
- `organ` (valfritt): Organ (KU, FiU, UU, etc.)
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)
- `limit` (valfritt): Max antal resultat (standard: 50)

#### `search_anforanden`
Sök efter anföranden i Riksdagen.

**Parametrar:**
- `talare` (valfritt): Talare att söka efter
- `parti` (valfritt): Parti
- `debattnamn` (valfritt): Debattnamn
- `text` (valfritt): Text att söka i anförandet
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)
- `limit` (valfritt): Max antal resultat (standard: 50)

#### `search_voteringar`
Sök efter voteringar i Riksdagen.

**Parametrar:**
- `titel` (valfritt): Titel att söka efter
- `rm` (valfritt): Riksmöte (t.ex. "2024/25")
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)
- `limit` (valfritt): Max antal resultat (standard: 50)

#### `search_regering`
Sök i Regeringskansliets dokument.

**Parametrar:**
- `dataType` (required): Typ av dokument (pressmeddelanden, propositioner, departementsserien, sou, remisser, rapporter)
- `titel` (valfritt): Titel att söka efter
- `departement` (valfritt): Departement
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)
- `limit` (valfritt): Max antal resultat (standard: 50)

### Analysverktyg

#### `analyze_partifordelning`
Analysera fördelningen av ledamöter per parti.

**Parametrar:**
- `valkrets` (valfritt): Filtrera efter valkrets

#### `analyze_votering`
Analysera röstningsstatistik för en specifik votering.

**Parametrar:**
- `votering_id` (required): ID för voteringen

#### `analyze_ledamot`
Analysera en ledamots aktivitet.

**Parametrar:**
- `intressent_id` (required): ID för ledamoten
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)

#### `analyze_dokument_statistik`
Analysera statistik över dokument från Riksdagen.

**Parametrar:**
- `doktyp` (valfritt): Dokumenttyp
- `rm` (valfritt): Riksmöte
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)

#### `analyze_trend`
Analysera trender över tid.

**Parametrar:**
- `dataType` (required): Typ av data (dokument, anforanden, voteringar)
- `groupBy` (required): Gruppering (day, week, month, year)
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)

### Jämförelseverktyg

#### `compare_ledamoter`
Jämför två ledamöters aktivitet.

**Parametrar:**
- `intressent_id_1` (required): ID för första ledamoten
- `intressent_id_2` (required): ID för andra ledamoten

#### `compare_parti_rostning`
Jämför partiernas röstbeteende mellan två voteringar.

**Parametrar:**
- `votering_id_1` (required): ID för första voteringen
- `votering_id_2` (required): ID för andra voteringen

#### `compare_riksdag_regering`
Jämför dokument från Riksdagen och Regeringen om samma ämne.

**Parametrar:**
- `searchTerm` (required): Sökterm för att hitta relaterade dokument
- `limit` (valfritt): Max antal dokument från varje källa (standard: 10)

#### `compare_partier`
Jämför aktivitet mellan två partier.

**Parametrar:**
- `parti_1` (required): Första partiet
- `parti_2` (required): Andra partiet
- `from_date` (valfritt): Från datum (YYYY-MM-DD)
- `to_date` (valfritt): Till datum (YYYY-MM-DD)

## 📚 Resources

Servern exponerar följande resources:

- `riksdagen://ledamoter` - Lista över alla ledamöter
- `riksdagen://partier` - Översikt över alla partier
- `riksdagen://dokument/typer` - Lista över dokumenttyper
- `regeringen://departement` - Lista över departement
- `riksdagen://statistik` - Sammanställd statistik

## 💡 Exempel

### Söka efter ledamöter från Socialdemokraterna

```typescript
{
  "tool": "search_ledamoter",
  "arguments": {
    "parti": "S",
    "limit": 20
  }
}
```

### Analysera en votering

```typescript
{
  "tool": "analyze_votering",
  "arguments": {
    "votering_id": "8033E74D-8DD4-4D0F-8AD4-6BD6BBA4D4DB"
  }
}
```

### Jämföra två partier

```typescript
{
  "tool": "compare_partier",
  "arguments": {
    "parti_1": "S",
    "parti_2": "M",
    "from_date": "2024-01-01",
    "to_date": "2024-12-31"
  }
}
```

### Analysera dokumenttrender per månad

```typescript
{
  "tool": "analyze_trend",
  "arguments": {
    "dataType": "dokument",
    "groupBy": "month",
    "from_date": "2024-01-01",
    "to_date": "2024-12-31"
  }
}
```

## 🏗️ Utveckling

### Projektstruktur

```
mcp/
├── src/
│   ├── index.ts              # Huvudfil för MCP server
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── utils/                # Hjälpfunktioner
│   │   ├── supabase.ts       # Supabase client
│   │   └── helpers.ts        # Diverse hjälpfunktioner
│   ├── tools/                # MCP tools
│   │   ├── search.ts         # Sökverktyg
│   │   ├── analyze.ts        # Analysverktyg
│   │   └── compare.ts        # Jämförelseverktyg
│   └── resources/            # MCP resources
│       └── index.ts
├── dist/                     # Kompilerad kod
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Bygga projektet

```bash
npm run build
```

### Utvecklingsläge

```bash
npm run dev
```

## 🤝 Bidra

Bidrag är välkomna! Vänligen:

1. Forka projektet
2. Skapa en feature-branch (`git checkout -b feature/amazing-feature`)
3. Commit dina ändringar (`git commit -m 'Add some amazing feature'`)
4. Push till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📄 Licens

MIT License - se LICENSE-filen för detaljer

## 🙏 Erkännanden

- **Riksdagen** för deras öppna API (data.riksdagen.se)
- **g0v.se** för aggregering av Regeringskansliets data
- **Model Context Protocol** (MCP) från Anthropic

## 📞 Support

För frågor eller problem, öppna ett issue på GitHub eller kontakta projektets maintainers.

## 🔗 Länkar

- [Riksdagens öppna data](https://data.riksdagen.se/)
- [g0v.se](https://g0v.se/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Supabase](https://supabase.com/)
