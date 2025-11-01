import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Eager load critical routes
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

// Lazy load other routes
const Riksdagen = lazy(() => import('@/pages/Riksdagen'));
const Ledamoter = lazy(() => import('@/pages/Ledamoter'));
const Dokument = lazy(() => import('@/pages/Dokument'));
const Anforanden = lazy(() => import('@/pages/Anforanden'));
const Voteringar = lazy(() => import('@/pages/Voteringar'));
const Regeringskansliet = lazy(() => import('@/pages/Regeringskansliet'));
const Pressmeddelanden = lazy(() => import('@/pages/Pressmeddelanden'));
const Admin = lazy(() => import('@/pages/Admin'));
const Favorites = lazy(() => import('@/pages/Favorites'));

// Generic document page for Regeringskansliet categories
const GenericDocumentPage = lazy(() => import('@/pages/GenericDocumentPage'));

/**
 * Regeringskansliet document categories
 * This replaces 26+ individual page components with a single dynamic route
 */
export const REGERINGSKANSLIET_CATEGORIES = [
  { path: 'propositioner', title: 'Propositioner', icon: 'file-text' },
  { path: 'dokument', title: 'Dokument', icon: 'folder' },
  { path: 'kategorier', title: 'Kategorier', icon: 'folder-tree' },
  { path: 'departementsserien', title: 'Departementsserien', icon: 'book' },
  { path: 'skrivelse', title: 'Skrivelser', icon: 'mail' },
  { path: 'sou', title: 'SOU', icon: 'file-text' },
  { path: 'tal', title: 'Tal', icon: 'mic' },
  { path: 'remisser', title: 'Remisser', icon: 'send' },
  { path: 'kommittedirektiv', title: 'Kommittédirektiv', icon: 'list-checks' },
  { path: 'faktapromemoria', title: 'Faktapromemorior', icon: 'file-question' },
  { path: 'informationsmaterial', title: 'Informationsmaterial', icon: 'info' },
  { path: 'mr-granskningar', title: 'MR-granskningar', icon: 'scale' },
  { path: 'dagordningar', title: 'Dagordningar', icon: 'calendar' },
  { path: 'rapporter', title: 'Rapporter', icon: 'file-bar-chart' },
  { path: 'regeringsuppdrag', title: 'Regeringsuppdrag', icon: 'briefcase' },
  { path: 'regeringsarenden', title: 'Regeringsärenden', icon: 'folder-open' },
  { path: 'sakrad', title: 'Sakråd', icon: 'users' },
  { path: 'bistands-strategier', title: 'Biståndstrategier', icon: 'globe' },
  { path: 'overenskommelser-avtal', title: 'Överenskommelser & Avtal', icon: 'file-signature' },
  { path: 'arendeforteckningar', title: 'Ärendeförteckningar', icon: 'list' },
  { path: 'artiklar', title: 'Artiklar', icon: 'newspaper' },
  { path: 'debattartiklar', title: 'Debattartiklar', icon: 'message-square' },
  { path: 'ud-avrader', title: 'UD-avråder', icon: 'alert-triangle' },
  { path: 'uttalanden', title: 'Uttalanden', icon: 'quote' },
  { path: 'lagradsremiss', title: 'Lagradsremisser', icon: 'gavel' },
  { path: 'forordningsmotiv', title: 'Förordningsmotiv', icon: 'file-edit' },
  { path: 'internationella-overenskommelser', title: 'Internationella överenskommelser', icon: 'globe-2' },
] as const;

/**
 * Application routes configuration
 */
export const routes: RouteObject[] = [
  // Critical routes (eager loaded)
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/login',
    element: <Login />,
  },

  // Riksdagen routes
  {
    path: '/riksdagen',
    element: <Riksdagen />,
  },
  {
    path: '/riksdagen/ledamoter',
    element: <Ledamoter />,
  },
  {
    path: '/riksdagen/dokument',
    element: <Dokument />,
  },
  {
    path: '/riksdagen/anforanden',
    element: <Anforanden />,
  },
  {
    path: '/riksdagen/voteringar',
    element: <Voteringar />,
  },

  // Regeringskansliet routes
  {
    path: '/regeringskansliet',
    element: <Regeringskansliet />,
  },
  {
    path: '/regeringskansliet/pressmeddelanden',
    element: <Pressmeddelanden />,
  },

  // Dynamic Regeringskansliet category routes (replaces 26+ individual components!)
  ...REGERINGSKANSLIET_CATEGORIES.map((category) => ({
    path: `/regeringskansliet/${category.path}`,
    element: <GenericDocumentPage category={category.path} title={category.title} />,
  })),

  // Admin & User features
  {
    path: '/admin',
    element: <Admin />,
  },
  {
    path: '/favorites',
    element: <Favorites />,
  },

  // 404 catch-all
  {
    path: '*',
    element: <NotFound />,
  },
];

/**
 * Navigation structure for sidebar/menu
 */
export const navigation = {
  main: [
    {
      title: 'Hem',
      path: '/',
      icon: 'home',
    },
    {
      title: 'Riksdagen',
      path: '/riksdagen',
      icon: 'landmark',
      children: [
        { title: 'Dokument', path: '/riksdagen/dokument' },
        { title: 'Ledamöter', path: '/riksdagen/ledamoter' },
        { title: 'Anföranden', path: '/riksdagen/anforanden' },
        { title: 'Voteringar', path: '/riksdagen/voteringar' },
      ],
    },
    {
      title: 'Regeringskansliet',
      path: '/regeringskansliet',
      icon: 'building',
      children: [
        { title: 'Pressmeddelanden', path: '/regeringskansliet/pressmeddelanden' },
        ...REGERINGSKANSLIET_CATEGORIES.map((cat) => ({
          title: cat.title,
          path: `/regeringskansliet/${cat.path}`,
        })),
      ],
    },
  ],
  user: [
    {
      title: 'Favoriter',
      path: '/favorites',
      icon: 'star',
    },
  ],
  admin: [
    {
      title: 'Admin',
      path: '/admin',
      icon: 'settings',
    },
  ],
} as const;
