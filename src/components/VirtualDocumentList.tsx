import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, Download } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { format } from "date-fns";

interface Document {
  id: string;
  document_id: string;
  titel?: string;
  beteckningsnummer?: string;
  publicerad_datum?: string;
  avsandare?: string;
  departement?: string;
  kategorier?: string[];
  innehall?: string;
  url?: string;
  local_pdf_url?: string;
  markdown_url?: string;
  local_files?: any;
  local_bilagor?: any;
}

interface VirtualDocumentListProps {
  documents: Document[];
  tableName: string;
  onDocumentView: (tableName: string, documentId: string) => void;
}

/**
 * Virtual scrolling implementation for document lists
 * Renders only visible documents for optimal performance
 *
 * @param documents - Array of documents to display
 * @param tableName - Name of the table for favorites tracking
 * @param onDocumentView - Callback when user clicks to view document
 */
export const VirtualDocumentList = ({
  documents,
  tableName,
  onDocumentView,
}: VirtualDocumentListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each card
    overscan: 5, // Number of items to render outside visible area
  });

  const renderLocalFiles = (localFiles: any) => {
    if (!localFiles) return null;

    const files = Array.isArray(localFiles) ? localFiles : [localFiles];

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {files.map((file: any, idx: number) => {
          const fileName = file.name || file.filename || `Fil ${idx + 1}`;
          const fileUrl = file.url || file.local_url || file;

          if (typeof fileUrl === 'string' && fileUrl) {
            return (
              <a
                key={idx}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                {fileName}
              </a>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const doc = documents[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card className="hover:shadow-sm transition-all duration-200 border-border/50 mb-4">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {doc.titel || doc.document_id}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        {doc.beteckningsnummer && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{doc.beteckningsnummer}</span>
                          </div>
                        )}
                        {doc.publicerad_datum && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(doc.publicerad_datum), "d MMMM yyyy")}
                            </span>
                          </div>
                        )}
                        {(doc.avsandare || doc.departement) && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{doc.avsandare || doc.departement}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-start gap-2">
                      {doc.kategorier && doc.kategorier.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.kategorier.slice(0, 3).map((kat: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {kat}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FavoriteButton tableName={tableName} documentId={doc.document_id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {doc.innehall && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                      {doc.innehall}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDocumentView(tableName, doc.document_id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Visa original
                        </Button>
                      </a>
                    )}
                    {doc.local_pdf_url && (
                      <a href={doc.local_pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Ladda ner PDF
                        </Button>
                      </a>
                    )}
                    {doc.markdown_url && (
                      <a href={doc.markdown_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Markdown
                        </Button>
                      </a>
                    )}
                  </div>
                  {(doc.local_files || doc.local_bilagor) && renderLocalFiles(doc.local_files || doc.local_bilagor)}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
