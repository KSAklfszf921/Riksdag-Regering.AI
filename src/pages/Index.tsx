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

      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="flex justify-end gap-2 mb-4">
          {/* Favorites button - show for logged in users */}
          {user && <Link to="/favorites">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Favoriter
              </Button>
            </Link>}
          
          {/* Admin button - show for logged in users */}
          {user && <Link to="/admin">
              <Button variant={isAdmin ? "default" : "outline"} size="sm">
                <Shield className="h-4 w-4 mr-2" />
                {isAdmin ? "Admin Panel" : "Admin Setup"}
              </Button>
            </Link>}
          
          {/* Auth buttons */}
          {user ? <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div> : <Link to="/login">
              <Button size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Logga in för Admin
              </Button>
            </Link>}
        </div>

        <header className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-3 tracking-tight">
            Riksdag & Regering
          </h1>
          <div className="w-16 h-0.5 bg-primary/20 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Utforska svenska politiska institutioner med AI-baserade informationstjänster
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto mb-16">
          <InstitutionCard title="Riksdagen" description="Utforska Sveriges riksdag med AI. Få insikter om propositioner, debatter och beslutsprocesser." href="/riksdagen" image={riksdagenLogo} />

          <InstitutionCard title="Regeringskansliet" description="Upptäck regeringens arbete och organisation. AI-driven information om departement och policy." href="/regeringskansliet" image={regeringskanslientLogo} />
        </div>

        <footer className="border-t border-border/40 bg-muted/20 -mx-4 px-4 py-8 mt-16">
          
          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Svenska AI-tjänster. Alla rättigheter förbehållna.
            </p>
          </div>
        </footer>
      </div>
    </div>;
};
export default Index;