# 🌐 Remote MCP Server - Anslutningsguide

## 📡 Server Information

**Base URL:** `https://riksdag-regering-ai.onrender.com`

**Version:** 2.0.0
**Status:** ✅ Live
**Region:** 🇪🇺 Frankfurt (EU)

---

## 🚀 Snabbstart

### 1. Ta bort API_KEY (för publik access)

För att göra servern tillgänglig för alla utan autentisering:

1. Gå till [Render Dashboard > Environment](https://dashboard.render.com/web/srv-d4eukgjgk3sc73c006mg/env)
2. Hitta `API_KEY` variabeln
3. Klicka **Delete**
4. Render deployar om automatiskt (~2-3 min)

### 2. Anslut din MCP-klient

---

## 🔌 Anslutningsinstruktioner

### Claude Desktop (macOS/Windows)

**Metod 1: SSE (Rekommenderat)**
```json
{
  "mcpServers": {
    "riksdag-regering": {
      "url": "https://riksdag-regering-ai.onrender.com/sse",
      "transport": "sse"
    }
  }
}
```

**Metod 2: HTTP POST**
```json
{
  "mcpServers": {
    "riksdag-regering": {
      "url": "https://riksdag-regering-ai.onrender.com/mcp",
      "transport": "http"
    }
  }
}
```

**Fil location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

---

### Claude Code CLI

```bash
# SSE transport (rekommenderat)
claude mcp add riksdag-regering \
  --url https://riksdag-regering-ai.onrender.com/sse \
  --transport sse

# HTTP transport (alternativ)
claude mcp add riksdag-regering \
  --url https://riksdag-regering-ai.onrender.com/mcp \
  --transport http
```

**Verifiera:**
```bash
claude mcp list
```

---

### Cursor IDE

**Settings → Features → MCP Servers:**

```json
{
  "riksdag-regering": {
    "url": "https://riksdag-regering-ai.onrender.com/sse"
  }
}
```

---

### Cline (VS Code Extension)

**Cline Settings → MCP Servers:**

```json
{
  "riksdag-regering": {
    "url": "https://riksdag-regering-ai.onrender.com/sse",
    "transport": "sse"
  }
}
```

---

### Continue.dev

**.continue/config.json:**

```json
{
  "mcpServers": [
    {
      "name": "riksdag-regering",
      "url": "https://riksdag-regering-ai.onrender.com/sse"
    }
  ]
}
```

---

## 📚 API Endpoints

### Health Check
```bash
GET https://riksdag-regering-ai.onrender.com/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "riksdag-regering-mcp",
  "version": "2.0.0",
  "timestamp": "2025-11-19T16:30:00.000Z"
}
```

---

### SSE Streaming (Rekommenderat)

#### Connect to stream
```bash
GET https://riksdag-regering-ai.onrender.com/sse
```

**Headers:**
```
Accept: text/event-stream
```

**Response:**
```
data: {"type":"connected","timestamp":"2025-11-19T16:30:00.000Z"}

: ping
```

#### Send MCP requests
```bash
POST https://riksdag-regering-ai.onrender.com/sse
Content-Type: application/json

{
  "method": "tools/list"
}
```

---

### HTTP POST Endpoints (Legacy)

#### List Tools
```bash
POST https://riksdag-regering-ai.onrender.com/mcp/list-tools
Content-Type: application/json

{}
```

#### Call Tool
```bash
POST https://riksdag-regering-ai.onrender.com/mcp/call-tool
Content-Type: application/json

{
  "name": "riksdagen_search_documents",
  "arguments": {
    "doktyp": "prop",
    "rm": "2024/25"
  }
}
```

#### List Resources
```bash
POST https://riksdag-regering-ai.onrender.com/mcp/list-resources
Content-Type: application/json

{}
```

#### Read Resource
```bash
POST https://riksdag-regering-ai.onrender.com/mcp/read-resource
Content-Type: application/json

{
  "uri": "riksdagen://dokument-types"
}
```

---

## 🛠️ Tillgängliga Verktyg

Servern exponerar **27 verktyg** för att arbeta med svenska politiska dokument:

### 📄 Riksdagen (Fetch)
- `riksdagen_fetch_document` - Hämta dokument med ID
- `riksdagen_fetch_debatt` - Hämta debatt med ID
- `riksdagen_fetch_votering` - Hämta votering med ID
- `riksdagen_fetch_person` - Hämta person-info med ID
- `riksdagen_fetch_ledamot` - Hämta ledamot med ID

### 🔍 Riksdagen (Search)
- `riksdagen_search_documents` - Sök dokument
- `riksdagen_search_debatter` - Sök debatter
- `riksdagen_search_voteringer` - Sök voteringar
- `riksdagen_search_personer` - Sök personer
- `riksdagen_search_ledamoter` - Sök ledamöter

### 📊 Riksdagen (Compare)
- `riksdagen_compare_party_votes` - Jämför partiröstningar
- `riksdagen_compare_versions` - Jämför dokumentversioner

### 📈 Riksdagen (Analyze)
- `riksdagen_analyze_voting_patterns` - Analysera röstmönster
- `riksdagen_analyze_document_sentiment` - Sentiment-analys

### 🏛️ Regeringskansliet (Fetch)
- `regeringen_fetch_proposition` - Hämta proposition
- `regeringen_fetch_sou` - Hämta SOU
- `regeringen_fetch_ds` - Hämta Ds

### 🔎 Regeringskansliet (Search)
- `regeringen_search_propositioner` - Sök propositioner
- `regeringen_search_sou` - Sök SOU
- `regeringen_search_ds` - Sök Ds

### 📉 Regeringskansliet (Analyze)
- `regeringen_analyze_policy_area` - Analysera policyområde
- `regeringen_analyze_proposal_impact` - Analysera propositionseffekter

### 📊 Aggregate
- `aggregate_riksdag_regering_data` - Aggregera data från båda källor
- `aggregate_timeline` - Skapa tidslinje
- `aggregate_compare_sources` - Jämför källor

---

## 🗂️ Tillgängliga Resurser

Servern exponerar **5 resurser** med metadata:

- `riksdagen://dokument-types` - Dokumenttyper (prop, mot, etc.)
- `riksdagen://party-info` - Partiinformation
- `riksdagen://organ-info` - Organs-information
- `regeringen://dokument-types` - Regeringens dokumenttyper
- `api://info` - API-information och statistik

---

## 🔒 Säkerhet & Rate Limiting

### Rate Limiting
- **100 requests per 15 minuter** per IP-adress
- Gäller endast `/mcp/*` endpoints
- SSE-streaming räknas som 1 request

### CORS
- **Aktiverat** för alla domäner (`Access-Control-Allow-Origin: *`)
- Säker för webbapps

### Authentication (Optional)
Om du sätter `API_KEY` environment variable:

**Headers:**
```
X-API-Key: your-secret-key
```

**Query parameter:**
```
?api_key=your-secret-key
```

---

## 🧪 Testa Anslutningen

### cURL Test
```bash
# Health check
curl https://riksdag-regering-ai.onrender.com/health

# SSE connection
curl -N -H "Accept: text/event-stream" \
  https://riksdag-regering-ai.onrender.com/sse

# List tools
curl -X POST https://riksdag-regering-ai.onrender.com/sse \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}'
```

### JavaScript Test
```javascript
// SSE connection
const eventSource = new EventSource('https://riksdag-regering-ai.onrender.com/sse');

eventSource.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
};
```

---

## 📝 Exempel: Sök Propositioner

```bash
curl -X POST https://riksdag-regering-ai.onrender.com/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "riksdagen_search_documents",
    "arguments": {
      "doktyp": "prop",
      "rm": "2024/25",
      "sok": "klimat",
      "p": 1,
      "sz": 10
    }
  }'
```

---

## 🐛 Troubleshooting

### "Invalid API key"
➡️ Ta bort `API_KEY` från Render environment variables

### "Too many requests"
➡️ Vänta 15 minuter eller implementera request throttling

### SSE connection timeout
➡️ Normal behavior - servern skickar ping var 30:e sekund

### CORS error
➡️ CORS är aktiverat - kontrollera att klienten skickar rätt headers

---

## 📞 Support

**GitHub:** https://github.com/KSAklfszf921/Riksdag-Regering.AI
**Issues:** https://github.com/KSAklfszf921/Riksdag-Regering.AI/issues

---

## 📜 License

MIT License - Se [LICENSE](LICENSE) fil för detaljer

---

**Uppdaterad:** 2025-11-19
**Version:** 2.0.0
**Status:** ✅ Production Ready
