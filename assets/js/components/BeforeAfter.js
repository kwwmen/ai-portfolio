import { parseYouTubeId, youTubeThumb, localThumb, resolveImage } from '../lib/media.js';
import { YouTubeEmbed } from './YouTubeEmbed.js';

/**
 * Блок «Было → Стало».
 *
 * Слева — исходная фотография объекта, справа — готовый ролик.
 * Разделитель перетаскивается мышью и пальцем (clip-path).
 *
 * Важно про пропорции: контейнер 16:9. Если подставить вертикальное
 * фото, `object-fit: cover` обрежет его до узкой полосы — выглядит плохо.
 * Поэтому в page.json поле `beforePhoto` задаёт горизонтальный кадр явно,
 * а `object-fit` для него — `cover` только когда пропорции близки.
 *
 * @param {object} caseData — объект кейса
 * @param {object} ba       — секция beforeAfter из page.json
 */
export async function mountBeforeAfter(caseData, ba = {}) {
  const slider    = document.getElementById('ba-slider');
  const beforeImg = document.getElementById('ba-before-img');
  const afterSlot = document.getElementById('ba-after-video');
  const handle    = document.getElementById('ba-handle');

  if (!slider || !beforeImg || !afterSlot || !handle || !caseData) return;

  const ytId = parseYouTubeId(caseData.video);

  /* ── Кадр «Было» ───────────────────────────────────
     Приоритет: beforePhoto → первое фото кейса → стоп-кадр видео */
  let photoPath = ba.beforePhoto || null;

  if (!photoPath && Array.isArray(caseData.photos) && caseData.photos.length > 0) {
    photoPath = caseData.photos[0];
  }

  if (photoPath) {
    const resolved = await resolveImage(photoPath);
    beforeImg.src = resolved || 'assets/img/placeholder.svg';
  } else if (ytId) {
    beforeImg.src = localThumb(ytId);
    beforeImg.addEventListener(
      'error',
      () => { beforeImg.src = youTubeThumb(ytId, 'hqdefault'); },
      { once: true }
    );
  } else {
    beforeImg.src = 'assets/img/placeholder.svg';
  }

  beforeImg.addEventListener(
    'error',
    () => { beforeImg.src = 'assets/img/placeholder.svg'; },
    { once: true }
  );

  /* ── Кадр «Стало» ──────────────────────────────────
     Тот же кейс, только видео. Превью — eager, чтобы не мигало */
  afterSlot.appendChild(YouTubeEmbed(caseData.video, caseData.title, '', { eager: true }));

  /* ── Перетаскивание разделителя ───────────────────── */

  const afterMedia = slider.querySelector('.ba__media--after');
  if (!afterMedia) return;

  let dragging = false;

  function setPosition(percent) {
    const clamped = Math.max(4, Math.min(96, percent));
    afterMedia.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    handle.style.left = `${clamped}%`;
  }

  function percentFromEvent(clientX) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return 50;
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

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    dragging = true;
    document.body.style.userSelect = 'none';
  });
  handle.addEventListener('touchstart', () => { dragging = true; }, { passive: true });

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);

  /* Клик мимо кнопки плеера — переносим разделитель туда */
  slider.addEventListener('click', e => {
    if (e.target.closest('.yt__btn') || e.target.closest('.yt__iframe')) return;
    if (e.target === handle || handle.contains(e.target)) return;
    setPosition(percentFromEvent(e.clientX));
  });

  /* Мягкий «подсказывающий» проезд после появления в кадре:
     разделитель один раз сам сдвигается влево, показывая,
     что элемент интерактивный. Дальше — только действия пользователя. */
  setPosition(50);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const hint = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        hint.unobserve(entry.target);

        const start = performance.now();
        const from = 50;
        const to = 30;
        const dur = 900;

        function step(now) {
          const t = Math.min((now - start) / dur, 1);
          /* easeInOutCubic */
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          setPosition(from + (to - from) * e);
          if (t < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
      });
    },
    { threshold: 0.5 }
  );

  hint.observe(slider);
}
