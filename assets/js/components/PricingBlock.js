import { el } from '../lib/dom.js';

/**
 * Блок цен: простая карточка + отдельная карточка «индивидуально».
 * @param {object} pricing — { basic: {...}, custom: {...} }
 */
export function PricingBlock(pricing) {
  const wrap = el('div', 'pricing__grid');

  if (pricing.basic) {
    const card = el('div', 'pricing-card');
    card.appendChild(el('p', 'pricing-card__title', pricing.basic.title));
    card.appendChild(el('p', 'pricing-card__detail', pricing.basic.detail));
    card.appendChild(el('p', 'pricing-card__price', pricing.basic.price));
    wrap.appendChild(card);
  }

  if (pricing.custom) {
    const card = el('div', 'pricing-card pricing-card--custom');
    card.appendChild(el('p', 'pricing-card__title', pricing.custom.title));
    card.appendChild(el('p', 'pricing-card__detail', pricing.custom.detail));
    card.appendChild(el('p', 'pricing-card__price', pricing.custom.price));
    wrap.appendChild(card);
  }

  return wrap;
}
