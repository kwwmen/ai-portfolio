/**
 * Анимации интерфейса.
 * Всё построено на IntersectionObserver — без scroll-listener'ов,
 * которые нагружают главный поток.
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Появление элементов при скролле ──────────────── */

let revealObserver = null;

function getRevealObserver() {
  if (revealObserver) return revealObserver;

  revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  return revealObserver;
}

/**
 * Помечает элемент как «появляющийся при скролле».
 * @param {HTMLElement} node
 * @param {number} order — порядковый номер в группе (для каскада)
 * @param {number} step  — задержка между элементами группы, мс
 */
export function reveal(node, order = 0, step = 70) {
  if (!node) return node;

  if (reduceMotion) return node;

  node.classList.add('reveal');

  // Задержка не больше 420 мс, иначе последние элементы ждут слишком долго
  const delay = Math.min(order * step, 420);
  if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);

  getRevealObserver().observe(node);
  return node;
}

/** Пометить сразу группу элементов */
export function revealAll(nodes, step = 70) {
  Array.from(nodes).forEach((node, i) => reveal(node, i, step));
}

/* ── Шапка: фон, прогресс чтения, активная ссылка ─── */

export function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  header.appendChild(progress);

  let ticking = false;

  function update() {
    const y = window.scrollY;

    header.classList.toggle('is-scrolled', y > 8);

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docH > 0 ? Math.min(y / docH, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
}

/** Подсветка активной ссылки в навигации по мере прокрутки */
export function initActiveNav() {
  const links = Array.from(document.querySelectorAll('.site-nav__link[href^="#"]'));
  if (links.length === 0) return;

  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        links.forEach(a => {
          a.classList.toggle('is-active', a.getAttribute('href') === id);
        });
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );

  sections.forEach(s => observer.observe(s));
}

/* ── Плавный скролл с учётом высоты шапки ─────────── */

export function initSmoothAnchors() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    const headerH = document.querySelector('.site-header')?.offsetHeight ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;

    window.scrollTo({
      top,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });

    history.replaceState(null, '', hash);
  });
}

/* ── Скелетоны на время загрузки данных ───────────── */

export function showSkeleton(container, count = 3) {
  if (!container) return;

  const grid = document.createElement('div');
  grid.className = 'skeleton-grid';

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');

    const media = document.createElement('div');
    media.className = 'skeleton skeleton--media';

    const line1 = document.createElement('div');
    line1.className = 'skeleton skeleton--line';

    const line2 = document.createElement('div');
    line2.className = 'skeleton skeleton--line skeleton--line-sm';
    line2.style.marginTop = '10px';

    item.append(media, line1, line2);
    grid.appendChild(item);
  }

  container.appendChild(grid);
}
