import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  message: string;
  suggestion?: string;
  actionLabel?: string;
  actionHref?: string;
  showAdminHint?: boolean;
}

const EmptyState = ({ message, suggestion, actionLabel, actionHref, showAdminHint }: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 max-w-lg mx-auto">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-muted-foreground/50" />
        </div>

        <h3 className="text-2xl font-bold mb-2">{message}</h3>

        {suggestion && (
          <p className="text-muted-foreground text-center mb-6 leading-relaxed">
            {suggestion}
          </p>
        )}

        {actionLabel && actionHref && (
          <div className="space-y-3">
            <Button size="lg" variant="gradient" asChild>
              <Link to={actionHref}>
                <Download className="mr-2 h-4 w-4" />
                {actionLabel}
              </Link>
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Som admin kan du hämta data från API:et
            </p>
          </div>
        )}

        {showAdminHint && !actionHref && (
          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Logga in som admin för att hämta data från Riksdagens API.
              <Button variant="link" asChild className="ml-2 p-0 h-auto">
                <Link to="/login">Logga in →</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
