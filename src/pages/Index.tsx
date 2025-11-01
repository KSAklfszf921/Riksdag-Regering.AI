import { Link } from "react-router-dom";
import { InstitutionCard } from "@/components/InstitutionCard";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, LogOut, Heart, ArrowDown, FileText, Users } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickSearch } from "@/components/QuickSearch";
import riksdagenLogo from "@/assets/riksdagen-logo.svg";
import regeringskanslientLogo from "@/assets/regeringskansliet-logo.svg";
const Index = () => {
  const {
    isAdmin
  } = useIsAdmin();
  const {
    toast
  } = useToast();
  const {
    data: user,
    isLoading: userLoading
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data
      } = await supabase.auth.getUser();
      return data.user;
    }
  });

  // Fetch live stats from database
  const { data: liveStats, isLoading: statsLoading } = useQuery({
    queryKey: ['homepage-stats'],
    queryFn: async () => {
      const [dokumentResult, ledamoterResult] = await Promise.all([
        supabase.from('riksdagen_dokument').select('id', { count: 'exact', head: true }),
        supabase.from('riksdagen_ledamoter').select('id', { count: 'exact', head: true }),
      ]);

      return {
        dokument: dokumentResult.count || 0,
        ledamoter: ledamoterResult.count || 0,
      };
    },
  });

  const scrollToInstitutions = () => {
    document.getElementById('institutions')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Utloggad",
      description: "Du är nu utloggad"
    });
  };
  return <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Riksdag & Regering</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        <div className="flex justify-end gap-3 mb-8">
          {/* Favorites button - show for logged in users */}
          {user && <Link to="/favorites">
              <Button variant="outline-hover" size="sm" className="touch-target">
                <Heart className="h-4 w-4 mr-2" />
                Favoriter
              </Button>
            </Link>}

          {/* Admin button - show for logged in users */}
          {user && <Link to="/admin">
              <Button
                variant={isAdmin ? "gradient" : "outline-hover"}
                size="sm"
                className="touch-target"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isAdmin ? "Admin Panel" : "Admin Setup"}
              </Button>
            </Link>}

          {/* Auth buttons */}
          {user ? <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="touch-target">
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div> : <Link to="/login">
              <Button size="sm" className="touch-target">
                <LogIn className="h-4 w-4 mr-2" />
                Logga in för Admin
              </Button>
            </Link>}
        </div>

        {/* Enhanced Hero Section with Live Stats */}
        <header className="text-center mb-20 md:mb-28">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="hero-title text-foreground">
                Sök i Sveriges<br className="hidden md:block" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {" "}Politiska Arkiv
                </span>
              </h1>

              <div className="w-24 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 mx-auto rounded-full"></div>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                AI-driven tillgång till Sveriges största samling av politiska dokument från Riksdagen och Regeringskansliet
              </p>
            </div>

            {/* Live Stats - Impressive numbers */}
            {statsLoading ? (
              <div className="flex justify-center gap-16 py-6">
                <div className="text-center">
                  <Skeleton className="h-16 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
                <div className="hidden md:block w-px bg-border"></div>
                <div className="text-center">
                  <Skeleton className="h-16 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              </div>
            ) : liveStats && (liveStats.dokument > 0 || liveStats.ledamoter > 0) ? (
              <div className="flex justify-center gap-12 md:gap-16 py-6">
                {liveStats.dokument > 0 && (
                  <>
                    <div className="text-center group">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary/60 transition-transform group-hover:scale-110" />
                        <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                          {liveStats.dokument.toLocaleString('sv-SE')}
                        </div>
                      </div>
                      <div className="text-sm md:text-base text-muted-foreground font-medium">
                        Dokument
                      </div>
                    </div>

                    {liveStats.ledamoter > 0 && (
                      <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                    )}
                  </>
                )}

                {liveStats.ledamoter > 0 && (
                  <div className="text-center group">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Users className="h-6 w-6 md:h-8 md:w-8 text-secondary/60 transition-transform group-hover:scale-110" />
                      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-secondary to-secondary/60 bg-clip-text text-transparent">
                        {liveStats.ledamoter}
                      </div>
                    </div>
                    <div className="text-sm md:text-base text-muted-foreground font-medium">
                      Ledamöter
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* CTA Button */}
            <div className="pt-4">
              <Button
                size="lg"
                variant="gradient"
                className="h-14 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                onClick={scrollToInstitutions}
              >
                Börja utforska
                <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
              </Button>

              <p className="text-xs text-muted-foreground mt-4">
                Gratis • Öppen data • Uppdateras kontinuerligt
              </p>
            </div>
          </div>
        </header>

        {/* Quick Search Section */}
        <div className="mb-20 md:mb-28">
          <QuickSearch className="max-w-2xl mx-auto" />
        </div>

        {/* Institutions Grid - scroll target */}
        <div id="institutions" className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 max-w-6xl mx-auto mb-20 scroll-mt-24">
          <InstitutionCard
            title="Riksdagen"
            description="Utforska Sveriges riksdag med AI. Få insikter om propositioner, debatter och beslutsprocesser."
            href="/riksdagen"
            image={riksdagenLogo}
            accentColor="primary"
          />

          <InstitutionCard
            title="Regeringskansliet"
            description="Upptäck regeringens arbete och organisation. AI-driven information om departement och policy."
            href="/regeringskansliet"
            image={regeringskanslientLogo}
            accentColor="secondary"
          />
        </div>

        <footer className="border-t border-border/40 bg-gradient-to-b from-muted/10 to-muted/30 -mx-4 px-4 py-12 mt-24">
          <div className="max-w-prose mx-auto">
            <div className="pt-8 border-t border-border/40 text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Svenska AI-tjänster. Alla rättigheter förbehållna.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>;
};
export default Index;