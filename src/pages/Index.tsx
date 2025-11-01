import { Link } from "react-router-dom";
import { InstitutionCard } from "@/components/InstitutionCard";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, LogOut, Heart } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
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

        <header className="text-center mb-16 md:mb-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="hero-title text-foreground">
              Riksdag & Regering
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 mx-auto rounded-full"></div>
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              Utforska svenska politiska institutioner med AI-baserade informationstjänster
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 max-w-6xl mx-auto mb-20">
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