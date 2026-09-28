import { requiredElement, setStatus, copyText } from './dom.js';

const list = requiredElement('#archify-list');
const status = requiredElement('#archify-status');

async function loadArchify() {
  try {
    const response = await fetch(new URL('./archify/manifest.json', document.baseURI));
    if (!response.ok) throw new Error('Archify 图表清单读取失败。');
    const manifest = await response.json();
    if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) {
      throw new Error('Archify 图表清单格式无效。');
    }
    if (manifest.files.length === 0) {
      setStatus(status, '仓库中还没有 Archify 图表。');
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const file of manifest.files) {
      if (typeof file.path !== 'string' || !/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:architecture|workflow|sequence|dataflow|lifecycle)\.html$/.test(file.path)) {
        throw new Error('Archify 图表路径无效。');
      }
      const article = document.createElement('article');
      article.className = 'file-card';
      const link = document.createElement('a');
      const url = new URL('./archify/artifacts/' + file.path, document.baseURI);
      link.href = url.href;
      link.textContent = file.title || file.path;
      const detail = document.createElement('span');
      detail.className = 'file-card-path';
      detail.textContent = file.path;
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'button button-secondary';
      copy.textContent = '复制嵌入地址';
      copy.addEventListener('click', async () => {
        const embedUrl = new URL(url);
        embedUrl.searchParams.set('embed', '1');
        try {
          await copyText(embedUrl.href);
          copy.textContent = '已复制';
          window.setTimeout(() => { copy.textContent = '复制嵌入地址'; }, 1400);
        } catch (error) {
          setStatus(status, error instanceof Error ? error.message : '复制失败。', 'error');
        }
      });
      article.append(link, detail, copy);
      fragment.append(article);
    }
    list.replaceChildren(fragment);
    status.hidden = true;
  } catch (error) {
    setStatus(status, error instanceof Error ? error.message : '无法读取 Archify 图表。', 'error');
  }
}

void loadArchify();
