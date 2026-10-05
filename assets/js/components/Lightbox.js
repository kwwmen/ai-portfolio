import { el, fadeInImage } from '../lib/dom.js';
import { resolveImage } from '../lib/media.js';

/**
 * Полноэкранный просмотр фотографий.
 * @returns {{ element: HTMLElement, open: Function, hide: Function }}
 */
export function Lightbox() {
  const overlay = el('div', 'lightbox');
  overlay.setAttribute('hidden', '');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Просмотр фотографий');

  const img = el('img', 'lightbox__img');
  img.alt = '';

  const closeBtn = el('button', 'lightbox__close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.textContent = '×';

  const prevBtn = el('button', 'lightbox__nav lightbox__nav--prev');
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Предыдущее фото');
  prevBtn.textContent = '‹';

  const nextBtn = el('button', 'lightbox__nav lightbox__nav--next');
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Следующее фото');
  nextBtn.textContent = '›';

  const counter = el('p', 'lightbox__counter');
  counter.setAttribute('aria-live', 'polite');

  overlay.append(img, closeBtn, prevBtn, nextBtn, counter);

  let photos = [];
  let current = 0;

  function render() {
    img.classList.remove('is-loaded');
    img.src = '';

    const single = photos.length <= 1;
    prevBtn.style.display = single ? 'none' : '';
    nextBtn.style.display = single ? 'none' : '';

    counter.textContent = single ? '' : `${current + 1} / ${photos.length}`;
    img.alt = `Фото ${current + 1} из ${photos.length}`;

    fadeInImage(img);

    resolveImage(photos[current]).then(resolved => {
      img.src = resolved || 'assets/img/placeholder.svg';
    });
  }

  function go(index) {
    if (photos.length === 0) return;
    current = (index + photos.length) % photos.length;
    render();
  }

  function open(list, index = 0) {
    if (!Array.isArray(list) || list.length === 0) return;

    photos = list;
    current = Math.max(0, Math.min(index, list.length - 1));

    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    render();
    closeBtn.focus();
  }

  function hide() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
    photos = [];
    img.src = '';
  }

  closeBtn.addEventListener('click', hide);
  prevBtn.addEventListener('click', () => go(current - 1));
  nextBtn.addEventListener('click', () => go(current + 1));

  overlay.addEventListener('click', e => {
    if (e.target === overlay) hide();
  });

  document.addEventListener('keydown', e => {
    if (overlay.hasAttribute('hidden')) return;
    if (e.key === 'ArrowLeft')  go(current - 1);
    if (e.key === 'ArrowRight') go(current + 1);
  });

  /* Свайпы на телефоне */
  let startX = 0;
  overlay.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });

  overlay.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 48) return;
    go(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  return { element: overlay, open, hide };
}
