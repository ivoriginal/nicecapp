import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadJSON(path) {
  const filePath = join(__dirname, path);
  const data = await readFile(filePath, 'utf8');
  return JSON.parse(data);
} 