import { z } from 'zod';
import { fetchG0vDocumentContent } from '../utils/g0vApi.js';

export const getG0vDocumentContentSchema = z.object({
  regeringenUrl: z.string().url().describe('The URL of the document on regeringen.se to fetch its Markdown content from g0v.se.'),
});

export async function getG0vDocumentContent(args: z.infer<typeof getG0vDocumentContentSchema>) {
  const content = await fetchG0vDocumentContent(args.regeringenUrl);
  return {
    url: args.regeringenUrl,
    content: content,
  };
}
