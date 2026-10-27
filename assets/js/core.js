/* Socle commun aux trois pages : défilement fluide, portail, médias, en-tête,
   mode calme, chrono 60:00, clés cachées, curseur, horaires, transitions. */
import { SITE, HOURS } from './data.js';
import { IMAGES } from './images.js';
import { art, KEY_SVG } from './art.js';
import { createPortal } from './portal.js';
import { Lenis } from './vendor/lenis/index.js';

export const gsap = window.gsap;
export const ScrollTrigger = window.ScrollTrigger;
export const SplitText = window.SplitText;
gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
root.classList.add('js');

/* ---------- Mode calme ---------- */
const store = {
  get(k, s = localStorage) { try { return s.getItem(k); } catch { return null; } },
  set(k, v, s = localStorage) { try { s.setItem(k, v); } catch { /* stockage indisponible */ } },
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
export function scrollToTarget(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -76, duration: 1.4 });
  else el.scrollIntoView({ behavior: 'auto' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const el = document.querySelector(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  closeMenu();
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
export function trackScenes() {
  pauseUnderLightSections();
  document.querySelectorAll('[data-scene]:not(.porte-monde)').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle(self) {
        if (!self.isActive) return;
        portal?.setScene(sec.dataset.scene);
        const w = sec.dataset.world || sec.closest('[data-world]')?.dataset.world;
        if (w) root.dataset.world = w; else delete root.dataset.world;
        if (portal) {
          const d = sec.dataset;
          gsap.to(portal.state, { dim: parseFloat(d.dim ?? 1), ring: parseFloat(d.ring ?? 1), swirl: parseFloat(d.swirl ?? 1), dive: 0, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
        }
      },
    });
  });
}

/* ---------- En-tête, menu mobile ---------- */
const header = document.querySelector('.header');
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
function closeMenu() {
  if (!menu?.classList.contains('is-open')) return;
  menu.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  lenis?.start();
}
burger?.addEventListener('click', () => {
  const open = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  if (open) { lenis?.stop(); menu.querySelector('a')?.focus(); } else lenis?.start();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
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
  if (now.iso <= HOURS.notice.until && store.get('g42-notice', sessionStorage) !== '1') {
    noticeEl.querySelector('[data-notice-text]').textContent = HOURS.notice.text;
    noticeEl.hidden = false;
    noticeEl.querySelector('button')?.addEventListener('click', () => { noticeEl.hidden = true; store.set('g42-notice', '1', sessionStorage); });
  }
}

/* ---------- Horaires et « ouvert maintenant » ---------- */
const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const fmt = (hm) => { const [h, m] = hm.split(':'); return m === '00' ? `${parseInt(h, 10)} h` : `${parseInt(h, 10)} h ${m}`; };
export function openStatus(date = new Date()) {
  const now = parisParts(date);
  const today = HOURS.days.find((d) => d.d === now.dow);
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
const chrono = document.getElementById('chrono');
if (chrono) {
  const txt = chrono.querySelector('[data-chrono-text]');
  const ring = chrono.querySelector('.chrono__ring');
  const len = 2 * Math.PI * 10;
  ring.style.strokeDasharray = `${len}`;
  let lastShown = '';
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const p = self.progress;
      const left = Math.round((1 - p) * 3600);
      const label = p > 0.995 ? 'Mission accomplie' : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      if (label !== lastShown) { txt.textContent = label; lastShown = label; }
      ring.style.strokeDashoffset = `${len * p}`;
      chrono.classList.toggle('is-done', p > 0.995);
    },
  });
}

/* ---------- Clés cachées ---------- */
const found = new Set(JSON.parse(store.get('g42-cles', sessionStorage) || '[]'));
const keyTools = document.querySelectorAll('.tool--keys .k');
const keyLive = document.getElementById('keys-live');
const keysDialog = document.getElementById('keys-dialog');
const updateKeys = () => {
  keyTools.forEach((k, i) => k.classList.toggle('is-found', i < found.size));
  const tool = document.querySelector('.tool--keys');
  if (tool) tool.setAttribute('aria-label', `Clés cachées trouvées : ${found.size} sur 3`);
};
document.querySelectorAll('.cle').forEach((btn) => {
  btn.innerHTML = KEY_SVG;
  if (found.has(btn.dataset.key)) btn.classList.add('is-found');
  btn.addEventListener('click', () => {
    if (found.has(btn.dataset.key)) return;
    found.add(btn.dataset.key);
    store.set('g42-cles', JSON.stringify([...found]), sessionStorage);
    const target = keyTools[found.size - 1];
    const a = btn.getBoundingClientRect();
    const fly = btn.cloneNode(true);
    Object.assign(fly.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, margin: 0, zIndex: 130, animation: 'none' });
    document.body.append(fly);
    btn.classList.add('is-found');
    const done = () => { fly.remove(); updateKeys(); if (keyLive) keyLive.textContent = `Clé trouvée : ${found.size} sur 3.`; if (found.size === 3) keysDialog?.showModal(); };
    if (target && !calm) {
      const b = target.getBoundingClientRect();
      gsap.to(fly, { x: b.left - a.left - 12, y: b.top - a.top - 10, rotate: 360, scale: 0.6, duration: 1.1, ease: 'power3.inOut', onComplete: done });
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
  if (store.get('g42-veil', sessionStorage) === '1') {
    store.set('g42-veil', '0', sessionStorage);
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
    store.set('g42-veil', '1', sessionStorage);
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
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (re.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(re, (m, a, b) => `${a}${b === ':' ? '\u00a0' : '\u202f'}${b}`);
    re.lastIndex = 0;
  }
}
frenchSpaces();

export function ready(fn) {
  const go = () => { fn(); ScrollTrigger.refresh(); };
  if (document.fonts?.ready) document.fonts.ready.then(go); else go();
}
