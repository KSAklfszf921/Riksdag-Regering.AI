# Design & UX Förbättringar - 20 Förslag

Baserat på analys av nuvarande design (Tailwind CSS, shadcn/ui, IBM Plex Serif + Inter).

---

## 🎨 Typografi & Hierarki

### 1. **Förbättrad Typografisk Hierarki**
**Problem:** Textsstorlekar är relativt enhetliga
**Lösning:**
- Lägg till fler storlekar: `text-6xl` för hero titlar
- Använd `font-weight` variationer (300, 400, 500, 600, 700)
- Lägg till `letter-spacing` för stora rubriker: `tracking-tight`
- Använd `line-height` strategiskt: `leading-tight` för titlar, `leading-relaxed` för brödtext

**Implementation:**
```css
/* src/index.css */
.hero-title {
  @apply text-6xl font-bold tracking-tight leading-none;
}

.section-title {
  @apply text-3xl font-semibold tracking-tight;
}

.body-large {
  @apply text-lg leading-relaxed;
}
```

---

### 2. **Lägg till Textur med Font Styles**
**Problem:** Endast två typsnitt används
**Lösning:**
- Använd `font-serif` för alla rubriker (IBM Plex Serif) för elegans
- Använd `font-sans` (Inter) för all brödtext och UI-element
- Lägg till `italic` för citat och betoningar

**Exempel:**
```tsx
<h1 className="font-serif text-4xl font-bold">Riksdagen</h1>
<p className="font-sans text-base leading-relaxed">Beskrivning...</p>
<blockquote className="font-serif italic text-muted-foreground">
  "Sveriges riksdag är folkets högsta beslutande församling."
</blockquote>
```

---

## 🌈 Färger & Kontrast

### 3. **Gradient Accents**
**Problem:** Platta färger överallt, saknar djup
**Lösning:**
- Lägg till subtila gradienter påCards och Headers
- Använd `from-primary/5 to-secondary/5` för bakgrunder

**Implementation:**
```tsx
// InstitutionCard.tsx
<Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 hover:border-primary/20 transition-all duration-300">
```

```css
/* index.css */
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--secondary) / 0.05) 100%);
}
```

---

### 4. **Status Colors med Bättre Visuell Feedback**
**Problem:** Success/Error/Warning finns men används inte konsekvent
**Lösning:**
- Lägg till badge-varianter med semantiska färger
- Använd färgkodade ikoner

**Exempel:**
```tsx
// components/ui/status-badge.tsx
const statusStyles = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
  info: "bg-info/10 text-info border-info/20"
};

<Badge className={statusStyles.success}>Aktiv</Badge>
```

---

### 5. **Höj Kontrasten på Muted Text**
**Problem:** `text-muted-foreground` kan vara svår att läsa
**Lösning:**
- Öka kontrasten från 50% till 60-65%
- Använd olika nivåer: `text-muted-foreground` och `text-muted-foreground/80`

**Fix i index.css:**
```css
:root {
  --muted-foreground: 210 15% 40%; /* Tidigare 50% */
}

.dark {
  --muted-foreground: 210 15% 70%; /* Tidigare 65% */
}
```

---

## ✨ Animationer & Transitions

### 6. **Smooth Hover Effects**
**Problem:** Abrupt hover states på knappar och kort
**Lösning:**
- Lägg till `transition-all duration-300 ease-in-out`
- Använd `hover:scale-[1.02]` för subtil zoom
- Lägg till `hover:shadow-lg` för djup

**Exempel:**
```tsx
// InstitutionCard.tsx
<Card className="
  transition-all duration-300 ease-in-out
  hover:scale-[1.02]
  hover:shadow-xl
  hover:border-primary/30
">
```

---

### 7. **Page Transitions**
**Problem:** Abrupt sidnavigering
**Lösning:**
- Lägg till Framer Motion för page transitions
- Fade in + slide up effekt

**Implementation:**
```tsx
// App.tsx
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3 }}
  >
    <Routes>...</Routes>
  </motion.div>
</AnimatePresence>
```

---

### 8. **Loading Skeletons med Shimmer Effect**
**Problem:** Statiska skeleton screens
**Lösning:**
- Lägg till animerad shimmer effekt
- Använd gradient animation

**CSS:**
```css
/* index.css */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

---

## 🎯 Layout & Spacing

### 9. **Konsekvent Spacing System**
**Problem:** Olika spacing-värden används inkonsekvent
**Lösning:**
- Definiera spacing scale: 4px-baserat system
- Använd endast: `space-2`, `space-4`, `space-6`, `space-8`, `space-12`, `space-16`, `space-24`

**Best Practice:**
```tsx
// Istället för:
<div className="mb-3 mt-5 px-7">

// Använd:
<div className="mb-4 mt-6 px-8"> // Divisible by 4
```

---

### 10. **Förbättrad Container Max-Width**
**Problem:** Innehåll kan bli för brett på stora skärmar
**Lösning:**
- Använd olika `max-w-*` för olika sektioner
- Hero: `max-w-4xl`
- Content: `max-w-7xl`
- Text: `max-w-prose` (65ch optimal läslängd)

**Exempel:**
```tsx
<section className="container mx-auto px-4">
  <div className="max-w-4xl mx-auto text-center">
    <h1>Hero Title</h1>
  </div>

  <div className="max-w-prose mx-auto">
    <p>Long form content optimal for reading...</p>
  </div>
</section>
```

---

### 11. **Grid Gap Responsivitet**
**Problem:** Samma gap på mobil och desktop
**Lösning:**
- Använd responsive gap: `gap-4 md:gap-6 lg:gap-8`

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
```

---

## 🎭 Komponenter & UI-detaljer

### 12. **Förbättrade Card Designs**
**Problem:** Cards ser platta ut
**Lösning:**
- Lägg till subtil inner shadow
- Använd border gradients
- Lägg till hover states med glow effect

**CSS:**
```css
/* index.css */
.card-elevated {
  box-shadow:
    0 1px 3px hsl(var(--foreground) / 0.05),
    0 10px 20px hsl(var(--foreground) / 0.02);
}

.card-elevated:hover {
  box-shadow:
    0 4px 6px hsl(var(--primary) / 0.1),
    0 20px 40px hsl(var(--primary) / 0.05);
}
```

---

### 13. **Ikoner med Färg-Accenter**
**Problem:** Alla ikoner är monokroma
**Lösning:**
- Lägg till färgade ikoner för olika sektioner
- Använd `text-primary`, `text-secondary`, `text-success` strategiskt

**Exempel:**
```tsx
import { Building, Users, FileText, Scale } from 'lucide-react';

<div className="flex items-center gap-3">
  <Building className="h-5 w-5 text-primary" />
  <span>Riksdagen</span>
</div>

<div className="flex items-center gap-3">
  <Scale className="h-5 w-5 text-secondary" />
  <span>Regeringskansliet</span>
</div>
```

---

### 14. **Förbättrade Buttons med Varianter**
**Problem:** Endast standard button styles
**Lösning:**
- Lägg till nya varianter: `ghost-hover`, `gradient`, `outline-hover`

**Button Component:**
```tsx
// components/ui/button.tsx
const buttonVariants = {
  gradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70",
  "ghost-hover": "hover:bg-accent hover:text-accent-foreground transition-colors",
  "outline-hover": "border border-primary/20 hover:border-primary hover:bg-primary/5"
};
```

---

### 15. **Breadcrumbs med Ikoner**
**Problem:** Breadcrumbs saknar visuell hierarki
**Lösning:**
- Lägg till ikoner per nivå
- Använd `ChevronRight` som separator istället för `/`

**Exempel:**
```tsx
import { Home, ChevronRight, Building } from 'lucide-react';

<nav className="flex items-center gap-2 text-sm">
  <Home className="h-4 w-4 text-muted-foreground" />
  <ChevronRight className="h-4 w-4 text-muted-foreground" />
  <Building className="h-4 w-4 text-primary" />
  <span className="font-medium">Riksdagen</span>
</nav>
```

---

## 📱 Responsiv Design

### 16. **Mobil-Optimerade Typsnitt**
**Problem:** Samma textstorlekar på mobil och desktop
**Lösning:**
- Använd `clamp()` för fluid typography

**CSS:**
```css
/* index.css */
.hero-fluid {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.1;
}

.body-fluid {
  font-size: clamp(0.875rem, 2vw, 1rem);
  line-height: 1.6;
}
```

**Eller med Tailwind:**
```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
```

---

### 17. **Touch-Friendly Interactive Elements**
**Problem:** Knappar kan vara för små på mobil
**Lösning:**
- Minsta touch target: 44x44px (WCAG guideline)
- Lägg till `min-h-[44px]` på alla buttons på mobil

**Exempel:**
```tsx
<Button className="min-h-[44px] px-6 sm:min-h-[40px]">
  Klicka här
</Button>
```

---

## 🌙 Dark Mode Förbättringar

### 18. **Mjukare Dark Mode Övergång**
**Problem:** Hård switch mellan light/dark mode
**Lösning:**
- Lägg till smooth transition på alla element
- Använd `transition-colors duration-200` globalt

**CSS:**
```css
/* index.css */
* {
  @apply transition-colors duration-200;
}

/* Disable transition on theme toggle to prevent flash */
.theme-transition-disabled * {
  transition: none !important;
}
```

---

### 19. **Bättre Dark Mode Kontrast**
**Problem:** Vissa element försvinner i dark mode
**Lösning:**
- Öka kontrasten på borders i dark mode
- Använd subtil glow istället för borders

**CSS:**
```css
.dark {
  --border: 210 20% 25%; /* Tidigare 20% */
}

/* Eller använd glow: */
.card-dark-glow {
  box-shadow: 0 0 0 1px hsl(var(--primary) / 0.2);
}
```

---

## 🎪 Mikrointeraktioner

### 20. **Hover States med Detaljer**
**Problem:** Simpla hover effekter
**Lösning:**
- Lägg till multi-layer hover effects
- Kombinera scale, shadow, border, och color changes

**Exempel:**
```tsx
// InstitutionCard Component
<Card className="
  group
  transition-all duration-300 ease-in-out
  hover:scale-[1.02]
  hover:shadow-xl hover:shadow-primary/5
  hover:border-primary/30
  hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent
">
  <CardHeader>
    <Building className="
      h-8 w-8 mb-4
      text-muted-foreground
      group-hover:text-primary
      group-hover:scale-110
      transition-all duration-300
    " />
    <CardTitle className="
      group-hover:text-primary
      transition-colors duration-300
    ">
      Riksdagen
    </CardTitle>
  </CardHeader>
</Card>
```

---

## 📊 Sammanfattning

### Prioritering

**🔥 Critical (Implementera först):**
1. ✅ #1 - Typografisk hierarki
2. ✅ #6 - Smooth hover effects
3. ✅ #9 - Konsekvent spacing
4. ✅ #10 - Container max-width
5. ✅ #18 - Dark mode transition

**⚡ High Priority:**
6. ✅ #3 - Gradient accents
7. ✅ #7 - Page transitions
8. ✅ #12 - Förbättrade cards
9. ✅ #13 - Ikoner med färg
10. ✅ #16 - Mobil-optimerade typsnitt

**💡 Medium Priority:**
11. ✅ #2 - Font styles
12. ✅ #4 - Status colors
13. ✅ #8 - Loading shimmer
14. ✅ #11 - Grid gap responsivitet
15. ✅ #14 - Button varianter

**🎨 Nice to Have:**
16. ✅ #5 - Kontrast på muted text
17. ✅ #15 - Breadcrumbs med ikoner
18. ✅ #17 - Touch-friendly
19. ✅ #19 - Dark mode kontrast
20. ✅ #20 - Mikrointeraktioner

---

## 🚀 Implementation Plan

### Fas 1: Foundation (30 min)
- Uppdatera `index.css` med nya utility classes
- Fixa spacing system
- Lägg till transitions

### Fas 2: Components (1h)
- Uppdatera Card component
- Förbättra Button variants
- Lägg till Status Badge

### Fas 3: Layout (45 min)
- Fixa container widths
- Förbättra grid gaps
- Uppdatera typografi

### Fas 4: Polish (1h)
- Lägg till page transitions (Framer Motion)
- Implementera hover states
- Fixa dark mode detaljer

### Total tid: ~3-4 timmar

---

## 📦 Nya Dependencies

```bash
# För animationer
npm install framer-motion

# För ikoner (redan installerat men bra att nämna)
# lucide-react är redan installerat
```

---

**Datum:** 2025-11-01
**Version:** Design v1.0
**Status:** 📝 Planerat - Redo för implementation
