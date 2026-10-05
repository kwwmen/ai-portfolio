import { el, setAttr, fadeInImage } from '../lib/dom.js';
import { CONFIG } from '../config.js';
import {
  parseYouTubeId,
  localThumb,
  youTubeThumb,
  youTubeEmbedUrl,
  parseVkId,
  vkEmbedUrl,
  parseRutubeId,
  rutubeEmbedUrl
} from '../lib/media.js';

/**
 * Универсальный видеоплеер.
 *
 * Задача: ролик должен открываться у всех, независимо от VPN, провайдера
 * и блокировок. Поэтому источники выстроены по степени надёжности:
 *
 *   1. mp4    — свой файл рядом с сайтом. Работает ВСЕГДА: нет внешних
 *               сервисов, нет блокировок, нет рекламы, грузится мгновенно.
 *   2. rutube — российский, без VPN, без регистрации для просмотра.
 *   3. vk      — российский, без VPN, но требует открытый доступ к vk.com.
 *   4. youtube — запасной. У кого-то не грузится без VPN, у кого-то наоборот.
 *
 * Если задано несколько — показываем основной, остальные даём ссылками
 * под плеером, чтобы зритель выбрал рабочий у себя.
 *
 * @param {object} video  — { mp4, rutube, vk, youtube } или строка
 * @param {string} title  — название для aria-label
 * @param {object} opts   — { poster: string, label: string, eager: bool }
 */
export function VideoPlayer(video, title = 'Видео', opts = {}) {
  const wrap = el('div', 'vp');
  const sources = normalizeSources(video);

  const order = (CONFIG.videoOrder || ['mp4', 'rutube', 'vk', 'youtube'])
    .filter(k => sources[k]);

  if (order.length === 0) {
    wrap.appendChild(el('p', 'state-empty', 'Видео пока не добавлено'));
    return wrap;
  }

  const primary = order[0];
  const poster = opts.poster || buildPoster(sources) || 'assets/img/placeholder.svg';

  if (primary === 'mp4') {
    wrap.appendChild(buildNative(sources.mp4, poster, title, opts));
  } else {
    wrap.appendChild(buildFacade(primary, sources[primary], poster, title, opts));
  }

  /* Ссылки на остальные источники — под плеером */
  const alts = order.slice(1);
  if (alts.length > 0) {
    const bar = el('div', 'vp__alts');
    bar.appendChild(el('span', 'vp__alts-label', 'Не открывается?'));
    alts.forEach(key => {
      const a = el('a', 'vp__alt', ALT_LABEL[key]);
      a.href = sources[key];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      bar.appendChild(a);
    });
    wrap.appendChild(bar);
  }

  return wrap;
}

/* ── Своё видео: <video> ──────────────────────────────
   Самый надёжный вариант. Никаких внешних домены —
   если сайт открылся, откроется и ролик. */

function buildNative(src, poster, title, opts) {
  const video = el('video', 'vp__native');
  video.controls = true;
  video.playsInline = true;
  video.preload = opts.eager ? 'metadata' : 'none';
  video.poster = poster;
  setAttr(video, 'aria-label', title);

  if (opts.eager) video.autoplay = false;

  const source = document.createElement('source');
  source.src = src;
  source.type = 'video/mp4';
  video.appendChild(source);

  return video;
}

/* ── Встраиваемый плеер: превью до клика ───────────── */

function buildFacade(kind, src, poster, title, opts) {
  const holder = el('div', 'yt');

  const btn = el('button', 'yt__btn');
  btn.type = 'button';
  setAttr(btn, 'aria-label', `Воспроизвести видео: ${title}`);

  const img = el('img', 'yt__thumb');
  img.alt = '';
  img.loading = opts.eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.width = 1280;
  img.height = 720;
  img.src = poster;

  img.addEventListener('error', () => {
    img.src = 'assets/img/placeholder.svg';
  }, { once: true });

  fadeInImage(img);
  btn.appendChild(img);
  btn.appendChild(buildPlayIcon());

  if (opts.label) btn.appendChild(el('span', 'yt__label', opts.label));

  holder.appendChild(btn);

  btn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'yt__iframe';
    iframe.src = KIND_URL[kind](src);
    iframe.title = title;
    iframe.loading = 'eager';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    holder.replaceChildren(iframe);
  }, { once: true });

  return holder;
}

function buildPlayIcon() {
  const play = el('span', 'yt__play');
  play.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 68 48');
  svg.setAttribute('focusable', 'false');

  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p1.setAttribute('d', 'M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3 0 34 0 34 0S12.7 0 7.4 1.7c-2.9.8-5.1 3.1-5.9 6C0 13 0 24 0 24s0 11 .5 16.3c.8 2.9 3 5.2 5.9 6C12.7 48 34 48 34 48s21.3 0 26.6-1.7c2.9-.8 5.1-3.1 5.9-6C68 35 68 24 68 24s0-11-1.5-16.3z');
  p1.setAttribute('fill', '#F00');

  const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p2.setAttribute('d', 'M45 24 27 14v20');
  p2.setAttribute('fill', '#FFF');

  svg.append(p1, p2);
  play.appendChild(svg);
  return play;
}

/* ── Вспомогательное ─────────────────────────────── */

const ALT_LABEL = {
  mp4:     'Своё видео',
  rutube:  'RuTube',
  vk:      'VK Видео',
  youtube: 'YouTube'
};

const KIND_URL = {
  youtube: id => youTubeEmbedUrl(id),
  vk:      id => vkEmbedUrl(id),
  rutube:  id => rutubeEmbedUrl(id)
};

/**
 * Приводит значение из cases.json к объекту источников.
 * Понимает и старую запись строкой — тогда это ссылка YouTube.
 */
export function normalizeSources(video) {
  if (!video) return {};

  if (typeof video === 'string') {
    const yt = parseYouTubeId(video);
    if (yt) return { youtube: yt };

    const vk = parseVkId(video);
    if (vk) return { vk };

    const rt = parseRutubeId(video);
    if (rt) return { rutube: rt };

    /* Прямая ссылка на файл */
    if (/\.mp4($|\?)/i.test(video)) return { mp4: video };

    return {};
  }

  const out = {};

  if (video.mp4) out.mp4 = video.mp4;

  if (video.vk) {
    const id = parseVkId(video.vk);
    if (id) out.vk = id;
  }

  if (video.rutube) {
    const id = parseRutubeId(video.rutube);
    if (id) out.rutube = id;
  }

  const yt = parseYouTubeId(video.youtube || video.yt);
  if (yt) out.youtube = yt;

  return out;
}

/** Превью: сначала своё для YouTube, потом кадр от самого сервиса */
function buildPoster(sources) {
  if (sources.youtube) return localThumb(sources.youtube);
  return null;
}

/** Превью с запасным вариантом прямо из YouTube */
export function posterFor(video, opts = {}) {
  const s = normalizeSources(video);
  if (opts.poster) return opts.poster;
  if (s.youtube) return localThumb(s.youtube);
  if (s.mp4) return 'assets/img/placeholder.svg';
  return 'assets/img/placeholder.svg';
}

/** Как в старой версии: кадр с серверов YouTube, если локального нет */
export function youtubePosterFallback(video) {
  const s = normalizeSources(video);
  return s.youtube ? youTubeThumb(s.youtube, 'hqdefault') : null;
}
