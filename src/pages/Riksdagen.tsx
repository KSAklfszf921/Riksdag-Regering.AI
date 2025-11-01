import { Link } from "react-router-dom";
import { FileText, Users, MessageSquare, Vote } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/navigation/AppHeader";
import { DynamicBreadcrumbs } from "@/components/navigation/DynamicBreadcrumbs";

const Riksdagen = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['riksdagen-stats'],
    queryFn: async () => {
      const [dokument, ledamoter, anforanden, voteringar] = await Promise.all([
        supabase.from('riksdagen_dokument').select('id', { count: 'exact', head: true }),
        supabase.from('riksdagen_ledamoter').select('id', { count: 'exact', head: true }),
        supabase.from('riksdagen_anforanden').select('id', { count: 'exact', head: true }),
        supabase.from('riksdagen_voteringar').select('id', { count: 'exact', head: true }),
      ]);
      
      return {
        dokument: dokument.count || 0,
        ledamoter: ledamoter.count || 0,
        anforanden: anforanden.count || 0,
        voteringar: voteringar.count || 0,
      };
    },
  });

  const sections = [
    {
      title: "Ledamöter",
      description: "Utforska riksdagens ledamöter, deras roller och partitillhörighet",
      icon: Users,
      href: "/riksdagen/ledamoter",
      variant: "info" as const
    },
    {
      title: "Dokument",
      description: "Sök och läs propositioner, betänkanden och andra riksdagsdokument",
      icon: FileText,
      href: "/riksdagen/dokument",
      variant: "success" as const
    },
    {
      title: "Anföranden",
      description: "Följ debatter och läs anföranden från riksdagens kammare",
      icon: MessageSquare,
      href: "/riksdagen/anforanden",
      variant: "warning" as const
    },
    {
      title: "Voteringar",
      description: "Se resultat från omröstningar och hur ledamöter röstat",
      icon: Vote,
      href: "/riksdagen/voteringar",
      variant: "error" as const
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <DynamicBreadcrumbs />

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Sveriges Riksdag
          </h1>
          <div className="w-20 h-1 bg-secondary mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Utforska data från riksdagens öppna API:er med hjälp av AI
          </p>
        </header>

        {/* Compact Statistics - 1 row */}
        {statsLoading ? (
          <div className="flex justify-center gap-8 md:gap-12 mb-16 p-6 bg-muted/30 rounded-lg">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-6 mx-auto mb-2 rounded-full" />
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
        ) : stats && (stats.dokument > 0 || stats.ledamoter > 0 || stats.anforanden > 0 || stats.voteringar > 0) ? (
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16 p-6 bg-muted/30 rounded-lg">
            {stats.dokument > 0 && (
              <>
                <div className="text-center group cursor-default">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground transition-transform group-hover:scale-110" />
                  <div className="text-3xl font-bold text-foreground">
                    {stats.dokument.toLocaleString('sv-SE')}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">
                    Dokument
                  </div>
                </div>

                {(stats.ledamoter > 0 || stats.anforanden > 0 || stats.voteringar > 0) && (
                  <Separator orientation="vertical" className="h-16 self-center hidden md:block" />
                )}
              </>
            )}

            {stats.ledamoter > 0 && (
              <>
                <div className="text-center group cursor-default">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground transition-transform group-hover:scale-110" />
                  <div className="text-3xl font-bold text-foreground">
                    {stats.ledamoter}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">
                    Ledamöter
                  </div>
                </div>

                {(stats.anforanden > 0 || stats.voteringar > 0) && (
                  <Separator orientation="vertical" className="h-16 self-center hidden md:block" />
                )}
              </>
            )}

            {stats.anforanden > 0 && (
              <>
                <div className="text-center group cursor-default">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground transition-transform group-hover:scale-110" />
                  <div className="text-3xl font-bold text-foreground">
                    {stats.anforanden.toLocaleString('sv-SE')}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">
                    Anföranden
                  </div>
                </div>

                {stats.voteringar > 0 && (
                  <Separator orientation="vertical" className="h-16 self-center hidden md:block" />
                )}
              </>
            )}

            {stats.voteringar > 0 && (
              <div className="text-center group cursor-default">
                <Vote className="h-6 w-6 mx-auto mb-2 text-muted-foreground transition-transform group-hover:scale-110" />
                <div className="text-3xl font-bold text-foreground">
                  {stats.voteringar.toLocaleString('sv-SE')}
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-1">
                  Voteringar
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {sections.map((section) => (
            <Link key={section.href} to={section.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <section.icon className={`h-8 w-8 ${section.variant === 'info' ? 'text-info' : section.variant === 'success' ? 'text-success' : section.variant === 'warning' ? 'text-warning' : 'text-error'}`} />
                    <CardTitle className="text-2xl">{section.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link 
            to="/" 
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Riksdagen;
