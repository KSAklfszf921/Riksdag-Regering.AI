# Riksdag-Regering.AI

En omfattande plattform för att utforska, analysera och visualisera data från Sveriges Riksdag och Regeringskansliet.

## 📋 Översikt

Detta projekt består av två huvudkomponenter:

1. **Web Application** - En interaktiv webbplattform för att utforska svensk parlamentarisk data
2. **MCP Server** - En Model Context Protocol-server för AI-assistenter att hämta och analysera riksdag/regeringsdata

## 🚀 Snabbstart

### Web Application

```bash
# Installera dependencies
npm install

# Starta utvecklingsserver
npm run dev

# Bygg för produktion
npm run build
```

### MCP Server

Se [mcp/README.md](mcp/README.md) för detaljerad dokumentation om MCP-servern.

```bash
# Navigera till mcp-katalogen
cd mcp

# Installera dependencies
npm install

# Bygg servern
npm run build

# Starta servern
npm start
```

## 🎯 Funktioner

### Web Application

- **Sökfunktionalitet**: Sök efter ledamöter, dokument, anföranden och voteringar
- **Datavisualisering**: Interaktiva diagram och grafer
- **Dokumenthantering**: Visa och analysera riksdagsdokument
- **Responsive design**: Fungerar på alla enheter

### MCP Server

- **27 verktyg** för sök, analys, jämförelse och aggregering
- **5 resurser** för direktåtkomst till strukturerad data
- **Säker datavalidering** med endast tillåtna riksdag/regering-tabeller
- **Dual transport** - Både STDIO och HTTP-server
- **Remote deployment** - Deploy till Render.com eller andra cloud providers

## 📦 Teknologier

### Frontend
- **Vite** - Build tool och dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI-framework
- **shadcn-ui** - UI-komponentbibliotek
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend och databas

### MCP Server
- **Node.js** ≥ 18.0.0
- **TypeScript** - Type-safe development
- **@modelcontextprotocol/sdk** - MCP SDK
- **Supabase** - Databas och API
- **Express** - HTTP server (för remote deployment)
- **Zod** - Schema validation
- **Winston** - Logging

## 🗂️ Projektstruktur

```
Riksdag-Regering.AI/
├── src/                    # Frontend källkod
│   ├── components/         # React-komponenter
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Hjälpfunktioner
│   ├── integrations/      # API-integrationer
│   └── pages/             # Sidkomponenter
├── mcp/                   # MCP Server
│   ├── src/
│   │   ├── tools/         # MCP verktyg
│   │   ├── resources/     # MCP resurser
│   │   └── utils/         # Hjälpfunktioner
│   ├── dist/              # Byggda filer
│   └── README.md          # MCP-dokumentation
├── supabase/              # Supabase Edge Functions
└── public/                # Statiska filer
```

## 🔧 Konfiguration

### Frontend (.env)

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### MCP Server (mcp/.env)

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

## 📚 Datakällor

Projektet använder data från:

- **Sveriges Riksdag** (data.riksdagen.se)
  - Ledamöter och uppdrag
  - Dokument (motioner, propositioner, betänkanden)
  - Anföranden och debatter
  - Voteringar och röstningsdata

- **Regeringskansliet** (regeringen.se via g0v.se)
  - Pressmeddelanden
  - Propositioner
  - Statens offentliga utredningar (SOU)
  - Departementsserien
  - Remisser och rapporter

## 🚢 Deployment

### Web Application

#### GitHub Pages

```bash
npm run build:github-pages
npm run deploy
```

#### Custom Domain

```bash
npm run build
# Upload dist/ to your hosting provider
```

### MCP Server

Se [mcp/README.md](mcp/README.md) för deployment-instruktioner till:
- Render.com
- Google Cloud Run
- AWS ECS
- Docker

## 🧪 Testning

```bash
# Frontend tester
npm test
npm run test:coverage

# MCP Server tester
cd mcp
npm test
npm run test:coverage
```

## 🤝 Bidra

Bidrag välkomnas! För att bidra:

1. Forka projektet
2. Skapa en feature-branch (`git checkout -b feature/amazing-feature`)
3. Commit dina ändringar (`git commit -m 'Add some amazing feature'`)
4. Push till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📖 Dokumentation

- [MCP Server README](mcp/README.md) - Detaljerad MCP-dokumentation
- [API Documentation](docs/API.md) - API-guide
- [Contributing Guide](CONTRIBUTING.md) - Bidragsriktlinjer

## 📄 Licens

MIT License - Se [LICENSE](LICENSE) för detaljer.

## 🙏 Erkännanden

- **Riksdagen** för deras öppna API
- **g0v.se** för aggregering av regeringsdata
- **Anthropic** för Model Context Protocol
- **Supabase** för backend-infrastruktur

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/KSAklfszf921/Riksdag-Regering.AI/issues)
- **Diskussioner**: [GitHub Discussions](https://github.com/KSAklfszf921/Riksdag-Regering.AI/discussions)

## 🔗 Länkar

- [Live Demo](https://ksaaklfszf921.github.io/Riksdag-Regering.AI/)
- [Riksdagens öppna data](https://data.riksdagen.se/)
- [g0v.se](https://g0v.se/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## Lovable Project Info

**Project URL**: https://lovable.dev/projects/4734fa32-ab04-435b-8cf6-d46801e10e63

### Utveckling med Lovable

Du kan redigera detta projekt på flera sätt:

**Använd Lovable**
- Besök [Lovable Project](https://lovable.dev/projects/4734fa32-ab04-435b-8cf6-d46801e10e63)
- Ändringar synkas automatiskt till detta repo

**Använd din IDE**
- Klona repot och pusha ändringar
- Ändringar reflekteras i Lovable

**GitHub Codespaces**
- Klicka på "Code" > "Codespaces" > "New codespace"
- Redigera direkt i browsern

## Frontend Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### GitHub Pages

To deploy to GitHub Pages (for example via the `npm run deploy` script) you **must** build the project with the GitHub Pages base path. This repository now includes a dedicated build command that sets the correct configuration automatically:

```sh
npm run build:github-pages
# or, when using the deploy script
npm run deploy
```

The generated `dist/` directory will use the `/Riksdag-Regering.AI/` base path so that the site loads correctly when served from `https://<username>.github.io/Riksdag-Regering.AI/` or any GitHub Pages custom domain mapping to the project.

### Custom domains / other hosts

For custom domains (e.g. `www.regeringskansliet.ai`, `www.riksdagen.ai`) or other hosting platforms, run the standard production build which keeps the site rooted at `/`:

```sh
npm run build
```

The resulting build folder can be uploaded to any static hosting provider. If you are using a provider-specific build target, such as Hostinger, continue to use the dedicated command:

```sh
npm run build:hostinger
```
