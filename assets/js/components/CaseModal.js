import { el, clear, fadeInImage, pad2 } from '../lib/dom.js';
import { resolveImage } from '../lib/media.js';
import { YouTubeEmbed } from './YouTubeEmbed.js';

let closeButton = null;

/**
 * Модальное окно кейса.
 * @param {HTMLElement}  modalEl
 * @param {object[]}     testimonials
 * @param {object}       lightbox
 * @param {object}       galleryFactory — функция Gallery(photos, lightbox)
 */
export function CaseModal(modalEl, testimonials, lightbox, galleryFactory) {
  if (!modalEl) return { open() {}, close() {} };

  function open(caseData) {
    clear(modalEl);
    modalEl.appendChild(buildPanel(caseData));
    modalEl.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    closeButton = modalEl.querySelector('.modal__close');
    closeButton?.focus();
  }

  function close() {
    modalEl.setAttribute('hidden', '');
    document.body.style.overflow = '';
    lightbox?.hide();
    lastFocused?.focus?.();
  }

  let lastFocused = null;

  function openWithReturn(caseData, trigger) {
    lastFocused = trigger || document.activeElement;
    open(caseData);
  }

  /* Клик по затемнению — закрыть */
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) close();
  });

  /* Escape — закрыть сначала lightbox, потом модалку */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;

    if (lightbox && !lightbox.element.hasAttribute('hidden')) {
      lightbox.hide();
      return;
    }
    if (!modalEl.hasAttribute('hidden')) close();
  });

  /* Удержание фокуса внутри модального окна */
  modalEl.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;

    const focusables = Array.from(
      modalEl.querySelectorAll(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(n => n.offsetParent !== null);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  function buildPanel(c) {
    const panel = el('div', 'modal__panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', c.title);

    const closeBtn = el('button', 'modal__close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);
    panel.appendChild(closeBtn);

    panel.appendChild(el('p', 'modal__number', `Кейс ${pad2(c.number)}`));

    const h2 = el('h2', 'modal__title', c.title);
    h2.id = `case-title-${c.id}`;
    panel.appendChild(h2);

    /* Видео */
    if (c.video) {
      const media = el('div', 'modal__media');
      media.appendChild(YouTubeEmbed(c.video, c.title));
      panel.appendChild(media);
    }

    /* Задача */
    if (c.task) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Задача'));
      block.appendChild(el('p', 'modal__text', c.task));
      panel.appendChild(block);
    }

    /* Что сделали */
    if (Array.isArray(c.actions) && c.actions.length > 0) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Что сделали'));
      const list = el('ol', 'modal__list');
      c.actions.forEach(a => list.appendChild(el('li', null, a)));
      block.appendChild(list);
      panel.appendChild(block);
    }

    /* Результат */
    if (c.result) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Результат'));
      block.appendChild(el('p', 'modal__text', c.result));
      panel.appendChild(block);
    }

    /* Стоимость */
    if (c.price) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Стоимость'));
      block.appendChild(el('span', 'modal__price', c.price));
      panel.appendChild(block);
    }

    /* Фотографии */
    if (Array.isArray(c.photos) && c.photos.length > 0 && galleryFactory) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Фотографии'));
      block.appendChild(galleryFactory(c.photos, lightbox));
      panel.appendChild(block);
    }

    /* Отзыв */
    if (c.testimonialId) {
      const t = testimonials.find(x => x.id === c.testimonialId);
      if (t) {
        const block = el('div', 'modal__block');
        block.appendChild(el('p', 'modal__label', 'Отзыв клиента'));

        const box = el('div', 'modal__testimonial');
        box.appendChild(el('p', 'modal__testimonial-quote', `«${t.quote}»`));

        const author = el('p', 'modal__testimonial-author');
        author.textContent = t.role ? `${t.author} — ${t.role}` : t.author;
        box.appendChild(author);

        block.appendChild(box);
        panel.appendChild(block);
      }
    }

    return panel;
  }

  return { open: openWithReturn, close };
}
