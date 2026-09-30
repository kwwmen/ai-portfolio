import { el } from '../lib/dom.js';

/**
 * Карточка услуги.
 * @param {object} s — одна запись из services.json
 */
export function ServiceCard(s) {
  const card = el('article', 'service');

  card.appendChild(el('h3', 'service__title', s.title));
  card.appendChild(el('p', 'service__desc', s.description));

  if (s.formats && s.formats.length > 0) {
    const formats = el('p', 'service__desc');
    formats.style.marginTop = 'var(--sp-3)';
    formats.style.fontSize = 'var(--fs-xs)';
    formats.style.color = 'var(--c-text-faint)';
    formats.textContent = s.formats.join(' · ');
    card.appendChild(formats);
  }

  if (s.price) {
    card.appendChild(el('p', 'service__price', s.price));
  }

  return card;
}
