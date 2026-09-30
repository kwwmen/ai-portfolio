import { CONFIG } from './config.js';
import { el, clear, safeHref } from './lib/dom.js';
import { pluralRu } from './lib/format.js';
import {
  reveal,
  revealAll,
  initHeaderScroll,
  initActiveNav,
  initSmoothAnchors,
  showSkeleton
} from './lib/motion.js';

import { CaseCard } from './components/CaseCard.js';
import { CaseModal } from './components/CaseModal.js';
import { Gallery } from './components/Gallery.js';
import { Lightbox } from './components/Lightbox.js';
import { ServiceCard } from './components/ServiceCard.js';
import { TestimonialCard } from './components/TestimonialCard.js';

document.documentElement.classList.add('has-js');

/* ── Загрузка данных ────────────────────────────── */

async function loadJSON(name) {
  const res = await fetch(`${CONFIG.dataDir}${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

/* ── Точка входа ────────────────────────────────── */

async function main() {
  initHeaderScroll();
  initSmoothAnchors();

  const caseGrid = document.getElementById('case-grid');
  showSkeleton(caseGrid, 3);

  let site, cases, services, testimonials;

  try {
    [site, cases, services, testimonials] = await Promise.all([
      loadJSON('site.json'),
      loadJSON('cases.json'),
      loadJSON('services.json'),
      loadJSON('testimonials.json')
    ]);
  } catch (err) {
    console.error('[main] Не удалось загрузить данные:', err);
    if (caseGrid) {
      clear(caseGrid);
      caseGrid.appendChild(
        el('p', 'state-empty', 'Не удалось загрузить данные. Обновите страницу.')
      );
    }
    document.body.classList.add('is-ready');
    return;
  }

  renderSiteMeta(site);
  renderHeader(site);
  renderHero(site);

  const visibleCases = cases.filter(
    c => c.status === 'published' || (CONFIG.showDemo && c.status === 'demo')
  );

  renderCases(visibleCases, testimonials);
  renderServices(services);
  renderTestimonials(testimonials, visibleCases);
  renderContact(site);
  renderFooter(site);

  initActiveNav();

  /* Запуск анимации героя — после того как тексты вставлены */
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
}

/* ── Метаданные документа ───────────────────────── */

function renderSiteMeta(site) {
  if (!site.brand) return;
  const sep = ' — ';
  document.title = site.tagline
    ? `${site.brand}${sep}${site.tagline}`
    : site.brand;
}

/* ── Шапка ──────────────────────────────────────── */

function renderHeader(site) {
  const brand = document.querySelector('[data-site="brand"]');
  if (brand) brand.textContent = site.brand || '';

  const nav = document.querySelector('[data-site="nav"]');
  if (!nav || !Array.isArray(site.nav)) return;

  site.nav.forEach(item => {
    const href = safeHref(item.href);
    if (!href) return;

    const a = el('a', 'site-nav__link', item.label);
    a.href = href;
    if (item.optional) a.classList.add('site-nav__link--optional');
    nav.appendChild(a);
  });
}

/* ── Hero ───────────────────────────────────────── */

function renderHero(site) {
  const eyebrow = document.querySelector('[data-site="heroEyebrow"]');
  const title   = document.querySelector('[data-site="heroTitle"]');
  const lead    = document.querySelector('[data-site="heroLead"]');
  const actions = document.querySelector('[data-site="heroActions"]');

  if (eyebrow) eyebrow.textContent = site.heroEyebrow || '';
  if (lead)    lead.textContent    = site.heroLead || '';

  /* Заголовок: часть после «|» выделяется акцентным курсивом */
  if (title) {
    const raw = site.heroTitle || site.name || '';
    const [head, tail] = raw.split('|').map(s => s.trim());

    title.replaceChildren(document.createTextNode(head));

    if (tail) {
      title.appendChild(document.createTextNode(' '));
      const em = el('em');
      em.textContent = tail;
      title.appendChild(em);
    }
  }

  /* Кнопки действий строим из контактов: первая — основная */
  if (!actions || !Array.isArray(site.contacts)) return;

  const primary = site.contacts[0];
  if (primary) {
    const href = safeHref(primary.href);
    if (href) {
      const btn = el('a', 'btn btn--primary', `Написать в ${primary.label}`);
      btn.href = href;
      if (href.startsWith('http')) {
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
      }
      actions.appendChild(btn);
    }
  }

  const ghost = el('a', 'btn btn--ghost', 'Смотреть работы');
  ghost.href = '#cases';
  actions.appendChild(ghost);
}

/* ── Кейсы ──────────────────────────────────────── */

async function renderCases(cases, testimonials) {
  const grid = document.getElementById('case-grid');
  const counter = document.querySelector('[data-count="cases"]');

  if (!grid) return;
  clear(grid);

  if (cases.length === 0) {
    grid.appendChild(el('p', 'state-empty', 'Кейсы скоро появятся'));
    return;
  }

  if (counter) {
    counter.textContent =
      `${cases.length} ${pluralRu(cases.length, ['кейс', 'кейса', 'кейсов'])}`;
  }

  const lightbox = Lightbox();
  document.body.appendChild(lightbox.element);

  const modal = CaseModal(
    document.getElementById('case-modal'),
    testimonials,
    lightbox,
    Gallery
  );

  const cards = [];

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const card = await CaseCard(
      c,
      data => modal.open(data, card),
      i === 0 && cases.length > 2
    );
    cards.push(card);
    grid.appendChild(card);
  }

  revealAll(cards, 80);
}

/* ── Услуги ─────────────────────────────────────── */

function renderServices(services) {
  const grid = document.getElementById('service-grid');
  const counter = document.querySelector('[data-count="services"]');

  if (!grid) return;

  if (!Array.isArray(services) || services.length === 0) {
    const section = document.getElementById('services');
    if (section) section.hidden = true;
    return;
  }

  if (counter) {
    counter.textContent =
      `${services.length} ${pluralRu(services.length, ['услуга', 'услуги', 'услуг'])}`;
  }

  const cards = services.map((s, i) => ServiceCard(s, i));
  cards.forEach(c => grid.appendChild(c));
  revealAll(cards, 90);
}

/* ── Отзывы ─────────────────────────────────────── */

function renderTestimonials(testimonials, cases) {
  const grid = document.getElementById('testimonial-grid');
  const counter = document.querySelector('[data-count="testimonials"]');

  if (!grid) return;

  /* Секция без отзывов просто не показывается */
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    const section = document.getElementById('testimonials');
    if (section) section.hidden = true;
    return;
  }

  if (counter) {
    counter.textContent =
      `${testimonials.length} ${pluralRu(testimonials.length, ['отзыв', 'отзыва', 'отзывов'])}`;
  }

  const cards = testimonials.map(t => TestimonialCard(t, cases));
  cards.forEach(c => grid.appendChild(c));
  revealAll(cards, 90);
}

/* ── Контакты ───────────────────────────────────── */

function renderContact(site) {
  const body = document.getElementById('contact-body');
  if (!body || !Array.isArray(site.contacts)) return;

  const grid = el('div', 'contact-grid');
  const items = [];

  site.contacts.forEach(c => {
    const item = el('div', 'contact-item');
    item.appendChild(el('span', 'contact-item__label', c.label));

    const value = el('p', 'contact-item__value');
    const href = safeHref(c.href);

    if (href) {
      const a = el('a', null, c.value);
      a.href = href;
      if (href.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      value.appendChild(a);
    } else {
      value.textContent = c.value;
    }

    item.appendChild(value);
    grid.appendChild(item);
    items.push(item);
  });

  body.appendChild(grid);
  revealAll(items, 80);
}

/* ── Footer ─────────────────────────────────────── */

function renderFooter(site) {
  const footer = document.querySelector('[data-site="footer"]');
  if (!footer) return;

  const grid = el('div', 'site-footer__grid');

  /* О проекте */
  const col1 = el('div');
  col1.appendChild(el('p', 'site-footer__heading', site.name || site.brand || ''));
  if (site.footer?.about) {
    col1.appendChild(el('p', 'site-footer__about', site.footer.about));
  }
  grid.appendChild(col1);

  /* Контакты */
  if (Array.isArray(site.contacts) && site.contacts.length > 0) {
    const col = el('div');
    col.appendChild(el('p', 'site-footer__heading', 'Контакты'));

    const list = el('ul', 'site-footer__list');
    site.contacts.forEach(c => {
      const li = el('li');
      const href = safeHref(c.href);

      if (href) {
        const a = el('a', null, c.value);
        a.href = href;
        if (href.startsWith('http')) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
        li.appendChild(a);
      } else {
        li.textContent = c.value;
      }
      list.appendChild(li);
    });

    col.appendChild(list);
    grid.appendChild(col);
  }

  /* Навигация */
  if (Array.isArray(site.nav) && site.nav.length > 0) {
    const col = el('div');
    col.appendChild(el('p', 'site-footer__heading', 'Разделы'));

    const list = el('ul', 'site-footer__list');
    site.nav.forEach(item => {
      const href = safeHref(item.href);
      if (!href) return;
      const li = el('li');
      const a = el('a', null, item.label);
      a.href = href;
      li.appendChild(a);
      list.appendChild(li);
    });

    col.appendChild(list);
    grid.appendChild(col);
  }

  footer.appendChild(grid);

  const bottom = el('div', 'site-footer__bottom');
  const year = site.year || new Date().getFullYear();
  bottom.appendChild(el('span', null, `© ${year} ${site.name || site.brand || ''}`));
  bottom.appendChild(el('span', null, 'AI photo-to-video'));
  footer.appendChild(bottom);

  reveal(footer.querySelector('.site-footer__grid'));
}

main();
