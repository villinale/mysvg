import { requiredElement, setStatus } from './dom.js';
import { createPageUrl, validateSvgPath } from './svg-path.js';

const status = requiredElement('#status');
const list = requiredElement('#file-list');
const count = requiredElement('#file-count');

function isManifest(value) {
  return Boolean(value)
    && value.schemaVersion === 1
    && Array.isArray(value.files)
    && value.files.every((file) => {
      if (!file || typeof file.path !== 'string' || typeof file.name !== 'string') return false;
      try { validateSvgPath(file.path); return true; } catch { return false; }
    });
}

function renderFiles(files) {
  list.replaceChildren();
  if (files.length === 0) {
    setStatus(status, '仓库中还没有 SVG 文件。');
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const file of files) {
    const link = document.createElement('a');
    link.className = 'file-card';
    link.href = createPageUrl('viewer.html', file.path, document.baseURI).href;
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = file.name;
    const path = document.createElement('span');
    path.className = 'file-card-path';
    path.textContent = file.path;
    link.append(name, path);
    fragment.append(link);
  }
  list.append(fragment);
  count.textContent = `${files.length} 个文件`;
  count.hidden = false;
  status.hidden = true;
}

async function loadManifest() {
  try {
    const response = await fetch(new URL('./svg/manifest.json', document.baseURI));
    if (!response.ok) throw new Error(`文件清单请求失败（HTTP ${response.status}）。`);
    const data = await response.json();
    if (!isManifest(data)) throw new Error('文件清单格式无效。');
    renderFiles(data.files);
  } catch (error) {
    setStatus(status, error instanceof Error ? error.message : '无法读取文件清单。', 'error');
  }
}

void loadManifest();
