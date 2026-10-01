import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheRoot = path.join(projectRoot, '.cache', 'archify');
const releasePath = path.join(projectRoot, 'config', 'archify-release.json');

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(command + ' failed: ' + (result.stderr || result.error?.message || result.stdout));
  }
}

export async function prepareArchify() {
  const release = JSON.parse(await readFile(releasePath, 'utf8'));
  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(release.version) || !/^[a-f0-9]{64}$/.test(release.sha256)) {
    throw new Error('Invalid Archify release configuration.');
  }
  const target = path.join(cacheRoot, release.version + '-' + release.sha256.slice(0, 12));
  const cli = path.join(target, 'archify', 'bin', 'archify.mjs');
  if (await exists(cli)) {
    const marker = path.join(target, 'release.sha256');
    if ((await readFile(marker, 'utf8')).trim() !== release.sha256) {
      throw new Error('Cached Archify release SHA-256 marker mismatch.');
    }
    return cli;
  }

  await mkdir(cacheRoot, { recursive: true });
  const temporary = await mkdtemp(path.join(cacheRoot, '.download-'));
  if (!temporary.startsWith(cacheRoot + path.sep)) throw new Error('Invalid temporary directory.');
  try {
    const archive = path.join(temporary, 'archify.zip');
    const url = 'https://github.com/tt-a1i/archify/releases/download/v' + release.version + '/archify.zip';
    run(process.platform === 'win32' ? 'curl.exe' : 'curl', [
      '--fail', '--location', '--silent', '--show-error', '--retry', '3', '--output', archive, url
    ]);
    const contents = await readFile(archive);
    const digest = createHash('sha256').update(contents).digest('hex');
    if (digest !== release.sha256) throw new Error('Archify release SHA-256 mismatch.');
    if (process.platform === 'win32') run('tar', ['-xf', archive, '-C', temporary]);
    else run('unzip', ['-q', archive, '-d', temporary]);
    await rm(archive);
    const extractedCli = path.join(temporary, 'archify', 'bin', 'archify.mjs');
    if (!await exists(extractedCli)) throw new Error('Archify release is missing its CLI.');
    const metadata = JSON.parse(await readFile(path.join(temporary, 'archify', 'package.json'), 'utf8'));
    if (metadata.version !== release.version) throw new Error('Archify package version mismatch.');
    await writeFile(path.join(temporary, 'release.sha256'), release.sha256 + '\n', 'utf8');
    await rename(temporary, target);
    return cli;
  } finally {
    if (await exists(temporary)) await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareArchify().then((cli) => console.log(cli)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
