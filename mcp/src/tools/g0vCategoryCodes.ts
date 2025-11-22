import { z } from 'zod';
import { fetchG0vCodes } from '../utils/g0vApi.js';

export const getG0vCategoryCodesSchema = z.object({});

export async function getG0vCategoryCodes() {
  const codes = await fetchG0vCodes();
  return {
    category_codes: codes,
    count: Object.keys(codes).length,
  };
}
