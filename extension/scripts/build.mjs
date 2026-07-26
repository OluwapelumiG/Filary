import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const watch = process.argv.includes('--watch');

function copyStatic() {
  mkdirSync(dist, { recursive: true });

  const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

  for (const dir of ['popup', 'options', 'icons']) {
    const from = join(root, 'src', dir);
    const to = join(dist, dir);
    if (existsSync(from)) {
      mkdirSync(to, { recursive: true });
      cpSync(from, to, {
        recursive: true,
        filter: (src) => !src.endsWith('.ts'),
      });
    }
  }
}

const shared = {
  bundle: true,
  target: 'chrome120',
  sourcemap: true,
  logLevel: 'info',
};

const moduleEntries = [
  join(root, 'src/background.ts'),
  join(root, 'src/popup/popup.ts'),
  join(root, 'src/options/options.ts'),
];

const contexts = await Promise.all([
  esbuild.context({
    ...shared,
    entryPoints: moduleEntries,
    outdir: dist,
    outbase: join(root, 'src'),
    format: 'esm',
  }),
  esbuild.context({
    ...shared,
    entryPoints: [join(root, 'src/content/index.ts')],
    outfile: join(dist, 'content/index.js'),
    format: 'iife',
  }),
]);

async function buildOnce() {
  if (existsSync(dist)) {
    rmSync(dist, { recursive: true, force: true });
  }
  await Promise.all(contexts.map((ctx) => ctx.rebuild()));
  copyStatic();
  console.log('Built extension → extension/dist');
}

if (watch) {
  await buildOnce();
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('Watching for changes…');
} else {
  await buildOnce();
  await Promise.all(contexts.map((ctx) => ctx.dispose()));
}
