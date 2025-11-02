import { memo } from 'react';
import { GenericDocumentPage as GenericDocumentPageComponent } from '@/components/GenericDocumentPage';

interface GenericDocumentPageProps {
  category: string;
  title: string;
}

/**
 * Category to table name and description mapping
 */
const getCategoryConfig = (category: string, title: string) => {
  // Convert category path to table name (e.g., "debattartiklar" -> "regeringskansliet_debattartiklar")
  const tableName = `regeringskansliet_${category.replace(/-/g, '_')}`;

  // Generate description based on title
  const description = `Genomsök och utforska ${title.toLowerCase()} från Regeringskansliet`;

  return {
    tableName,
    description,
    source: 'regeringskansliet' as const,
    dataType: category,
  };
};

/**
 * Generic Document Page Component
 * Replaces 26+ individual page components with a single dynamic component
 * Reduces codebase size by ~90% for Regeringskansliet category pages
 *
 * This component acts as a router wrapper that:
 * 1. Maps category paths to Supabase table names
 * 2. Delegates to the actual GenericDocumentPage component from components
 * 3. Ensures consistent props across all document categories
 */
const GenericDocumentPage = memo(({ category, title }: GenericDocumentPageProps) => {
  const config = getCategoryConfig(category, title);

  return (
    <GenericDocumentPageComponent
      tableName={config.tableName}
      title={title}
      description={config.description}
      source={config.source}
      dataType={config.dataType}
      backLink="/regeringskansliet"
    />
  );
});

GenericDocumentPage.displayName = 'GenericDocumentPage';

export default GenericDocumentPage;