import { el } from '../lib/dom.js';

/**
 * Карточка отзыва.
 * @param {object}   t     — запись из testimonials.json
 * @param {object[]} cases — массив из cases.json (для подписи «Кейс №X»)
 */
export function TestimonialCard(t, cases = []) {
  const card = el('article', 'testimonial');

  card.appendChild(el('p', 'testimonial__quote', `«${t.quote}»`));

  const footer = el('footer');
  footer.appendChild(el('p', 'testimonial__author', t.author));
  if (t.role) footer.appendChild(el('p', 'testimonial__role', t.role));

  if (t.caseId) {
    const linked = cases.find(c => c.id === t.caseId);
    if (linked) {
      footer.appendChild(
        el('p', 'testimonial__case', `Кейс №${linked.number} — ${linked.title}`)
      );
    }
  }

  card.appendChild(footer);
  return card;
}
