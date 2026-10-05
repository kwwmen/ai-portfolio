import { el } from '../lib/dom.js';

/**
 * Список «Что входит в ролик».
 * @param {string[]} items
 */
export function IncludedList(items) {
  const list = el('ul', 'included');

  items.forEach(text => {
    const li = el('li', 'included__item');
    li.appendChild(el('span', 'included__check', '✓'));
    li.appendChild(el('span', null, text));
    list.appendChild(li);
  });

  return list;
}
