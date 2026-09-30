import { el, pad2 } from '../lib/dom.js';

/**
 * Карточка услуги.
 * @param {object} s      — запись из services.json
 * @param {number} index  — порядковый номер для подписи 01, 02, ...
 */
export function ServiceCard(s, index = 0) {
  const card = el('article', 'service');

  card.appendChild(el('p', 'service__index', pad2(index + 1)));
  card.appendChild(el('h3', 'service__title', s.title));
  card.appendChild(el('p', 'service__desc', s.description));

  if (Array.isArray(s.formats) && s.formats.length > 0) {
    const formats = el('div', 'service__formats');
    s.formats.forEach(f => formats.appendChild(el('span', 'service__tag', f)));
    card.appendChild(formats);
  }

  if (s.price) {
    card.appendChild(el('p', 'service__price', s.price));
  }

  return card;
}
