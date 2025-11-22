# Deployment Guide (v2.1)

Denna version kräver endast Node.js 20+. All data hämtas direkt från Riksdagens öppna API samt g0v.se.

## Render.com

1. **Forka eller klona** detta repo och koppla till Render.
2. Render läser `render.yaml` och skapar en web service med kommandot:
   ```bash
   npm install && npm run build && node dist/server.js
   ```
3. Sätt valfri `API_KEY` i Render om du vill kräva autentisering för `/mcp`.
4. Deploy. Health-check finns på `/health`.

## Docker

```bash
docker build -t riksdag-regering-mcp .
docker run -p 3000:3000 -e API_KEY=hemligt riksdag-regering-mcp
```

## Övriga plattformar

- **Cloud Run / ECS / Azure App Service** fungerar så länge Node 20 är tillgängligt.
- Ingen databas, Redis eller filstorage behövs.

## Miljövariabler

| Variabel | Beskrivning |
| --- | --- |
| `API_KEY` | (Valfri) Kräv `x-api-key` för att nå `/mcp` |
| `PORT` | Port för HTTP-servern (default 3000) |
| `NODE_ENV` | `production` eller `development` |

## Loggning

Applikationen loggar till stdout/stderr med Winston. Render/Cloud Run/AWS CloudWatch fångar automatiskt upp loggarna.
