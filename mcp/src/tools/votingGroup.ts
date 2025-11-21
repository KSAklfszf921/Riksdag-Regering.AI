import { z } from 'zod';
import { fetchVoteringGroup } from '../utils/riksdagenApi.js';
import { normalizeLimit } from '../utils/helpers.js';

export const getVotingGroupSchema = z.object({
  rm: z.string().optional().describe('Riksmöte'),
  bet: z.string().optional().describe('Beteckning'),
  punkt: z.string().optional().describe('Punkt'),
  groupBy: z.enum(['parti', 'valkrets', 'namn']).optional().describe('Grupperingsnivå'),
  limit: z.number().min(1).max(500).optional().default(200),
});

export async function getVotingGroup(args: z.infer<typeof getVotingGroupSchema>) {
  const limit = normalizeLimit(args.limit, 200, 500);
  const result = await fetchVoteringGroup({
    rm: args.rm,
    bet: args.bet,
    punkt: args.punkt,
    grupperin: args.groupBy,
    sz: limit,
  });

  return {
    count: result.hits,
    voteringar: result.data,
    message: `Grupperade data per ${args.groupBy || 'ingen'}`,
  };
}
