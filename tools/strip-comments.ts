import { promises as fs } from 'node:fs';
import { listFiles } from 'poku';

const ensureNodeCompatibility = async (path: string) => {
  const files = await listFiles(path, {
    filter: /\.(|m)?(j)?s$/,
  });

  console.log('Ensuring no unnecessary comments for:', files);

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const content = raw.replace(/(\/\*)((?:|[^1])+?)\//gim, '');

    await fs.writeFile(file, content, { encoding: 'utf8' });
  }
};

ensureNodeCompatibility('./lib');
