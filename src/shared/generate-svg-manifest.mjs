import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function collectSvgFiles(rootDirectory) {
  const files = [];
  async function visit(directory, relativeDirectory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const relativePath = relativeDirectory ? path.posix.join(relativeDirectory, entry.name) : entry.name;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolutePath, relativePath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) files.push({ path: relativePath, name: entry.name });
    }
  }
  await visit(rootDirectory, '');
  files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  return files;
}

export async function writeSvgManifest(rootDirectory, outputPath) {
  const manifest = { schemaVersion: 1, files: await collectSvgFiles(rootDirectory) };
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

const modulePath = fileURLToPath(import.meta.url);
if (globalThis.process?.argv[1] && path.resolve(globalThis.process.argv[1]) === modulePath) {
  const projectRoot = path.resolve(path.dirname(modulePath), '..', '..');
  const svgDirectory = path.join(projectRoot, 'public', 'svg');
  const manifestPath = path.join(svgDirectory, 'manifest.json');
  const manifest = await writeSvgManifest(svgDirectory, manifestPath);
  console.log(`Generated ${path.relative(projectRoot, manifestPath)} with ${manifest.files.length} SVG file(s).`);
}
