import { z } from 'zod';
import { DATA_DICTIONARY } from '../data/dictionary.js';

export const getDataDictionarySchema = z.object({
  dataset: z.string().optional().describe('Valfritt dataset-ID att filtrera på'),
});

export function getDataDictionary(args: z.infer<typeof getDataDictionarySchema>) {
  if (args.dataset) {
    const match = DATA_DICTIONARY.datasets.find((d) => d.id === args.dataset);
    if (!match) {
      throw new Error(`Dataset ${args.dataset} saknas i dictionaryt`);
    }
    return match;
  }
  return DATA_DICTIONARY;
}
