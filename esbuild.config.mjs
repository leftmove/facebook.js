import { build } from 'esbuild';

await build({
  entryPoints: ['src/cli/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/cli/index.js',
  loader: {
    '.html': 'text',
  },
  external: ['node:*'],
  packages: 'external',
});
