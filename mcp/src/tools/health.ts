import { z } from 'zod';

export const getSyncStatusSchema = z.object({});

export async function getSyncStatus() {
  return {
    status: 'live',
    generated_at: new Date().toISOString(),
    sources: {
      riksdagen: 'data.riksdagen.se',
      regeringen: 'g0v.se',
    },
  };
}
