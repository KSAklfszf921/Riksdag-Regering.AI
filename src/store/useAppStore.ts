import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Global Application State Store using Zustand
 * Features: TypeScript support, persistence, devtools
 */

interface User {
  id: string;
  email: string;
  role?: 'admin' | 'moderator' | 'user';
}

interface SearchFilters {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  documentType?: string;
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;

  // UI state
  sidebarOpen: boolean;
  darkMode: boolean;

  // Search state
  searchFilters: SearchFilters;
  recentSearches: string[];

  // Favorites
  favoriteIds: Set<string>;

  // Actions - User
  setUser: (user: User | null) => void;
  logout: () => void;

  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;

  // Actions - Search
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  clearSearchFilters: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Actions - Favorites
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      sidebarOpen: true,
      darkMode: false,
      searchFilters: {
        query: '',
      },
      recentSearches: [],
      favoriteIds: new Set<string>(),

      // User actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // UI actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // Search actions
      setSearchFilters: (filters) =>
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...filters },
        })),
      clearSearchFilters: () =>
        set({
          searchFilters: {
            query: '',
          },
        }),
      addRecentSearch: (query) =>
        set((state) => {
          const searches = [query, ...state.recentSearches.filter((q) => q !== query)].slice(0, 10);
          return { recentSearches: searches };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Favorites actions
      toggleFavorite: (id) =>
        set((state) => {
          const newFavorites = new Set(state.favoriteIds);
          if (newFavorites.has(id)) {
            newFavorites.delete(id);
          } else {
            newFavorites.add(id);
          }
          return { favoriteIds: newFavorites };
        }),
      isFavorite: (id) => get().favoriteIds.has(id),
      clearFavorites: () => set({ favoriteIds: new Set() }),
    }),
    {
      name: 'riksdag-regering-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
        recentSearches: state.recentSearches,
        favoriteIds: Array.from(state.favoriteIds), // Convert Set to Array for serialization
      }),
      // Custom serializer for Set
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favoriteIds)) {
          state.favoriteIds = new Set(state.favoriteIds);
        }
      },
    }
  )
);

// Selectors for better performance
export const selectUser = (state: AppState) => state.user;
export const selectIsAuthenticated = (state: AppState) => state.isAuthenticated;
export const selectDarkMode = (state: AppState) => state.darkMode;
export const selectSearchFilters = (state: AppState) => state.searchFilters;
export const selectFavorites = (state: AppState) => state.favoriteIds;
