import { CONFIG } from '../config.js';

const cache = new Map();

/**
 * Превращает значение из JSON в URL для <img src>.
 *
 * Поддерживает три формы:
 *   • https://...          — используется как есть
 *   • assets/...  или  ./… — путь от корня сайта, без преобразований
 *   • /Photo/case-1/a.jpg  — локальное хранилище (assets/img/cases/…)
 *                            либо Яндекс Диск, если mediaSource: 'yandex'
 */
export async function resolveImage(path) {
  if (!path) return null;

  const raw = String(path).trim();

  if (/^https?:\/\//i.test(raw)) return raw;

  /* Прямой путь от корня сайта — не трогаем */
  if (/^(assets\/|\.\/)/i.test(raw)) return raw.replace(/^\.\//, '');

  if (CONFIG.mediaSource === 'yandex') {
    return resolveYandex(raw);
  }

  /* local: /Photo/case-1/a.jpg → assets/img/cases/case-1/a.jpg */
  const normalized = raw
    .replace(/^\/?Photo\//i, '')
    .replace(/^\//, '');

  return `assets/img/cases/${normalized}`;
}

async function resolveYandex(path) {
  const key = `yandex::${path}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CONFIG.yandex.cacheTtlMs) return hit.url;

  if (!CONFIG.yandex.publicKey) {
    console.warn('[media] mediaSource="yandex", но publicKey не задан в config.js');
    return null;
  }

  const api = new URL('https://cloud-api.yandex.net/v1/disk/public/resources/download');
  api.searchParams.set('public_key', CONFIG.yandex.publicKey);
  api.searchParams.set('path', path);

  try {
    const res = await fetch(api);
    if (!res.ok) throw new Error(`Yandex API ${res.status}`);
    const { href } = await res.json();
    cache.set(key, { url: href, at: Date.now() });
    return href;
  } catch (err) {
    console.error('[media] ошибка Яндекс Диска:', path, err);
    return null;
  }
}

/* ── YouTube ─────────────────────────────────────── */

/** Достаёт 11-символьный ID из любой формы ссылки YouTube */
export function parseYouTubeId(input) {
  if (!input) return null;

  const s = String(input).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/
  ];

  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }

  return null;
}

/**
 * Стоп-кадр, размещённый в самом репозитории.
 * Лежит в assets/img/thumbs/<id>.webp — грузится с того же домена,
 * не зависит от доступности i.ytimg.com.
 */
export function localThumb(id) {
  return `assets/img/thumbs/${id}.webp`;
}

/** Резервный вариант: стоп-кадр напрямую с серверов YouTube */
export function youTubeThumb(id, quality = 'hqdefault') {
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

export function youTubeEmbedUrl(id) {
  return `${CONFIG.youtube.host}/embed/${id}?${CONFIG.youtube.params}`;
}

/** Прямая ссылка на ролик — для кнопки «Открыть на YouTube» */
/* ── VK Видео ────────────────────────────────────── */

/**
 * Достаёт идентификатор VK-видео.
 * Понимает все встречающиеся формы:
 *   https://vk.com/video-123456_789012
 *   https://vkvideo.ru/video-123456_789012
 *   https://vk.com/video_ext.php?oid=-123456&id=789012
 * @returns {string|null} строка вида "-123456_789012"
 */
export function parseVkId(input) {
  if (!input) return null;

  const s = String(input).trim();

  /* Уже готовый идентификатор */
  if (/^-?\d+_\d+$/.test(s)) return s;

  /* video_ext.php?oid=...&id=... */
  const ext = s.match(/[?&]oid=(-?\d+)[^#]*?[?&]id=(\d+)/);
  if (ext) return `${ext[1]}_${ext[2]}`;

  /* Любая ссылка с video<oid>_<id> */
  const m = s.match(/video(-?\d+)_(\d+)/);
  if (m) return `${m[1]}_${m[2]}`;

  return null;
}

export function vkEmbedUrl(vkId) {
  const [oid, id] = String(vkId).split('_');
  const params = new URLSearchParams({
    oid,
    id,
    hd: '2',
    autoplay: '1'
  });
  return `https://vk.com/video_ext.php?${params}`;
}

/** Прямая ссылка на страницу ролика — для ссылки «открыть» */
export function vkWatchUrl(vkId) {
  return `https://vk.com/video${vkId}`;
}

/* ── RuTube ──────────────────────────────────────── */

/**
 * Достаёт идентификатор RuTube.
 *   https://rutube.ru/video/abcdef1234567890/
 *   https://rutube.ru/play/embed/abcdef1234567890
 * @returns {string|null}
 */
export function parseRutubeId(input) {
  if (!input) return null;

  const s = String(input).trim();
  if (/^[a-f0-9]{32}$/i.test(s)) return s;

  const m = s.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]{32})/i);
  return m ? m[1] : null;
}

export function rutubeEmbedUrl(rtId) {
  return `https://rutube.ru/play/embed/${rtId}`;
}

export function youTubeWatchUrl(id) {
  return `https://youtu.be/${id}`;
}
