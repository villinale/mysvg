import { spawnSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSvgFiles } from '../src/shared/generate-svg-manifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(root, 'public');
const outputDirectory = path.join(root, 'dist');
const svgDirectory = path.join(publicDirectory, 'svg');
const sourceDirectory = path.join(publicDirectory, 'archify', 'sources');
const types = new Set(['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle']);
const sourceName = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.(architecture|workflow|sequence|dataflow|lifecycle)\.json$/;

async function findSources(directory, relative = '') {
  const found = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return found;
    throw error;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const name = relative ? relative + '/' + entry.name : entry.name;
    if (entry.isDirectory()) found.push(...await findSources(path.join(directory, entry.name), name));
    else if (entry.isFile() && entry.name.endsWith('.json')) found.push(name);
  }
  return found.sort((left, right) => left.localeCompare(right, 'en'));
}

export async function buildPages() {
  if (outputDirectory === root || !outputDirectory.startsWith(root + path.sep)) {
    throw new Error('Invalid output directory.');
  }
  await rm(outputDirectory, { recursive: true, force: true });
  await cp(publicDirectory, outputDirectory, { recursive: true });
  await rm(path.join(outputDirectory, 'editor.html'), { force: true });
  await rm(path.join(outputDirectory, 'editor.js'), { force: true });
  const files = await collectSvgFiles(svgDirectory);
  await mkdir(path.join(outputDirectory, 'svg'), { recursive: true });
  await writeFile(
    path.join(outputDirectory, 'svg', 'manifest.json'),
    JSON.stringify({ schemaVersion: 1, files }, null, 2) + '\n',
    'utf8'
  );

  const sources = await findSources(sourceDirectory);
  const archifyFiles = [];
  for (const relative of sources) {
    const match = sourceName.exec(path.posix.basename(relative));
    if (!match) throw new Error('Invalid Archify source name: ' + relative);
    const [, slug, type] = match;
    const input = path.join(sourceDirectory, ...relative.split('/'));
    const diagram = JSON.parse(await readFile(input, 'utf8'));
    if (!types.has(diagram.diagram_type) || diagram.diagram_type !== type) {
      throw new Error('Archify diagram type does not match source name: ' + relative);
    }
    const parent = path.posix.dirname(relative);
    const artifactRelative = parent === '.' ? slug + '.' + type + '.html' : parent + '/' + slug + '.' + type + '.html';
    const output = path.join(outputDirectory, 'archify', 'artifacts', ...artifactRelative.split('/'));
    archifyFiles.push({ path: artifactRelative, source: relative, title: diagram.meta?.title || slug, type });
    await mkdir(path.dirname(output), { recursive: true });
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'archify', 'archify', 'bin', 'archify.mjs'), 'render', type, input, output],
      { cwd: root, encoding: 'utf8' }
    );
    if (result.error || result.status !== 0) {
      throw new Error('Archify render failed for ' + relative + ':\n' + (result.stderr || result.error?.message || result.stdout));
    }
  }
  await writeFile(
    path.join(outputDirectory, 'archify', 'manifest.json'),
    JSON.stringify({ schemaVersion: 1, files: archifyFiles }, null, 2) + '\n',
    'utf8'
  );
  return { svgCount: files.length, archifyCount: sources.length, outputDirectory };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPages().then((result) => {
    console.log('Built ' + result.outputDirectory + ' (' + result.svgCount + ' SVG, ' + result.archifyCount + ' Archify).');
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
