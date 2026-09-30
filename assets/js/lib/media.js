import { CONFIG } from '../config.js';

const cache = new Map();

/**
 * Превращает значение из JSON в URL для <img src>.
 * Принимает абсолютный https-URL или путь вида /Photo/case-1/a.jpg
 */
export async function resolveImage(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  if (CONFIG.mediaSource === 'yandex') {
    return resolveYandex(path);
  }

  /* local: /Photo/case-1/a.jpg → assets/img/cases/case-1/a.jpg */
  const normalized = String(path)
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

export function youTubeThumb(id, quality = 'hqdefault') {
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

export function youTubeEmbedUrl(id) {
  return `${CONFIG.youtube.host}/embed/${id}?${CONFIG.youtube.params}`;
}
