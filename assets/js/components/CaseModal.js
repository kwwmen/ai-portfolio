import { el, frag, clear, safeHref } from '../lib/dom.js';
import { YouTubeEmbed } from './YouTubeEmbed.js';
import { Gallery } from './Gallery.js';
import { Lightbox } from './Lightbox.js';

let lightbox = null;

/**
 * Модальное окно кейса.
 * @param {HTMLElement} modalEl  — <div class="modal" id="case-modal">
 * @param {object[]} testimonials — массив из testimonials.json
 */
export function CaseModal(modalEl, testimonials = []) {
  const lb = Lightbox();
  lightbox = lb;
  document.body.appendChild(lb.element);

  function open(caseData) {
    clear(modalEl);
    modalEl.appendChild(buildPanel(caseData, testimonials, lb, close));
    modalEl.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    // фокус на кнопку закрытия
    const closeBtn = modalEl.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    modalEl.setAttribute('hidden', '');
    document.body.style.overflow = '';
    lb.hide();
  }

  // Закрытие по клику на оверлей
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) close();
  });

  // Закрытие по Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!lb.element.hasAttribute('hidden')) { lb.hide(); return; }
      if (!modalEl.hasAttribute('hidden')) close();
    }
  });

  return { open, close };
}

function buildPanel(c, testimonials, lb, onClose) {
  const panel = el('div', 'modal__panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', c.title);

  // Кнопка закрытия
  const closeBtn = el('button', 'modal__close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', onClose);
  panel.appendChild(closeBtn);

  // Номер + заголовок
  panel.appendChild(el('p', 'modal__number', `Кейс №${c.number}`));
  panel.appendChild(el('h2', 'modal__title', c.title));

  // Видео
  if (c.video) {
    const block = el('div', 'modal__media');
    block.appendChild(YouTubeEmbed(c.video, c.title));
    panel.appendChild(block);
  }

  // Задача
  if (c.task) {
    const block = el('div', 'modal__block');
    block.appendChild(el('p', 'modal__label', 'Задача'));
    block.appendChild(el('p', 'modal__text', c.task));
    panel.appendChild(block);
  }

  // Что сделали
  if (c.actions && c.actions.length > 0) {
    const block = el('div', 'modal__block');
    block.appendChild(el('p', 'modal__label', 'Что сделали'));
    const list = el('ul', 'modal__list');
    c.actions.forEach(a => {
      list.appendChild(el('li', null, a));
    });
    block.appendChild(list);
    panel.appendChild(block);
  }

  // Результат
  if (c.result) {
    const block = el('div', 'modal__block');
    block.appendChild(el('p', 'modal__label', 'Результат'));
    block.appendChild(el('p', 'modal__text', c.result));
    panel.appendChild(block);
  }

  // Цена
  if (c.price) {
    const block = el('div', 'modal__block');
    block.appendChild(el('p', 'modal__label', 'Стоимость'));
    block.appendChild(el('span', 'modal__price', c.price));
    panel.appendChild(block);
  }

  // Фотографии
  if (c.photos && c.photos.length > 0) {
    const block = el('div', 'modal__block');
    block.appendChild(el('p', 'modal__label', 'Фотографии'));
    block.appendChild(Gallery(c.photos, lb));
    panel.appendChild(block);
  }

  // Отзыв
  if (c.testimonialId) {
    const t = testimonials.find(t => t.id === c.testimonialId);
    if (t) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Отзыв'));
      const tBlock = el('div', 'modal__testimonial');
      tBlock.appendChild(el('p', 'modal__testimonial-quote', `«${t.quote}»`));
      const author = el('p', 'modal__testimonial-author', t.author);
      if (t.role) author.appendChild(Object.assign(el('span', null, ` — ${t.role}`), {}));
      tBlock.appendChild(author);
      block.appendChild(tBlock);
      panel.appendChild(block);
    }
  }

  return panel;
}
