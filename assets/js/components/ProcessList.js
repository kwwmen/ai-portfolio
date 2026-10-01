import { el } from '../lib/dom.js';

/**
 * Секция «Как проходит работа» — вертикальная последовательность шагов
 * со scroll-reveal анимацией (используется общий helper reveal из motion.js
 * на уровне main.js, здесь только разметка).
 *
 * @param {object[]} steps — [{ step: '01', title, text }]
 */
export function ProcessList(steps) {
  const wrap = el('div');

  steps.forEach((s, i) => {
    const row = el('div', 'process__step');

    const num = el('span', 'process__num', s.step);
    const body = el('div', 'process__body');
    body.appendChild(el('h3', 'process__title', s.title));
    body.appendChild(el('p', 'process__text', s.text));

    row.append(num, body);
    wrap.appendChild(row);

    if (i < steps.length - 1) {
      wrap.appendChild(el('div', 'process__connector'));
    }
  });

  return wrap;
}
