import { el, setAttr } from '../lib/dom.js';
import { parseYouTubeId, youTubeThumb, youTubeEmbedUrl } from '../lib/media.js';

/**
 * Фасад YouTube.
 * До клика — только превью (~20 КБ). Посл�� клика — настоящий iframe.
 */
export function YouTubeEmbed(videoValue, title = 'Видео') {
  const id = parseYouTubeId(videoValue);
  const wrap = el('div', 'yt');

  if (!id) {
    wrap.appendChild(el('p', 'state-empty', 'Видео не указано'));
    return wrap;
  }

  const btn = el('button', 'yt__btn');
  btn.type = 'button';
  setAttr(btn, 'aria-label', `Воспроизвести: ${title}`);

  const img = el('img', 'yt__thumb');
  img.src = youTubeThumb(id);
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 1280;
  img.height = 720;

  const play = el('span', 'yt__play');
  play.setAttribute('aria-hidden', 'true');
  // SVG кнопки YouTube — встроен напрямую (не innerHTML через внешний источник)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 68 48');
  svg.setAttribute('focusable', 'false');
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3 0 34 0 34 0S12.7 0 7.4 1.7c-2.9.8-5.1 3.1-5.9 6C0 13 0 24 0 24s0 11 .5 16.3c.8 2.9 3 5.2 5.9 6C12.7 48 34 48 34 48s21.3 0 26.6-1.7c2.9-.8 5.1-3.1 5.9-6C68 35 68 24 68 24s0-11-1.5-16.3z');
  path1.setAttribute('fill', '#F00');
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M45 24 27 14v20');
  path2.setAttribute('fill', '#FFF');
  svg.append(path1, path2);
  play.appendChild(svg);

  btn.append(img, play);
  wrap.appendChild(btn);

  // Preconnect при hover — сокращает задержку при клике
  const preconnect = () => {
    if (document.querySelector('link[data-yt-pre]')) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://www.youtube-nocookie.com';
    link.setAttribute('data-yt-pre', '');
    document.head.appendChild(link);
  };

  btn.addEventListener('mouseenter', preconnect, { once: true });
  btn.addEventListener('touchstart', preconnect, { once: true, passive: true });

  btn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'yt__iframe';
    iframe.src = youTubeEmbedUrl(id);
    iframe.title = title;
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    wrap.replaceChildren(iframe);
  });

  return wrap;
}
