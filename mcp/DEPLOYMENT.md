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

### 1. Supabase Database

Innan deployment behöver du en Supabase-databas med data från Riksdagen och Regeringskansliet.

**Hämta credentials:**
1. Gå till [Supabase Dashboard](https://app.supabase.com)
2. Välj ditt projekt
3. Gå till Settings > API
4. Kopiera:
   - `Project URL` (SUPABASE_URL)
   - `anon/public` key (SUPABASE_ANON_KEY)

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

### Steg 4: Sätt Environment Variables

I Render dashboard, lägg till följande environment variables:

```bash
# Obligatoriska
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Valfria
NODE_ENV=production
LOG_LEVEL=info
API_KEY=your-secret-api-key  # För autentisering (rekommenderas)
```

**Säkerhetstips:**
- Markera `SUPABASE_ANON_KEY` och `API_KEY` som "Secret"
- Använd en stark, slumpmässig API_KEY

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

# Eller med environment variables
docker run -p 3000:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-key \
  -e NODE_ENV=production \
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
  --set-env-vars SUPABASE_URL=https://...,SUPABASE_ANON_KEY=...
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
  --env-vars SUPABASE_URL=... SUPABASE_ANON_KEY=...
```

### DigitalOcean App Platform

1. Gå till [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Klicka "Create App"
3. Välj GitHub repository
4. Välj `mcp` som root directory
5. Sätt environment variables
6. Deploy

## 🔐 Miljövariabler

### Obligatoriska

| Variable | Beskrivning | Exempel |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGc...` |

### Valfria

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

**Problem:** `Error: Missing SUPABASE_URL`

**Lösning:** Sätt environment variables i Render dashboard:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
```

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
- Fel Supabase credentials
- Databasanslutning misslyckades
- Saknade tabeller i databasen

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

### Database Optimization

Säkerställ index på Supabase tabeller:
```sql
CREATE INDEX idx_ledamoter_parti ON ledamoter(parti);
CREATE INDEX idx_dokument_doktyp ON dokument(doktyp);
CREATE INDEX idx_dokument_datum ON dokument(datum);
```

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
- [Supabase Documentation](https://supabase.com/docs)

---

**Lycka till med din deployment! 🚀**
