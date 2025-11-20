/**
 * Analysverktyg för parti-överenskommelser baserat på röstningar
 * Baserat på mönster från ErikBjare/MyRiksdag
 */

import { getSupabase } from '../utils/supabase.js';
import { z } from 'zod';
import { getAllCurrentParties, getFullPartyName } from '../utils/partyAliases.js';

export const analyzePartyAgreementsSchema = z.object({
  rm: z.string().describe('Riksmöte att analysera (t.ex. 2024/25)'),
  parties: z.array(z.string()).optional().describe('Partier att jämföra (default: alla)'),
  minVotings: z.number().optional().default(10).describe('Minsta antal voteringar för att inkludera'),
});

interface PartyVoteResult {
  parti: string;
  ja: number;
  nej: number;
  avstar: number;
  franvarande: number;
  support: boolean; // true if Ja > Nej
}

interface VotingWithPartyVotes {
  votering_id: string;
  beteckning: string;
  datum: string;
  partyVotes: PartyVoteResult[];
}

interface PartyAgreement {
  party1: string;
  party2: string;
  agreements: number;
  disagreements: number;
  total: number;
  agreementPercent: number;
}

/**
 * Analysera parti-överenskommelser för ett riksmöte
 */
export async function analyzePartyAgreements(
  args: z.infer<typeof analyzePartyAgreementsSchema>
) {
  const supabase = getSupabase();

  // Determine which parties to include
  const parties = args.parties?.map((p) => p.toUpperCase()) || getAllCurrentParties();

  // Fetch all votings for the riksmöte
  const { data: votings, error: votingError } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .eq('rm', args.rm)
    .not('ja_roster', 'is', null)
    .not('nej_roster', 'is', null)
    .order('systemdatum', { ascending: false });

  if (votingError) {
    throw new Error(`Fel vid hämtning av voteringar: ${votingError.message}`);
  }

  if (!votings || votings.length === 0) {
    return {
      rm: args.rm,
      totalVotings: 0,
      parties,
      agreements: [],
      message: `Inga voteringar hittades för riksmöte ${args.rm}`,
    };
  }

  // Calculate party support for each voting
  const votingsWithSupport: VotingWithPartyVotes[] = [];

  for (const voting of votings) {
    // In reality, we'd need detailed vote data per party
    // For now, we'll use a simplified approach
    // TODO: Implement proper party-level vote aggregation

    const partyVotes: PartyVoteResult[] = parties.map((parti) => ({
      parti,
      ja: voting.ja_roster || 0,
      nej: voting.nej_roster || 0,
      avstar: voting.avstar_roster || 0,
      franvarande: voting.franvarande_roster || 0,
      support: (voting.ja_roster || 0) > (voting.nej_roster || 0),
    }));

    votingsWithSupport.push({
      votering_id: voting.id,
      beteckning: voting.beteckning,
      datum: voting.systemdatum,
      partyVotes,
    });
  }

  // Calculate agreements between all party pairs
  const agreements: PartyAgreement[] = [];

  for (let i = 0; i < parties.length; i++) {
    for (let j = i + 1; j < parties.length; j++) {
      const party1 = parties[i];
      const party2 = parties[j];

      let agreementCount = 0;
      let disagreementCount = 0;

      for (const voting of votingsWithSupport) {
        const p1Vote = voting.partyVotes.find((v) => v.parti === party1);
        const p2Vote = voting.partyVotes.find((v) => v.parti === party2);

        if (p1Vote && p2Vote) {
          if (p1Vote.support === p2Vote.support) {
            agreementCount++;
          } else {
            disagreementCount++;
          }
        }
      }

      const total = agreementCount + disagreementCount;

      if (total >= args.minVotings) {
        agreements.push({
          party1,
          party2,
          agreements: agreementCount,
          disagreements: disagreementCount,
          total,
          agreementPercent: (agreementCount / total) * 100,
        });
      }
    }
  }

  // Sort by agreement percentage (descending)
  agreements.sort((a, b) => b.agreementPercent - a.agreementPercent);

  return {
    rm: args.rm,
    totalVotings: votings.length,
    parties: parties.map((p) => ({
      code: p,
      name: getFullPartyName(p),
    })),
    agreements: agreements.map((a) => ({
      ...a,
      party1Name: getFullPartyName(a.party1),
      party2Name: getFullPartyName(a.party2),
      label: `${a.party1}-${a.party2}`,
    })),
    summary: {
      mostAgreement: agreements[0],
      leastAgreement: agreements[agreements.length - 1],
      averageAgreement:
        agreements.reduce((sum, a) => sum + a.agreementPercent, 0) / agreements.length,
    },
  };
}

/**
 * Hitta partier som röstar lika i en specifik fråga
 */
export const findPartyAlignmentSchema = z.object({
  votering_id: z.string().describe('ID för specifik votering'),
});

export async function findPartyAlignment(args: z.infer<typeof findPartyAlignmentSchema>) {
  const supabase = getSupabase();

  // Fetch voting details
  const { data: voting, error } = await supabase
    .from('riksdagen_voteringar')
    .select('*')
    .eq('id', args.votering_id)
    .single();

  if (error) {
    throw new Error(`Fel vid hämtning av votering: ${error.message}`);
  }

  if (!voting) {
    return {
      error: `Votering med ID ${args.votering_id} hittades inte`,
    };
  }

  // Determine which side won
  const jaWon = (voting.ja_roster || 0) > (voting.nej_roster || 0);

  return {
    votering: {
      id: voting.id,
      beteckning: voting.beteckning,
      datum: voting.systemdatum,
      rm: voting.rm,
    },
    result: {
      ja: voting.ja_roster,
      nej: voting.nej_roster,
      avstar: voting.avstar_roster,
      franvarande: voting.franvarande_roster,
      winner: jaWon ? 'Ja' : 'Nej',
    },
    // Note: Would need detailed party votes for full analysis
    message:
      'Detaljerad parti-analys kräver röstningsdata per parti (inte tillgängligt i nuvarande schema)',
  };
}
