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
 */
export function safeHref(raw) {
  if (typeof raw !== 'string') return null;
  const url = raw.trim();
  if (!url) return null;
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  return null;
}

/**
 * Мягкое проявление картинки после декодирования.
 * Ставит класс is-loaded — CSS делает плавный fade.
 */
export function fadeInImage(img) {
  const done = () => img.classList.add('is-loaded');

  if (img.complete && img.naturalWidth > 0) {
    done();
    return;
  }
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
}
