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
const GVIZ_NEWS_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=news`;
const GVIZ_CONTACT_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;
/**
 * Fallback menu data – mirrors the Google Sheet structure.
 * kategorie, gericht, preis (€), bildUrl (optional)
 */
const FALLBACK_MENU = [
  // Döner / Kebab
  { kategorie: 'Döner & Kebab', gericht: 'Döner Kebab (Brot)',       preis: null, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Döner Kebab (Dürüm)',      preis: null, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Döner Teller',             preis: null, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Döner a la Turka',         preis: null, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Yufka Döner',              preis: null, bildUrl: '' },
  { kategorie: 'Döner & Kebab', gericht: 'Veganer Dürüm (Halloumi)', preis: null, bildUrl: '' },
  // Falafel
  { kategorie: 'Falafel',       gericht: 'Falafel im Brot',          preis: null, bildUrl: '' },
  { kategorie: 'Falafel',       gericht: 'Falafel Dürüm',            preis: null, bildUrl: '' },
  { kategorie: 'Falafel',       gericht: 'Falafel Teller',           preis: null, bildUrl: '' },
  // Pizza
  { kategorie: 'Pizza',         gericht: 'Pizza Margherita',         preis: null, bildUrl: '' },
  { kategorie: 'Pizza',         gericht: 'Pizza Funghi',             preis: null, bildUrl: '' },
  { kategorie: 'Pizza',         gericht: 'Pizza Salami',             preis: null, bildUrl: '' },
  { kategorie: 'Pizza',         gericht: 'Pizza Döner',              preis: null, bildUrl: '' },
  // Salate
  { kategorie: 'Salate',        gericht: 'Thunfischsalat',           preis: null, bildUrl: '' },
  { kategorie: 'Salate',        gericht: 'Gemischter Salat',         preis: null, bildUrl: '' },
  // Getränke
  { kategorie: 'Getränke',      gericht: 'Cola 0,33 l',              preis: null, bildUrl: '' },
  { kategorie: 'Getränke',      gericht: 'Wasser 0,5 l',             preis: null, bildUrl: '' },
  { kategorie: 'Getränke',      gericht: 'Ayran',                    preis: null, bildUrl: '' },
];

/**
 * Emoji placeholder per category (shown when no image URL)
 */
const CATEGORY_EMOJI = {
  'kebab gerichte': '🥙',
  'kebab':         '🥙',
  'falafel':       '🧆',
  'lahmacun':      '🫓',
  'pizza':         '🍕',
  'pizzen':         '🍕',
  'vegetarische gerichte':        '🥗',
  'getränke':      '🥤',
  'alkoholische getränke':      '🍺',
  'alkoholfreie getränke':      '🥤',
  'salate':         '🥗',
  'salat':         '🥗',
  'teig gerichte ': '🥟',
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
// Translations (i18n)
// =============================================

const TRANSLATIONS = {
  de: {
    'nav.menu': 'Speisekarte',
    'nav.specials': 'Aktionstage',
    'nav.hours': 'Öffnungszeiten',
    'nav.contact': 'Kontakt',
    'nav.call': '📞 Anrufen',
    'hero.title': 'Dönerstag Mainz',
    'hero.subtitle': 'Frischer Döner · Knusprige Pizza · Vegane Falafel',
    'hero.menuBtn': 'Zur Speisekarte',
    'hero.routeBtn': '📍 Route starten',
    'hero.routeAria': 'Navigation zu Dönerstag starten (öffnet Google Maps)',
    'hero.badge.1': '🧆 Montag – Falafel-Tag!',
    'hero.title.1': 'Falafel-Tag!',
    'hero.subtitle.1': 'Knusprige Falafel – frisch, würzig, 100 % vegan',
    'hero.badge.3': '🍕 Mittwoch – Pizza-Aktionstag!',
    'hero.title.3': 'Pizza-Aktionstag!',
    'hero.subtitle.3': 'Jeden Mittwoch – hausgemachte Pizza zu Aktionspreisen',
    'hero.badge.4': '🥙 Es ist DÖNERSTAG!',
    'hero.title.4': 'Dönerstag!',
    'hero.subtitle.4': 'Saftiger Döner mit eiskalter Cola – das Original',
    'hero.badge.default': '🌟 Guten',
    'specials.heading': 'Unsere Aktionstage',
    'specials.subtitle': 'An diesen Tagen gibt es bei uns etwas Besonderes!',
    'specials.monday': 'Montag',
    'specials.wednesday': 'Mittwoch',
    'specials.thursday': 'Donnerstag',
    'specials.falafelName': 'Falafel-Tag',
    'specials.falafelDesc': 'Frisch zubereitete Falafel – knusprig, würzig, 100 % vegan.',
    'specials.doenerName': 'Dönerstag!',
    'specials.doenerDesc': 'Der echte Dönerstag: saftiger Döner mit eiskalter Cola – das Original.',
    'specials.pizzaName': 'Pizza-Aktionstag',
    'specials.pizzaDesc': 'Jeden Mittwoch gibt es unsere hausgemachte Pizza zu Aktionspreisen!',
    'specials.todayBadge': '🔥 Heute!',
    'menu.heading': 'Speisekarte',
    'menu.subtitle': 'Frisch zubereitet – täglich für dich',
    'menu.all': 'Alle',
    'menu.loading': 'Speisekarte wird geladen…',
    'menu.error': '⚠️ Speisekarte konnte nicht geladen werden. Bitte ruf uns an oder schau direkt bei uns vorbei!',
    'menu.priceWarning': '⚠️ Die aktuellen Preise konnten nicht geladen werden. Die angezeigten Preise und Produkte sind Platzhalter – bitte frag direkt bei uns nach.',
    'menu.noEntries': 'Keine Einträge gefunden.',
    'hours.heading': 'Öffnungszeiten',
    'hours.subtitle': 'Wir sind fast immer für dich da',
    'hours.closed': 'Geschlossen',
    'hours.openNow': 'Jetzt geöffnet – bis',
    'hours.closedNow': 'Aktuell geschlossen – öffnet um',
    'hours.closedGeneral': 'Aktuell geschlossen',
    'hours.uhr': 'Uhr',
    'hours.warning': '⚠️ Die aktuellen Öffnungszeiten konnten nicht geladen werden. Bitte ruf uns an:',
    'hours.callForHours': 'Bitte ruf uns an für aktuelle Öffnungszeiten.',
    'hours.todayOpen': 'geöffnet',
    'hours.todayClosed': 'geschlossen',
    'contact.heading': 'Kontakt & Anfahrt',
    'contact.subtitle': 'Wir freuen uns auf deinen Besuch',
    'contact.address': 'Adresse',
    'contact.phone': 'Telefon',
    'contact.today': 'Heute',
    'contact.navBtn': '🗺️ Navigation starten',
    'contact.navAria': 'Google Maps Navigation zu Dönerstag Mainz starten',
    'footer.legal': 'Rechtliches',
    'footer.impressum': 'Impressum',
    'footer.datenschutz': 'Datenschutzerklärung',
    'footer.copyright': 'Alle Rechte vorbehalten.',
    'day.0': 'Sonntag', 'day.1': 'Montag', 'day.2': 'Dienstag', 'day.3': 'Mittwoch',
    'day.4': 'Donnerstag', 'day.5': 'Freitag', 'day.6': 'Samstag',
  },
  en: {
    'nav.menu': 'Menu',
    'nav.specials': 'Special Days',
    'nav.hours': 'Opening Hours',
    'nav.contact': 'Contact',
    'nav.call': '📞 Call Us',
    'hero.title': 'Dönerstag Mainz',
    'hero.subtitle': 'Fresh Döner · Crispy Pizza · Vegan Falafel',
    'hero.menuBtn': 'View Menu',
    'hero.routeBtn': '📍 Get Directions',
    'hero.routeAria': 'Navigate to Dönerstag (opens Google Maps)',
    'hero.badge.1': '🧆 Monday – Falafel Day!',
    'hero.title.1': 'Falafel Day!',
    'hero.subtitle.1': 'Crispy falafel – fresh, spicy, 100% vegan',
    'hero.badge.3': '🍕 Wednesday – Pizza Special!',
    'hero.title.3': 'Pizza Special!',
    'hero.subtitle.3': 'Every Wednesday – homemade pizza at special prices',
    'hero.badge.4': '🥙 It\'s DÖNERSTAG!',
    'hero.title.4': 'Dönerstag!',
    'hero.subtitle.4': 'Juicy döner with ice-cold cola – the original',
    'hero.badge.default': '🌟 Happy',
    'specials.heading': 'Our Special Days',
    'specials.subtitle': 'On these days we have something special for you!',
    'specials.monday': 'Monday',
    'specials.wednesday': 'Wednesday',
    'specials.thursday': 'Thursday',
    'specials.falafelName': 'Falafel Day',
    'specials.falafelDesc': 'Freshly prepared falafel – crispy, spicy, 100% vegan.',
    'specials.doenerName': 'Dönerstag!',
    'specials.doenerDesc': 'The real Döner Thursday: juicy döner with ice-cold cola – the original.',
    'specials.pizzaName': 'Pizza Special Day',
    'specials.pizzaDesc': 'Every Wednesday – our homemade pizza at special prices!',
    'specials.todayBadge': '🔥 Today!',
    'menu.heading': 'Menu',
    'menu.subtitle': 'Freshly prepared – daily for you',
    'menu.all': 'All',
    'menu.loading': 'Loading menu…',
    'menu.error': '⚠️ Menu could not be loaded. Please call us or visit us directly!',
    'menu.priceWarning': '⚠️ Current prices could not be loaded. Displayed prices and products are placeholders – please ask us directly.',
    'menu.noEntries': 'No entries found.',
    'hours.heading': 'Opening Hours',
    'hours.subtitle': 'We\'re almost always here for you',
    'hours.closed': 'Closed',
    'hours.openNow': 'Open now – until',
    'hours.closedNow': 'Currently closed – opens at',
    'hours.closedGeneral': 'Currently closed',
    'hours.uhr': '',
    'hours.warning': '⚠️ Current opening hours could not be loaded. Please call us:',
    'hours.callForHours': 'Please call us for current opening hours.',
    'hours.todayOpen': 'open',
    'hours.todayClosed': 'closed',
    'contact.heading': 'Contact & Directions',
    'contact.subtitle': 'We look forward to your visit',
    'contact.address': 'Address',
    'contact.phone': 'Phone',
    'contact.today': 'Today',
    'contact.navBtn': '🗺️ Start Navigation',
    'contact.navAria': 'Start Google Maps navigation to Dönerstag Mainz',
    'footer.legal': 'Legal',
    'footer.impressum': 'Legal Notice',
    'footer.datenschutz': 'Privacy Policy',
    'footer.copyright': 'All rights reserved.',
    'day.0': 'Sunday', 'day.1': 'Monday', 'day.2': 'Tuesday', 'day.3': 'Wednesday',
    'day.4': 'Thursday', 'day.5': 'Friday', 'day.6': 'Saturday',
  }
};

let currentLang = 'de';
let _lastOpeningHours = null;

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS['de']?.[key] ?? key;
}

// =============================================
// i18n
// =============================================

function initLanguage() {
  currentLang = localStorage.getItem('lang') || 'de';
  setLanguage(currentLang, true);

  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      setLanguage(currentLang === 'de' ? 'en' : 'de');
    });
  }
}

function setLanguage(lang, isInitial) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  // Static data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });

  // Toggle button label
  const langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.textContent = lang === 'de' ? 'EN' : 'DE';

  // CSS variable for today badge
  document.documentElement.style.setProperty('--today-badge', `'${t('specials.todayBadge')}'`);

  // Update theme toggle aria
  updateThemeButton();

  if (!isInitial) {
    initHeroAnimation();
    if (_lastOpeningHours) {
      renderHoursTable(_lastOpeningHours);
      renderHoursStatus(_lastOpeningHours);
    }
  }
}

// =============================================
// Theme
// =============================================

function initTheme() {
  const saved = localStorage.getItem('theme');
  setTheme(saved || 'dark');

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// =============================================
// DOM Ready
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initYear();
  initNavbar();
  initMobileNav();
  initHeroAnimation();
  initHoursStatus();
  initFooterHours();
  initMenuLoader();
  initModals();
  initParticles();
  initSpecialDayHighlight();
  initNewsLoader();
});

// =============================================
// Footer Year
// =============================================

function initYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
  const copyright = document.getElementById('footerCopyright');
  if (copyright) {
    const url = GVIZ_CONTACT_URL;
    const open = () => {
      const pwd = window.prompt('Passwort:');
      if (pwd === '39') window.open(url, '_blank', 'noopener,noreferrer');
    };
    copyright.addEventListener('click', open);
    copyright.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  }
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
    if (badge)    badge.textContent = t('hero.badge.' + day);
    if (title)    title.textContent = t('hero.title.' + day);
    if (subtitle) subtitle.textContent = t('hero.subtitle.' + day);
    if (stage)    stage.innerHTML = cfg.animation();
  } else {
    // Default – generic day
    if (badge)    badge.textContent = `${t('hero.badge.default')} ${t('day.' + day)}!`;
    if (title)    title.textContent = t('hero.title');
    if (subtitle) subtitle.textContent = t('hero.subtitle');
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
 * Parses a time value from a Google Sheet cell into a fractional hour number.
 * Handles multiple formats returned by Google Sheets gviz:
 *  - "Date(1899,11,30,11,30,0)" → 11.5  (gviz datetime .v)
 *  - "11:30" or "11:30:00"     → 11.5  (gviz .f or plain text)
 *  - 11 or "11"                → 11    (plain number)
 * Returns null if the value cannot be parsed.
 */
function parseTimeStr(val) {
  if (val == null) return null;
  const str = String(val).trim();
  if (!str) return null;

  // Handle gviz Date(year,month,day,hour,minute,second) format
  const dateMatch = str.match(/^Date\(\d+,\d+,\d+,(\d+),(\d+),(\d+)\)$/);
  if (dateMatch) {
    return parseInt(dateMatch[1], 10) + parseInt(dateMatch[2], 10) / 60;
  }

  // Handle HH:MM or HH:MM:SS
  if (str.includes(':')) {
    const parts = str.split(':');
    return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Formats a fractional hour (possibly > 24 for cross-midnight) as HH:MM.
 * e.g., 11.5 → "11:30", 11.25 → "11:15", 25.5 → "01:30", 3 → "03:00"
 */
function fmtHour(h) {
  const normalized   = h > 24 ? h - 24 : h;
  const totalMinutes = Math.round(normalized * 60);
  const hours        = Math.floor(totalMinutes / 60);
  const minutes      = totalMinutes % 60;
  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

async function initHoursStatus() {
  let openingHours;
  let fetchFailed = false;
  try {
    openingHours = await fetchOpeningHoursFromSheets();
  } catch (err) {
    console.warn('Opening hours could not be loaded from sheet.', err);
    fetchFailed = true;
  }

  if (fetchFailed) {
    // Clear the static fallback rows and show a warning
    const tbody = document.getElementById('hoursTableBody');
    if (tbody) tbody.innerHTML = '';
    const warning = document.getElementById('hoursWarning');
    if (warning) warning.classList.remove('hidden');
    // Show fallback message in Kontakt section
    const todayEl = document.getElementById('todayHours');
    if (todayEl) {
      todayEl.textContent = t('hours.callForHours');
      todayEl.style.color = 'var(--text-muted)';
    }
  } else {
    _lastOpeningHours = openingHours;
    renderHoursTable(openingHours);
    renderHoursStatus(openingHours);
  }
}

/**
 * Fetches opening hours from the "opening-hours" sheet tab.
 * Expected columns: day (mo/di/mi/do/fr/sa/so), open (HH:MM), close (HH:MM).
 * Times may be plain integers ("11") or "HH:MM" strings ("11:30").
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

      // Google Sheets returns time/datetime columns as Date(...) strings in .v
      // but provides a human-readable "HH:MM" in .f – prefer .f over .v
      const openCell  = row.c[1];
      const closeCell = row.c[2];
      // Skip if cells are missing entirely (null row entry)
      if (!openCell && !closeCell) return;

      const open  = parseTimeStr(openCell?.f ?? openCell?.v);
      let   close = parseTimeStr(closeCell?.f ?? closeCell?.v);

      // Skip if times couldn't be parsed, or both are 0 (= closed day, e.g. 00:00–00:00)
      if (open == null || close == null) return;
      if (open === 0 && close === 0) return;

      // Wrap-around: e.g., open=10:00, close=03:00 → close becomes 27
      if (close <= open) close += 24;

      if (!hours[dayIndex]) hours[dayIndex] = [];
      hours[dayIndex].push([open, close]);
    });

  return hours;
}

/**
 * Rebuilds the hours table from fetched data.
 * Renders rows in Mon–Sun order; days with no slots show "Geschlossen".
 */
function renderHoursTable(openingHours) {
  const tbody = document.getElementById('hoursTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const today    = new Date().getDay();
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon … Sun

  dayOrder.forEach(dayIndex => {
    const slots = openingHours[dayIndex];

    const tr = document.createElement('tr');
    tr.className = 'hours-row';
    tr.setAttribute('data-days', String(dayIndex));
    if (dayIndex === today) tr.classList.add('today');

    const uhr = t('hours.uhr');
    const timeText = (slots && slots.length > 0)
      ? slots.map(([o, c]) => `${fmtHour(o)} – ${fmtHour(c)}${uhr ? ' ' + uhr : ''}`).join(' / ')
      : t('hours.closed');

    tr.innerHTML = `
      <td class="hours-day">${t('day.' + dayIndex)}</td>
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
    const uhr = t('hours.uhr');
    if (isOpen) {
      statusEl.textContent = `✅ ${t('hours.openNow')} ${fmtHour(currentSlot[1])}${uhr ? ' ' + uhr : ''}`;
    } else {
      const nextSlot = slots.find(([open]) => adjustedHour < open);
      if (nextSlot) {
        statusEl.textContent = `❌ ${t('hours.closedNow')} ${fmtHour(nextSlot[0])}${uhr ? ' ' + uhr : ''}`;
      } else {
        statusEl.textContent = `❌ ${t('hours.closedGeneral')}`;
      }
    }
  }

  if (todayEl) {
    const uhr = t('hours.uhr');
    const slotsText = slots.length > 0
      ? slots.map(([o, c]) => `${fmtHour(o)} – ${fmtHour(c)}${uhr ? ' ' + uhr : ''}`).join(', ')
      : '';
    todayEl.textContent = `${slotsText} ${isOpen ? t('hours.todayOpen') : t('hours.todayClosed')}`;
    todayEl.style.color = isOpen ? '#4ecdc4' : 'var(--primary)';
  }
}

// =============================================
// Footer – dynamic opening hours
// =============================================

function initFooterHours() {
  const container = document.getElementById('footerHoursList');
  if (!container) return;

  const DAY_ABBR = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const fmtHour  = h => String(h >= 24 ? h - 24 : h).padStart(2, '0') + ':00';

  // Iterate days Mon–Sun (1..6, 0), group consecutive days with identical hours
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const groups   = [];
  let i = 0;
  while (i < dayOrder.length) {
    const [open, close] = OPENING_HOURS[dayOrder[i]] || [10, 25];
    let j = i + 1;
    while (j < dayOrder.length) {
      const [o2, c2] = OPENING_HOURS[dayOrder[j]] || [10, 25];
      if (o2 === open && c2 === close) j++;
      else break;
    }
    groups.push({ days: dayOrder.slice(i, j), open, close });
    i = j;
  }

  container.innerHTML = groups.map(g => {
    const label = g.days.length === 1
      ? DAY_ABBR[g.days[0]]
      : `${DAY_ABBR[g.days[0]]} \u2013 ${DAY_ABBR[g.days[g.days.length - 1]]}`;
    return `<p>${label}: ${fmtHour(g.open)} \u2013 ${fmtHour(g.close)} Uhr</p>`;
  }).join('');
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
    grid.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; text-align:center;">${t('menu.noEntries')}</p>`;
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
  const locale = currentLang === 'en' ? 'en-US' : 'de-DE';
  return Number(price).toLocaleString(locale, { style: 'currency', currency: 'EUR' });
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
// News Banner
// =============================================

async function fetchNewsFromSheets() {
  const res  = await fetch(GVIZ_NEWS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const data    = JSON.parse(jsonStr);

  const rows = data?.table?.rows;
  if (!rows || rows.length === 0) return [];

  return rows
    .filter(row => row.c && row.c[0] && row.c[0].v)
    .map(row => ({
      title: (row.c[0]?.v ?? '').toString().trim(),
      text:  (row.c[1]?.v ?? '').toString().trim(),
    }));
}

async function initNewsLoader() {
  const container = document.getElementById('newsContainer');
  if (!container) return;

  try {
    const items = await fetchNewsFromSheets();
    if (!items.length) return;

    container.innerHTML = '';
    items.forEach(item => {
      const article = document.createElement('article');
      article.className = 'news-item';
      article.innerHTML = `
        <h3 class="news-title">${escapeHtml(item.title)}</h3>
        ${item.text ? `<p class="news-text">${escapeHtml(item.text)}</p>` : ''}
      `;
      container.appendChild(article);
    });

    container.hidden = false;
  } catch (e) {
    // News are optional; log to console for debugging
    console.warn('[News] Could not load news:', e);
  }
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
