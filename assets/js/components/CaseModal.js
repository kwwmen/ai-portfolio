import { el, clear } from '../lib/dom.js';
import { VideoPlayer } from './VideoPlayer.js';

/**
 * Модальное окно кейса.
 * Номер кейса не выводится — вместо него строка с составом работы.
 *
 * @param {HTMLElement} modalEl
 * @param {object[]}    testimonials
 * @param {object}      lightbox
 * @param {Function}    galleryFactory
 */
export function CaseModal(modalEl, testimonials, lightbox, galleryFactory) {
  if (!modalEl) return { open() {}, close() {} };

  let lastFocused = null;

  function open(caseData, trigger) {
    lastFocused = trigger || document.activeElement;

    clear(modalEl);
    modalEl.appendChild(buildPanel(caseData));
    modalEl.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    modalEl.querySelector('.modal__close')?.focus();
  }

  function close() {
    modalEl.setAttribute('hidden', '');
    document.body.style.overflow = '';
    lightbox?.hide();
    lastFocused?.focus?.();
  }

  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;

    if (lightbox && !lightbox.element.hasAttribute('hidden')) {
      lightbox.hide();
      return;
    }
    if (!modalEl.hasAttribute('hidden')) close();
  });

  /* Фокус не выходит за пределы окна */
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

    /* Состав работы вместо номера кейса */
    const parts = [];
    if (c.video) parts.push('Видео');
    if (Array.isArray(c.photos) && c.photos.length > 0) {
      parts.push(`${c.photos.length} фото`);
    }
    if (c.price) parts.push(c.price);

    if (parts.length > 0) {
      panel.appendChild(el('p', 'modal__number', parts.join(' · ')));
    }

    const h2 = el('h2', 'modal__title', c.title);
    panel.appendChild(h2);

    if (c.video) {
      const media = el('div', 'modal__media');
      media.appendChild(VideoPlayer(c.video, c.title, { eager: true }));
      panel.appendChild(media);
    }

    if (c.task) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Задача'));
      block.appendChild(el('p', 'modal__text', c.task));
      panel.appendChild(block);
    }

    if (Array.isArray(c.actions) && c.actions.length > 0) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Что сделал'));
      const list = el('ol', 'modal__list');
      c.actions.forEach(a => list.appendChild(el('li', null, a)));
      block.appendChild(list);
      panel.appendChild(block);
    }

    if (c.result) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Результат'));
      block.appendChild(el('p', 'modal__text', c.result));
      panel.appendChild(block);
    }

    if (Array.isArray(c.photos) && c.photos.length > 0 && galleryFactory) {
      const block = el('div', 'modal__block');
      block.appendChild(el('p', 'modal__label', 'Фотографии'));
      block.appendChild(galleryFactory(c.photos, lightbox));
      panel.appendChild(block);
    }

    if (c.testimonialId) {
      const t = testimonials.find(x => x.id === c.testimonialId);
      if (t) {
        const block = el('div', 'modal__block');
        block.appendChild(el('p', 'modal__label', 'Отзыв клиента'));

        const box = el('div', 'modal__testimonial');
        box.appendChild(el('p', 'modal__testimonial-quote', `«${t.quote}»`));

        if (t.author) {
          const author = el('p', 'modal__testimonial-author');
          author.textContent = t.role ? `${t.author} — ${t.role}` : t.author;
          box.appendChild(author);
        }

        block.appendChild(box);
        panel.appendChild(block);
      }
    }

    return panel;
  }

  return { open, close };
}
