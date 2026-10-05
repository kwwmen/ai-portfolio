import { el } from '../lib/dom.js';

/**
 * Секция «Как проходит работа» — вертикальная последовательность шагов
 * со scroll-reveal анимацией и растущей линией-коннектором.
 *
 * Номера 01, 02, 03, 04 генерируются из порядка массива —
 * в page.json их указывать не нужно.
 *
 * @param {object[]} steps — [{ title, text }]
 */
export function ProcessList(steps) {
  const wrap = el('div', 'process');

  steps.forEach((s, i) => {
    const row = el('div', 'process__step');

    /* Номер: 1 -> «01» */
    const num = el('span', 'process__num', String(i + 1).padStart(2, '0'));

    const body = el('div', 'process__body');
    body.appendChild(el('h3', 'process__title', s.title));
    body.appendChild(el('p', 'process__text', s.text));

    row.append(num, body);
    wrap.appendChild(row);

    /* Коннектор между шагами — растущая линия */
    if (i < steps.length - 1) {
      const conn = el('div', 'process__connector');
      conn.setAttribute('aria-hidden', 'true');
      wrap.appendChild(conn);
    }
  });

  return wrap;
}
