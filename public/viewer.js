import { copyText, requiredElement, setStatus } from './dom.js';
import { createPageUrl, createSvgAssetUrl, validateSvgPath } from './svg-path.js';

const status = requiredElement('#status');
const image = requiredElement('#svg-image');
const source = requiredElement('#svg-source');
const title = requiredElement('#file-title');
const pathLabel = requiredElement('#file-path');
const copySvgButton = requiredElement('#copy-svg-url');
const copyEmbedButton = requiredElement('#copy-embed-url');
const parameters = new URLSearchParams(window.location.search);

if (parameters.get('embed') === '1') document.body.classList.add('embed-mode');

async function showCopyResult(button, value) {
  const original = button.textContent;
  try {
    await copyText(value);
    button.textContent = '已复制';
    window.setTimeout(() => { button.textContent = original; }, 1400);
  } catch (error) {
    setStatus(status, error instanceof Error ? error.message : '复制失败。', 'error');
  }
}

async function loadSvg() {
  try {
    const file = validateSvgPath(parameters.get('file'));
    const fileName = file.split('/').at(-1) ?? file;
    const svgUrl = createSvgAssetUrl(file, document.baseURI);
    const embedUrl = createPageUrl('viewer.html', file, document.baseURI);
    embedUrl.searchParams.set('embed', '1');
    title.textContent = fileName;
    document.title = `${fileName} · SVG Maker`;
    pathLabel.textContent = file;
    image.alt = `${fileName} 图像`;
    image.src = svgUrl.href;
    copySvgButton.addEventListener('click', () => void showCopyResult(copySvgButton, svgUrl.href));
    copyEmbedButton.addEventListener('click', () => void showCopyResult(copyEmbedButton, embedUrl.href));
    const response = await fetch(svgUrl);
    if (!response.ok) throw new Error(`SVG 文件请求失败（HTTP ${response.status}）。`);
    source.textContent = await response.text();
    image.hidden = false;
    setStatus(status, 'SVG 已加载。', 'success');
  } catch (error) {
    image.hidden = true;
    source.textContent = '';
    setStatus(status, error instanceof Error ? error.message : '无法读取 SVG 文件。', 'error');
  }
}

void loadSvg();
