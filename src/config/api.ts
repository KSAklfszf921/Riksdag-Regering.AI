/**
 * API Configuration
 * Centralized API endpoints and configuration
 */

// Base URLs
export const API_BASE_URLS = {
  RIKSDAGEN: 'https://data.riksdagen.se',
  REGERINGSKANSLIET: 'https://www.regeringen.se',
  SUPABASE: import.meta.env.VITE_SUPABASE_URL || '',
} as const;

// Riksdagen API Endpoints
export const RIKSDAGEN_ENDPOINTS = {
  DOKUMENT: '/dokumentlista/',
  LEDAMOTER: '/personlista/',
  VOTERINGAR: '/voteringlista/',
  ANFORANDEN: '/anforandelista/',
  UTSKOTT: '/utskott/',
} as const;

// Regeringskansliet API Endpoints
export const REGERINGSKANSLIET_ENDPOINTS = {
  PRESSMEDDELANDEN: '/api/pressmeddelanden',
  PROPOSITIONER: '/api/propositioner',
  SOU: '/api/sou',
  DOKUMENT: '/api/dokument',
} as const;

// Supabase API Endpoints (hvis applicable)
export const SUPABASE_ENDPOINTS = {
  FAVORITES: '/rest/v1/user_favorites',
  ANALYTICS: '/rest/v1/document_analytics',
  ADMIN_LOGS: '/rest/v1/admin_activity_log',
} as const;

// API Request Configuration
export const API_CONFIG = {
  // Request timeouts (in milliseconds)
  TIMEOUT: {
    DEFAULT: 30000, // 30 seconds
    LONG: 60000, // 1 minute for large requests
    SHORT: 10000, // 10 seconds for quick requests
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second between retries
    BACKOFF_MULTIPLIER: 2, // Exponential backoff
  },

  // Cache configuration (for React Query)
  CACHE: {
    STALE_TIME: 5 * 60 * 1000, // 5 minutes
    CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  },

  // Rate limiting (client-side)
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    DEBOUNCE_MS: 300,
    THROTTLE_MS: 1000,
  },
} as const;

// Helper function to build URLs
export const buildUrl = (base: string, endpoint: string, params?: Record<string, string | number>) => {
  const url = new URL(endpoint, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
};

// Helper to build Riksdagen API URLs
export const buildRiksdagenUrl = (endpoint: string, params?: Record<string, string | number>) => {
  return buildUrl(API_BASE_URLS.RIKSDAGEN, endpoint, params);
};

// Helper to build Regeringskansliet API URLs
export const buildRegeringskanslientUrl = (endpoint: string, params?: Record<string, string | number>) => {
  return buildUrl(API_BASE_URLS.REGERINGSKANSLIET, endpoint, params);
};
