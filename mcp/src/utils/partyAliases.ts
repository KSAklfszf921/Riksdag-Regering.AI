/**
 * Party name aliases and historical name changes
 * Based on analysis of GitHub repos and Swedish political history
 */

export interface PartyAlias {
  current: string;
  aliases: string[];
  fullName: string;
  changes: Array<{
    from: string;
    to: string;
    date: string;
    reason: string;
  }>;
}

/**
 * Complete party information with aliases
 */
export const PARTIES: Record<string, PartyAlias> = {
  V: {
    current: 'V',
    aliases: ['V', 'VPK'],
    fullName: 'Vänsterpartiet',
    changes: [
      {
        from: 'VPK',
        to: 'V',
        date: '1990-05-19',
        reason: 'Vänsterpartiet kommunisterna renamed to Vänsterpartiet',
      },
    ],
  },
  S: {
    current: 'S',
    aliases: ['S', 'SAP'],
    fullName: 'Sveriges socialdemokratiska arbetareparti',
    changes: [],
  },
  MP: {
    current: 'MP',
    aliases: ['MP', 'MpG'],
    fullName: 'Miljöpartiet de gröna',
    changes: [
      {
        from: 'MpG',
        to: 'MP',
        date: '1993-01-01',
        reason: 'Abbreviation changed from MpG to MP',
      },
    ],
  },
  L: {
    current: 'L',
    aliases: ['L', 'FP'],
    fullName: 'Liberalerna',
    changes: [
      {
        from: 'FP',
        to: 'L',
        date: '2015-11-08',
        reason: 'Folkpartiet liberalerna renamed to Liberalerna',
      },
    ],
  },
  C: {
    current: 'C',
    aliases: ['C'],
    fullName: 'Centerpartiet',
    changes: [],
  },
  M: {
    current: 'M',
    aliases: ['M'],
    fullName: 'Moderata samlingspartiet',
    changes: [],
  },
  SD: {
    current: 'SD',
    aliases: ['SD'],
    fullName: 'Sverigedemokraterna',
    changes: [],
  },
  KD: {
    current: 'KD',
    aliases: ['KD', 'KDS'],
    fullName: 'Kristdemokraterna',
    changes: [
      {
        from: 'KDS',
        to: 'KD',
        date: '1996-04-01',
        reason: 'Kristdemokratiska Samhällspartiet renamed to Kristdemokraterna',
      },
    ],
  },
  NYD: {
    current: 'NYD',
    aliases: ['NYD', 'NyD'],
    fullName: 'Ny demokrati',
    changes: [],
  },
};

/**
 * Get all aliases for a party (including current name)
 * Example: expandPartyAliases('L') → ['L', 'FP']
 */
export function expandPartyAliases(party: string): string[] {
  const partyUpper = party.toUpperCase();

  // Check if it's a current party name
  if (PARTIES[partyUpper]) {
    return PARTIES[partyUpper].aliases;
  }

  // Check if it's an alias of any party
  for (const partyInfo of Object.values(PARTIES)) {
    if (partyInfo.aliases.includes(partyUpper)) {
      return partyInfo.aliases;
    }
  }

  // Unknown party, return as-is
  return [partyUpper];
}

/**
 * Get current party name from any alias
 * Example: getCurrentPartyName('FP') → 'L'
 */
export function getCurrentPartyName(party: string): string {
  const partyUpper = party.toUpperCase();

  // Already current
  if (PARTIES[partyUpper]) {
    return partyUpper;
  }

  // Find in aliases
  for (const [current, partyInfo] of Object.entries(PARTIES)) {
    if (partyInfo.aliases.includes(partyUpper)) {
      return current;
    }
  }

  // Unknown party
  return partyUpper;
}

/**
 * Get full party name
 * Example: getFullPartyName('L') → 'Liberalerna'
 */
export function getFullPartyName(party: string): string {
  const current = getCurrentPartyName(party);
  return PARTIES[current]?.fullName || party;
}

/**
 * Check if a party name is valid (current or alias)
 */
export function isValidParty(party: string): boolean {
  const partyUpper = party.toUpperCase();

  // Check current names
  if (PARTIES[partyUpper]) {
    return true;
  }

  // Check aliases
  for (const partyInfo of Object.values(PARTIES)) {
    if (partyInfo.aliases.includes(partyUpper)) {
      return true;
    }
  }

  return false;
}

/**
 * Get all current party names
 */
export function getAllCurrentParties(): string[] {
  return Object.keys(PARTIES);
}

/**
 * Get party information including all name changes
 */
export function getPartyInfo(party: string): PartyAlias | null {
  const current = getCurrentPartyName(party);
  return PARTIES[current] || null;
}

/**
 * Map for quick API parameter conversion
 */
export const API_PARAM_MAP: Record<string, string> = {
  tilltalsnamn: 'fnamn',
  efternamn: 'enamn',
  kon: 'kn',
  antal: 'sz',
  valkrets: 'valkrests', // Note: typo in API
};

/**
 * Convert MCP parameter to API parameter
 */
export function toApiParam(param: string): string {
  return API_PARAM_MAP[param] || param;
}

/**
 * Riksmöten (Parliament sessions) from 1993/94 onwards
 */
export const RIKSMOTEN = [
  '1993/94',
  '1994/95',
  '1995/96',
  '1996/97',
  '1997/98',
  '1998/99',
  '1999/2000',
  '2000/01',
  '2001/02',
  '2002/03',
  '2003/04',
  '2004/05',
  '2005/06',
  '2006/07',
  '2007/08',
  '2008/09',
  '2009/10',
  '2010/11',
  '2011/12',
  '2012/13',
  '2013/14',
  '2014/15',
  '2015/16',
  '2016/17',
  '2017/18',
  '2018/19',
  '2019/20',
  '2020/21',
  '2021/22',
  '2022/23',
  '2023/24',
  '2024/25',
];

/**
 * Get the most recent riksmöte
 */
export function getCurrentRiksmote(): string {
  return RIKSMOTEN[RIKSMOTEN.length - 1];
}

/**
 * Validate riksmöte format (YYYY/YY)
 */
export function isValidRiksmote(rm: string): boolean {
  const pattern = /^\d{4}\/\d{2}$/;
  return pattern.test(rm) && RIKSMOTEN.includes(rm);
}
