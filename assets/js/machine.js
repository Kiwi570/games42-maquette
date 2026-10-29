/* Page « La Machine à remonter le temps » : compte à rebours, horloge à réparer,
   frise des époques, jauges, calculateur de prix. */
import { gsap, ScrollTrigger, SplitText, calm, trackScenes, liveTitles, ready, scrollToHash, padMasks, heroReady, heroDelay } from './core.js';
import { gearPath } from './art.js';
import { PRICES } from './data.js';

/* ---------- Dessins : engrenages et graduations ---------- */
document.querySelectorAll('.gear-obj').forEach((p) => p.setAttribute('d', gearPath(42, 42, 24, 10, 0.22)));
document.querySelector('.clk-gear--a')?.setAttribute('d', gearPath(96, 340, 74, 14));
document.querySelector('.clk-gear--b')?.setAttribute('d', gearPath(350, 96, 58, 12));
document.querySelector('.slot__gear')?.setAttribute('d', gearPath(0, 0, 19, 9, 0.24));
document.querySelector('.seal-gear')?.setAttribute('d', gearPath(40, 40, 30, 16, 0.12));
const ticks = document.querySelector('.clk-ticks');
if (ticks) {
  ticks.innerHTML = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2, r1 = i % 5 ? 132 : 120, r2 = 140;
    return `<line x1="${(220 + Math.cos(a) * r1).toFixed(1)}" y1="${(220 + Math.sin(a) * r1).toFixed(1)}" x2="${(220 + Math.cos(a) * r2).toFixed(1)}" y2="${(220 + Math.sin(a) * r2).toFixed(1)}" stroke="#E3A33B" stroke-width="${i % 5 ? 1.5 : 4}" opacity=".85"/>`;
  }).join('');
}

/* ---------- Compte à rebours : le temps s'est arrêté il y a 60 minutes ---------- */
const cd = document.querySelector('[data-countdown]');
if (cd) {
  let left = 3600;
  const tick = () => {
    left = Math.max(0, left - 1);
    cd.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    if (left === 0) clearInterval(timer);
  };
  const timer = setInterval(tick, 1000);
}

/* ---------- Horloge à réparer ---------- */
const objets = [...document.querySelectorAll('.objet')];
const fills = [...document.querySelectorAll('.slot__fill')];
const status = document.querySelector('[data-status]');
const STATUS = ['L’horloge est arrêtée.', 'Un objet sur trois retrouvé.', 'Deux objets sur trois retrouvés.', 'L’horloge repart !'];
let shown = -1;
const setFound = (n) => {
  if (n === shown) return;
  shown = n;
  objets.forEach((o, i) => o.classList.toggle('is-found', i < n));
  fills.forEach((f, i) => gsap.to(f, { opacity: i < n ? 1 : 0, scale: i < n ? 1 : 0.4, transformOrigin: '50% 50%', duration: calm ? 0 : 0.5, ease: 'back.out(2)' }));
  if (status) status.textContent = STATUS[n];
};

/* ---------- Titre ---------- */
function heroIn() {
  if (calm) { heroReady(); return; }
  const split = SplitText.create('.m-title', { type: 'words,chars', mask: 'words' });
  padMasks(split);
  gsap.timeline({ delay: heroDelay, onComplete: () => split.revert() })
    .from(split.chars, { yPercent: 125, fontWeight: 280, duration: 1.1, ease: 'expo.out', stagger: 0.022 })
    .from('.page-hero .badge-new, .page-hero .crumbs', { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, 0)
    .from('.page-hero .lead, .countdown, .page-hero .facts li, .page-hero .actions > *', { y: 24, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 0.4);
  heroReady();
}

function scenes() {
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)' }, (ctx) => {
    const { wide } = ctx.conditions;
    if (wide && !calm) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.objets__pin', pin: true, start: 'top top', end: '+=1600', scrub: 0.6, refreshPriority: 2,
          onUpdate: (self) => setFound(Math.min(3, Math.floor(self.progress * 3.6))),
        },
      });
      tl.to('.clk-gear--a', { rotation: 360, svgOrigin: '96 340', ease: 'none', duration: 4 }, 0)
        .to('.clk-gear--b', { rotation: -300, svgOrigin: '350 96', ease: 'none', duration: 4 }, 0)
        .to('.clk-min', { rotation: 720, svgOrigin: '220 220', ease: 'power2.in', duration: 1.2 }, 2.8)
        .to('.clk-hour', { rotation: 60, svgOrigin: '220 220', ease: 'power2.in', duration: 1.2 }, 2.8);

      const track = document.querySelector('.epoques__track');
      const dist = () => track.scrollWidth - window.innerWidth + 32;
      const move = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.epoques__pin', pin: true, start: 'center center', end: () => `+=${dist()}`, scrub: 0.8, invalidateOnRefresh: true, refreshPriority: 1 },
      });
      gsap.fromTo('.epoques__hand', { left: '0%' }, { left: '100%', ease: 'none', scrollTrigger: { trigger: '.epoques__pin', start: 'center center', end: () => `+=${dist()}`, scrub: 0.8 } });
      document.querySelectorAll('.epoque .portal-reveal .media__inner').forEach((inner) => {
        gsap.fromTo(inner, { clipPath: 'circle(0% at 50% 65%)', scale: 1.3 }, { clipPath: 'circle(80% at 50% 50%)', scale: 1, ease: 'none', scrollTrigger: { trigger: inner.closest('.epoque'), containerAnimation: move, start: 'left 100%', end: 'left 55%', scrub: true } });
      });
      document.querySelectorAll('.epoque--badge .media__inner').forEach((inner) => {
        gsap.fromTo(inner, { rotate: -25, scale: 0.6 }, { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: inner.closest('.epoque'), containerAnimation: move, start: 'left 100%', end: 'left 60%', scrub: true } });
      });
    } else {
      objets.forEach((o, i) => ScrollTrigger.create({ trigger: o, start: 'top 70%', onEnter: () => setFound(Math.max(shown, i + 1)) }));
      if (!calm) {
        document.querySelectorAll('.epoque .portal-reveal .media__inner').forEach((inner) => {
          gsap.fromTo(inner, { clipPath: 'circle(0% at 50% 65%)' }, { clipPath: 'circle(80% at 50% 50%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: inner.closest('.epoque'), horizontal: false, start: 'top 85%', once: true } });
        });
      }
    }
  });

  // Jauges de difficulté
  document.querySelectorAll('.gauge__arc').forEach((arc) => {
    const v = parseFloat(arc.dataset.value);
    if (calm) return;
    gsap.fromTo(arc, { strokeDashoffset: 10 }, { strokeDashoffset: 10 - v, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: arc, start: 'top 85%', once: true } });
  });

  if (calm) return;
  gsap.from('.mode', { y: 70, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.modes', start: 'top 85%', once: true } });
  gsap.fromTo('.diplome', { rotate: -8, y: 80 }, { rotate: 3, y: -20, ease: 'none', scrollTrigger: { trigger: '.diplome', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.diplome__seal', { rotate: 360, transformOrigin: '50% 50%', ease: 'none', scrollTrigger: { trigger: '.diplome', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.other', { y: 60, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.others', start: 'top 85%', once: true } });
  gsap.from('.price-table tbody tr', { x: -40, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '.price-table', start: 'top 85%', once: true } });
}

/* ---------- Calculateur ---------- */
document.querySelectorAll('[data-stepper]').forEach((st) => {
  const out = st.querySelector('output');
  const min = Number(st.dataset.min), max = Number(st.dataset.max);
  let n = Number(st.dataset.value);
  const totalEl = document.querySelector('[data-total]');
  const detailEl = document.querySelector('[data-detail]');
  const update = () => {
    const unit = PRICES.machine(n);
    out.textContent = String(n);
    totalEl.textContent = `${unit * n} €`;
    detailEl.textContent = `soit ${unit} € par joueur pour ${n} joueurs`;
    st.querySelector('[data-step="-1"]').disabled = n <= min;
    st.querySelector('[data-step="1"]').disabled = n >= max;
    if (!calm) gsap.fromTo(totalEl, { scale: 1.12 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
  };
  st.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { n = Math.max(min, Math.min(max, n + Number(b.dataset.step))); update(); }));
  update();
});

setFound(0);
heroIn();
ready(() => {
  trackScenes();
  scenes();
  liveTitles();
  setTimeout(scrollToHash, 60);
});
