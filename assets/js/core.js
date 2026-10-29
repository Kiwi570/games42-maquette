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
/* Mobile : la barre d'adresse qui apparaît ou disparaît ne doit pas recalculer les scènes */
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
root.classList.add('js');
/* Arrivée depuis une autre page par le voile (posé par le script d'amorce) */
export const viaVeil = root.classList.contains('veil-in');
/* Délai d'entrée du héro : il démarre pendant que le voile s'ouvre, pas dessous */
export const heroDelay = viaVeil ? 0.4 : 0.15;

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

/* ---------- Adresses propres sur l'hébergement final ---------- */
/* Vercel sert /anniversaire et redirige /anniversaire.html : on évite ce détour à chaque clic. */
const cleanHost = /\.vercel\.app$|games42\.fr$/.test(location.hostname);
const cleanHref = (a) => {
  const h = a.getAttribute('href');
  if (cleanHost && h && /^(index|machine-a-remonter-le-temps|anniversaire)\.html(#|$)/.test(h)) a.setAttribute('href', h.replace(/^index\.html/, '/').replace(/\.html/, ''));
};
document.querySelectorAll('a[href]').forEach(cleanHref);
/* Liens créés plus tard (couloir, résultats) : nettoyés au moment du clic, avant la navigation */
document.addEventListener('click', (e) => { const a = e.target.closest?.('a[href]'); if (a) cleanHref(a); }, true);

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
  flushRefresh(); // positions à jour avant de viser
  lenis?.resize(); // la hauteur a pu changer (scènes épinglées) : sinon la cible serait tronquée
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
  if (!el) return;
  requestAnimationFrame(() => { scrollToTarget(el, { instant: true }); ScrollTrigger.update(); sceneChanged(); });
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
if (params.has('debug')) window.__g42portal = portal; // sondes de test uniquement
/* Le monde de la première section se charge tout de suite, sans attendre les polices */
const firstScene = document.querySelector('main [data-scene]');
if (portal && firstScene) portal.setScene(firstScene.dataset.scene, true);
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
let lookLocked = false;
/* Pendant l'ouverture orchestrée, l'intro pilote seule l'ambiance du portail. */
export function lockLook(v) { lookLocked = v; }
export function sceneLook(scene, look) {
  if (!portal) return;
  if (calm) { Object.assign(portal.state, look); portal.setScene(scene); portal.render(); return; }
  portal.setScene(scene);
  if (!lookLocked) gsap.to(portal.state, { ...look, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
}
/* Choix de la scène par position, pas par ordre d'événements : lors d'un saut (lien d'ancre,
   menu), plusieurs déclencheurs basculent dans la même image ; on applique ensuite une seule fois
   la scène réellement à l'écran. */
const sceneEntries = [];
let sceneRaf = 0;
let currentEntry = null;
/* when : condition supplémentaire (ex. un monde du couloir ne compte que pendant que le couloir est épinglé) */
export function registerScene(st, apply, when = null) { sceneEntries.push({ st, apply, when }); }
export function sceneChanged() {
  if (sceneRaf) return;
  sceneRaf = requestAnimationFrame(() => {
    sceneRaf = 0;
    const e = sceneEntries.find((x) => x.st.isActive && x.st.enabled !== false && (!x.when || x.when()));
    if (e && e !== currentEntry) { currentEntry = e; e.apply(); }
  });
}
export function trackScenes() {
  pauseUnderLightSections();
  document.querySelectorAll('[data-scene]:not(.porte-monde)').forEach((sec) => {
    const st = ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: sceneChanged });
    registerScene(st, () => {
      const d = sec.dataset;
      const look = { dim: parseFloat(d.dim ?? 1), ring: parseFloat(d.ring ?? 1), swirl: parseFloat(d.swirl ?? 1) };
      /* La plongée de l'ouverture est pilotée par le défilement (data-dive="scrub") : on n'y touche pas. */
      if (d.dive !== 'scrub') look.dive = parseFloat(d.dive ?? 0);
      sceneLook(d.scene, look);
      const w = d.world; // pas de closest() : il remonterait jusqu'à <html>, qui porte le monde courant
      if (w) root.dataset.world = w; else delete root.dataset.world;
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
  if (open) {
    const b = burger.getBoundingClientRect();
    const hb = header ? header.getBoundingClientRect().bottom : 72;
    menu.style.setProperty('--mx', `${Math.round(b.left + b.width / 2)}px`);
    menu.style.setProperty('--my', `${Math.round(b.top + b.height / 2)}px`);
    menu.style.setProperty('--mt', `${Math.round(Math.max(hb, 0) + 24)}px`);
  }
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
  /* L'en-tête se cache en descendant, revient après une vraie remontée (24 px), et reste caché
     pendant les scènes épinglées (couloir, horloge, époques) pour ne jamais recouvrir leur contenu. */
  let lastY = 0, up = 0, pins = [];
  ScrollTrigger.addEventListener('refresh', () => { pins = ScrollTrigger.getAll().filter((st) => st.pin); });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      const d = y - lastY;
      lastY = y;
      if (menu?.classList.contains('is-open')) return;
      const pinned = pins.some((st) => st.isActive);
      if (pinned || (y > 500 && d > 0)) { up = 0; header.classList.add('is-hidden'); return; }
      if (d < 0) up -= d;
      if (y <= 500 || up > 24) header.classList.remove('is-hidden');
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
    noticeEl.querySelector('button')?.addEventListener('click', () => {
      store.set('g42-notice', '1', 'session');
      if (calm) { noticeEl.hidden = true; return; }
      gsap.to(noticeEl, { height: 0, paddingTop: 0, paddingBottom: 0, opacity: 0, duration: 0.45, ease: 'power2.inOut', onComplete: () => { noticeEl.hidden = true; gsap.set(noticeEl, { clearProps: 'all' }); } });
    });
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
  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const drag = !!t.closest?.('[role="spinbutton"]');
    cursor.classList.toggle('is-drag', drag);
    cursor.classList.toggle('is-hover', !drag && !!t.closest?.('a, button, summary, label, [role="tab"]'));
    const light = !!t.closest?.('.sec--lune');
    lantern.classList.toggle('is-dim', light || !!t.closest?.('.footer, .menu'));
    cursor.classList.toggle('on-light', light);
  });
  document.documentElement.addEventListener('pointerleave', () => { shown = false; gsap.to([cursor, lantern], { opacity: 0, duration: 0.3 }); });
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.35); });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
}

/* ---------- Titres vivants : mots qui montent, graisse qui s'affirme ---------- */
/* Les masques de ligne coupent les jambages (j, p, q) : on leur donne de la marge en bas. */
export function padMasks(split) {
  (split.masks || []).forEach((m) => { m.style.paddingBottom = '0.18em'; m.style.marginBottom = '-0.18em'; });
}
export function liveTitles(scope = document) {
  if (calm) { root.classList.add('titles-ready'); return; }
  scope.querySelectorAll('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines,words', mask: 'lines' });
    padMasks(split);
    gsap.from(split.words, {
      yPercent: 125, duration: 1.1, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onComplete: () => split.revert(), // retour au texte d'origine : plus de découpe, plus de masque
    });
  });
  root.classList.add('titles-ready');
}
/* L'ouverture de page est prête : on lève le masque posé dès le premier affichage. */
export function heroReady() { root.classList.add('hero-ready'); }

/* ---------- Compteurs ---------- */
export function counters(scope = document) {
  scope.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    const nf = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    let shownTxt = '';
    // Le texte n'est réécrit que lorsqu'il change (moins de recalculs pour les grands chiffres)
    const out = (v) => { const t = nf.format(v); if (t !== shownTxt) { el.textContent = t; shownTxt = t; } };
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
  if (root.classList.contains('veil-in') || store.get('g42-veil', 'session') === '1') {
    store.set('g42-veil', '0', 'session');
    const c = store.get('g42-veil-c', 'session');
    if (c) veil.style.background = c;
    // Le vrai voile prend le relais du cache posé par le script d'amorce, dans la même image
    gsap.set(veil, { clipPath: 'circle(150% at 50% 50%)' });
    root.classList.remove('veil-in');
    gsap.to(veil, { clipPath: 'circle(0% at 50% 50%)', duration: 0.9, ease: 'expo.inOut', delay: 0.08, onComplete: () => { veil.style.background = ''; } });
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
    store.set('g42-veil-c', getComputedStyle(veil).backgroundColor, 'session');
    gsap.fromTo(veil, { clipPath: `circle(0% at ${e.clientX}px ${e.clientY}px)` }, { clipPath: `circle(150% at ${e.clientX}px ${e.clientY}px)`, duration: 0.7, ease: 'expo.in', onComplete: () => { location.href = url.href; } });
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { root.classList.remove('veil-in'); gsap.set(veil, { clipPath: 'circle(0% at 50% 50%)' }); } });
} else root.classList.remove('veil-in');

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

/* Quand la hauteur de la page change (résultats du cadenas, FAQ, onglets, bandeau fermé),
   les positions des scènes épinglées doivent être recalculées, sinon elles se déclenchent trop tôt. */
let lastH = 0;
let rto = null;
let refreshPending = false;
/* Avant de calculer une position (ancre, aimantation), on applique un rafraîchissement en attente. */
export function flushRefresh() {
  if (!refreshPending) return;
  clearTimeout(rto);
  refreshPending = false;
  ScrollTrigger.refresh();
  lastH = document.documentElement.scrollHeight;
}
function watchHeight() {
  const main = document.querySelector('main');
  if (!main || !('ResizeObserver' in window)) return;
  lastH = document.documentElement.scrollHeight;
  const run = () => {
    if (lenis?.isScrolling) { rto = setTimeout(run, 220); return; } // on attend l'arrêt du défilement
    refreshPending = false;
    if (Math.abs(document.documentElement.scrollHeight - lastH) < 24) return; // changement passager, déjà résorbé
    ScrollTrigger.refresh();
    lastH = document.documentElement.scrollHeight;
  };
  new ResizeObserver(() => {
    if (Math.abs(document.documentElement.scrollHeight - lastH) < 24) return; // arrondis ignorés
    clearTimeout(rto);
    refreshPending = true;
    rto = setTimeout(run, 160);
  }).observe(main);
}
/* Démarrage en deux temps, pour des animations d'ouverture parfaitement fluides :
   1. polices chargées, puis mise en place des scènes et calcul des positions (travail lourd) ;
   2. première image du fond affichée, deux images d'attente, puis seulement l'animation d'ouverture.
   Aucune animation ne tourne pendant le chargement des polices ou l'envoi des textures. */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
export function ready(fn, after) {
  // Les deux familles sont demandées explicitement : on ne démarre pas avec une police de secours
  const fonts = document.fonts?.load
    ? Promise.race([Promise.all([document.fonts.load('640 1em Fraunces'), document.fonts.load('400 1em Figtree')]).then(() => document.fonts.ready), wait(1800)])
    : Promise.resolve();
  fonts.then(async () => {
    // Les scènes épinglées passent en premier : les positions des sections suivantes en tiennent compte
    fn();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    watchHeight();
    sceneChanged();
    await Promise.race([portal?.ready || Promise.resolve(), wait(1500)]);
    await frame(); await frame();
    after?.();
    // Les autres mondes de la page se préparent ensuite, pendant les temps morts
    setTimeout(() => portal?.preload?.([...document.querySelectorAll('[data-scene]')].map((e) => e.dataset.scene)), 1200);
  });
}

/* ---------- FAQ : ouverture et fermeture en douceur ---------- */
document.querySelectorAll('.faq details').forEach((d) => {
  const sum = d.querySelector('summary');
  const ans = d.querySelector('.answer');
  if (!sum || !ans) return;
  sum.addEventListener('click', (e) => {
    if (calm) return;
    e.preventDefault();
    gsap.killTweensOf(ans);
    if (d.open && !d.classList.contains('is-closing')) {
      d.classList.add('is-closing');
      gsap.to(ans, { height: 0, paddingBottom: 0, opacity: 0, duration: 0.35, ease: 'power2.inOut', onComplete: () => { d.open = false; d.classList.remove('is-closing'); gsap.set(ans, { clearProps: 'height,paddingBottom,opacity' }); } });
    } else {
      d.classList.remove('is-closing');
      d.open = true;
      gsap.fromTo(ans, { height: 0, paddingBottom: 0, opacity: 0 }, { height: 'auto', paddingBottom: '1.2rem', opacity: 1, duration: 0.45, ease: 'power3.out', onComplete: () => gsap.set(ans, { clearProps: 'height,paddingBottom,opacity' }) });
    }
  });
});
