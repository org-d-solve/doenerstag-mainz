/**
 * Dönerstag Mainz – Main Application Script
 *
 * Handles:
 *  - Day-specific hero animations (Mo=Falafel, Mi=Pizza, Do=Döner+Cola)
 *  - Speisekarte loaded from Google Sheets (gviz/tq JSON), with hardcoded fallback
 *  - Category filter buttons
 *  - Öffnungszeiten – open/closed status
 *  - Navbar scroll behaviour
 *  - Mobile nav toggle
 *  - Impressum / Datenschutz modals
 *  - Particle background
 */

'use strict';

// =============================================
// Constants
// =============================================

const SHEET_ID        = '1VGKY-hecl4sMV1L6kOeYJI9nw4MgmP9BKzW3JfyK1UM';
const GVIZ_PRICES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=prices`;
const GVIZ_HOURS_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=opening-hours`;

/**
 * Fallback menu data – mirrors the Google Sheet structure.
 * kategorie, gericht, preis (€), bildUrl (optional)
 */
const FALLBACK_MENU = [
  // Döner / Kebab
  { kategorie: 'Döner & Kebab', gericht: 'Döner Kebab (Brot)',       preis: 100, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Döner Kebab (Dürüm)',      preis: 100, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Döner Teller',             preis: 100, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Döner a la Turka',         preis: 100, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Yufka Döner',              preis: 100, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Veganer Dürüm (Halloumi)', preis: 100, bildUrl: '' },
  // Falafel
  { kategorie: 'Falafel',       gericht: 'Falafel im Brot',          preis: 100, bildUrl: '' },
  { kategorie: 'Falafel',       gericht: 'Falafel Dürüm',            preis: 100, bildUrl: '' },
  { kategorie: 'Falafel',       gericht: 'Falafel Teller',           preis: 100, bildUrl: '' },
  // Pizza
  { kategorie: 'Pizza',         gericht: 'Pizza Margherita',         preis: 100, bildUrl: '' },
  { kategorie: 'Pizza',         gericht: 'Pizza Funghi',             preis: 100, bildUrl: '' },
  { kategorie: 'Pizza',         gericht: 'Pizza Salami',             preis: 100, bildUrl: '' },
  { kategorie: 'Pizza',         gericht: 'Pizza Döner',              preis: 100, bildUrl: '' },
  // Salate
  { kategorie: 'Salate',        gericht: 'Thunfischsalat',           preis: 100, bildUrl: '' },
  { kategorie: 'Salate',        gericht: 'Gemischter Salat',         preis: 100, bildUrl: 'https://res.cloudinary.com/tkwy-prod-eu/image/upload/c_thumb,w_2200,h_480/f_auto/q_auto/dpr_1.0/d_de:cuisines:italienische-pizza-3.jpg/v1/static-takeaway-com/images/generic/heroes/271/271_italian_pizza_163' },
  // Getränke
  { kategorie: 'Getränke',      gericht: 'Cola 0,33 l',              preis: 100, bildUrl: '' },
  { kategorie: 'Getränke',      gericht: 'Wasser 0,5 l',             preis: 100, bildUrl: '' },
  { kategorie: 'Getränke',      gericht: 'Ayran',                    preis: 100, bildUrl: '' },
];

/**
 * Emoji placeholder per category (shown when no image URL)
 */
const CATEGORY_EMOJI = {
  'döner & kebab': '🥙',
  'falafel':       '🧆',
  'pizza':         '🍕',
  'salate':        '🥗',
  'getränke':      '🥤',
  'kebab':         '🥙',
  'salat':         '🥗',
  'default':       '🍽️',
};

/**
 * Maps German day abbreviations (from the sheet) to JS getDay() indices.
 */
const DAY_ABBR_TO_INDEX = { mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6, so: 0 };

/**
 * Fallback opening hours used when the sheet cannot be fetched.
 * Format: { dayIndex: [[openHour, closeHour], …] }
 * closeHour > 24 means the closing time wraps past midnight (e.g., 27 = 03:00 next day).
 */
const FALLBACK_OPENING_HOURS = {
  0: [[10, 25]], // Sun  10–01
  1: [[10, 25]], // Mon  10–01
  2: [[10, 25]], // Tue  10–01
  3: [[10, 25]], // Wed  10–01
  4: [[10, 25]], // Thu  10–01
  5: [[10, 27]], // Fri  10–03
  6: [[10, 27]], // Sat  10–03
};

// =============================================
// DOM Ready
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initNavbar();
  initMobileNav();
  initHeroAnimation();
  initHoursStatus();
  initMenuLoader();
  initModals();
  initParticles();
  initSpecialDayHighlight();
});

// =============================================
// Footer Year
// =============================================

function initYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

// =============================================
// Navbar scroll effect
// =============================================

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// =============================================
// Mobile nav toggle
// =============================================

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close when any nav link is clicked
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
  });
}

// =============================================
// Hero – day-specific animation
// =============================================

const DAY_NAMES_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const DAY_CONFIG = {
  // Monday – Falafel
  1: {
    badge:    '🧆 Montag – Falafel-Tag!',
    title:    'Falafel-Tag!',
    subtitle: 'Knusprige Falafel – frisch, würzig, 100 % vegan',
    animation: buildFalafelAnimation,
    particles: '#2a9d8f',
  },
  // Wednesday – Pizza
  3: {
    badge:    '🍕 Mittwoch – Pizza-Aktionstag!',
    title:    'Pizza-Aktionstag!',
    subtitle: 'Jeden Mittwoch – hausgemachte Pizza zu Aktionspreisen',
    animation: buildPizzaAnimation,
    particles: '#f4a261',
  },
  // Thursday – Döner + Cola
  4: {
    badge:    '🥙 Es ist DÖNERSTAG!',
    title:    'Dönerstag!',
    subtitle: 'Saftiger Döner mit eiskalter Cola – das Original',
    animation: buildDoenerAnimation,
    particles: '#e63946',
  },
};

function initHeroAnimation() {
  const day = new Date().getDay();
  const cfg = DAY_CONFIG[day];

  const badge    = document.getElementById('dayBadge');
  const title    = document.getElementById('heroTitle');
  const subtitle = document.getElementById('heroSubtitle');
  const stage    = document.getElementById('animationStage');

  if (cfg) {
    if (badge)    badge.textContent = cfg.badge;
    if (title)    title.textContent = cfg.title;
    if (subtitle) subtitle.textContent = cfg.subtitle;
    if (stage)    stage.innerHTML = cfg.animation();
  } else {
    // Default – generic döner day
    if (badge)    badge.textContent = `🌟 Guten ${DAY_NAMES_DE[day]}!`;
    if (stage)    stage.innerHTML = buildDefaultAnimation();
  }
}

// ---- Animation builders ----

function buildDoenerAnimation() {
  return `
    <div style="position:relative; display:flex; align-items:center; gap:1.5rem;">
      <span class="confetti-piece" style="left:10%; animation-duration:2.1s; animation-delay:0s;">🎉</span>
      <span class="confetti-piece" style="left:30%; animation-duration:1.8s; animation-delay:0.3s;">✨</span>
      <span class="confetti-piece" style="left:60%; animation-duration:2.4s; animation-delay:0.6s;">🎊</span>
      <span class="confetti-piece" style="left:80%; animation-duration:2s; animation-delay:1s;">🌟</span>
      <span class="anim-food anim-character" aria-hidden="true">🧑</span>
      <span class="anim-food anim-doener"   aria-hidden="true">🥙</span>
      <span class="anim-food anim-cola"     aria-hidden="true">🥤</span>
    </div>`;
}

function buildFalafelAnimation() {
  return `
    <div style="display:flex; align-items:flex-end; gap:1rem;">
      <span class="anim-food anim-character"               aria-hidden="true">🧑</span>
      <span class="anim-food anim-falafel"                 aria-hidden="true">🧆</span>
      <span class="anim-food anim-falafel" style="font-size:3.5rem; animation-delay:0.15s;" aria-hidden="true">🧆</span>
      <span class="anim-food anim-falafel" style="font-size:4rem; animation-delay:0.3s;"   aria-hidden="true">🧆</span>
      <span class="anim-food" style="font-size:3rem; animation: floatBob 3.5s ease-in-out infinite 0.5s;" aria-hidden="true">🥗</span>
    </div>`;
}

function buildPizzaAnimation() {
  return `
    <div style="position:relative; display:flex; align-items:center; gap:1.5rem;">
      <span class="anim-food anim-character"  aria-hidden="true">🧑‍🍳</span>
      <div style="position:relative;">
        <div class="anim-steam">
          <span class="steam-wisp" aria-hidden="true">💨</span>
          <span class="steam-wisp" aria-hidden="true">💨</span>
          <span class="steam-wisp" aria-hidden="true">💨</span>
        </div>
        <span class="anim-food anim-pizza" aria-hidden="true">🍕</span>
      </div>
      <span class="anim-food" style="font-size:2.5rem; animation: floatBob 2.5s ease-in-out infinite 0.7s;" aria-hidden="true">⭐</span>
    </div>`;
}

function buildDefaultAnimation() {
  return `
    <div style="display:flex; align-items:center; gap:1.5rem;">
      <span class="anim-food anim-doener"  aria-hidden="true">🥙</span>
      <span class="anim-food anim-pizza"   style="font-size:3.5rem;" aria-hidden="true">🍕</span>
      <span class="anim-food anim-falafel" style="font-size:3.5rem;" aria-hidden="true">🧆</span>
    </div>`;
}

// =============================================
// Particle background
// =============================================

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const day = new Date().getDay();
  const cfg = DAY_CONFIG[day];
  const color = cfg ? cfg.particles : '#e63946';

  const FOODS = ['🥙', '🍕', '🧆', '🌶️', '🧄', '🥗', '⭐'];
  const COUNT = 12;

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.textContent = FOODS[i % FOODS.length];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${1 + Math.random() * 2}rem;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
      color: ${color};
      background: none;
      border-radius: 0;
      opacity: 0.18;
    `;
    container.appendChild(el);
  }
}

// =============================================
// Öffnungszeiten status
// =============================================

/**
 * Formats a fractional hour (possibly > 24 for cross-midnight) as HH:00.
 * e.g., 25 → "01:00", 3 → "03:00"
 */
function fmtHour(h) {
  return String(h > 24 ? h - 24 : h).padStart(2, '0') + ':00';
}

async function initHoursStatus() {
  let openingHours = FALLBACK_OPENING_HOURS;
  try {
    openingHours = await fetchOpeningHoursFromSheets();
  } catch (err) {
    console.warn('Opening hours could not be loaded from sheet, using fallback.', err);
  }
  renderHoursTable(openingHours);
  renderHoursStatus(openingHours);
}

/**
 * Fetches opening hours from the "opening-hours" sheet tab.
 * Expected columns: day (mo/di/mi/do/fr/sa/so), open (hour), close (hour).
 * A day may have multiple rows (e.g., for a midday break).
 * If close < open the closing time wraps past midnight (close += 24).
 * Returns: { dayIndex: [[openHour, closeHour], …] }
 */
async function fetchOpeningHoursFromSheets() {
  const res = await fetch(GVIZ_HOURS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const data    = JSON.parse(jsonStr);

  const rows = data?.table?.rows;
  if (!rows || rows.length === 0) throw new Error('Empty opening-hours sheet');

  const hours = {};
  rows
    .filter(row => row.c && row.c[0] && row.c[0].v)
    .forEach(row => {
      const dayStr   = (row.c[0]?.v ?? '').toString().trim().toLowerCase();
      const dayIndex = DAY_ABBR_TO_INDEX[dayStr];
      if (dayIndex === undefined) return;

      const open  = parseFloat(row.c[1]?.v ?? 0);
      let   close = parseFloat(row.c[2]?.v ?? 0);
      // Wrap-around: e.g., open=10, close=3 → close becomes 27
      if (close < open) close += 24;

      if (!hours[dayIndex]) hours[dayIndex] = [];
      hours[dayIndex].push([open, close]);
    });

  return hours;
}

/**
 * Rebuilds the hours table from fetched data.
 * Renders rows in Mon–Sun order; days with no slots are omitted.
 */
function renderHoursTable(openingHours) {
  const tbody = document.getElementById('hoursTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const today    = new Date().getDay();
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon … Sun

  dayOrder.forEach(dayIndex => {
    const slots = openingHours[dayIndex];
    if (!slots || slots.length === 0) return;

    const tr = document.createElement('tr');
    tr.className = 'hours-row';
    tr.setAttribute('data-days', String(dayIndex));
    if (dayIndex === today) tr.classList.add('today');

    const timeText = slots
      .map(([o, c]) => `${fmtHour(o)} – ${fmtHour(c)} Uhr`)
      .join(' / ');

    tr.innerHTML = `
      <td class="hours-day">${DAY_NAMES_DE[dayIndex]}</td>
      <td class="hours-time">${timeText}</td>
      <td class="hours-note"></td>`;

    tbody.appendChild(tr);
  });
}

/**
 * Updates the open/closed badge and today's hours line in the Kontakt section.
 */
function renderHoursStatus(openingHours) {
  const statusEl = document.getElementById('hoursStatus');
  const todayEl  = document.getElementById('todayHours');

  const now          = new Date();
  const day          = now.getDay();
  const hour         = now.getHours() + now.getMinutes() / 60;
  const adjustedHour = hour < 6 ? hour + 24 : hour;

  const slots       = openingHours[day] || [];
  const currentSlot = slots.find(([open, close]) => adjustedHour >= open && adjustedHour < close);
  const isOpen      = !!currentSlot;

  if (statusEl) {
    statusEl.className = `hours-status ${isOpen ? 'open' : 'closed'}`;
    if (isOpen) {
      statusEl.textContent = `✅ Jetzt geöffnet – bis ${fmtHour(currentSlot[1])} Uhr`;
    } else {
      const nextSlot = slots.find(([open]) => adjustedHour < open);
      if (nextSlot) {
        statusEl.textContent = `❌ Aktuell geschlossen – öffnet um ${fmtHour(nextSlot[0])} Uhr`;
      } else {
        statusEl.textContent = '❌ Aktuell geschlossen';
      }
    }
  }

  if (todayEl) {
    const slotsText = slots.length > 0
      ? slots.map(([o, c]) => `${fmtHour(o)} – ${fmtHour(c)} Uhr`).join(', ')
      : 'Heute geschlossen';
    todayEl.textContent = `${slotsText} (${isOpen ? 'geöffnet' : 'geschlossen'})`;
    todayEl.style.color = isOpen ? '#4ecdc4' : 'var(--primary)';
  }
}

// =============================================
// Special-day card highlight
// =============================================

function initSpecialDayHighlight() {
  const day   = new Date().getDay();
  const cards = document.querySelectorAll('.spezial-card');
  cards.forEach(card => {
    const cardDay = parseInt(card.getAttribute('data-day'), 10);
    if (cardDay === day) card.classList.add('today-active');
  });
}

// =============================================
// Speisekarte – Google Sheets loader
// =============================================

async function initMenuLoader() {
  try {
    const menu = await fetchMenuFromSheets();
    renderMenu(menu);
  } catch {
    renderMenu(FALLBACK_MENU);
    const warning = document.getElementById('menuPriceWarning');
    if (warning) warning.classList.remove('hidden');
  }
}

/**
 * Fetches menu data from the public Google Sheets gviz/tq endpoint.
 * Returns an array of { kategorie, gericht, preis, bildUrl } objects.
 */
async function fetchMenuFromSheets() {
  const res  = await fetch(GVIZ_PRICES_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  // Strip JSONP wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const data    = JSON.parse(jsonStr);

  const rows = data?.table?.rows;
  if (!rows || rows.length === 0) throw new Error('Empty sheet');

  return rows
    .filter(row => row.c && row.c[0] && row.c[0].v && !isNaN(parseFloat(row.c[2]?.v))) // skip empty rows and header row
    .map(row => ({
      kategorie: (row.c[0]?.v ?? '').toString().trim(),
      gericht:   (row.c[1]?.v ?? '').toString().trim(),
      preis:     parseFloat(row.c[2]?.v ?? 0),
      bildUrl:   (row.c[3]?.v ?? '').toString().trim(),
    }));
}

// =============================================
// Menu rendering
// =============================================

let allMenuItems = [];

function renderMenu(items) {
  const grid    = document.getElementById('menuGrid');
  const loading = document.getElementById('menuLoading');
  const filterBar = document.getElementById('filterBar');

  if (loading) loading.classList.add('hidden');
  if (!grid)   return;

  allMenuItems = items;

  // Build unique category list preserving order
  const categories = [...new Set(items.map(i => i.kategorie))];

  // Populate filter bar
  if (filterBar) {
    // Clear existing dynamic buttons (keep "Alle")
    filterBar.querySelectorAll('[data-filter]:not([data-filter="all"])').forEach(b => b.remove());
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.setAttribute('data-filter', cat);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.textContent = cat;
      filterBar.appendChild(btn);
    });

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      renderMenuItems(grid, btn.getAttribute('data-filter'));
    });
  }

  renderMenuItems(grid, 'all');
}

function renderMenuItems(grid, filter) {
  grid.innerHTML = '';

  const filtered = filter === 'all'
    ? allMenuItems
    : allMenuItems.filter(i => i.kategorie === filter);

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center;">Keine Einträge gefunden.</p>';
    return;
  }

  if (filter === 'all') {
    // Group by category
    const categories = [...new Set(filtered.map(i => i.kategorie))];
    categories.forEach(cat => {
      const catItems = filtered.filter(i => i.kategorie === cat);
      const section  = document.createElement('div');
      section.className = 'menu-category-section';

      const catTitle = document.createElement('h3');
      catTitle.className = 'menu-category-title';
      catTitle.textContent = cat;
      section.appendChild(catTitle);

      const row = document.createElement('div');
      row.className = 'menu-items-row';
      catItems.forEach(item => row.appendChild(createMenuCard(item)));
      section.appendChild(row);

      grid.appendChild(section);
    });
  } else {
    filtered.forEach(item => grid.appendChild(createMenuCard(item)));
  }
}

function createMenuCard(item) {
  const card = document.createElement('article');
  card.className = 'menu-card';
  card.setAttribute('aria-label', `${item.gericht} – ${formatPrice(item.preis)}`);

  const imgPart = item.bildUrl
    ? `<img class="menu-card-img" src="${escapeHtml(item.bildUrl)}" alt="${escapeHtml(item.gericht)}" loading="lazy" />`
    : `<div class="menu-card-img-placeholder" aria-hidden="true">${categoryEmoji(item.kategorie)}</div>`;

  card.innerHTML = `
    ${imgPart}
    <div class="menu-card-body">
      <h4 class="menu-card-name">${escapeHtml(item.gericht)}</h4>
      <p class="menu-card-price">${formatPrice(item.preis)}</p>
    </div>`;

  return card;
}

function categoryEmoji(kategorie) {
  return CATEGORY_EMOJI[(kategorie || '').toLowerCase()] || CATEGORY_EMOJI['default'];
}

function formatPrice(price) {
  if (!price && price !== 0) return '';
  return Number(price).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// =============================================
// Modals (Impressum / Datenschutz)
// =============================================

function initModals() {
  const triggers = {
    openImpressum:   'impressumModal',
    openDatenschutz: 'datenschutzModal',
  };

  Object.entries(triggers).forEach(([btnId, modalId]) => {
    const btn   = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (!btn || !modal) return;
    btn.addEventListener('click', () => openModal(modal));
  });

  // Close buttons / backdrops
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', e => {
      const modal = document.getElementById(el.getAttribute('data-close'));
      if (modal) closeModal(modal);
    });
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(m => closeModal(m));
    }
  });
}

function openModal(modal) {
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  // Focus first focusable element
  const focusable = modal.querySelector('button, a, input');
  if (focusable) focusable.focus();
}

function closeModal(modal) {
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
}
