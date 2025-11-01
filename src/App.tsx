import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useRoutes } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';

/**
 * Loading fallback component shown while lazy routes are loading
 * Provides better UX with skeleton screens instead of blank page
 */
const PageLoader = () => (
  <div className="min-h-screen bg-background p-8">
    <div className="container mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
);

/**
 * Routes component using the centralized routes config
 * Replaces 50+ lines of individual Route declarations
 */
const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

/**
 * Main App Component
 *
 * Improvements implemented:
 * - ✅ Error Boundaries: Catches errors and prevents total crash
 * - ✅ Centralized Routes: Routes defined in config/routes.tsx
 * - ✅ Dynamic Routing: GenericDocumentPage replaces 26+ components
 * - ✅ React Query DevTools: Available in development mode
 * - ✅ Code Reduction: ~80% fewer lines in App.tsx
 */
const App = () => (
  <ErrorBoundary>
    <BrowserRouter
      basename={import.meta.env.PROD ? '/Riksdag-Regering.AI' : '/'}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>

      {/* React Query DevTools - Only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
