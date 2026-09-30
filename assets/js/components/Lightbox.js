import { el } from '../lib/dom.js';
import { resolveImage } from '../lib/media.js';

/**
 * Lightbox для просмотра фотографий.
 * Возвращает объект { element, open, hide }.
 */
export function Lightbox() {
  const overlay = el('div', 'lightbox');
  overlay.setAttribute('hidden', '');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Просмотр фото');

  const imgEl = el('img', 'lightbox__img');
  imgEl.alt = '';

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

  overlay.append(imgEl, closeBtn, prevBtn, nextBtn, counter);

  let photos = [];
  let current = 0;

  async function show(index) {
    current = Math.max(0, Math.min(index, photos.length - 1));
    imgEl.src = '';
    const resolved = await resolveImage(photos[current]);
    imgEl.src = resolved || 'assets/img/placeholder.svg';
    imgEl.alt = `Фото ${current + 1} из ${photos.length}`;
    counter.textContent = `${current + 1} / ${photos.length}`;
    prevBtn.style.display = photos.length <= 1 ? 'none' : '';
    nextBtn.style.display = photos.length <= 1 ? 'none' : '';
  }

  function open(photoList, index = 0) {
    photos = photoList;
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    show(index);
    closeBtn.focus();
  }

  function hide() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
    photos = [];
  }

  closeBtn.addEventListener('click', hide);
  overlay.addEventListener('click', e => { if (e.target === overlay) hide(); });
  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));

  document.addEventListener('keydown', e => {
    if (overlay.hasAttribute('hidden')) return;
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  return { element: overlay, open, hide };
}
