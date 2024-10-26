import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handleFile = async (file) => {
  if (!file) return null;

  const parts = file.name.split('.');
  const ext = parts[parts.length - 1];
  const filename = `${Date.now()}.${ext}`;
  const filepath = path.join(__dirname, '..', '..', 'uploads', filename);

  const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
  
  await fs.promises.writeFile(filepath, bufferData);
  return filename;
};