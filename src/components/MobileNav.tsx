import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Home, Building2, Shield, Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Mobile navigation component with hamburger menu
 * Provides responsive navigation for mobile devices
 */
export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useIsAdmin();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const NavLink = ({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon?: any }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className="flex items-center gap-3 px-4 py-3 text-lg hover:bg-muted rounded-md transition-colors"
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Öppna meny</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Utforska Riksdagen och Regeringskansliet
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-2 mt-6">
          <NavLink to="/" icon={Home}>
            Startsida
          </NavLink>

          <div className="my-2 border-t" />

          <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
            Riksdagen
          </div>
          <NavLink to="/riksdagen">Översikt</NavLink>
          <NavLink to="/riksdagen/ledamoter">Ledamöter</NavLink>
          <NavLink to="/riksdagen/dokument">Dokument</NavLink>
          <NavLink to="/riksdagen/anforanden">Anföranden</NavLink>
          <NavLink to="/riksdagen/voteringar">Voteringar</NavLink>

          <div className="my-2 border-t" />

          <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
            Regeringskansliet
          </div>
          <NavLink to="/regeringskansliet">Översikt</NavLink>
          <NavLink to="/regeringskansliet/pressmeddelanden">Pressmeddelanden</NavLink>
          <NavLink to="/regeringskansliet/propositioner">Propositioner</NavLink>
          <NavLink to="/regeringskansliet/sou">SOU</NavLink>
          <NavLink to="/regeringskansliet/tal">Tal</NavLink>
          <NavLink to="/regeringskansliet/remisser">Remisser</NavLink>

          <div className="my-2 border-t" />

          {user && (
            <>
              <NavLink to="/favorites" icon={Heart}>
                Favoriter
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" icon={Shield}>
                  Admin Panel
                </NavLink>
              )}
            </>
          )}

          {!user && (
            <NavLink to="/login" icon={LogIn}>
              Logga in
            </NavLink>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
