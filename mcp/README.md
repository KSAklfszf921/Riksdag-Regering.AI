# Riksdag-Regering MCP (npm)

Detta paket innehåller MCP-servern som distribueras via npm (`riksdag-regering-mcp`). Från och med version 2.1 används inga externa databaser – all data hämtas live från Riksdagens öppna API och g0v.se.

## Installation

```bash
npm install -g riksdag-regering-mcp
# eller lokalt i ett projekt
npm install riksdag-regering-mcp
```

Starta i STDIO-läge (Claude Desktop, Cline m.fl.):

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "command": "npx",
      "args": ["riksdag-regering-mcp"]
    }
  }
}
```

## Remote HTTP

Servern kan även köras i HTTP-läge (Render, Docker, etc.).

```bash
npx riksdag-regering-mcp --http --port 3000
```

Tillåtna miljövariabler:

| Variabel | Beskrivning |
| --- | --- |
| `API_KEY` | Valfritt. Om satt krävs `x-api-key` för `/mcp`-endpointen |
| `RIKSDAG_USER_AGENT` | Override av User-Agent mot data.riksdagen.se |

## Datakällor

- `https://data.riksdagen.se` (dokument, ledamöter, anföranden)
- `https://g0v.se/api` (pressmeddelanden, propositioner, SOU, tal)

## Verktyg

Se [huvud-README](../README.md#⚒️-tillgängliga-verktyg) för komplett lista över verktyg och resources.

## Licens

MIT – samma som huvudprojektet.
