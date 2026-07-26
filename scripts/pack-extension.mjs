import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = join(import.meta.dir, '..');
const dist = join(root, 'extension', 'dist');
const stagingRoot = join(root, '.pack');
const staging = join(stagingRoot, 'filary');
const outZip = join(root, 'web', 'filary-extension.zip');

if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('extension/dist missing — run bun run build first');
  process.exit(1);
}

rmSync(stagingRoot, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
cpSync(dist, staging, { recursive: true });
rmSync(outZip, { force: true });

function collectFiles(dir, base = dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectFiles(full, base, files);
    else files.push(full);
  }
  return files;
}

const zipCli = spawnSync('zip', ['-r', outZip, 'filary'], {
  cwd: stagingRoot,
  encoding: 'utf8',
});

if (zipCli.status === 0) {
  rmSync(stagingRoot, { recursive: true, force: true });
  console.log(`Packed → web/filary-extension.zip`);
  process.exit(0);
}

// Fallback: Python zipfile (available on Vercel)
const files = collectFiles(staging);
const pyList = files
  .map((f) => relative(stagingRoot, f).split('\\').join('/'))
  .map((p) => JSON.stringify(p))
  .join(',');

const py = `
import zipfile, os
root = ${JSON.stringify(stagingRoot)}
out = ${JSON.stringify(outZip)}
paths = [${pyList}]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for p in paths:
        z.write(os.path.join(root, p), p)
print("ok")
`;

const pyRun = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
rmSync(stagingRoot, { recursive: true, force: true });

if (pyRun.status !== 0) {
  console.error(zipCli.stderr || zipCli.stdout);
  console.error(pyRun.stderr || pyRun.stdout);
  process.exit(1);
}

console.log(`Packed → web/filary-extension.zip`);
