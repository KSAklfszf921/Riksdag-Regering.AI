# Säkerhetsdokumentation

## Översikt
Servern är stateless och hämtar endast öppna data direkt från `data.riksdagen.se` och `g0v.se`. Ingen databas eller filstorage används. Minimal konfiguration: Node 20+, valfri `API_KEY` för att skydda `/mcp`.

## Transport & Åtkomst
- **HTTPS** i produktion (Render/liknande hanterar TLS).
- **API-nyckel (valfri):** sätt `API_KEY` för att kräva `x-api-key` på samtliga `/mcp`-endpoints.
- **Rate limiting:** `express-rate-limit` (100 anrop/15 min/IP) aktivt på `/mcp`.
- **CORS:** öppet som standard; begränsa till dina klientdomäner om servern exponeras publikt.

## Validering & Felhantering
- Alla verktyg har Zod-scheman; inkommande argument parse:as och valideras innan fetch mot upstream.
- HTTP-anrop sker via `safeFetch` (timeout, JSON-parsning med felhantering) och enkel rate-limiter per datakälla.
- Oväntade fel loggas med stacktrace via Winston till stdout/stderr.

## Data & Cache
- Ingen långlivad lagring. NodeCache används för lättviktig cache (standard TTL 5 min) av `/mcp/list-*` svar.
- Ingen session- eller användardata skrivs till disk; deploya på volatila filerystem utan risk för läckor.

## Hårdnande åtgärder
- Kör processen som icke-root i container/host.
- Begränsa ingress till `/health` och `/mcp` via WAF eller IP-allowlist om publik åtkomst inte behövs.
- Rotera och hålla `API_KEY` utanför repo (`.env`), och logga aldrig hemligheter.
- Justera `LOG_LEVEL` till `warn` i produktion för att minska brus.

## Incidentrespons
- Vid onormalt beteende: skala ned servern, rotera `API_KEY`, och starta om processen.
- Kontrollera Render/host-loggar för misslyckade verktygsanrop; felkoder från upstream returneras i klartext för snabb felsökning.
