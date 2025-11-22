import { z } from 'zod';
import { fetchVoteringGroup, fetchVoteringarDirect } from '../utils/riksdagenApi.js';
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

  // Use voteringlistagrupp endpoint if groupBy is specified, otherwise use regular endpoint
  if (args.groupBy) {
    const result = await fetchVoteringGroup({
      rm: args.rm,
      bet: args.bet,
      punkt: args.punkt,
      gruppering: args.groupBy,
      sz: limit,
    });

    // Aggregate the data by the groupBy field
    const grouped: Record<string, any> = {};

    result.data.forEach((item: any) => {
      const key = item[args.groupBy!] || 'Okänt';
      if (!grouped[key]) {
        grouped[key] = {
          [args.groupBy!]: key,
          ja: 0,
          nej: 0,
          avstar: 0,
          franvarande: 0,
          total: 0,
          votering_id: item.votering_id,
          rm: item.rm,
          beteckning: item.beteckning || item.bet,
          punkt: item.punkt,
          datum: item.systemdatum || item.datum,
        };
      }

      const rost = (item.rost || '').toLowerCase();
      if (rost === 'ja') grouped[key].ja++;
      else if (rost === 'nej') grouped[key].nej++;
      else if (rost === 'avstår') grouped[key].avstar++;
      else if (rost === 'frånvarande') grouped[key].franvarande++;

      grouped[key].total++;
    });

    const groupedResults = Object.values(grouped);

    return {
      count: groupedResults.length,
      groupBy: args.groupBy,
      voteringar: groupedResults,
      message: `Grupperade ${groupedResults.length} grupper per ${args.groupBy}`,
    };
  } else {
    // Fetch individual votes without grouping
    const result = await fetchVoteringarDirect({
      rm: args.rm,
      bet: args.bet,
      punkt: args.punkt,
      sz: limit,
    });

    return {
      count: result.hits,
      voteringar: result.data,
      message: `Hämtade ${result.data.length} individuella röster`,
    };
  }
}
