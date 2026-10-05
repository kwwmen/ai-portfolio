import { CONFIG } from './config.js';
import { el, clear, safeHref } from './lib/dom.js';
import { pluralRu } from './lib/format.js';
import { typeset } from './lib/typography.js';
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
import { ProcessList } from './components/ProcessList.js';
import { IncludedList } from './components/IncludedList.js';
import { PricingBlock } from './components/PricingBlock.js';
import { AudienceCard } from './components/AudienceCard.js';
import { FaqList } from './components/FaqList.js';
import { mountBeforeAfter } from './components/BeforeAfter.js';

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

  let site, cases, services, testimonials, page;

  try {
    [site, cases, services, testimonials, page] = await Promise.all([
      loadJSON('site.json'),
      loadJSON('cases.json'),
      loadJSON('services.json'),
      loadJSON('testimonials.json'),
      loadJSON('page.json')
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

  renderBeforeAfter(page, visibleCases);
  renderCases(visibleCases, testimonials);
  renderProcess(page);
  renderIncluded(page);
  renderServices(services);
  renderPricing(page);
  renderAudience(page);
  renderCtaMid(page);
  renderTestimonials(testimonials, visibleCases);
  renderFaq(page);
  renderContact(site);
  renderCtaFinal(page);
  renderFooter(site);

  initActiveNav();

  /* Запуск анимации героя — после того как тексты вставлены */
  /* Типографика: неразрывные пробелы во всех отрисованных текстах */
  typeset(document.querySelector('main'));
  typeset(document.querySelector('.site-footer'));
  typeset(document.querySelector('.site-header'));

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

  const priceEl = document.querySelector('[data-site="heroPrice"]');
  if (priceEl && site.heroPrice) priceEl.textContent = site.heroPrice;

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

  /* Две основные кнопки: "Посмотреть работы" и "Обсудить проект" */
  if (!actions) return;

  const viewWorks = el('a', 'btn btn--ghost', 'Посмотреть работы');
  viewWorks.href = '#cases';
  actions.appendChild(viewWorks);

  if (Array.isArray(site.contacts)) {
    const primary = site.contacts[0];
    if (primary) {
      const href = safeHref(primary.href);
      if (href) {
        const btn = el('a', 'btn btn--primary', 'Обсудить проект');
        btn.href = href;
        if (href.startsWith('http')) {
          btn.target = '_blank';
          btn.rel = 'noopener noreferrer';
        }
        actions.appendChild(btn);
      }
    }
  }
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

/* ── Было → Стало ───────────────────────────────── */

function renderBeforeAfter(page, cases) {
  const section = document.getElementById('before-after');
  const ba = page?.beforeAfter;
  if (!section || !ba) { if (section) section.hidden = true; return; }

  /* Секция живёт, если есть либо ролик, либо пара своих кадров */
  const targetCase = ba.caseId ? cases.find(c => c.id === ba.caseId) : null;
  const hasOwnPair = Boolean(ba.beforePhoto && ba.afterPhoto);
  const hasVideo = Boolean(targetCase && targetCase.video);

  if (!hasOwnPair && !hasVideo) { section.hidden = true; return; }

  const beforeTag = section.querySelector('.ba__tag--before');
  const afterTag  = section.querySelector('.ba__tag--after');
  const caption   = section.querySelector('.ba__caption');

  if (beforeTag) beforeTag.textContent = ba.beforeLabel || 'Было';
  if (afterTag)  afterTag.textContent  = ba.afterLabel  || 'Стало';
  if (caption)   caption.textContent   = `${ba.beforeText || ''} → ${ba.afterText || ''}`;

  mountBeforeAfter(targetCase, ba);
  reveal(section.querySelector('.container'));
}

/* ── Как проходит работа ────────────────────────── */

function renderProcess(page) {
  const container = document.getElementById('process-list');
  const steps = page?.process;
  if (!container) return;

  if (!Array.isArray(steps) || steps.length === 0) {
    const section = document.getElementById('process');
    if (section) section.hidden = true;
    return;
  }

  container.appendChild(ProcessList(steps));
  revealAll(container.querySelectorAll('.process__step'), 100);
}

/* ── Что входит в ролик ──────────────────────────── */

function renderIncluded(page) {
  const list = document.getElementById('included-list');
  const footnote = document.getElementById('included-footnote');
  const data = page?.included;

  if (!list) return;

  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    const section = document.getElementById('included');
    if (section) section.hidden = true;
    return;
  }

  const built = IncludedList(data.items);
  list.replaceWith(built);
  built.id = 'included-list';

  if (footnote && data.footnote) footnote.textContent = data.footnote;

  reveal(built);
}

/* ── Цены ────────────────────────────────────────── */

function renderPricing(page) {
  const container = document.getElementById('pricing-block');
  const pricing = page?.pricing;
  if (!container) return;

  if (!pricing || (!pricing.basic && !pricing.custom)) {
    container.hidden = true;
    return;
  }

  container.appendChild(PricingBlock(pricing));
  revealAll(container.querySelectorAll('.pricing-card'), 100);
}

/* ── Для кого ────────────────────────────────────── */

function renderAudience(page) {
  const grid = document.getElementById('audience-grid');
  const items = page?.audience;
  if (!grid) return;

  if (!Array.isArray(items) || items.length === 0) {
    const section = document.getElementById('audience');
    if (section) section.hidden = true;
    return;
  }

  const cards = items.map(a => AudienceCard(a));
  cards.forEach(c => grid.appendChild(c));
  revealAll(cards, 90);
}

/* ── CTA (середина страницы) ───────────────────────── */

function renderCtaMid(page) {
  const section = document.getElementById('cta-mid');
  const data = page?.ctaMid;
  if (!section) return;

  if (!data) { section.hidden = true; return; }

  const title = document.getElementById('cta-mid-title');
  const text  = document.getElementById('cta-mid-text');
  if (title) title.textContent = data.title || '';
  if (text)  text.textContent  = data.text || '';

  reveal(section.querySelector('.cta-mid__inner'));
}

/* ── FAQ ─────────────────────────────────────────── */

function renderFaq(page) {
  const container = document.getElementById('faq-list');
  const items = page?.faq;
  if (!container) return;

  if (!Array.isArray(items) || items.length === 0) {
    const section = document.getElementById('faq');
    if (section) section.hidden = true;
    return;
  }

  container.appendChild(FaqList(items));
  reveal(container);
}

/* ── CTA (финальный блок) ──────────────────────────── */

function renderCtaFinal(page) {
  const section = document.getElementById('cta-final');
  const data = page?.ctaFinal;
  if (!section) return;

  if (!data) { section.hidden = true; return; }

  const title = document.getElementById('cta-final-title');
  const text  = document.getElementById('cta-final-text');
  if (title) title.textContent = data.title || '';
  if (text)  text.textContent  = data.text || '';

  reveal(section.querySelector('.cta-final__inner'));
}

main();
