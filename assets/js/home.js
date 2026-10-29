/* Page d'accueil : ouverture, cadenas à molettes, couloir des portails,
   coffre, porte, frise, carte, bon cadeau. */
import { gsap, ScrollTrigger, SplitText, calm, fine, portal, lenis, renderMedia, trackScenes, liveTitles, counters, portalReveals, ready, scrollToTarget, scrollToHash, setAnchorResolver, frenchSpaces, sceneLook, lockLook, padMasks, heroReady, viaVeil, registerScene, sceneChanged, flushRefresh } from './core.js';
import { MISSIONS, PRICES, SITE } from './data.js';

const SCENE_OF = { sorcier: 'sorcier', temps: 'temps', pirate: 'pirate', cirque: 'cirque', serpent: 'serpent' };
const euro = (v) => `${Number.isInteger(v) ? v : v.toFixed(2).replace('.', ',')} €`;

/* ---------- Couloir : construit depuis data.js ---------- */
const track = document.querySelector('[data-track]');
track.innerHTML = MISSIONS.map((m) => `
  <article class="porte-monde" id="monde-${m.id}" data-world="${m.world}" data-scene="${SCENE_OF[m.world]}" data-dim="0.42" data-ring="0.3" data-swirl="0.8" aria-labelledby="t-${m.id}">
    <div class="porte-monde__media">
      <div class="glow" aria-hidden="true"></div>
      <figure class="media arch ratio-45 portal-reveal" data-media="${m.image}" data-world="${m.world}" data-sizes="(max-width: 900px) 92vw, 34vw"></figure>
    </div>
    <div class="porte-monde__copy">
      <span class="porte-monde__kind">${m.kind}</span>
      <h3 id="t-${m.id}">${m.name}</h3>
      <p>${m.pitch}</p>
      <ul class="facts">${m.facts.map((f) => `<li>${f}</li>`).join('')}</ul>
      <p class="small">${m.plus}</p>
      <p class="price-line">${m.priceLine}${m.flag ? `<span class="flag">${m.flag}</span>` : ''}</p>
      <div class="actions">
        <a class="btn btn--book" href="${SITE.booking}" data-magnetic>Réserver</a>
        ${m.url ? `<a class="btn btn--ghost" href="${m.url}">Découvrir la salle</a>` : '<a class="btn btn--ghost" href="#trouver">Calculer mon prix</a>'}
      </div>
    </div>
  </article>`).join('');
renderMedia(track);
frenchSpaces(track);

/* Pastilles du couloir : une par monde, cliquables (grand écran) */
const progress = document.querySelector('[data-progress]');
progress.innerHTML = MISSIONS.map((m) => `<button type="button" data-go="monde-${m.id}" title="${m.name}"><span><i></i></span><span class="sr-only">${m.name}</span></button>`).join('');
progress.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) scrollToTarget(document.getElementById(b.dataset.go));
});

/* ---------- Cadenas à molettes ---------- */
const TEAMS = [
  { v: 'enfants', t: 'Enfants' }, { v: 'ados', t: 'Ados' }, { v: 'famille', t: 'Famille' }, { v: 'adultes', t: 'Adultes' },
];
const AGES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 18].map((v) => ({ v, t: v === 13 ? '13-17 ans' : v === 18 ? '18 ans et +' : `${v} ans` }));
const PLAYERS = Array.from({ length: 17 }, (_, i) => ({ v: i + 2, t: String(i + 2), say: `${i + 2} joueurs` }));

function makeWheel(root, items, start, onChange) {
  const win = root.querySelector('.wheel__window');
  const drum = root.querySelector('.wheel__drum');
  const A = 24;
  const H = 44;
  const R = H / (2 * Math.tan((A / 2) * Math.PI / 180));
  drum.innerHTML = items.map((it, i) => `<div class="wheel__item" style="transform: rotateX(${-i * A}deg) translateZ(${R.toFixed(1)}px)">${it.t}</div>`).join('');
  const els = [...drum.children];
  win.setAttribute('aria-valuemin', '0');
  win.setAttribute('aria-valuemax', String(items.length - 1));
  win.setAttribute('data-lenis-prevent', '');
  const st = { rot: start * A, index: start };
  const paint = () => {
    drum.style.transform = `translateZ(${-R.toFixed(1)}px) rotateX(${st.rot}deg)`;
    const f = st.rot / A;
    els.forEach((el, i) => {
      const d = Math.abs(i - f);
      el.style.opacity = d > 2.6 ? 0 : String(1 - d * 0.32);
      el.style.visibility = d > 2.8 ? 'hidden' : 'visible';
      el.style.color = d < 0.5 ? 'var(--lune)' : 'var(--lune-3)';
    });
  };
  const set = (i, animate = true) => {
    const idx = Math.max(0, Math.min(items.length - 1, i));
    const changed = idx !== st.index;
    st.index = idx;
    win.setAttribute('aria-valuenow', String(idx));
    win.setAttribute('aria-valuetext', items[idx].say || items[idx].t);
    if (animate && !calm) gsap.to(st, { rot: idx * A, duration: 0.6, ease: 'back.out(1.6)', onUpdate: paint, overwrite: true });
    else { st.rot = idx * A; paint(); }
    if (changed) onChange?.(items[idx].v);
  };
  root.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => set(st.index + Number(b.dataset.dir))));
  win.addEventListener('keydown', (e) => {
    const map = { ArrowUp: -1, ArrowDown: 1, PageUp: -3, PageDown: 3 };
    if (e.key in map) { e.preventDefault(); set(st.index + map[e.key]); }
    if (e.key === 'Home') { e.preventDefault(); set(0); }
    if (e.key === 'End') { e.preventDefault(); set(items.length - 1); }
  });
  let acc = 0;
  win.addEventListener('wheel', (e) => {
    e.preventDefault();
    acc += e.deltaY;
    if (Math.abs(acc) > 40) { set(st.index + Math.sign(acc)); acc = 0; }
  }, { passive: false });
  let drag = null;
  win.addEventListener('pointerdown', (e) => { drag = { y: e.clientY, rot: st.rot }; win.setPointerCapture(e.pointerId); gsap.killTweensOf(st); });
  win.addEventListener('pointermove', (e) => {
    if (!drag) return;
    st.rot = Math.max(-A * 0.4, Math.min((items.length - 1 + 0.4) * A, drag.rot + (drag.y - e.clientY) * 0.55));
    paint();
  });
  const end = () => { if (!drag) return; drag = null; set(Math.round(st.rot / A)); };
  win.addEventListener('pointerup', end);
  win.addEventListener('pointercancel', end);
  set(start, false);
  return { set, get value() { return items[st.index].v; }, indexOf: (v) => items.findIndex((it) => it.v === v) };
}

const lockEl = document.querySelector('[data-lock]');
const resultsEl = document.getElementById('results');
let opened = false;
let rendered = false;
const wTeam = makeWheel(lockEl.querySelector('[data-wheel="team"]'), TEAMS, 2, (v) => {
  const age = wAge.value;
  if (v === 'adultes' && age < 18) wAge.set(wAge.indexOf(18));
  if (v === 'ados' && (age < 12 || age > 13)) wAge.set(wAge.indexOf(13));
  if (v === 'enfants' && age > 12) wAge.set(wAge.indexOf(9));
  if (opened) render();
});
const wAge = makeWheel(lockEl.querySelector('[data-wheel="age"]'), AGES, 2, () => { if (opened) render(); });
const wPlayers = makeWheel(lockEl.querySelector('[data-wheel="players"]'), PLAYERS, 3, () => { if (opened) render(); });

/* Règles relevées sur le site actuel : âges, tailles d'équipe, grilles de prix. */
export function suggest(team, age, n) {
  const out = [];
  const m = Object.fromEntries(MISSIONS.map((x) => [x.id, x]));
  const kids = team === 'enfants' || team === 'ados';
  const per = (unit, count, label = 'joueur') => (unit ? { line: `${euro(unit)} par ${label}`, total: `soit ${euro(unit * count)} pour ${count} ${label}s` } : null);

  if (age <= 8 && age >= 5 && (team === 'enfants' || team === 'famille')) {
    const unit = PRICES.bozo(n);
    out.push({ m: m.bozo, why: 'De 5 à 8 ans, avec au moins un parent qui joue. 1 h de jeu et 45 min de goûter.', price: per(unit, n, 'enfant'), note: n < 4 ? '4 enfants minimum.' : n > 6 ? 'Jusqu’à 6 enfants par coffre : appelez-nous pour un plus grand groupe.' : '', fit: n >= 4 && n <= 6 });
  }
  if ((team === 'adultes' && n >= 3) || (team === 'famille' && age >= 7) || (kids && age >= 8)) {
    const max = team === 'adultes' ? 6 : 8;
    const unit = PRICES.sorcier(n);
    const notes = [];
    if (kids && age === 8) notes.push('Dès 9 ans conseillé : à 8 ans, le niveau est ajusté.');
    if (n < 3 || (kids && n < 4)) notes.push(kids ? '4 enfants minimum.' : '3 joueurs minimum.');
    if (n > max) notes.push(team === 'adultes' ? 'Pour les adultes, 6 joueurs maximum conseillés.' : '8 joueurs maximum.');
    if (n === 3) notes.push('Tarif à 3 joueurs à confirmer.');
    out.push({ m: m.sorcier, why: kids ? 'Dès 9 ans, de 4 à 8 joueurs, avec le maître des apprentis dans la salle.' : team === 'famille' ? 'En famille dès 7 ans, de 3 à 8 joueurs, deux niveaux au choix.' : 'De 3 à 6 adultes, difficulté 7/10.', price: per(unit, n), note: notes.join(' '), fit: n >= (kids ? 4 : 3) && n <= max });
  }
  if (team === 'enfants' && age >= 8 && n >= 4 && n <= 8) {
    out.push({ m: { ...m.sorcier, name: 'Le mercredi anniversaire', image: 'baguette-magique', url: 'anniversaire.html' }, why: 'Escape game L’Apprenti Sorcier, atelier baguette magique, goûter et diplôme : environ 2 h, le mercredi.', price: per(PRICES.mercredi, n, 'enfant'), note: 'Un adulte présent dans la salle, gratuit.', fit: true });
  }
  if ((team === 'famille' && age >= 7) || (kids && age >= 9) || team === 'adultes') {
    const unit = PRICES.machine(n);
    out.push({ m: m.machine, why: '60 min, de 3 à 6 joueurs. Nouvelle salle, trois époques à traverser.', price: per(unit, n), note: n > 6 ? 'Jusqu’à 6 joueurs par partie.' : n < 3 ? '3 joueurs minimum.' : '', fit: n >= 3 && n <= 6 });
  }
  if ((kids || team === 'famille') && age >= 8) {
    const unit = PRICES.pirateGouter(n);
    const ados = team === 'ados' || age >= 13;
    out.push({ m: m.pirate, why: `${ados ? 'Mode ados, difficulté 7/10' : 'Mode enfants dès 9 ans, difficulté 5/10'}. 1 h de jeu puis un goûter en salle privatisée.`, price: per(unit, n), note: n < 4 ? '4 joueurs minimum.' : n > 12 ? 'De 13 à 18 joueurs en privatisant nos salles : tarif à confirmer.' : age === 8 ? 'À 8 ans, le niveau est ajusté.' : '', fit: n >= 4 && n <= 12 });
  }
  if (team === 'adultes') {
    const unit = PRICES.pirateApero(n);
    out.push({ m: { ...m.pirate, name: 'L’apéritif du Pirate' }, why: '1 h de jeu puis 1 h d’apéritif, de 4 à 18 joueurs. Idéal pour un EVG, un EVJF ou entre collègues.', price: per(unit, n), note: n < 4 ? '4 joueurs minimum.' : n > 18 ? '18 joueurs maximum.' : '', fit: n >= 4 && n <= 18 });
  }
  if (age >= 12 && team !== 'enfants') {
    const boxes = Math.ceil(n / 6);
    out.push({ m: m.serpent, why: 'Coffre à emporter chez vous, de 3 à 6 joueurs par coffre, difficulté adultes 9/10.', price: { line: `${euro(PRICES.serpentLocation)} le coffre`, total: boxes > 1 ? `soit ${euro(PRICES.serpentLocation * boxes)} pour ${boxes} coffres` : 'caution de 300 € au retrait' }, note: n < 3 ? '3 joueurs minimum.' : '', fit: n >= 3 });
  }
  return out.sort((a, b) => Number(b.fit) - Number(a.fit));
}

const TEAM_LABEL = { enfants: 'enfants', ados: 'ados', famille: 'joueurs en famille', adultes: 'adultes' };
function render() {
  const team = wTeam.value, age = wAge.value, n = wPlayers.value;
  const list = suggest(team, age, n);
  const ageTxt = age === 18 ? 'adultes' : age === 13 ? 'dès 13 ans' : `le plus jeune a ${age} ans`;
  resultsEl.innerHTML = `
    <div class="results__head"><h3 style="margin:0">${list.length ? `${list.length} mission${list.length > 1 ? 's' : ''} pour ${n} ${TEAM_LABEL[team]}` : 'Aucune mission exacte'}</h3><p class="small">${ageTxt}. Tarifs TTC relevés sur le site actuel.</p></div>
    ${list.length ? `<div class="results__list">${list.map((r) => `
      <article class="result" data-world="${r.m.world}">
        <figure class="media ratio-11" data-media="${r.m.image}" data-world="${r.m.world}" data-alt="" data-sizes="96px"></figure>
        <div>
          <h3>${r.m.name}</h3>
          <p class="result__why">${r.why}</p>
          <p class="result__price">${r.price ? `${r.price.line}<span class="total">${r.price.total}</span>` : '<span class="tbd">Tarif à compléter</span>'}</p>
          ${r.note ? `<p class="result__note">${r.note}</p>` : ''}
          <div class="actions">
            <a class="btn btn--book btn--sm" href="${SITE.booking}">Réserver</a>
            <a class="btn btn--ghost btn--sm" href="${r.m.url || `#monde-${r.m.id}`}">Voir la mission</a>
          </div>
        </div>
      </article>`).join('')}</div>`
    : `<p class="results__empty">Aucune de nos missions ne correspond exactement à ce réglage. Appelez-nous au <a href="${SITE.phoneHref}">${SITE.phone}</a> : nous adaptons souvent les formules.</p>`}`;
  renderMedia(resultsEl);
  frenchSpaces(resultsEl);
  if (calm) return;
  if (!rendered) gsap.from(resultsEl.querySelectorAll('.result, .results__empty'), { y: 40, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
  else gsap.fromTo(resultsEl.querySelectorAll('.result, .results__empty'), { opacity: 0.4 }, { opacity: 1, duration: 0.35, stagger: 0.03, ease: 'power1.out' });
  rendered = true;
}

function openLock() {
  const shackle = lockEl.querySelector('.lock__shackle path');
  const first = !opened;
  opened = true;
  render();
  if (!calm && first) {
    gsap.timeline()
      .to(shackle, { y: -16, duration: 0.25, ease: 'power2.out' })
      .to(shackle, { rotation: -14, transformOrigin: '85% 100%', duration: 0.5, ease: 'back.out(2)' })
      .fromTo(lockEl, { boxShadow: '0 0 0 0 rgba(142,92,255,0)' }, { boxShadow: '0 0 0 10px rgba(142,92,255,.25), 0 40px 80px rgba(8,5,20,.5)', duration: 0.4, yoyo: true, repeat: 1 }, 0.2);
  }
  lockEl.querySelector('[data-open]').textContent = 'Mettre à jour';
  if (first) setTimeout(() => scrollToTarget(resultsEl), calm ? 0 : 450);
}
lockEl.querySelector('[data-open]').addEventListener('click', openLock);

const PRESETS = { enfants: ['enfants', 9, 6], famille: ['famille', 7, 5], adultes: ['adultes', 18, 6] };
document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
  const [t, a, p] = PRESETS[b.dataset.preset];
  document.querySelectorAll('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  wTeam.set(wTeam.indexOf(t));
  wAge.set(wAge.indexOf(a));
  wPlayers.set(wPlayers.indexOf(p));
  openLock();
}));

/* ---------- Ouverture orchestrée ---------- */
function heroIn() {
  const big = document.querySelector('.hero__big');
  const tl = gsap.timeline();
  if (calm) { heroReady(); return tl; }
  const split = SplitText.create(big, { type: 'chars,words', mask: 'words' });
  padMasks(split);
  tl.eventCallback('onComplete', () => split.revert());
  tl.from(split.chars, { yPercent: 125, rotate: 6, duration: 1.2, ease: 'expo.out', stagger: 0.03, force3D: true })
    .from('.hero__sub', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.35)
    .from('.hero .lead', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.5)
    .from('.hero .actions > *', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.62)
    .from('.hero .proofs li', { y: 16, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' }, 0.75)
    .from('.scroll-cue', { opacity: 0, duration: 0.6 }, 1.1);
  heroReady(); // les éléments sont déjà à leur état de départ : on peut lever le masque sans flash
  return tl;
}

function intro() {
  const el = document.querySelector('.intro');
  const root = document.documentElement;
  if (calm || !el) { el?.remove(); heroIn(); return; }
  let seen = null;
  try { seen = sessionStorage.getItem('g42-intro'); } catch { /* sans stockage */ }
  // Déjà vue, ou arrivée depuis une autre page par le voile : pas de deuxième ouverture
  if (seen === '1' || viaVeil || root.classList.contains('intro-seen')) {
    el.remove();
    try { sessionStorage.setItem('g42-intro', '1'); } catch { /* sans stockage */ }
    if (portal) Object.assign(portal.state, { dim: 1, ring: 1, swirl: 1 });
    heroIn().delay(viaVeil ? 0.4 : 0);
    return;
  }
  try { sessionStorage.setItem('g42-intro', '1'); } catch { /* sans stockage */ }
  lockLook(true);
  const svg = el.querySelector('svg');
  const shackle = el.querySelector('.intro__shackle');
  if (portal) Object.assign(portal.state, { dim: 0.15, ring: 0, swirl: 3 });
  const tl = gsap.timeline();
  tl.from(svg, { scale: 0.7, opacity: 0, duration: 0.45, ease: 'power3.out' })
    .to(shackle, { y: -16, duration: 0.3, ease: 'back.out(3)' }, 0.5)
    .to(svg, { scale: 7, opacity: 0, duration: 0.75, ease: 'expo.in' }, 0.85)
    .to(el, { opacity: 0, duration: 0.45, onComplete: () => el.remove() }, 1.2)
    .call(() => lockLook(false), null, 2.6);
  if (portal) tl.to(portal.state, { dim: 1, ring: 1, swirl: 1, duration: 1.6, ease: 'power2.out' }, 0.95);
  tl.add(heroIn(), 1.15);
}

/* ---------- Scènes de défilement ---------- */
function scenes() {
  const mm = gsap.matchMedia();

  // Plongée dans le portail en quittant l'ouverture
  if (portal && !calm) {
    gsap.fromTo(portal.state, { dive: 0 }, { dive: 0.6, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 55%', scrub: true } });
    gsap.fromTo('.hero__text', { yPercent: 0, opacity: 1 }, { yPercent: -18, opacity: 0.2, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Couloir des portails
  const panels = gsap.utils.toArray('.porte-monde');
  const bars = gsap.utils.toArray('.couloir__progress i');
  const setPanelScene = (p) => {
    sceneLook(p.dataset.scene, { dim: 0.42, ring: 0.3, swirl: 0.8, dive: 0 });
    document.documentElement.dataset.world = p.dataset.world;
  };
  mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)' }, (ctx) => {
    const { wide } = ctx.conditions;
    let cleanup = null;
    if (wide && !calm) {
      const pinEl = document.querySelector('.couloir__pin');
      // Distance exacte jusqu'au dernier monde (un débordement décoratif ne doit pas la fausser)
      const dist = () => panels[panels.length - 1].offsetLeft - track.offsetLeft;
      const buttons = [...progress.querySelectorAll('button')];
      const move = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pinEl, pin: true, start: () => (pinEl.offsetHeight > window.innerHeight - 40 ? 'top top+=20' : 'center center'),
          end: () => `+=${dist()}`, scrub: 0.35, invalidateOnRefresh: true, anticipatePin: 1, // Lenis lisse déjà : peu de retard en plus
          refreshPriority: 1, // calculé avant les scènes situées plus bas (sinon elles seraient décalées de toute la longueur du couloir)
          onToggle: sceneChanged,
          onUpdate: (self) => {
            bars.forEach((b, i) => { b.style.transform = `scaleX(${Math.max(0, Math.min(1, self.progress * panels.length - i))})`; });
            const cur = Math.round(self.progress * (panels.length - 1));
            buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
          },
        },
      });
      // Position de défilement qui montre le panneau i en plein écran
      const yOf = (i) => { const st = move.scrollTrigger; return st.start + (st.end - st.start) * (i / (panels.length - 1)); };
      setAnchorResolver((el) => { const i = panels.indexOf(el); return i < 0 ? null : yOf(i); });
      // Aimantation : à l'arrêt du défilement dans le couloir, on se cale sur le monde le plus proche
      let snapping = false;
      let lastDir = 1;
      const offDir = lenis?.on('scroll', (l) => { if (l.direction && !snapping) lastDir = l.direction; });
      const snap = () => {
        flushRefresh();
        const st = move.scrollTrigger;
        if (!lenis || snapping || !st) return;
        const y = window.scrollY;
        if (y <= st.start + 2 || y >= st.end - 2) return;
        // Aimantation douce vers le monde le plus proche (un geste franc, au-delà de 60 %, passe au suivant)
        const f = ((y - st.start) / (st.end - st.start)) * (panels.length - 1);
        const base = Math.floor(f);
        const frac = f - base;
        const i = frac > (lastDir > 0 ? 0.4 : 0.6) ? base + 1 : base;
        const target = yOf(Math.min(panels.length - 1, Math.max(0, i)));
        if (Math.abs(target - y) < 4) return;
        snapping = true;
        lenis.scrollTo(target, { duration: 0.9, easing: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2), onComplete: () => { snapping = false; } });
        setTimeout(() => { snapping = false; }, 1300);
      };
      let snapTimer = null;
      const snapLater = () => { clearTimeout(snapTimer); snapTimer = setTimeout(snap, 140); };
      ScrollTrigger.addEventListener('scrollEnd', snapLater);
      // Clavier, barre de défilement ou doigt : l'utilisateur reprend la main tout de suite
      const cancelSnap = () => { clearTimeout(snapTimer); if (snapping) { snapping = false; lenis?.scrollTo(window.scrollY, { immediate: true, force: true }); } };
      window.addEventListener('keydown', cancelSnap);
      window.addEventListener('pointerdown', cancelSnap);
      // Navigation au clavier : un bouton atteint par Tab fait venir son monde à l'écran
      const onFocus = (e) => {
        const p = e.target.closest('.porte-monde');
        if (!p) return;
        const y = yOf(panels.indexOf(p));
        if (Math.abs(window.scrollY - y) > 4) { if (lenis) lenis.scrollTo(y, { duration: 0.9, force: true }); else window.scrollTo(0, y); }
      };
      track.addEventListener('focusin', onFocus);
      cleanup = () => { ScrollTrigger.removeEventListener('scrollEnd', snapLater); clearTimeout(snapTimer); window.removeEventListener('keydown', cancelSnap); window.removeEventListener('pointerdown', cancelSnap); track.removeEventListener('focusin', onFocus); offDir?.(); setAnchorResolver(null); };
      panels.forEach((p) => {
        registerScene(ScrollTrigger.create({ trigger: p, containerAnimation: move, start: 'left 55%', end: 'right 55%', onToggle: sceneChanged }), () => setPanelScene(p), () => move.scrollTrigger.isActive);
        const inner = p.querySelector('.media__inner');
        gsap.fromTo(inner, { clipPath: 'circle(0% at 50% 62%)', scale: 1.3 }, { clipPath: 'circle(75% at 50% 50%)', scale: 1, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: move, start: 'left 95%', end: 'left 40%', scrub: true } });
        gsap.from(p.querySelectorAll('.porte-monde__kind, h3, .facts li'), { x: 80, opacity: 0, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: move, start: 'left 90%', end: 'left 45%', scrub: true } });
      });
    } else {
      panels.forEach((p) => {
        registerScene(ScrollTrigger.create({ trigger: p, start: 'top 55%', end: 'bottom 55%', onToggle: sceneChanged }), () => setPanelScene(p));
      });
      portalReveals(document.querySelector('.couloir'));
    }
    return () => cleanup?.();
  });

  if (calm) return;

  // Le coffre s'ouvre
  const chest = document.querySelector('.chest');
  const sparksG = chest.querySelector('.chest__sparks');
  const NS = 'http://www.w3.org/2000/svg';
  const sparks = Array.from({ length: 30 }, () => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', String(gsap.utils.random(170, 430)));
    c.setAttribute('cy', String(gsap.utils.random(184, 200)));
    c.setAttribute('r', String(gsap.utils.random(1.2, 3.6)));
    c.setAttribute('fill', Math.random() > 0.3 ? '#ffe7a8' : '#fff8e0');
    sparksG.append(c);
    return c;
  });
  const lid = chest.querySelector('.chest__lid');
  const lidIn = chest.querySelector('.chest__lid-in');
  const ct = gsap.timeline({ scrollTrigger: { trigger: '.coffres__stage', start: 'top 72%', end: 'bottom 30%', scrub: 0.7 } });
  ct.to(lid, { y: -4, duration: 0.06, ease: 'power1.out' }, 0) // le couvercle se soulève
    .to(lid, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.34, ease: 'power2.in' }, 0.06)
    .fromTo(lidIn, { scaleY: 0, opacity: 1, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.3, ease: 'power2.out' }, 0.4)
    .to('.chest__mouth', { opacity: 1, duration: 0.2 }, 0.32)
    .fromTo('.chest__rays', { opacity: 0, scaleY: 0.2, transformOrigin: '50% 100%' }, { opacity: 1, scaleY: 1, duration: 0.45, ease: 'power2.out' }, 0.36);
  sparks.forEach((c) => {
    const at = gsap.utils.random(0.38, 0.75);
    ct.fromTo(c, { opacity: 0, x: 0, y: 0 }, { opacity: 1, duration: 0.06 }, at)
      .to(c, { x: gsap.utils.random(-130, 130), y: gsap.utils.random(-240, -70), duration: gsap.utils.random(0.25, 0.4), ease: 'power2.out' }, at)
      .to(c, { opacity: 0, duration: 0.12 }, '>-0.1');
  });
  ct.fromTo('.coffres__stage .cle', { y: 60, opacity: 0 }, { y: 0, opacity: 0.9, duration: 0.2, ease: 'back.out(2)' }, 0.7);
  gsap.from('.chest__cards .tag-card', { y: 140, opacity: 0, rotate: (i) => (i - 1) * 4, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.chest__cards', start: 'top 92%', end: 'top 50%', scrub: 0.8 } });

  // La porte qui ne se ferme jamais : la lumière gagne la pièce à mesure qu'on approche
  gsap.timeline({ scrollTrigger: { trigger: '.door', start: 'top 80%', end: 'center 40%', scrub: 0.6 } })
    .fromTo('.door__media .media__inner', { scale: 1.12 }, { scale: 1, ease: 'none' }, 0)
    .fromTo('.door__shade', { opacity: 0.5 }, { opacity: 0, ease: 'none' }, 0)
    .fromTo('.door__glow', { opacity: 0.15 }, { opacity: 1, ease: 'power1.in' }, 0)
    .fromTo('.door__floor', { opacity: 0.2, scaleX: 0.6 }, { opacity: 1, scaleX: 1.1, ease: 'none' }, 0);
  gsap.from('.reassure li', { x: 60, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.reassure', start: 'top 85%', once: true } });

  // Les bougies s'allument le long de la frise
  const flames = gsap.utils.toArray('.frise .candle__flame');
  const ft = gsap.timeline({ scrollTrigger: { trigger: '.frise', start: 'top 80%', once: true } });
  ft.to('.frise__line i', { scaleX: 1, duration: 2, ease: 'power1.inOut' }, 0);
  flames.forEach((f, i) => ft.to(f, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 0.15 + i * 0.55));
  ft.from('.frise__time, .frise__what', { y: 14, opacity: 0, stagger: 0.06, duration: 0.5 }, 0.1);
  gsap.from('.big-price strong', { scale: 0.6, opacity: 0, duration: 1, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: '.big-price', start: 'top 85%', once: true } });

  // Étoiles qui se remplissent
  gsap.from('.score__stars svg', { scale: 0, rotate: -90, stagger: 0.12, duration: 0.7, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.score', start: 'top 80%', once: true } });

  // Pros : cartes qui s'empilent
  gsap.from('.pro', { y: 80, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.pros__grid', start: 'top 85%', once: true } });

  // Carte : le trajet se dessine
  gsap.fromTo('.map-card .route', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.map-card', start: 'top 75%', end: 'center 45%', scrub: 0.6 } });
  gsap.from('.map-pin', { scale: 0, transformOrigin: '50% 100%', duration: 0.8, ease: 'back.out(3)', scrollTrigger: { trigger: '.map-card', start: 'center 60%', once: true } });

  // Bon cadeau : la carte s'incline sous la souris
  const ticket = document.querySelector('[data-tilt]');
  if (ticket && fine) {
    const rx = gsap.quickTo(ticket, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(ticket, 'rotationY', { duration: 0.6, ease: 'power3' });
    ticket.addEventListener('pointermove', (e) => {
      const r = ticket.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * 18); rx((0.5 - y) * 14);
      ticket.style.setProperty('--sx', `${x * 100}%`); ticket.style.setProperty('--sy', `${y * 100}%`);
    });
    ticket.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
  gsap.from('.ticket', { rotationY: -35, rotationX: 12, y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ticket', start: 'top 85%', once: true } });

}

// L'ouverture ne démarre qu'une fois polices, scènes et premier fond prêts (voir ready dans core.js)
ready(() => {
  trackScenes();
  scenes();
  liveTitles();
  counters();
  portalReveals(document.querySelector('.anniv-teaser'));
  setTimeout(scrollToHash, 60);
}, intro);
