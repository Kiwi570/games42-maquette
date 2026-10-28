/* Socle commun aux trois pages : défilement fluide, portail, médias, en-tête,
   mode calme, chrono 60:00, clés cachées, curseur, horaires, transitions. */
import { SITE, HOURS } from './data.js?v=20261028';
import { IMAGES } from './images.js?v=20261028';
import { art, KEY_SVG } from './art.js?v=20261028';
import { createPortal } from './portal.js?v=20261028';
import { Lenis } from './vendor/lenis/index.js';

export const gsap = window.gsap;
export const ScrollTrigger = window.ScrollTrigger;
export const SplitText = window.SplitText;
gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
root.classList.add('js');

/* ---------- Mode calme ---------- */
/* Le stockage peut être bloqué (navigation privée, cadre) : on le résout dans le try. */
const area = (s) => (s === 'session' ? window.sessionStorage : window.localStorage);
const store = {
  get(k, s = 'local') { try { return area(s).getItem(k); } catch { return null; } },
  set(k, v, s = 'local') { try { area(s).setItem(k, v); } catch { /* stockage indisponible */ } },
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saved = store.get('g42-calme');
const params = new URLSearchParams(location.search);
export const calm = params.get('calme') === '1' || saved === '1' || (saved === null && reduced);
if (calm) root.classList.add('calme');
export const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isNarrow = () => window.innerWidth < 900;

/* ---------- Médias : vraie image ou visuel provisoire ---------- */
export function renderMedia(scope = document) {
  scope.querySelectorAll('[data-media]').forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const key = el.dataset.media;
    const meta = IMAGES[key];
    const inner = document.createElement('div');
    inner.className = 'media__inner';
    if (meta) {
      const img = document.createElement('img');
      img.src = `assets/img/${key}.webp`;
      if (meta.sm) {
        img.srcset = `assets/img/${key}-sm.webp 800w, assets/img/${key}.webp ${meta.w}w`;
        img.sizes = el.dataset.sizes || '(max-width: 900px) 92vw, 45vw';
      }
      img.width = meta.w;
      img.height = meta.h;
      img.alt = el.dataset.alt !== undefined ? el.dataset.alt : meta.alt || '';
      img.loading = el.hasAttribute('data-eager') ? 'eager' : 'lazy';
      img.decoding = 'async';
      if (el.dataset.fit) img.style.objectFit = el.dataset.fit;
      if (el.dataset.pos) img.style.objectPosition = el.dataset.pos;
      inner.append(img);
    } else {
      inner.innerHTML = art(el.dataset.world || 'portail');
      el.classList.add('is-ph');
      const tag = document.createElement('span');
      tag.className = 'media__tag';
      tag.textContent = 'Visuel provisoire';
      el.append(tag);
    }
    el.prepend(inner);
  });
}
renderMedia();

/* ---------- Défilement fluide ---------- */
export let lenis = null;
if (!calm) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
/* Certaines cibles vivent dans une section épinglée (couloir horizontal) :
   la page peut fournir la position de défilement exacte qui les montre. */
let anchorResolver = null;
export function setAnchorResolver(fn) { anchorResolver = fn; }
const find = (sel) => { try { return document.querySelector(sel); } catch { return null; } };
export function scrollToTarget(target, { instant = false } = {}) {
  const el = typeof target === 'string' ? find(target) : target;
  if (!el) return;
  const y = anchorResolver?.(el);
  if (y != null) {
    if (lenis) lenis.scrollTo(y, { duration: instant ? 0 : 1.4, immediate: instant, force: true });
    else window.scrollTo(0, y);
  } else if (lenis) lenis.scrollTo(el, { offset: -76, duration: instant ? 0 : 1.4, immediate: instant, force: true });
  else el.scrollIntoView({ behavior: 'auto' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
/* Arrivée sur la page avec une ancre (#monde-sorcier depuis une autre page) */
export function scrollToHash() {
  if (location.hash.length < 2) return;
  const el = find(decodeURIComponent(location.hash));
  if (el) requestAnimationFrame(() => scrollToTarget(el, { instant: true }));
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const el = find(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  closeMenu();
  try { history.replaceState(null, '', a.getAttribute('href')); } catch { /* cadre sans historique */ }
  scrollToTarget(el);
});

/* ---------- Portail ---------- */
const portalEl = document.getElementById('portal');
export const portal = portalEl ? createPortal(portalEl, { calm }) : null;
/* Le fond WebGL se met en pause quand une section claire couvre tout l'écran. */
function pauseUnderLightSections() {
  if (!portal) return;
  const covering = new Set();
  document.querySelectorAll('.sec--lune').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom',
      onToggle(self) { if (self.isActive) covering.add(sec); else covering.delete(sec); portal.hidden = covering.size > 0; },
    });
  });
}
/* Change de monde et d'ambiance. En mode calme, pas d'animation : l'image est redessinée
   une fois, directement avec le bon assombrissement (sinon le texte peut manquer de contraste). */
export function sceneLook(scene, look) {
  if (!portal) return;
  if (calm) { Object.assign(portal.state, look); portal.setScene(scene); portal.render(); return; }
  portal.setScene(scene);
  gsap.to(portal.state, { ...look, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
}
export function trackScenes() {
  pauseUnderLightSections();
  document.querySelectorAll('[data-scene]:not(.porte-monde)').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle(self) {
        if (!self.isActive) return;
        const d = sec.dataset;
        sceneLook(d.scene, { dim: parseFloat(d.dim ?? 1), ring: parseFloat(d.ring ?? 1), swirl: parseFloat(d.swirl ?? 1), dive: 0 });
        const w = sec.dataset.world || sec.closest('[data-world]')?.dataset.world;
        if (w) root.dataset.world = w; else delete root.dataset.world;
      },
    });
  });
}

/* ---------- En-tête, menu mobile ---------- */
const header = document.querySelector('.header');
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
/* Pendant que le menu est ouvert, le reste de la page est inerte (clavier et lecteurs d'écran). */
const behindMenu = () => document.querySelectorAll('main, .footer, .actionbar, .notice');
function setMenu(open, { returnFocus = false } = {}) {
  if (!menu) return;
  menu.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  behindMenu().forEach((el) => { el.inert = open; });
  if (open) { lenis?.stop(); menu.querySelector('a')?.focus(); } else { lenis?.start(); if (returnFocus) burger.focus(); }
}
function closeMenu(opts) {
  if (!menu?.classList.contains('is-open')) return;
  setMenu(false, opts);
}
burger?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open'), { returnFocus: true }));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu({ returnFocus: true }); });
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeMenu()));
if (header) {
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      header.classList.toggle('is-hidden', y > 500 && y > lastY && !menu?.classList.contains('is-open'));
      lastY = y;
    },
  });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}

/* ---------- Bouton mode calme ---------- */
document.querySelectorAll('[data-calm-toggle]').forEach((btn) => {
  btn.setAttribute('aria-pressed', String(calm));
  btn.addEventListener('click', () => {
    store.set('g42-calme', calm ? '0' : '1');
    const url = new URL(location.href);
    url.searchParams.delete('calme');
    location.replace(url.toString());
  });
});

/* ---------- Bandeau saisonnier ---------- */
const parisParts = (date = new Date()) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map((p) => [p.type, p.value]));
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { dow, iso: `${parts.year}-${parts.month}-${parts.day}`, minutes: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10) };
};
const noticeEl = document.querySelector('[data-notice]');
if (noticeEl && HOURS.notice) {
  const now = parisParts();
  if ((!HOURS.notice.from || now.iso >= HOURS.notice.from) && now.iso <= HOURS.notice.until && store.get('g42-notice', 'session') !== '1') {
    noticeEl.querySelector('[data-notice-text]').textContent = HOURS.notice.text;
    noticeEl.hidden = false;
    noticeEl.querySelector('button')?.addEventListener('click', () => { noticeEl.hidden = true; store.set('g42-notice', '1', 'session'); });
  }
}

/* ---------- Horaires et « ouvert maintenant » ---------- */
const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const fmt = (hm) => { const [h, m] = hm.split(':'); return m === '00' ? `${parseInt(h, 10)} h` : `${parseInt(h, 10)} h ${m}`; };
export function openStatus(date = new Date()) {
  const now = parisParts(date);
  const today = HOURS.days.find((d) => d.d === now.dow);
  const hol = HOURS.notice;
  if (hol?.status && (!hol.from || now.iso >= hol.from) && now.iso <= hol.until) {
    /* Vacances : jours d'ouverture connus, horaires à confirmer par le client */
    return hol.openDays?.includes(now.dow)
      ? { state: 'request', text: `${hol.status}, horaires à confirmer` }
      : { state: 'closed', text: `Fermé aujourd’hui. ${hol.status}` };
  }
  if (today.open && now.minutes >= toMin(today.open) && now.minutes < toMin(today.close)) {
    return { state: 'open', text: `Ouvert maintenant, jusqu’à ${fmt(today.close)}` };
  }
  if (today.onRequest) return { state: 'request', text: 'Aujourd’hui : ouverture sur réservation' };
  if (today.open && now.minutes < toMin(today.open)) return { state: 'closed', text: `Fermé, ouvre aujourd’hui à ${fmt(today.open)}` };
  for (let i = 1; i <= 7; i++) {
    const d = HOURS.days.find((x) => x.d === (now.dow + i) % 7);
    if (d.open) return { state: 'closed', text: `Fermé, ouvre ${i === 1 ? 'demain' : d.label.toLowerCase()} à ${fmt(d.open)}` };
  }
  return { state: 'closed', text: 'Fermé' };
}
document.querySelectorAll('[data-open-status]').forEach((el) => {
  const s = openStatus();
  el.classList.toggle('is-open', s.state === 'open');
  el.classList.toggle('is-request', s.state === 'request');
  el.innerHTML = `<i aria-hidden="true"></i><span>${s.text}</span>`;
});
document.querySelectorAll('[data-hours]').forEach((table) => {
  const now = parisParts();
  const body = HOURS.days.map((d) => {
    const val = d.closed ? 'Fermé' : d.onRequest ? 'Sur réservation' : `${fmt(d.open)} à ${fmt(d.close)}`;
    return `<tr${d.d === now.dow ? ' class="is-today"' : ''}><th scope="row">${d.label}</th><td>${val}</td></tr>`;
  }).join('');
  table.innerHTML = `<caption class="sr-only">Horaires hors vacances scolaires</caption><tbody>${body}</tbody>`;
});

/* ---------- Chrono 60:00 ---------- */
/* Grand écran : un fil vertical dans la marge droite, qui ne recouvre jamais le texte.
   Mobile : le chrono rejoint la barre d'actions en bas d'écran (Appeler, Réserver). */
const chronoEls = document.querySelectorAll('#chrono, .actionbar');
if (chronoEls.length) {
  const texts = document.querySelectorAll('[data-chrono-text]');
  const rings = document.querySelectorAll('.chrono__ring');
  const fill = document.querySelector('.chrono__fill');
  const len = 2 * Math.PI * 10;
  rings.forEach((r) => { r.style.strokeDasharray = `${len}`; });
  let lastShown = '';
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const p = self.progress;
      const done = p > 0.995;
      const left = Math.round((1 - p) * 3600);
      const label = done ? 'Mission accomplie' : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      if (label !== lastShown) { texts.forEach((t) => { t.textContent = label; }); lastShown = label; }
      rings.forEach((r) => { r.style.strokeDashoffset = `${len * p}`; });
      if (fill) fill.style.transform = `scaleY(${p})`;
      chronoEls.forEach((c) => c.classList.toggle('is-done', done));
    },
  });
}
/* La barre d'actions mobile s'efface tant que le bouton Réserver de l'ouverture est à l'écran,
   et prend le relais dès qu'il ne l'est plus (au-dessus ou en dessous). */
const actionbar = document.querySelector('.actionbar');
const heroCta = document.querySelector('main > section .btn--book');
if (actionbar) {
  if (heroCta) {
    const st = ScrollTrigger.create({
      trigger: heroCta, start: 'top bottom', end: 'bottom top',
      onToggle(self) { actionbar.classList.toggle('is-on', !self.isActive); },
      onRefresh(self) { actionbar.classList.toggle('is-on', !self.isActive); },
    });
    actionbar.classList.toggle('is-on', !st.isActive);
  } else actionbar.classList.add('is-on');
}

/* ---------- Clés cachées ---------- */
let foundInit = [];
try { foundInit = JSON.parse(store.get('g42-cles', 'session') || '[]'); } catch { /* valeur illisible */ }
const found = new Set(Array.isArray(foundInit) ? foundInit : []);
const keyTools = document.querySelectorAll('.tool--keys .k');
const keyLive = document.getElementById('keys-live');
const keysDialog = document.getElementById('keys-dialog');
const keysCount = document.querySelector('[data-keys-count]');
const updateKeys = () => {
  keyTools.forEach((k, i) => k.classList.toggle('is-found', i < found.size));
  const tool = document.querySelector('.tool--keys');
  if (tool) tool.setAttribute('aria-label', `Clés cachées trouvées : ${found.size} sur 3`);
  if (keysCount) { keysCount.hidden = found.size === 0; keysCount.querySelector('b').textContent = String(found.size); }
};
/* Cible visible du vol de la clé : le compteur d'en-tête, sinon celui de la barre mobile */
const visible = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight ? r : null;
};
document.querySelectorAll('.cle').forEach((btn) => {
  btn.innerHTML = KEY_SVG;
  if (found.has(btn.dataset.key)) btn.classList.add('is-found');
  btn.addEventListener('click', () => {
    if (found.has(btn.dataset.key)) return;
    found.add(btn.dataset.key);
    store.set('g42-cles', JSON.stringify([...found]), 'session');
    const target = keyTools[found.size - 1];
    const a = btn.getBoundingClientRect();
    const fly = btn.cloneNode(true);
    Object.assign(fly.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, margin: 0, zIndex: 130, animation: 'none' });
    document.body.append(fly);
    btn.classList.add('is-found');
    const done = () => { fly.remove(); updateKeys(); if (keyLive) keyLive.textContent = `Clé trouvée : ${found.size} sur 3.`; if (found.size === 3) keysDialog?.showModal(); };
    if (keysCount) keysCount.hidden = false;
    const b = visible(target) || visible(keysCount) || visible(actionbar);
    if (b && !calm) {
      gsap.to(fly, { x: b.left - a.left - 12, y: b.top - a.top - 10, rotate: 360, scale: 0.6, duration: 1.1, ease: 'power3.inOut', onComplete: done });
    } else if (!calm) {
      gsap.to(fly, { y: -80, scale: 1.4, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: done });
    } else done();
  });
});
keysDialog?.querySelector('[data-close]')?.addEventListener('click', () => keysDialog.close());
updateKeys();

/* ---------- Curseur lanterne et boutons magnétiques ---------- */
if (fine && !calm) {
  const cursor = Object.assign(document.createElement('div'), { className: 'cursor' });
  const lantern = Object.assign(document.createElement('div'), { className: 'lantern' });
  document.body.append(lantern, cursor);
  root.classList.add('has-cursor');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
  const lx = gsap.quickTo(lantern, 'x', { duration: 0.9, ease: 'power3' });
  const ly = gsap.quickTo(lantern, 'y', { duration: 0.9, ease: 'power3' });
  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (!shown) { shown = true; gsap.set([cursor, lantern], { x: e.clientX, y: e.clientY }); gsap.to([cursor, lantern], { opacity: 1, duration: 0.4 }); }
    cx(e.clientX); cy(e.clientY); lx(e.clientX); ly(e.clientY);
  }, { passive: true });
  document.addEventListener('pointerover', (e) => { cursor.classList.toggle('is-hover', !!e.target.closest('a, button, summary, label, [role="spinbutton"]')); });
  document.documentElement.addEventListener('pointerleave', () => { shown = false; gsap.to([cursor, lantern], { opacity: 0, duration: 0.3 }); });
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.35); });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
}

/* ---------- Titres vivants : mots qui montent, graisse qui s'affirme ---------- */
export function liveTitles(scope = document) {
  if (calm) return;
  scope.querySelectorAll('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines,words', mask: 'lines', autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          yPercent: 110, fontWeight: 300, duration: 1.1, ease: 'expo.out', stagger: 0.06,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      },
    });
  });
}

/* ---------- Compteurs ---------- */
export function counters(scope = document) {
  scope.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    const out = (v) => { el.textContent = v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
    if (calm) { out(end); return; }
    const o = { v: 0 };
    out(0);
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => out(o.v), scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
}

/* ---------- Révélations d'images en cercle (ouverture de portail) ---------- */
export function portalReveals(scope = document) {
  if (calm) return;
  scope.querySelectorAll('.portal-reveal').forEach((el) => {
    const inner = el.querySelector('.media__inner');
    if (!inner) return;
    gsap.fromTo(inner, { clipPath: 'circle(0% at 50% 62%)', scale: 1.25 }, {
      clipPath: 'circle(75% at 50% 50%)', scale: 1, duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    });
  });
  scope.querySelectorAll('[data-parallax]').forEach((el) => {
    const inner = el.querySelector('.media__inner') || el;
    gsap.fromTo(inner, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- Transition entre pages : un portail qui s'ouvre ---------- */
const veil = document.querySelector('.veil');
if (veil && !calm) {
  if (store.get('g42-veil', 'session') === '1') {
    store.set('g42-veil', '0', 'session');
    gsap.fromTo(veil, { clipPath: 'circle(150% at 50% 50%)' }, { clipPath: 'circle(0% at 50% 50%)', duration: 0.9, ease: 'expo.inOut', delay: 0.05 });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.hash && url.pathname === location.pathname) return;
    e.preventDefault();
    veil.style.setProperty('--vx', `${e.clientX}px`);
    veil.style.setProperty('--vy', `${e.clientY}px`);
    store.set('g42-veil', '1', 'session');
    gsap.fromTo(veil, { clipPath: `circle(0% at ${e.clientX}px ${e.clientY}px)` }, { clipPath: `circle(150% at ${e.clientX}px ${e.clientY}px)`, duration: 0.7, ease: 'expo.in', onComplete: () => { location.href = url.href; } });
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(veil, { clipPath: 'circle(0% at 50% 50%)' }); });
}

/* ---------- Divers ---------- */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
document.querySelectorAll('[data-phone]').forEach((el) => { el.href = SITE.phoneHref; });

/* Typographie française : espace insécable avant ? ! ; et : */
export function frenchSpaces(scope = document.body) {
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !n.parentElement.closest('script, style') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const re = /(\S) ([?!;:])(?=\s|$|[»)])/g;
  /* Un nombre ne se sépare pas de son unité (14 h, 27 €, 8 ans, 15 h 30, 06 31 56 40 24) */
  const units = /(\d) (?=(?:h|min|ans?|€|km|g|%|mois|joueurs?|enfants?|coffres?|adultes|élèves|personnes)(?![\p{L}\p{N}’]))/gu;
  const hm = /(\d[\s\u00a0]h) (?=\d)/g;
  const tel = /(\d\d) (?=\d\d(?!\d))/g;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    let v = n.nodeValue;
    if (!/[\d?!;:]/.test(v)) continue;
    v = v.replace(re, (m, a, b) => `${a}${b === ':' ? ' ' : ' '}${b}`)
      .replace(units, '$1 ').replace(hm, '$1 ').replace(tel, '$1 ');
    if (v !== n.nodeValue) n.nodeValue = v;
  }
}
frenchSpaces();

export function ready(fn) {
  const go = () => { fn(); ScrollTrigger.refresh(); };
  if (document.fonts?.ready) document.fonts.ready.then(go); else go();
}
