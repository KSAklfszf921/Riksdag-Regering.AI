import { z } from 'zod';
import { analyzeByDepartment } from '../utils/g0vApi.js';

export const analyzeG0vByDepartmentSchema = z.object({
  dateFrom: z.string().optional().describe('Från datum (YYYY-MM-DD)'),
  dateTo: z.string().optional().describe('Till datum (YYYY-MM-DD)'),
});

export async function analyzeG0vByDepartment(args: z.infer<typeof analyzeG0vByDepartmentSchema>) {
  const analysis = await analyzeByDepartment({
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
  });
  return analysis;
}
