export function requiredElement(selector) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`页面缺少必要元素：${selector}`);
  return element;
}

export function setStatus(element, message, kind = 'info') {
  element.textContent = message;
  element.className = `status status-${kind}`;
  element.hidden = false;
}

export async function copyText(value) {
  if (!navigator.clipboard) throw new Error('当前浏览器不支持复制功能。');
  await navigator.clipboard.writeText(value);
}
