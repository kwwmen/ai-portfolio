import { el } from '../lib/dom.js';

/**
 * Карточка отзыва.
 * Номер кейса не выводится — только название работы.
 * Автор может отсутствовать: тогда строка просто не создаётся.
 *
 * @param {object}   t     — запись из testimonials.json
 * @param {object[]} cases — массив из cases.json
 */
export function TestimonialCard(t, cases = []) {
  const card = el('article', 'testimonial');

  card.appendChild(el('p', 'testimonial__quote', `«${t.quote}»`));

  const footer = el('footer');

  if (t.author) {
    footer.appendChild(el('p', 'testimonial__author', t.author));
    if (t.role) footer.appendChild(el('p', 'testimonial__role', t.role));
  }

  if (t.caseId) {
    const linked = cases.find(c => c.id === t.caseId);
    if (linked) {
      footer.appendChild(el('p', 'testimonial__case', linked.title));
    }
  }

  if (footer.children.length > 0) card.appendChild(footer);

  return card;
}
