import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import EmptyState from "@/components/EmptyState";

const Dokument = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  const { data: dokument, isLoading } = useQuery({
    queryKey: ['dokument', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('riksdagen_dokument')
        .select('*')
        .order('datum', { ascending: false });

      // Apply search filter if search query exists
      if (searchQuery) {
        query = query.or(`titel.ilike.%${searchQuery}%,subtitel.ilike.%${searchQuery}%,doktyp.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full bg-primary py-1"></div>
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <header className="mb-12">
          <Link to="/riksdagen" className="text-primary hover:underline mb-4 inline-block">
            ← Tillbaka till Riksdagen
          </Link>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            Riksdagsdokument
          </h1>
          <div className="w-20 h-1 bg-secondary mb-6"></div>
          <p className="text-muted-foreground">
            {searchQuery ? (
              <>
                Sökresultat för: <span className="font-semibold text-foreground">{searchQuery}</span>
                {dokument && dokument.length > 0 && (
                  <> ({dokument.length} {dokument.length === 1 ? 'dokument' : 'dokument'})</>
                )}
              </>
            ) : (
              'Senaste dokumenten från riksdagen'
            )}
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : dokument && dokument.length === 0 ? (
          <EmptyState
            message="Inga dokument hittades"
            suggestion="Använd 'Hämta data'-knappen på Riksdagen-sidan för att ladda ned dokument från Riksdagens API"
          />
        ) : (
          <div className="space-y-4">
            {dokument?.map((dok) => (
              <Card key={dok.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {dok.doktyp && (
                          <Badge variant="outline">{dok.doktyp}</Badge>
                        )}
                        {dok.beteckning && (
                          <Badge variant="secondary">{dok.beteckning}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">
                        {dok.titel || 'Dokument utan titel'}
                      </CardTitle>
                      {dok.subtitel && (
                        <CardDescription className="text-base">
                          {dok.subtitel}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {dok.datum && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(dok.datum), { 
                              addSuffix: true, 
                              locale: sv 
                            })}
                          </div>
                        )}
                        {dok.organ && <span>Organ: {dok.organ}</span>}
                        {dok.status && <span>Status: {dok.status}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {dok.local_pdf_url && (
                        <a
                          href={dok.local_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                        >
                          PDF (Lokal) <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {dok.dokument_url_html && (
                        <a
                          href={dok.dokument_url_html}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          HTML <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {dok.dokument_url_text && (
                        <a
                          href={dok.dokument_url_text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Text <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dokument;
