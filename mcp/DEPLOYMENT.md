# Deployment Guide - Riksdag-Regering MCP Server

Denna guide beskriver hur du deployer MCP servern som en remote HTTP server till olika cloud providers.

## 📋 Innehåll

- [Förberedelser](#förberedelser)
- [Deploy till Render.com](#deploy-till-rendercom)
- [Deploy med Docker lokalt](#deploy-med-docker-lokalt)
- [Andra Cloud Providers](#andra-cloud-providers)
- [Miljövariabler](#miljövariabler)
- [Säkerhet](#säkerhet)
- [Felsökning](#felsökning)

## 🎯 Förberedelser

### 1. API-Only Architecture

**Inga credentials behövs!** MCP-servern använder nu en API-only arkitektur och hämtar all data direkt från:
- **Riksdagen:** data.riksdagen.se
- **Regeringskansliet:** g0v.se

Detta innebär:
- ✅ Ingen databas att konfigurera
- ✅ Inga API-nycklar att hantera
- ✅ Snabb deployment utan beroenden
- ✅ Automatisk caching för bättre prestanda

### 2. GitHub Repository

Säkerställ att koden är pushad till GitHub:

```bash
git add .
git commit -m "feat: Add remote MCP server deployment support"
git push origin main
```

## 🚀 Deploy till Render.com

Render.com är den enklaste lösningen för deployment med generöst free tier.

### Steg 1: Skapa Render Account

1. Gå till [Render.com](https://render.com)
2. Registrera dig med GitHub-konto
3. Bekräfta din email

### Steg 2: Anslut GitHub Repository

1. Klicka på "New +" i Render Dashboard
2. Välj "Web Service"
3. Anslut ditt GitHub repository
4. Välj repository: `Riksdag-Regering.AI`

### Steg 3: Konfigurera Web Service

Render detekterar automatiskt `render.yaml`, men du kan också konfigurera manuellt:

**Basic Settings:**
- **Name:** `riksdag-regering-mcp`
- **Region:** Frankfurt (EU för GDPR compliance)
- **Branch:** `main`
- **Root Directory:** `mcp`
- **Environment:** Docker
- **Dockerfile Path:** `./Dockerfile`

**Instance:**
- **Plan:** Free (eller Starter för production)

### Steg 4: Sätt Environment Variables (Valfritt)

I Render dashboard kan du lägga till följande environment variables om önskat:

```bash
# Valfria
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
API_KEY=your-secret-api-key  # För autentisering (rekommenderas)
```

**Säkerhetstips:**
- Markera `API_KEY` som "Secret" om du använder den
- Använd en stark, slumpmässig API_KEY
- **Inga Supabase-credentials behövs!**

### Steg 5: Deploy

1. Klicka på "Create Web Service"
2. Render bygger och deployer automatiskt
3. Vänta 2-5 minuter för första deployment

**Deployment URL:**
```
https://riksdag-regering-mcp.onrender.com
```

### Steg 6: Verifiera Deployment

Testa att servern fungerar:

```bash
# Health check
curl https://riksdag-regering-mcp.onrender.com/health

# Lista verktyg
curl -X POST https://riksdag-regering-mcp.onrender.com/mcp/list-tools \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key"

# Anropa ett verktyg
curl -X POST https://riksdag-regering-mcp.onrender.com/mcp/call-tool \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "name": "search_ledamoter",
    "arguments": {
      "parti": "S",
      "limit": 5
    }
  }'
```

### Auto-Deploy on Push

Render deployer automatiskt när du pushar till `main`:

```bash
git add .
git commit -m "Update MCP server"
git push origin main
# Render deployer automatiskt!
```

## 🐳 Deploy med Docker lokalt

För lokal testning eller deployment till egen server:

### Steg 1: Bygg Docker Image

```bash
cd mcp

# Bygg image
docker build -t riksdag-regering-mcp:latest .
```

### Steg 2: Kör Container

```bash
# Med .env fil
docker run -p 3000:3000 --env-file .env riksdag-regering-mcp:latest

# Eller med environment variables (alla valfria)
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -e API_KEY=your-api-key \
  riksdag-regering-mcp:latest
```

### Steg 3: Testa

```bash
curl http://localhost:3000/health
```

## ☁️ Andra Cloud Providers

### Google Cloud Run

```bash
# 1. Bygg och pusha till Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/riksdag-regering-mcp

# 2. Deploy till Cloud Run
gcloud run deploy riksdag-regering-mcp \
  --image gcr.io/PROJECT-ID/riksdag-regering-mcp \
  --platform managed \
  --region europe-north1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,LOG_LEVEL=info
```

### AWS ECS/Fargate

1. Skapa ECR repository
2. Pusha Docker image till ECR
3. Skapa ECS Task Definition
4. Skapa ECS Service
5. Sätt environment variables

### Azure Container Apps

```bash
# 1. Skapa resource group
az group create --name riksdag-mcp-rg --location westeurope

# 2. Skapa Container Apps environment
az containerapp env create \
  --name riksdag-mcp-env \
  --resource-group riksdag-mcp-rg \
  --location westeurope

# 3. Deploy container
az containerapp create \
  --name riksdag-mcp \
  --resource-group riksdag-mcp-rg \
  --environment riksdag-mcp-env \
  --image your-registry/riksdag-regering-mcp:latest \
  --target-port 3000 \
  --ingress external \
  --env-vars NODE_ENV=production LOG_LEVEL=info
```

### DigitalOcean App Platform

1. Gå till [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Klicka "Create App"
3. Välj GitHub repository
4. Välj `mcp` som root directory
5. Sätt environment variables
6. Deploy

## 🔐 Miljövariabler

### Alla Miljövariabler är Valfria!

**API-Only Mode:** Servern kräver inga credentials eftersom all data hämtas direkt från öppna API:er.

### Valfria Konfigurationsvariabler

| Variable | Beskrivning | Default | Exempel |
|----------|-------------|---------|---------|
| `PORT` | Server port | `3000` | `8080` |
| `NODE_ENV` | Environment | `production` | `development` |
| `LOG_LEVEL` | Logging level | `info` | `debug` |
| `API_KEY` | API key för autentisering | - | `my-secret-key-123` |

## 🔒 Säkerhet

### API Key Authentication

För att skydda din MCP server, sätt en `API_KEY`:

```bash
# Generera säker API key
API_KEY=$(openssl rand -hex 32)
echo "API_KEY=$API_KEY"
```

Lägg till i Render environment variables som "Secret".

**Användning:**

```bash
# Via header
curl -H "x-api-key: your-api-key" ...

# Via query parameter
curl "...?api_key=your-api-key"
```

### Rate Limiting

Servern har inbyggd rate limiting:
- **100 requests per 15 minuter** per IP-adress
- Appliceras på `/mcp/*` endpoints

### CORS

CORS är aktiverat för alla origins. För production, överväg att begränsa:

```typescript
// I server.ts
app.use(cors({
  origin: ['https://your-allowed-domain.com']
}));
```

### HTTPS

Alla cloud providers (Render, Cloud Run, etc.) tillhandahåller automatiskt HTTPS.

## 🔧 Felsökning

### Servern startar inte

**Problem:** Servern startar inte eller visar fel

**Lösning:** Kontrollera logs för specifika felmeddelanden:
```bash
# Render: Dashboard > Service > Logs
# Docker: docker logs <container-id>
```

Vanliga orsaker:
- Port redan i bruk
- Otillräckligt minne
- Node.js version (kräver Node 20+)

### 401 Unauthorized

**Problem:** `Invalid API key`

**Lösning:** Inkludera API key i request:
```bash
curl -H "x-api-key: your-key" ...
```

### 500 Internal Server Error

**Kontrollera logs:**

```bash
# Render.com
# Gå till Dashboard > Service > Logs

# Docker
docker logs <container-id>

# Google Cloud Run
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**Vanliga orsaker:**
- API rate limiting från Riksdagen/g0v
- Nätverksanslutningsproblem
- Timeout vid långsamma API-anrop

### Rate Limit Exceeded

**Problem:** `429 Too Many Requests`

**Lösning:**
- Vänta 15 minuter
- Implementera caching i din klient
- Uppgradera till betald plan för högre limits

### Health Check Fails

**Problem:** Render visar "Service Unhealthy"

**Kontrollera:**
```bash
curl https://your-app.onrender.com/health
```

**Lösning:**
- Verifiera att `PORT` environment variable är satt korrekt
- Kontrollera Dockerfile `EXPOSE` directive
- Kolla logs för startup errors

## 📊 Monitoring

### Render Dashboard

- Gå till Dashboard > Service
- Se metrics: CPU, Memory, Response Time
- Läs real-time logs

### Custom Monitoring

Integrera med monitoring-tjänster:

- **Datadog:** [Guide](https://docs.datadoghq.com/integrations/render/)
- **New Relic:** Environment variable: `NEW_RELIC_LICENSE_KEY`
- **Sentry:** Lägg till i `server.ts`

### Logs

Winston logger skriver strukturerade logs:

```json
{
  "level": "info",
  "message": "Riksdag-Regering MCP Server started",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Performance Tips

### Caching

Servern använder NodeCache för att cache:
- `list-tools` results (5 min)
- `list-resources` results (5 min)

### API Rate Limiting

Servern har inbyggd hantering för API rate limits:
- Automatisk retry med exponentiell backoff
- Caching av ofta efterfrågade data
- Respekterar rate limits från Riksdagen och g0v

**Tips:**
- Använd cache för ofta hämtad data
- Implementera egen caching i klientapplikationen
- Begränsa parallella API-anrop

### Scaling

**Render Free Tier:**
- 512 MB RAM
- 0.1 CPU
- Går till sleep efter 15 min inaktivitet

**Render Starter ($7/mån):**
- 512 MB RAM
- 0.5 CPU
- Ingen sleep
- Auto-scaling

## 🆘 Support

**Problem med deployment?**

1. Kontrollera [Render Status](https://status.render.com)
2. Läs [Render Docs](https://render.com/docs)
3. Öppna issue på [GitHub](https://github.com/KSAklfszf921/Riksdag-Regering.AI/issues)

**Frågor?**

- GitHub Issues
- Render Community Forum
- Email: support@example.com

## 📚 Resurser

- [Render Documentation](https://render.com/docs)
- [Docker Documentation](https://docs.docker.com)
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [Riksdagens API](https://data.riksdagen.se)
- [g0v.se API](https://g0v.se)

---

**Lycka till med din deployment! 🚀**
