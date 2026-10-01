import { el } from '../lib/dom.js';

/**
 * Компактный аккордеон FAQ. Открыт в любой момент только один пункт.
 * @param {object[]} items — [{ q, a }]
 */
export function FaqList(items) {
  const wrap = el('div');
  const buttons = [];

  items.forEach((item, i) => {
    const row = el('div', 'faq__item');

    const btn = el('button', 'faq__question');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    const qId = `faq-a-${i}`;
    btn.setAttribute('aria-controls', qId);

    btn.appendChild(el('span', null, item.q));
    btn.appendChild(el('span', 'faq__icon', '+'));

    const answer = el('div', 'faq__answer');
    answer.id = qId;
    answer.hidden = true;
    const answerInner = el('p', 'faq__answer-text', item.a);
    answer.appendChild(answerInner);

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      buttons.forEach(({ b, panel }) => {
        b.setAttribute('aria-expanded', 'false');
        b.classList.remove('is-open');
        panel.hidden = true;
      });

      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('is-open');
        answer.hidden = false;
      }
    });

    buttons.push({ b: btn, panel: answer });

    row.append(btn, answer);
    wrap.appendChild(row);
  });

  return wrap;
}
