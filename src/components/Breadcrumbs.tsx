import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * Breadcrumbs navigation component
 * Automatically generates breadcrumb trail from current route
 */
export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mapping of routes to human-readable names
  const routeNames: Record<string, string> = {
    riksdagen: 'Riksdagen',
    regeringskansliet: 'Regeringskansliet',
    admin: 'Admin',
    favorites: 'Favoriter',
    login: 'Logga in',
    ledamoter: 'Ledamöter',
    dokument: 'Dokument',
    anforanden: 'Anföranden',
    voteringar: 'Voteringar',
    pressmeddelanden: 'Pressmeddelanden',
    propositioner: 'Propositioner',
    sou: 'SOU',
    tal: 'Tal',
    remisser: 'Remisser',
    kategorier: 'Kategorier',
    'departementsserien': 'Departementsserien',
    'skrivelse': 'Skrivelser',
    'kommittedirektiv': 'Kommittédirektiv',
    'faktapromemoria': 'Faktapromemorior',
    'informationsmaterial': 'Informationsmaterial',
    'mr-granskningar': 'MR-granskningar',
    'dagordningar': 'Dagordningar',
    'rapporter': 'Rapporter',
    'regeringsuppdrag': 'Regeringsuppdrag',
    'regeringsarenden': 'Regeringsärenden',
    'sakrad': 'Sakråd',
    'bistands-strategier': 'Biståndsstrategier',
    'overenskommelser-avtal': 'Överenskommelser & Avtal',
    'arendeforteckningar': 'Ärendeförteckningar',
    'artiklar': 'Artiklar',
    'debattartiklar': 'Debattartiklar',
    'ud-avrader': 'UD Avråder',
    'uttalanden': 'Uttalanden',
    'lagradsremiss': 'Lagrådsr emiss',
    'forordningsmotiv': 'Förordningsmotiv',
    'internationella-overenskommelser': 'Internationella Överenskommelser',
  };

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link
            to="/"
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Hem"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = routeNames[name] || name.charAt(0).toUpperCase() + name.slice(1);

          return (
            <li key={name} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="hover:text-foreground transition-colors"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
