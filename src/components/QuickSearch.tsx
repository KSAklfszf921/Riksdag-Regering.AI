import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuickSearchProps {
  className?: string;
}

export const QuickSearch = ({ className }: QuickSearchProps) => {
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  // Fetch popular search terms from recent documents
  const { data: popularTerms } = useQuery({
    queryKey: ['popular-search-terms'],
    queryFn: async () => {
      // Get recent document types that are actually in the database
      const { data, error } = await supabase
        .from('riksdagen_dokument')
        .select('doktyp')
        .not('doktyp', 'is', null)
        .limit(100);

      if (error || !data) return [];

      // Count occurrences and get top 3
      const typeCounts = data.reduce((acc, doc) => {
        const type = doc.doktyp;
        if (type) {
          acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(typeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Navigate to dokument page with search query
      navigate(`/riksdagen/dokument?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handlePopularSearch = (term: string) => {
    setSearchValue(term);
    navigate(`/riksdagen/dokument?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className={className}>
      {/* Search Input */}
      <form onSubmit={handleSearch}>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
          <Input
            type="text"
            placeholder="Sök i propositioner, ledamöter, voteringar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-12 h-14 text-base bg-card/50 backdrop-blur border-2 hover:border-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>

      {/* Popular Searches */}
      {popularTerms && popularTerms.length > 0 && (
        <div className="flex items-center gap-3 mt-4 justify-center flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">Populärt:</span>
          </div>

          {popularTerms.map((term) => (
            <Badge
              key={term}
              variant="outline"
              className="cursor-pointer hover:bg-accent hover:border-primary/30 transition-all duration-200 hover:scale-105"
              onClick={() => handlePopularSearch(term)}
            >
              {term}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
