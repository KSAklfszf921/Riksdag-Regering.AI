# 30 Förbättringsförslag för Riksdag-Regering.AI

## 📊 Kod & Arkitektur (1-8)

1. **Reducera duplicering av GenericDocumentPage**
   - 26+ nästan identiska sidor (RegeringskanslientArtiklar, RegeringskanslientTal, etc.)
   - Skapa en dynamisk route med parameter istället: `/regeringskansliet/:category`
   - Reducerar kodbas med ~90% för dessa komponenter

2. **Implementera Error Boundaries**
   - Lägg till React Error Boundaries på route-nivå
   - Förhindrar att hela appen kraschar vid fel
   - Ge användaren tydligare felmeddelanden

3. **Lägg till TypeScript strict mode**
   - Aktivera `strict: true` i tsconfig.json
   - Fånga fler buggar under compile-time
   - Förbättrad type-safety

4. **Extrahera routing till separat config**
   - App.tsx är 8KB med 40+ routes
   - Skapa `routes.config.tsx` för bättre översikt
   - Enklare att underhålla och testa

5. **Implementera React Query DevTools i dev mode**
   - För enklare debugging av API-anrop
   - Visualisera cache-status
   - Identifiera onödiga re-fetches

6. **Centralisera API-endpoints**
   - Skapa `/src/config/api.ts` med alla endpoints
   - Undvik hårdkodade URLs i komponenter
   - Enklare att uppdatera vid API-ändringar

7. **Lägg till komponent-lazy loading för stora komponenter**
   - Admin.tsx är 520KB (minifierad)
   - Dela upp i mindre chunks
   - Snabbare initial laddningstid

8. **Implementera State Management för global state**
   - Använd Zustand eller Jotai för global state
   - Undvik prop drilling
   - Förbättra performance med selectors

## 🚀 Performance (9-14)

9. **Implementera virtuell scrollning för långa listor**
   - @tanstack/react-virtual finns redan som dep
   - Använd för dokument-listor med 100+ items
   - Dramatiskt förbättrad scroll-performance

10. **Lägg till Service Worker för offline-funktionalitet**
    - PWA-stöd för offline-läsning
    - Cacha viktiga API-svar
    - Förbättrad användarupplevelse

11. **Optimera bildformat**
    - Konvertera SVG-logos till WebP/AVIF
    - Implementera lazy loading för bilder
    - Använd `<img loading="lazy" />`

12. **Implementera memoization för tunga beräkningar**
    - Använd `useMemo` för filtrering/sortering
    - `React.memo` för listobjekt
    - Reducera onödiga re-renders

13. **Aktivera code splitting per route**
    - Redan delvis implementerat med lazy()
    - Dela upp vendors i mindre chunks
    - Reducera initial bundle size

14. **Implementera Request Deduplication**
    - React Query har inbyggt stöd
    - Förhindra dubbla API-anrop
    - Reducera server-load

## 🔒 Säkerhet (15-19)

15. **Fixa npm audit vulnerabilities**
    - 2 moderate vulnerabilities finns
    - Kör `npm audit fix`
    - Uppdatera beroendeversioner

16. **Implementera Content Security Policy (CSP)**
    - Lägg till CSP headers i index.html
    - Förhindra XSS-attacker
    - Whitelist endast betrodda domäner

17. **Lägg till rate limiting på client-side**
    - Förhindra spam av API-anrop
    - Implementera throttling/debouncing
    - Skydda mot DoS från klienten

18. **Implementera input sanitering**
    - Använd DOMPurify för användarinput
    - Förhindra XSS via sökfält
    - Validera alla formulär med Zod

19. **Rotera och säkra API-nycklar regelbundet**
    - Automatisk rotation var 90:e dag
    - Använd GitHub Secrets rotation
    - Dokumentera i SECURITY.md

## 🎨 UX/UI (20-24)

20. **Lägg till dark mode toggle**
    - next-themes finns redan som dependency
    - Implementera i UI
    - Spara preferens i localStorage

21. **Förbättra 404-sidan**
    - NotFound.tsx är bara 745 bytes
    - Lägg till sökfunktion
    - Föreslå populära sidor

22. **Implementera breadcrumbs för navigation**
    - Visa användaren var de är
    - Enklare att navigera tillbaka
    - Förbättrad tillgänglighet

23. **Lägg till skeleton screens för alla loading states**
    - PageLoader finns redan
    - Använd konsekvent överallt
    - Förbättra upplevd hastighet

24. **Implementera keyboard navigation**
    - Keyboard shortcuts för vanliga åtgärder
    - Förbättrad tillgänglighet
    - Power user-funktionalitet

## 🔍 SEO & Tillgänglighet (25-27)

25. **Lägg till strukturerad data (JSON-LD)**
    - Schema.org markup för dokument
    - Förbättra sökmotorsynlighet
    - Rich snippets i Google

26. **Förbättra ARIA-labels och semantisk HTML**
    - Audit med Lighthouse
    - Lägg till aria-labels på knappar
    - Förbättra screen reader-stöd

27. **Implementera sitemap.xml generation**
    - Automatisk generering vid build
    - Inkludera alla routes
    - Förbättra indexering

## 🧪 Testing & CI/CD (28-30)

28. **Lägg till E2E-tester med Playwright**
    - Testa kritiska user flows
    - Automatiska smoke tests efter deploy
    - Förhindra regressions

29. **Implementera visuell regression testing**
    - Percy eller Chromatic
    - Fånga oavsiktliga UI-ändringar
    - Förbättra CI-pipeline

30. **Lägg till GitHub Actions för automatisk deployment preview**
    - Preview URLs för varje PR
    - Enklare code review
    - Testa innan merge

---

## Prioritering

### 🔥 Kritiska (bör göras först):
- #1: Reducera duplicering
- #15: Fixa säkerhetsproblem  
- #18: Input sanitering
- #3: TypeScript strict mode

### ⚡ Hög prioritet:
- #8: State management
- #10: PWA/offline support
- #20: Dark mode
- #28: E2E tests

### 💡 Medel prioritet:
- #9: Virtual scrolling
- #21-24: UX-förbättringar
- #25-27: SEO
- #2: Error boundaries

### 📝 Låg prioritet (nice to have):
- #29: Visual regression
- #30: Preview deployments
- #5: DevTools
- #24: Keyboard shortcuts
