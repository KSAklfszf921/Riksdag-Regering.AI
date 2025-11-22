import { z } from 'zod';
import { G0V_TYPE_ALIASES } from '../utils/g0vApi.js';

export const getG0vDocumentTypesSchema = z.object({});

export async function getG0vDocumentTypes() {
  const types = Object.keys(G0V_TYPE_ALIASES);
  return {
    document_types: types,
    count: types.length,
  };
}
