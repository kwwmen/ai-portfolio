import { el, setAttr, safeHref } from '../lib/dom.js';
import { resolveImage, parseYouTubeId, youTubeThumb } from '../lib/media.js';
import { CONFIG } from '../config.js';

/**
 * Карточка кейса — кнопка, открывает модальное окно.
 * @param {object} caseData — одна запись из cases.json
 * @param {Function} onClick — вызывается при клике, получает caseData
 */
export async function CaseCard(caseData, onClick) {
  const { id, number, status, title, result, video, photos } = caseData;

  const card = el('button', 'case-card');
  card.type = 'button';
  setAttr(card, 'aria-label', `Открыть кейс: ${title}`);
  setAttr(card, 'data-case-id', id);

  // ── Превью ────────────────────────────────────────
  const media = el('div', 'case-card__media');

  const badge = el('span', 'case-card__badge', `№${number}`);
  media.appendChild(badge);

  if (status === 'demo') {
    media.appendChild(el('span', 'case-card__demo-tag', 'Demo'));
  }

  // Источник превью: YouTube-стоп-кадр > первое фото > заглушка
  const img = el('img');
  img.alt = title;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 640;
  img.height = 360;

  const ytId = parseYouTubeId(video);
  if (ytId) {
    img.src = youTubeThumb(ytId, 'hqdefault');
  } else if (photos && photos.length > 0) {
    const resolved = await resolveImage(photos[0]);
    img.src = resolved || 'assets/img/placeholder.svg';
  } else {
    img.src = 'assets/img/placeholder.svg';
  }

  img.onerror = () => { img.src = 'assets/img/placeholder.svg'; };

  media.appendChild(img);
  card.appendChild(media);

  // ── Текст ─────────────────────────────────────────
  card.appendChild(el('h3', 'case-card__title', title));

  if (result) {
    card.appendChild(el('p', 'case-card__result', result));
  }

  const meta = el('div', 'case-card__meta');
  if (video) meta.appendChild(el('span', null, '▶ Видео'));
  if (photos && photos.length > 0) meta.appendChild(el('span', null, `${photos.length} фото`));
  if (meta.children.length > 0) card.appendChild(meta);

  card.addEventListener('click', () => onClick(caseData));

  return card;
}
