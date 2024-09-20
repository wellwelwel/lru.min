import { readFile, writeFile, mkdir } from 'node:fs/promises';
import esbuild from 'esbuild';
import { transformAsync } from '@babel/core';
import { minify } from 'terser';

(async () => {
  const contents = (await readFile('src/index.ts', 'utf8')).replace(
    /export const /gim,
    'window.'
  );

  const result = await esbuild.build({
    stdin: {
      contents,
      loader: 'ts',
    },
    platform: 'browser',
    outfile: 'browser/lru.min.js',
    target: 'es6',
    minify: true,
    write: false,
  });

  const browserfy = await transformAsync(result.outputFiles[0].text, {
    presets: [
      [
        '@babel/preset-env',
        {
          exclude: ['transform-regenerator'],
          loose: true,
          bugfixes: true,
        },
      ],
    ],
    compact: true,
    minified: true,
    comments: false,
  });

  const minified = await minify(browserfy?.code!, {
    compress: true,
    mangle: true,
    output: {
      comments: false,
    },
  });

  await mkdir('browser');
  await writeFile('browser/lru.min.js', minified.code!, 'utf8');
})();
