/* Page « Anniversaire » : bougies qui s'allument, frise du mercredi,
   calculateur, invitations en enveloppes. */
import { gsap, ScrollTrigger, SplitText, calm, trackScenes, liveTitles, portalReveals, ready, frenchSpaces } from './core.js';
import { PRICES, INVITATIONS } from './data.js';

/* ---------- Invitations ---------- */
const env = document.querySelector('[data-invitations]');
env.innerHTML = INVITATIONS.map((inv) => `
  <a class="env" href="${inv.url}" data-world="${inv.world}" target="_blank" rel="noopener">
    <span class="env__body" aria-hidden="true">
      <span class="env__card">${inv.name}</span>
      <span class="env__front"></span>
      <span class="env__flap"></span>
    </span>
    <span><strong>${inv.name}</strong><span>${inv.note}, PDF</span></span>
    <span class="env__dl"><svg aria-hidden="true"><use href="#i-download"/></svg>Télécharger</span>
  </a>`).join('');

/* ---------- Onglets de la frise ---------- */
const tabs = [...document.querySelectorAll('[role="tab"]')];
const showTab = (tab) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  const panel = document.getElementById(tab.getAttribute('aria-controls'));
  lightTimeline(panel, true);
  ScrollTrigger.refresh();
};
tabs.forEach((t, i) => {
  t.addEventListener('click', () => showTab(t));
  t.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); showTab(next);
    }
  });
});

function lightTimeline(panel, instant = false) {
  const rail = panel.querySelector('.timeline__rail i');
  const dots = panel.querySelectorAll('.timeline__dot');
  if (calm) { dots.forEach((d) => d.classList.add('is-lit')); return; }
  const tl = gsap.timeline({ paused: !instant });
  tl.fromTo(rail, { scaleY: 0 }, { scaleY: 1, duration: 2.2, ease: 'power1.inOut' }, 0);
  dots.forEach((d, i) => {
    d.classList.remove('is-lit');
    tl.call(() => d.classList.add('is-lit'), null, 0.1 + i * 0.62);
    tl.from(d.nextElementSibling, { x: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0.05 + i * 0.62);
  });
  if (!instant) ScrollTrigger.create({ trigger: panel, start: 'top 75%', once: true, onEnter: () => tl.play() });
  return tl;
}

/* ---------- Calculateur ---------- */
const FORMULES = {
  mercredi: { min: 4, max: 8, unit: () => PRICES.mercredi, label: 'par enfant', incl: ['Escape game L’Apprenti Sorcier, 1 h', 'Atelier baguette magique, 30 min', 'Goûter en salle privatisée, 30 min', 'Diplôme d’apprenti sorcier'], note: 'Le mercredi, dès 9 ans. Un adulte présent dans la salle, gratuit.' },
  weekend: { min: 4, max: 8, unit: (n) => (PRICES.sorcier(n) ? PRICES.sorcier(n) + PRICES.gouterWeekend : null), label: 'par enfant', incl: ['Escape game L’Apprenti Sorcier, 1 h', 'Goûter sur place, 45 min'], note: 'Samedi ou dimanche. Le goûter se réserve par téléphone. Grille de la salle à confirmer pour 2026.' },
  bozo: { min: 4, max: 6, unit: (n) => PRICES.bozo(n), label: 'par enfant', incl: ['Coffre Bozo le clown, 1 h', 'Goûter, 45 min'], note: 'De 5 à 8 ans, au moins un parent joue avec les enfants.' },
  pirate: { min: 4, max: 12, unit: (n) => PRICES.pirateGouter(n), label: 'par enfant', incl: ['Le Coffre du Pirate, 1 h', 'Goûter en salle privatisée'], note: 'Dès 9 ans. Jusqu’à 18 enfants en privatisant nos salles : tarif à confirmer.' },
};
const form = document.querySelector('[data-calc]');
const out = form.querySelector('[data-kids] output');
const minus = form.querySelector('[data-kids] [data-step="-1"]');
const plus = form.querySelector('[data-kids] [data-step="1"]');
const totalEl = form.querySelector('[data-total]');
let kids = 6;
const update = (pulse = true) => {
  const f = FORMULES[form.formule.value];
  kids = Math.max(f.min, Math.min(f.max, kids));
  const unit = f.unit(kids);
  out.textContent = String(kids);
  minus.disabled = kids <= f.min;
  plus.disabled = kids >= f.max;
  totalEl.textContent = unit ? `${unit * kids} €` : 'À compléter';
  form.querySelector('[data-detail]').textContent = unit ? `soit ${unit} € ${f.label} pour ${kids} enfants` : '';
  form.querySelector('[data-incl]').innerHTML = f.incl.map((x) => `<li>${x}</li>`).join('');
  form.querySelector('[data-note]').textContent = f.note;
  frenchSpaces(form);
  if (pulse && !calm) gsap.fromTo(totalEl, { scale: 1.12, color: '#FFD23F' }, { scale: 1, color: '', duration: 0.5, ease: 'back.out(2)' });
};
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('change', () => update());
minus.addEventListener('click', () => { kids -= 1; update(); });
plus.addEventListener('click', () => { kids += 1; update(); });
update(false);

/* ---------- Ouverture : les bougies s'allument une à une ---------- */
function heroIn() {
  const flames = document.querySelectorAll('.candles-row .candle__flame');
  if (calm) { gsap.set(flames, { scale: 1 }); return; }
  const split = SplitText.create('.a-title', { type: 'words,chars', mask: 'words' });
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from(split.chars, { yPercent: 115, fontWeight: 280, duration: 1.1, ease: 'expo.out', stagger: 0.02 })
    .from('.page-hero .crumbs, .page-hero .lead, .page-hero .actions > *, .page-hero .proofs li', { y: 24, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 0.35)
    .from('.candles-hero .media', { clipPath: 'circle(0% at 50% 80%)', duration: 1.4, ease: 'expo.inOut' }, 0.2)
    .from('.candles-row .candle', { y: 60, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'back.out(2)' }, 0.8);
  flames.forEach((f, i) => tl.to(f, { scale: 1, duration: 0.45, ease: 'back.out(3)' }, 1.3 + i * 0.28));
}

function scenes() {
  lightTimeline(document.getElementById('tl-a'));
  if (calm) return;
  gsap.from('.formule', { y: 90, opacity: 0, rotate: (i) => (i - 1) * 2.5, stagger: 0.12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.formules', start: 'top 85%', once: true } });
  gsap.from('.gouter-list li', { y: 30, opacity: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '.gouter-list', start: 'top 85%', once: true } });
  gsap.from('.env', { y: 60, rotate: (i) => (i % 2 ? 4 : -4), opacity: 0, stagger: 0.08, duration: 0.8, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.enveloppes', start: 'top 85%', once: true } });
  gsap.from('.calc', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.calc', start: 'top 85%', once: true } });
  gsap.from('.faq details', { y: 30, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '.faq', start: 'top 85%', once: true } });
}

heroIn();
ready(() => {
  trackScenes();
  scenes();
  liveTitles();
  portalReveals(document.getElementById('gouter'));
});
