import { el, setAttr, fadeInImage } from '../lib/dom.js';
import { posterFor, normalizeSources } from './VideoPlayer.js';
import { localThumb, youTubeThumb, resolveImage } from '../lib/media.js';

/**
 * Карточка кейса. Кнопка — открывает модальное окно.
 * Номер кейса не выводится: порядок задаётся в cases.json.
 *
 * Превью берётся локально (assets/img/thumbs/), поэтому карточки
 * видны даже там, где YouTube или VK недоступны.
 *
 * @param {object}   caseData
 * @param {Function} onClick
 * @param {boolean}  feature — крупная карточка на всю ширину
 */
export async function CaseCard(caseData, onClick, feature = false) {
  const { id, title, result, video, photos, price } = caseData;

  const card = el('button', 'case-card');
  if (feature) card.classList.add('case-card--feature');
  card.type = 'button';
  setAttr(card, 'aria-label', `Открыть кейс: ${title}`);
  setAttr(card, 'data-case-id', id);

  /* ── Медиа ──────────────────────────────────────── */

  const media = el('div', 'case-card__media');
  media.appendChild(el('span', 'case-card__hint', 'Смотреть'));

  const img = el('img');
  img.alt = title;
  img.loading = feature ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.width = 1280;
  img.height = 720;

  const sources = normalizeSources(video);

  if (sources.youtube) {
    if (feature) img.fetchPriority = 'high';

    img.src = localThumb(sources.youtube);
    img.addEventListener('error', () => {
      img.src = youTubeThumb(sources.youtube, 'hqdefault');
    }, { once: true });
  } else if (Array.isArray(photos) && photos.length > 0) {
    const resolved = await resolveImage(photos[0]);
    img.src = resolved || 'assets/img/placeholder.svg';
  } else {
    img.src = 'assets/img/placeholder.svg';
  }

  img.addEventListener('error', () => {
    img.src = 'assets/img/placeholder.svg';
  }, { once: true });

  fadeInImage(img);
  media.appendChild(img);
  card.appendChild(media);

  /* ── Текст ──────────────────────────────────────── */

  const body = el('div', 'case-card__body');
  body.appendChild(el('h3', 'case-card__title', title));

  if (result) {
    body.appendChild(el('p', 'case-card__result', result));
  }

  const meta = el('div', 'case-card__meta');
  const hasVideo = Object.keys(sources).length > 0;
  if (hasVideo) meta.appendChild(el('span', null, '▶ Видео'));
  if (Array.isArray(photos) && photos.length > 0) {
    meta.appendChild(el('span', null, `${photos.length} фото`));
  }
  if (price) meta.appendChild(el('span', null, price));
  if (meta.children.length > 0) body.appendChild(meta);

  card.appendChild(body);
  card.addEventListener('click', () => onClick(caseData));

  return card;
}
