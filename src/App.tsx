import { Suspense } from 'react';
import { BrowserRouter, useRoutes, useLocation } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Loading fallback component shown while lazy routes are loading
 * Enhanced with shimmer effect for better UX
 */
const PageLoader = () => (
  <div className="min-h-screen bg-background p-8">
    <div className="container mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-12 w-64 skeleton-shimmer" />
      <Skeleton className="h-6 w-96 skeleton-shimmer" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full skeleton-shimmer" />
        <Skeleton className="h-32 w-full skeleton-shimmer" />
        <Skeleton className="h-32 w-full skeleton-shimmer" />
      </div>
    </div>
  </div>
);

/**
 * Page transition variants for Framer Motion
 * Smooth fade in + slide up effect
 */
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  duration: 0.3,
  ease: 'easeInOut'
};

/**
 * Routes component with page transitions
 * Uses AnimatePresence for smooth transitions between routes
 */
const AppRoutes = () => {
  const element = useRoutes(routes);
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {element}
      </motion.div>
    </AnimatePresence>
  );
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
 * - ✅ Page Transitions: Smooth fade + slide animations with Framer Motion
 * - ✅ Enhanced Loading: Shimmer effect on skeleton screens
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
