import fs from 'node:fs/promises';
import path from 'node:path';

const currentDir = path.dirname(new URL(import.meta.url).pathname);
const toolGuidePath = path.resolve(currentDir, 'toolGuide.md');

export async function loadToolGuide(): Promise<string> {
  return fs.readFile(toolGuidePath, 'utf-8');
}