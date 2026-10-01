import { parseYouTubeId, youTubeThumb } from '../lib/media.js';
import { resolveImage } from '../lib/media.js';
import { YouTubeEmbed } from './YouTubeEmbed.js';

/**
 * Блок «Было → Стало» на реальных материалах кейса.
 * Слева — исходное фото, справа — видео (фасад YouTube).
 * Перетаскиваемый разделитель открывает/закрывает сравнение через clip-path.
 *
 * Монтируется в уже существующую разметку index.html:
 *   #ba-before-img, #ba-after-video, #ba-handle, #ba-slider
 *
 * @param {object} caseData — объект кейса (использует photos[0] и video)
 */
export async function mountBeforeAfter(caseData) {
  const slider   = document.getElementById('ba-slider');
  const beforeImg = document.getElementById('ba-before-img');
  const afterSlot  = document.getElementById('ba-after-video');
  const handle     = document.getElementById('ba-handle');

  if (!slider || !beforeImg || !afterSlot || !handle || !caseData) return;

  /* Фото "Было" — первое фото кейса */
  const photoPath = Array.isArray(caseData.photos) ? caseData.photos[0] : null;
  if (photoPath) {
    const resolved = await resolveImage(photoPath);
    beforeImg.src = resolved || 'assets/img/placeholder.svg';
  } else {
    /* Фолбэк: стоп-кадр видео, если фото в кейсе нет */
    const ytId = parseYouTubeId(caseData.video);
    beforeImg.src = ytId ? youTubeThumb(ytId, 'maxresdefault') : 'assets/img/placeholder.svg';
  }
  beforeImg.addEventListener(
    'error',
    () => { beforeImg.src = 'assets/img/placeholder.svg'; },
    { once: true }
  );

  /* Видео "Стало" — фасад YouTube того же кейса */
  afterSlot.appendChild(YouTubeEmbed(caseData.video, caseData.title));

  /* ── Логика перетаскивания разделителя ──────────── */
  const afterMedia = slider.querySelector('.ba__media--after');

  let dragging = false;

  function setPosition(percent) {
    const clamped = Math.max(6, Math.min(94, percent));
    afterMedia.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    handle.style.left = `${clamped}%`;
  }

  function percentFromEvent(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function onMove(e) {
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(percentFromEvent(x));
  }

  function stopDrag() {
    dragging = false;
    document.body.style.userSelect = '';
  }

  handle.addEventListener('mousedown', () => {
    dragging = true;
    document.body.style.userSelect = 'none';
  });
  handle.addEventListener('touchstart', () => { dragging = true; }, { passive: true });

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);

  /* Клик по слайдеру (не по кнопке плеера) тоже двигает разделитель */
  slider.addEventListener('click', e => {
    if (e.target.closest('.yt__btn') || e.target.closest('.yt__iframe')) return;
    if (e.target === handle) return;
    setPosition(percentFromEvent(e.clientX));
  });

  /* Начальное положение — по центру */
  setPosition(50);
}
