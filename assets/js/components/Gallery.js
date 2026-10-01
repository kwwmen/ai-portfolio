import { el, fadeInImage } from '../lib/dom.js';
import { resolveImage } from '../lib/media.js';

/**
 * Сетка фотографий. Клик открывает Lightbox.
 *
 * Пропорции ячейки подстраиваются под ориентацию снимков:
 * вертикальные фото — 3:4, горизонтальные — 4:3.
 * Иначе вертикальный кадр в горизонтальной ячейке обрезается
 * до неузнаваемой полосы (это и было видно в первом кейсе).
 */
export function Gallery(photos, lightbox) {
  const grid = el('div', 'gallery');

  if (!Array.isArray(photos) || photos.length === 0) return grid;

  /* Определяем ориентацию один раз по первому фото —
     обычно все снимки одного объекта сняты в одном формате */
  const first = resolveImage(photos[0]);

  Promise.resolve(first).then(async src => {
    const url = src || 'assets/img/placeholder.svg';
    const vertical = await detectVertical(url);
    grid.classList.add(vertical ? 'gallery--vertical' : 'gallery--horizontal');
  });

  photos.forEach((photo, index) => {
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

    resolveImage(photo).then(resolved => {
      img.src = resolved || 'assets/img/placeholder.svg';
    });

    btn.appendChild(img);
    btn.addEventListener('click', () => lightbox?.open(photos, index));
    grid.appendChild(btn);
  });

  return grid;
}

/** true, если картинка выше своей ширины */
function detectVertical(url) {
  return new Promise(resolve => {
    /* true — закрываем галерею, если сайт открыт локально и фото нет */
    const probe = new Image();
    probe.onload  = () => resolve(probe.naturalHeight > probe.naturalWidth);
    probe.onerror = () => resolve(false);
    probe.src = url;
  });
}
