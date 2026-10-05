import { resolveImage, localThumb, youTubeThumb } from '../lib/media.js';
import { VideoPlayer, normalizeSources } from './VideoPlayer.js';
import { fadeInImage } from '../lib/dom.js';

/**
 * Блок «Было → Стало».
 *
 * Два режима:
 *   1. Фото → фото  — сравнение исходного и обработанного кадра.
 *                     Включается, когда в page.json задан afterPhoto
 *                     и этот файл реально существует.
 *   2. Фото → видео — запасной режим: исходный кадр против готового ролика.
 *
 * Разделитель перетаскивается мышью и пальцем (clip-path).
 * При первом появлении в кадре он один раз сам делает плавный проезд —
 * так видно, что элемент интерактивный. Дальше управление только у пользователя.
 *
 * @param {object} [caseData] — объект кейса (может отсутствовать)
 * @param {object} ba         — секция beforeAfter из page.json
 */
export async function mountBeforeAfter(caseData, ba = {}) {
  const slider    = document.getElementById('ba-slider');
  const beforeImg = document.getElementById('ba-before-img');
  const afterSlot = document.getElementById('ba-after-video');
  const handle    = document.getElementById('ba-handle');

  if (!slider || !beforeImg || !afterSlot || !handle) return;

  /* caseData может отсутствовать, если кадры заданы парой в page.json */
  const data = caseData || {};

  const afterMedia = slider.querySelector('.ba__media--after');
  if (!afterMedia) return;

  const sources = normalizeSources(data.video);
  const ytId = sources.youtube || null;

  /* ── Кадр «Было» ──────────────────────────────────────────
     Идём по списку кандидатов и берём первый, который реально загрузился.
     Так блок не покажет битую картинку, если какого-то файла нет. */

  const beforeCandidates = [
    ba.beforePhoto,
    ...(Array.isArray(data.photos) ? data.photos : []),
    ytId ? localThumb(ytId) : null,
    ytId ? youTubeThumb(ytId, 'hqdefault') : null
  ].filter(Boolean);

  let beforeUrl = null;
  for (const candidate of beforeCandidates) {
    const url = await resolveImage(candidate);
    if (url && await canLoad(url)) { beforeUrl = url; break; }
  }

  beforeImg.src = beforeUrl || 'assets/img/placeholder.svg';
  fadeInImage(beforeImg);

  /* ── Кадр «Стало» ───────────────────────────────────────── */

  const afterUrl = ba.afterPhoto ? await resolveImage(ba.afterPhoto) : null;
  const photoMode = afterUrl ? await canLoad(afterUrl) : false;

  if (photoMode) {
    const afterImg = new Image();
    afterImg.alt = '';
    afterImg.decoding = 'async';
    afterImg.src = afterUrl;
    fadeInImage(afterImg);

    afterSlot.replaceChildren(afterImg);
    slider.classList.add('ba--photo');

    /* Подгоняем пропорции рамки под реальные снимки,
       чтобы кадр не обрезался сверху и снизу */
    const meta = await imageMeta(beforeUrl);
    if (meta) {
      const ratio = clamp(meta.w / meta.h, 1.2, 2.0);
      slider.style.aspectRatio = String(ratio);
    }
  } else if (Object.keys(sources).length > 0) {
    afterSlot.replaceChildren(
      VideoPlayer(data.video, data.title, {
        eager: true,
        poster: beforeUrl || undefined
      })
    );
  } else {
    afterSlot.replaceChildren(
      Object.assign(document.createElement('img'), {
        src: 'assets/img/placeholder.svg',
        alt: ''
      })
    );
  }

  /* ── Перетаскивание разделителя ─────────────────────────── */

  let dragging = false;
  let autoRunning = false;
  let sweepDone = false;

  function setPosition(percent) {
    const clamped = clamp(percent, 4, 96);
    afterMedia.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    handle.style.left = `${clamped}%`;
  }

  function stopAuto() { autoRunning = false; }

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
    stopAuto();
    dragging = true;
    document.body.style.userSelect = 'none';
  });

  handle.addEventListener('touchstart', () => {
    stopAuto();
    dragging = true;
  }, { passive: true });

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);

  /* Клик мимо плеера — переносим разделитель туда */
  slider.addEventListener('click', e => {
    if (e.target.closest('.yt__btn') || e.target.closest('.yt__iframe')) return;
    if (e.target === handle || handle.contains(e.target)) return;
    stopAuto();
    setPosition(percentFromEvent(e.clientX));
  });

  setPosition(50);

  /* ── Автопроезд при первом появлении ────────────────────── */

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  /* Ждём загрузки кадров, но не дольше 1.5 секунды */
  await Promise.race([
    waitImages([beforeImg, ...afterSlot.querySelectorAll('img')]),
    sleep(1500)
  ]);
  if (sweepDone) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || sweepDone) return;
        observer.unobserve(entry.target);
        sweepDone = true;
        autoRunning = true;

        /* Проезд влево — раскрываем «Стало», затем мягкий возврат */
        animate(50, 13, 1150,
          v => { if (autoRunning) setPosition(v); },
          () => {
            if (!autoRunning) return;
            setTimeout(() => {
              animate(13, 50, 900,
                v => { if (autoRunning) setPosition(v); },
                () => { autoRunning = false; });
            }, 220);
          }
        );
      });
    },
    { threshold: 0.45 }
  );

  observer.observe(slider);
}

/* ── Вспомогательное ─────────────────────────────────────── */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Плавная анимация по кадрам с easeInOutCubic */
function animate(from, to, duration, onFrame, onDone) {
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const e = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    onFrame(from + (to - from) * e);
    if (t < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }

  requestAnimationFrame(step);
}

/** true, если файл по ссылке существует и читается как картинка */
function canLoad(url) {
  return new Promise(resolve => {
    const probe = new Image();
    probe.onload  = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = url;
  });
}

/** Размеры картинки или null, если не загрузилась */
function imageMeta(url) {
  if (!url) return Promise.resolve(null);

  return new Promise(resolve => {
    const probe = new Image();
    probe.onload  = () => resolve({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.onerror = () => resolve(null);
    probe.src = url;
  });
}

function waitImages(list) {
  const pending = Array.from(list).filter(
    img => img && !(img.complete && img.naturalWidth > 0)
  );

  if (pending.length === 0) return Promise.resolve();

  return Promise.all(
    pending.map(img => new Promise(res => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
    }))
  );
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}
