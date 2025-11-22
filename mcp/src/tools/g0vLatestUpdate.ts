import { z } from 'zod';
import { fetchG0vLatestUpdate } from '../utils/g0vApi.js';

export const getG0vLatestUpdateSchema = z.object({});

export async function getG0vLatestUpdate() {
  const latestUpdate = await fetchG0vLatestUpdate();
  return latestUpdate;
}
