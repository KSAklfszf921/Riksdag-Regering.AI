import DOMPurify from 'dompurify';

/**
 * Input Sanitization Utilities
 * Provides XSS protection and input validation
 */

// Configure DOMPurify
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, purifyConfig);
};

/**
 * Sanitize user input for search queries
 * Removes potentially dangerous characters
 */
export const sanitizeSearchQuery = (query: string): string => {
  // Remove HTML tags
  let clean = query.replace(/<[^>]*>/g, '');

  // Remove special characters that could be used for injection
  clean = clean.replace(/[<>\"'`]/g, '');

  // Trim whitespace
  clean = clean.trim();

  // Limit length
  const MAX_QUERY_LENGTH = 200;
  if (clean.length > MAX_QUERY_LENGTH) {
    clean = clean.substring(0, MAX_QUERY_LENGTH);
  }

  return clean;
};

/**
 * Validate and sanitize email addresses
 */
export const sanitizeEmail = (email: string): string => {
  const clean = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    throw new Error('Ogiltig e-postadress');
  }

  return clean;
};

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export const sanitizeUrl = (url: string): string => {
  const clean = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = clean.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      throw new Error('Otillåten URL-protokoll');
    }
  }

  // Only allow http(s) and relative URLs
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    throw new Error('URL måste börja med http://, https:// eller /');
  }

  return clean;
};

/**
 * Validate and sanitize document IDs
 * Only allows alphanumeric characters, hyphens, and underscores
 */
export const sanitizeDocumentId = (id: string): string => {
  const clean = id.trim();

  // Allow only alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9\-_]+$/.test(clean)) {
    throw new Error('Ogiltigt dokument-ID format');
  }

  return clean;
};

/**
 * Escape special characters for use in RegExp
 */
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validate and sanitize date strings (YYYY-MM-DD format)
 */
export const sanitizeDate = (dateStr: string): string => {
  const clean = dateStr.trim();

  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    throw new Error('Ogiltigt datumformat. Använd YYYY-MM-DD');
  }

  // Validate actual date
  const date = new Date(clean);
  if (isNaN(date.getTime())) {
    throw new Error('Ogiltigt datum');
  }

  return clean;
};

/**
 * Sanitize integer values
 */
export const sanitizeInteger = (value: string | number, min?: number, max?: number): number => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(num)) {
    throw new Error('Värdet måste vara ett heltal');
  }

  if (min !== undefined && num < min) {
    throw new Error(`Värdet måste vara minst ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`Värdet får vara högst ${max}`);
  }

  return num;
};

/**
 * General purpose text sanitization
 * For user-generated content that will be displayed
 */
export const sanitizeText = (text: string, maxLength = 1000): string => {
  let clean = text.trim();

  // Remove null bytes
  clean = clean.replace(/\0/g, '');

  // Limit length
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }

  return clean;
};
