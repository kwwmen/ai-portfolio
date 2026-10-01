import { el } from '../lib/dom.js';

/**
 * Карточка отзыва.
 * Номер кейса не выводится — только название работы.
 * Если отзыв связан с кейсом (caseId) — внизу карточки появляется
 * кликабельная ссылка "Посмотреть работу", открывающая модальное окно кейса.
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

  if (footer.children.length > 0) card.appendChild(footer);

  if (t.caseId) {
    const linked = cases.find(c => c.id === t.caseId);
    if (linked) {
      const link = el('button', 'testimonial__link', `Посмотреть работу: ${linked.title}`);
      link.type = 'button';
      link.addEventListener('click', () => {
        const target = document.querySelector(
          `[data-case-id="${CSS.escape(linked.id)}"]`
        );
        target?.click();
      });
      card.appendChild(link);
    }
  }

  return card;
}
