/** Создать DOM-элемент. textContent безопасен, innerHTML не используем. */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

export function frag() {
  return document.createDocumentFragment();
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Найти [data-site="key"] внутри root и вставить text */
export function setText(root, key, value) {
  const node = root.querySelector(`[data-site="${CSS.escape(key)}"]`);
  if (node && value != null) node.textContent = value;
}

export function setAttr(node, name, value) {
  if (value == null || value === '') node.removeAttribute(name);
  else node.setAttribute(name, value);
  return node;
}

/**
 * Безопасная ссылка — пропускает только http(s), mailto, tel, / и #.
 * Отклоняет javascript:, data: и всё прочее.
 */
export function safeHref(raw) {
  if (typeof raw !== 'string') return null;
  const url = raw.trim();
  if (!url) return null;
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  return null;
}
