import { el } from '../lib/dom.js';
import { resolveImage } from '../lib/media.js';

/**
 * Сетка фотографий. Клик открывает Lightbox.
 * @param {string[]} photos — массив путей/URL
 * @param {object}   lb     — экземпляр Lightbox
 */
export function Gallery(photos, lb) {
  const grid = el('div', 'gallery');

  if (!photos || photos.length === 0) return grid;

  photos.forEach(async (src, index) => {
    const btn = el('button', 'gallery__item');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Фото ${index + 1} из ${photos.length}`);

    const img = el('img');
    img.alt = `Фото ${index + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';

    const resolved = await resolveImage(src);
    img.src = resolved || 'assets/img/placeholder.svg';
    img.onerror = () => { img.src = 'assets/img/placeholder.svg'; };

    btn.appendChild(img);
    btn.addEventListener('click', () => lb.open(photos, index));
    grid.appendChild(btn);
  });

  return grid;
}
