import { z } from 'zod';
import { fetchAllG0vDocuments } from '../utils/g0vApi.js';

export const getAllG0vDocumentsSchema = z.object({});

export async function getAllG0vDocuments() {
  const documents = await fetchAllG0vDocuments();
  return {
    count: documents.length,
    documents: documents,
    warning: 'Denna funktion hämtar ALLA dokument från g0v.se, vilket kan resultera i en mycket stor datamängd. Använd med försiktighet och överväg att filtrera med sökverktyg om möjligt.'
  };
}
