/**
 * Detaljerade röstningsverktyg med alla alternativ
 */

import { getSupabase } from '../utils/supabase.js';
import { fetchVoteringarDirect } from '../utils/riksdagenApi.js';
import { z } from 'zod';

/**
 * Hämta detaljerad information om en votering
 */
export const getVotingDetailsSchema = z.object({
  votering_id: z.string().optional().describe('Voterings-ID'),
  rm: z.string().optional().describe('Riksmöte'),
  beteckning: z.string().optional().describe('Beteckning att söka efter'),
  limit: z.number().optional().default(10).describe('Antal voteringar'),
});

export async function getVotingDetails(args: z.infer<typeof getVotingDetailsSchema>) {
  const supabase = getSupabase();

  if (args.votering_id) {
    // Single voting query
    const { data, error } = await supabase
      .from('riksdagen_voteringar')
      .select('*')
      .eq('id', args.votering_id)
      .single();

    if (error) {
      throw new Error(`Fel vid hämtning av votering: ${error.message}`);
    }

    if (!data) {
      return {
        error: 'Ingen votering hittades',
      };
    }

    const formatVoting = (voting: any) => {
      const totalVotes =
        (voting.ja_roster || 0) +
        (voting.nej_roster || 0) +
        (voting.avstar_roster || 0) +
        (voting.franvarande_roster || 0);

      const jaPercent = totalVotes > 0 ? ((voting.ja_roster || 0) / totalVotes) * 100 : 0;
      const nejPercent = totalVotes > 0 ? ((voting.nej_roster || 0) / totalVotes) * 100 : 0;

      return {
        id: voting.id,
        beteckning: voting.beteckning,
        datum: voting.systemdatum,
        rm: voting.rm,
        votes: {
          ja: voting.ja_roster || 0,
          nej: voting.nej_roster || 0,
          avstar: voting.avstar_roster || 0,
          franvarande: voting.franvarande_roster || 0,
          total: totalVotes,
        },
        percentages: {
          ja: Math.round(jaPercent * 10) / 10,
          nej: Math.round(nejPercent * 10) / 10,
        },
        result: {
          winner: (voting.ja_roster || 0) > (voting.nej_roster || 0) ? 'Ja' : 'Nej',
          margin: Math.abs((voting.ja_roster || 0) - (voting.nej_roster || 0)),
          unanimous: voting.ja_roster === totalVotes || voting.nej_roster === totalVotes,
        },
      };
    };

    return formatVoting(data);
  }

  // Multiple votings query
  let query = supabase
    .from('riksdagen_voteringar')
    .select('*')
    .limit(args.limit)
    .order('systemdatum', { ascending: false });

  if (args.rm) {
    query = query.eq('rm', args.rm);
  }

  if (args.beteckning) {
    query = query.ilike('beteckning', `%${args.beteckning}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Fel vid hämtning av votering: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      error: 'Inga voteringar hittades',
    };
  }

  // Format voting function
  const formatVoting = (voting: any) => {
    const totalVotes =
      (voting.ja_roster || 0) +
      (voting.nej_roster || 0) +
      (voting.avstar_roster || 0) +
      (voting.franvarande_roster || 0);

    const jaPercent = totalVotes > 0 ? ((voting.ja_roster || 0) / totalVotes) * 100 : 0;
    const nejPercent = totalVotes > 0 ? ((voting.nej_roster || 0) / totalVotes) * 100 : 0;

    return {
      id: voting.id,
      beteckning: voting.beteckning,
      datum: voting.systemdatum,
      rm: voting.rm,
      votes: {
        ja: voting.ja_roster || 0,
        nej: voting.nej_roster || 0,
        avstar: voting.avstar_roster || 0,
        franvarande: voting.franvarande_roster || 0,
        total: totalVotes,
      },
      percentages: {
        ja: Math.round(jaPercent * 10) / 10,
        nej: Math.round(nejPercent * 10) / 10,
      },
      result: {
        winner: (voting.ja_roster || 0) > (voting.nej_roster || 0) ? 'Ja' : 'Nej',
        margin: Math.abs((voting.ja_roster || 0) - (voting.nej_roster || 0)),
        unanimous: voting.ja_roster === totalVotes || voting.nej_roster === totalVotes,
      },
    };
  };

  return {
    count: data.length,
    voteringar: data.map(formatVoting),
  };
}

/**
 * Jämför röstningsresultat mellan flera voteringar
 */
export const compareVotingsSchema = z.object({
  votering_ids: z.array(z.string()).min(2).max(5).describe('Voterings-ID:n att jämföra'),
});

export async function compareVotings(args: z.infer<typeof compareVotingsSchema>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .in('id', args.votering_ids);

  if (error) {
    throw new Error(`Fel vid hämtning av voteringar: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      error: 'Inga voteringar hittades',
    };
  }

  const votings = data.map((v) => ({
    id: v.id,
    beteckning: v.beteckning,
    datum: v.systemdatum,
    rm: v.rm,
    ja: v.ja_roster || 0,
    nej: v.nej_roster || 0,
    avstar: v.avstar_roster || 0,
    franvarande: v.franvarande_roster || 0,
    total:
      (v.ja_roster || 0) +
      (v.nej_roster || 0) +
      (v.avstar_roster || 0) +
      (v.franvarande_roster || 0),
    winner: (v.ja_roster || 0) > (v.nej_roster || 0) ? 'Ja' : 'Nej',
  }));

  return {
    count: votings.length,
    votings,
    comparison: {
      averageJa: votings.reduce((sum, v) => sum + v.ja, 0) / votings.length,
      averageNej: votings.reduce((sum, v) => sum + v.nej, 0) / votings.length,
      averageTotal: votings.reduce((sum, v) => sum + v.total, 0) / votings.length,
      jaWins: votings.filter((v) => v.winner === 'Ja').length,
      nejWins: votings.filter((v) => v.winner === 'Nej').length,
    },
  };
}

/**
 * Hitta kontroversiella voteringar (små marginaler)
 */
export const findControversialVotingsSchema = z.object({
  rm: z.string().describe('Riksmöte'),
  maxMargin: z.number().optional().default(10).describe('Maximal marginal för att anses kontroversiell'),
  limit: z.number().optional().default(20).describe('Antal resultat'),
});

export async function findControversialVotings(
  args: z.infer<typeof findControversialVotingsSchema>
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .eq('rm', args.rm)
    .not('ja_roster', 'is', null)
    .not('nej_roster', 'is', null)
    .order('systemdatum', { ascending: false });

  if (error) {
    throw new Error(`Fel vid hämtning av voteringar: ${error.message}`);
  }

  if (!data) {
    return {
      rm: args.rm,
      controversial: [],
      count: 0,
    };
  }

  const controversial = data
    .map((v) => ({
      id: v.id,
      beteckning: v.beteckning,
      datum: v.systemdatum,
      ja: v.ja_roster || 0,
      nej: v.nej_roster || 0,
      margin: Math.abs((v.ja_roster || 0) - (v.nej_roster || 0)),
      winner: (v.ja_roster || 0) > (v.nej_roster || 0) ? 'Ja' : 'Nej',
    }))
    .filter((v) => v.margin <= args.maxMargin)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, args.limit);

  return {
    rm: args.rm,
    maxMargin: args.maxMargin,
    controversial,
    count: controversial.length,
    summary: {
      closestVote: controversial[0],
      averageMargin:
        controversial.length > 0
          ? controversial.reduce((sum, v) => sum + v.margin, 0) / controversial.length
          : 0,
    },
  };
}

/**
 * Analysera röstningsaktivitet över tid
 */
export const analyzeVotingActivitySchema = z.object({
  rm: z.string().describe('Riksmöte'),
});

export async function analyzeVotingActivity(args: z.infer<typeof analyzeVotingActivitySchema>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .eq('rm', args.rm)
    .not('ja_roster', 'is', null)
    .order('systemdatum', { ascending: false });

  if (error) {
    throw new Error(`Fel vid hämtning av voteringar: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      rm: args.rm,
      totalVotings: 0,
      message: `Inga voteringar hittades för ${args.rm}`,
    };
  }

  const totalVotes = data.reduce(
    (sum, v) =>
      sum +
      (v.ja_roster || 0) +
      (v.nej_roster || 0) +
      (v.avstar_roster || 0) +
      (v.franvarande_roster || 0),
    0
  );

  const totalJa = data.reduce((sum, v) => sum + (v.ja_roster || 0), 0);
  const totalNej = data.reduce((sum, v) => sum + (v.nej_roster || 0), 0);

  return {
    rm: args.rm,
    totalVotings: data.length,
    statistics: {
      totalVotes,
      averageVotesPerVoting: Math.round(totalVotes / data.length),
      totalJa,
      totalNej,
      jaPercent: Math.round((totalJa / (totalJa + totalNej)) * 1000) / 10,
      nejPercent: Math.round((totalNej / (totalJa + totalNej)) * 1000) / 10,
    },
    participation: {
      averageParticipation: Math.round(
        (data.reduce(
          (sum, v) => sum + ((v.ja_roster || 0) + (v.nej_roster || 0)) / (totalVotes / data.length),
          0
        ) /
          data.length) *
          1000
      ) / 10,
      averageAbstentions: Math.round(
        (data.reduce((sum, v) => sum + (v.avstar_roster || 0), 0) / data.length) * 10
      ) / 10,
      averageAbsent: Math.round(
        (data.reduce((sum, v) => sum + (v.franvarande_roster || 0), 0) / data.length) * 10
      ) / 10,
    },
  };
}
