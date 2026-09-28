const forbiddenPathCharacters = /[\\?#\0]/;
const schemePrefix = /^[a-z][a-z0-9+.-]*:/i;

/** @param {string | null | undefined} value @returns {string} */
export function validateSvgPath(value) {
  if (typeof value !== 'string' || value.length === 0) throw new Error('缺少 SVG 文件路径。');
  if (value.startsWith('/') || schemePrefix.test(value) || forbiddenPathCharacters.test(value)) {
    throw new Error('SVG 文件路径格式无效。');
  }
  const segments = value.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new Error('SVG 文件路径包含无效分段。');
  }
  if (!value.toLowerCase().endsWith('.svg')) throw new Error('只能读取 SVG 文件。');
  return value;
}

/** @param {string} value */
export function encodeSvgPath(value) {
  return validateSvgPath(value).split('/').map(encodeURIComponent).join('/');
}

/** @param {string} value @param {string | URL} baseUrl */
export function createSvgAssetUrl(value, baseUrl) {
  return new URL(`./svg/${encodeSvgPath(value)}`, baseUrl);
}

/** @param {string} page @param {string} value @param {string | URL} baseUrl */
export function createPageUrl(page, value, baseUrl) {
  const url = new URL(`./${page}`, baseUrl);
  url.searchParams.set('file', validateSvgPath(value));
  return url;
}
