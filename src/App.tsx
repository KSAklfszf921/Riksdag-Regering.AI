import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// Eager load critical routes for better initial UX
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy load all other routes for code splitting and better performance
const Riksdagen = lazy(() => import("./pages/Riksdagen"));
const Ledamoter = lazy(() => import("./pages/Ledamoter"));
const Dokument = lazy(() => import("./pages/Dokument"));
const Anforanden = lazy(() => import("./pages/Anforanden"));
const Voteringar = lazy(() => import("./pages/Voteringar"));
const Regeringskansliet = lazy(() => import("./pages/Regeringskansliet"));
const Pressmeddelanden = lazy(() => import("./pages/Pressmeddelanden"));
const RegeringskanslientPropositioner = lazy(() => import("./pages/RegeringskanslientPropositioner"));
const RegeringskanslientDokument = lazy(() => import("./pages/RegeringskanslientDokument"));
const RegeringskanslientKategorier = lazy(() => import("./pages/RegeringskanslientKategorier"));
const RegeringskanslientDepartementsserien = lazy(() => import("./pages/RegeringskanslientDepartementsserien"));
const RegeringskanslientSkrivelse = lazy(() => import("./pages/RegeringskanslientSkrivelse"));
const RegeringskanslientSOU = lazy(() => import("./pages/RegeringskanslientSOU"));
const RegeringskanslientTal = lazy(() => import("./pages/RegeringskanslientTal"));
const RegeringskanslientRemisser = lazy(() => import("./pages/RegeringskanslientRemisser"));
const RegeringskanslientKommittedirektiv = lazy(() => import("./pages/RegeringskanslientKommittedirektiv"));
const RegeringskanslientFaktapromemoria = lazy(() => import("./pages/RegeringskanslientFaktapromemoria"));
const RegeringskanslientInformationsmaterial = lazy(() => import("./pages/RegeringskanslientInformationsmaterial"));
const RegeringskanslientMRGranskningar = lazy(() => import("./pages/RegeringskanslientMRGranskningar"));
const RegeringskanslientDagordningar = lazy(() => import("./pages/RegeringskanslientDagordningar"));
const RegeringskanslientRapporter = lazy(() => import("./pages/RegeringskanslientRapporter"));
const RegeringskanslientRegeringsuppdrag = lazy(() => import("./pages/RegeringskanslientRegeringsuppdrag"));
const RegeringskanslientRegeringsarenden = lazy(() => import("./pages/RegeringskanslientRegeringsarenden"));
const RegeringskanslientSakrad = lazy(() => import("./pages/RegeringskanslientSakrad"));
const RegeringskanslientBistandsstrategier = lazy(() => import("./pages/RegeringskanslientBistandsstrategier"));
const RegeringskanslientOverenskommelserAvtal = lazy(() => import("./pages/RegeringskanslientOverenskommelserAvtal"));
const RegeringskanslientArendeforteckningar = lazy(() => import("./pages/RegeringskanslientArendeforteckningar"));
const RegeringskanslientArtiklar = lazy(() => import("./pages/RegeringskanslientArtiklar"));
const RegeringskanslientDebattartiklar = lazy(() => import("./pages/RegeringskanslientDebattartiklar"));
const RegeringskanslientUDAvrader = lazy(() => import("./pages/RegeringskanslientUDAvrader"));
const RegeringskanslientUttalanden = lazy(() => import("./pages/RegeringskanslientUttalanden"));
const RegeringskanslientLagradsremiss = lazy(() => import("./pages/RegeringskanslientLagradsremiss"));
const RegeringskanslientForordningsmotiv = lazy(() => import("./pages/RegeringskanslientForordningsmotiv"));
const RegeringskanslientInternationellaOverenskommelser = lazy(() => import("./pages/RegeringskanslientInternationellaOverenskommelser"));
const Admin = lazy(() => import("./pages/Admin"));
const Favorites = lazy(() => import("./pages/Favorites"));

/**
 * Loading fallback component shown while lazy routes are loading
 * Provides better UX with skeleton screens instead of blank page
 */
const PageLoader = () => (
  <div className="min-h-screen bg-background p-8">
    <div className="container mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
);

const App = () => (
  <BrowserRouter
    basename={import.meta.env.PROD ? "/Riksdag-Regering.AI" : "/"}
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Eager loaded routes - critical paths */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />

        {/* Lazy loaded routes - Riksdagen */}
        <Route path="/riksdagen" element={<Riksdagen />} />
        <Route path="/riksdagen/ledamoter" element={<Ledamoter />} />
        <Route path="/riksdagen/dokument" element={<Dokument />} />
        <Route path="/riksdagen/anforanden" element={<Anforanden />} />
        <Route path="/riksdagen/voteringar" element={<Voteringar />} />

        {/* Lazy loaded routes - Regeringskansliet */}
        <Route path="/regeringskansliet" element={<Regeringskansliet />} />
        <Route path="/regeringskansliet/pressmeddelanden" element={<Pressmeddelanden />} />
        <Route path="/regeringskansliet/propositioner" element={<RegeringskanslientPropositioner />} />
        <Route path="/regeringskansliet/dokument" element={<RegeringskanslientDokument />} />
        <Route path="/regeringskansliet/kategorier" element={<RegeringskanslientKategorier />} />
        <Route path="/regeringskansliet/departementsserien" element={<RegeringskanslientDepartementsserien />} />
        <Route path="/regeringskansliet/skrivelse" element={<RegeringskanslientSkrivelse />} />
        <Route path="/regeringskansliet/sou" element={<RegeringskanslientSOU />} />
        <Route path="/regeringskansliet/tal" element={<RegeringskanslientTal />} />
        <Route path="/regeringskansliet/remisser" element={<RegeringskanslientRemisser />} />
        <Route path="/regeringskansliet/kommittedirektiv" element={<RegeringskanslientKommittedirektiv />} />
        <Route path="/regeringskansliet/faktapromemoria" element={<RegeringskanslientFaktapromemoria />} />
        <Route path="/regeringskansliet/informationsmaterial" element={<RegeringskanslientInformationsmaterial />} />
        <Route path="/regeringskansliet/mr-granskningar" element={<RegeringskanslientMRGranskningar />} />
        <Route path="/regeringskansliet/dagordningar" element={<RegeringskanslientDagordningar />} />
        <Route path="/regeringskansliet/rapporter" element={<RegeringskanslientRapporter />} />
        <Route path="/regeringskansliet/regeringsuppdrag" element={<RegeringskanslientRegeringsuppdrag />} />
        <Route path="/regeringskansliet/regeringsarenden" element={<RegeringskanslientRegeringsarenden />} />
        <Route path="/regeringskansliet/sakrad" element={<RegeringskanslientSakrad />} />
        <Route path="/regeringskansliet/bistands-strategier" element={<RegeringskanslientBistandsstrategier />} />
        <Route path="/regeringskansliet/overenskommelser-avtal" element={<RegeringskanslientOverenskommelserAvtal />} />
        <Route path="/regeringskansliet/arendeforteckningar" element={<RegeringskanslientArendeforteckningar />} />
        <Route path="/regeringskansliet/artiklar" element={<RegeringskanslientArtiklar />} />
        <Route path="/regeringskansliet/debattartiklar" element={<RegeringskanslientDebattartiklar />} />
        <Route path="/regeringskansliet/ud-avrader" element={<RegeringskanslientUDAvrader />} />
        <Route path="/regeringskansliet/uttalanden" element={<RegeringskanslientUttalanden />} />
        <Route path="/regeringskansliet/lagradsremiss" element={<RegeringskanslientLagradsremiss />} />
        <Route path="/regeringskansliet/forordningsmotiv" element={<RegeringskanslientForordningsmotiv />} />
        <Route path="/regeringskansliet/internationella-overenskommelser" element={<RegeringskanslientInternationellaOverenskommelser />} />

        {/* Lazy loaded routes - Admin & User features */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/favorites" element={<Favorites />} />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;