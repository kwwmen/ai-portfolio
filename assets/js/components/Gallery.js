import { el, fadeInImage } from '../lib/dom.js';
import { resolveImage } from '../lib/media.js';

/**
 * Сетка фотографий. Клик открывает Lightbox.
 */
export function Gallery(photos, lightbox) {
  const grid = el('div', 'gallery');

  if (!Array.isArray(photos) || photos.length === 0) return grid;

  photos.forEach((src, index) => {
    const btn = el('button', 'gallery__item');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Открыть фото ${index + 1} из ${photos.length}`);

    const img = el('img');
    img.alt = `Фото ${index + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';

    img.addEventListener(
      'error',
      () => { img.src = 'assets/img/placeholder.svg'; },
      { once: true }
    );

    fadeInImage(img);

    resolveImage(src).then(resolved => {
      img.src = resolved || 'assets/img/placeholder.svg';
    });

    btn.appendChild(img);
    btn.addEventListener('click', () => lightbox?.open(photos, index));
    grid.appendChild(btn);
  });

  return grid;
}
