import { CONFIG } from './config.js';
import { el, clear, setText, safeHref } from './lib/dom.js';
import { pluralRu } from './lib/format.js';
import { CaseCard } from './components/CaseCard.js';
import { CaseModal } from './components/CaseModal.js';
import { ServiceCard } from './components/ServiceCard.js';
import { TestimonialCard } from './components/TestimonialCard.js';

async function loadJSON(name) {
  const res = await fetch(`${CONFIG.dataDir}${name}`);
  if (!res.ok) throw new Error(`Не удалось загрузить ${name}: ${res.status}`);
  return res.json();
}

async function main() {
  let site, cases, services, testimonials;

  try {
    [site, cases, services, testimonials] = await Promise.all([
      loadJSON('site.json'),
      loadJSON('cases.json'),
      loadJSON('services.json'),
      loadJSON('testimonials.json')
    ]);
  } catch (err) {
    console.error('[main] Ошибка загрузки данных:', err);
    return;
  }

  renderSiteMeta(site);
  renderHeader(site);
  renderHero(site);

  const visibleCases = cases.filter(c =>
    c.status === 'published' || (CONFIG.showDemo && c.status === 'demo')
  );

  renderCases(visibleCases, testimonials);
  renderServices(services);
  renderTestimonials(testimonials, visibleCases);
  renderContact(site);
  renderFooter(site);
}

function renderSiteMeta(site) {
  if (site.brand) {
    document.title = `${site.brand} — ${site.tagline || 'Портфолио'}`;
  }
}

function renderHeader(site) {
  const brand = document.querySelector('[data-site="brand"]');
  if (brand) brand.textContent = site.brand || '';

  const nav = document.querySelector('[data-site="nav"]');
  if (!nav || !site.nav) return;

  site.nav.forEach(item => {
    const href = safeHref(item.href);
    if (!href) return;
    const a = el('a', 'site-nav__link', item.label);
    a.href = href;
    if (item.optional) a.classList.add('site-nav__link--optional');
    nav.appendChild(a);
  });
}

function renderHero(site) {
  const eyebrow = document.querySelector('[data-site="heroEyebrow"]');
  const title   = document.querySelector('[data-site="heroTitle"]');
  const lead    = document.querySelector('[data-site="heroLead"]');

  if (eyebrow) eyebrow.textContent = site.heroEyebrow || '';
  if (title)   title.textContent   = site.heroTitle   || site.name || '';
  if (lead)    lead.textContent    = site.heroLead    || '';
}

async function renderCases(cases, testimonials) {
  const grid    = document.getElementById('case-grid');
  const counter = document.querySelector('[data-count="cases"]');
  if (!grid) return;

  if (cases.length === 0) {
    grid.appendChild(el('p', 'state-empty', 'Кейсы скоро появятся'));
    return;
  }

  if (counter) {
    counter.textContent =
      `${cases.length} ${pluralRu(cases.length, ['кейс', 'кейса', 'кейсов'])}`;
  }

  const modal = CaseModal(
    document.getElementById('case-modal'),
    testimonials
  );

  for (const c of cases) {
    const card = await CaseCard(c, () => modal.open(c));
    grid.appendChild(card);
  }
}

function renderServices(services) {
  const grid    = document.getElementById('service-grid');
  const counter = document.querySelector('[data-count="services"]');
  if (!grid) return;

  if (!services || services.length === 0) {
    const section = document.getElementById('services');
    if (section) section.hidden = true;
    return;
  }

  if (counter) {
    counter.textContent =
      `${services.length} ${pluralRu(services.length, ['услуга', 'услуги', 'услуг'])}`;
  }

  services.forEach(s => grid.appendChild(ServiceCard(s)));
}

function renderTestimonials(testimonials, cases) {
  const grid    = document.getElementById('testimonial-grid');
  const counter = document.querySelector('[data-count="testimonials"]');
  if (!grid) return;

  if (!testimonials || testimonials.length === 0) {
    const section = document.getElementById('testimonials');
    if (section) section.hidden = true;
    return;
  }

  if (counter) {
    counter.textContent =
      `${testimonials.length} ${pluralRu(testimonials.length, ['отзыв', 'отзыва', 'отзывов'])}`;
  }

  testimonials.forEach(t => grid.appendChild(TestimonialCard(t, cases)));
}

function renderContact(site) {
  const body = document.getElementById('contact-body');
  if (!body || !site.contacts) return;

  const grid = el('div', 'contact-grid');

  site.contacts.forEach(c => {
    const item = el('div', 'contact-item');
    item.appendChild(el('span', 'contact-item__label', c.label));

    const val = el('p', 'contact-item__value');
    const href = safeHref(c.href);
    if (href) {
      const a = el('a', null, c.value);
      a.href = href;
      if (href.startsWith('http')) a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      val.appendChild(a);
    } else {
      val.textContent = c.value;
    }

    item.appendChild(val);
    grid.appendChild(item);
  });

  body.appendChild(grid);
}

function renderFooter(site) {
  const footer = document.querySelector('[data-site="footer"]');
  if (!footer) return;

  const grid = el('div', 'site-footer__grid');

  // Колонка 1: о проекте
  const col1 = el('div');
  col1.appendChild(el('p', 'site-footer__heading', site.brand || ''));
  if (site.footer?.about) {
    col1.appendChild(el('p', 'site-footer__about', site.footer.about));
  }
  grid.appendChild(col1);

  // Колонка 2: контакты
  if (site.contacts && site.contacts.length > 0) {
    const col2 = el('div');
    col2.appendChild(el('p', 'site-footer__heading', 'Контакты'));
    const list = el('ul', 'site-footer__list');
    site.contacts.forEach(c => {
      const li = el('li');
      const href = safeHref(c.href);
      if (href) {
        const a = el('a', null, c.value);
        a.href = href;
        if (href.startsWith('http')) a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        li.appendChild(a);
      } else {
        li.textContent = c.value;
      }
      list.appendChild(li);
    });
    col2.appendChild(list);
    grid.appendChild(col2);
  }

  // Колонка 3: навигация
  if (site.nav && site.nav.length > 0) {
    const col3 = el('div');
    col3.appendChild(el('p', 'site-footer__heading', 'Навигация'));
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
    col3.appendChild(list);
    grid.appendChild(col3);
  }

  footer.appendChild(grid);

  // Подвал
  const bottom = el('div', 'site-footer__bottom');
  const year = site.year || new Date().getFullYear();
  bottom.appendChild(el('span', null, `© ${year} ${site.name || site.brand || ''}`));
  bottom.appendChild(el('span', null, 'AI photo-to-video'));
  footer.appendChild(bottom);
}

main();
