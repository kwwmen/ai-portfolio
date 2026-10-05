import { el } from '../lib/dom.js';

/**
 * Карточка целевой аудитории («Для кого»).
 * @param {object} a — { title, text }
 */
export function AudienceCard(a) {
  const card = el('article', 'audience-card');
  card.appendChild(el('h3', 'audience-card__title', a.title));
  card.appendChild(el('p', 'audience-card__text', a.text));
  return card;
}
