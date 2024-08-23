import { readFile } from 'node:fs/promises';
import esbuild from 'esbuild';

(async () => {
  const contents = (await readFile('src/index.ts', 'utf8'))
    .replace(/export/gim, '')
    .replace(/(let|const) /gim, 'var ');

  await esbuild.build({
    stdin: {
      contents,
      loader: 'ts',
    },
    platform: 'browser',
    target: 'es6',
    bundle: false,
    outfile: 'browser/lru.min.js',
    minify: true,
  });
})();
