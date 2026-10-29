/* Le portail vivant : fond WebGL fixe (OGL).
   Il affiche l'image du monde traversé, la fait tourbillonner autour du portail
   et passe d'un monde à l'autre par une dissolution lumineuse.
   Sans WebGL : fondu enchaîné d'images en CSS. */
import { Renderer } from './vendor/ogl/core/Renderer.js';
import { Program } from './vendor/ogl/core/Program.js';
import { Mesh } from './vendor/ogl/core/Mesh.js';
import { Texture } from './vendor/ogl/core/Texture.js';
import { Triangle } from './vendor/ogl/extras/Triangle.js';
import { WORLDS } from './data.js';

/* Scènes : image de fond + position du portail dans l'image (x depuis la gauche, y depuis le haut)
   et rayon du portail en fraction de la hauteur de l'image.
   stage (écrans larges) : où poser le portail à l'écran (x en fraction de largeur, rayon en fraction de hauteur) ;
   il est alors centré verticalement dans la partie visible de l'ouverture, sous l'en-tête. */
const SCENES = {
  hero: { land: ['hero-portail', 0.67, 0.461, 0.24], port: ['hero-portail-portrait', 0.505, 0.332, 0.179], stage: { land: { x: 0.71, r: 0.235 }, port: { x: 0.5, r: 0.105 } }, world: 'portail' },
  // Même image, portail centré à l'écran (appel final « Prêts à passer le portail ? »)
  portail: { land: ['hero-portail', 0.67, 0.461, 0.24], port: ['hero-portail-portrait', 0.505, 0.332, 0.179], stage: { land: { x: 0.5, y: 0.5, r: 0.3 }, port: { x: 0.5, y: 0.45, r: 0.15 } }, world: 'portail' },
  sorcier: { land: ['monde-sorcier', 0.62, 0.55, 0.22], port: ['monde-sorcier-portrait', 0.58, 0.42, 0.14], world: 'sorcier' },
  temps: { land: ['monde-temps', 0.82, 0.5, 0.36], port: ['monde-temps-portrait', 0.5, 0.42, 0.2], world: 'temps' },
  pirate: { land: ['monde-pirate', 0.66, 0.42, 0.2], port: ['monde-pirate-portrait', 0.5, 0.5, 0.15], world: 'pirate' },
  cirque: { land: ['monde-cirque', 0.5, 0.18, 0.12], port: ['monde-cirque-portrait', 0.5, 0.15, 0.1], world: 'cirque' },
  serpent: { land: ['monde-serpent', 0.38, 0.62, 0.22], port: ['monde-serpent-portrait', 0.42, 0.45, 0.18], world: 'serpent' },
  machine: { land: ['machine-hero', 0.7, 0.5, 0.34], port: ['machine-hero-portrait', 0.5, 0.288, 0.255], world: 'temps' },
  vortex: { land: ['machine-vortex', 0.57, 0.48, 0.18], port: ['machine-vortex', 0.57, 0.48, 0.18], world: 'temps' },
  fete: { land: ['anniversaire-bougies-flip', 0.82, 0.6, 0.2], port: ['anniversaire-bougies-portrait', 0.5, 0.3, 0.14], world: 'sorcier' },
  nuit: { land: ['frise-ciel', 0.6, 0.45, 0.2], port: ['frise-ciel', 0.6, 0.45, 0.2], world: 'sorcier' },
};

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform sampler2D uT0;
uniform sampler2D uT1;
uniform vec2 uS0;
uniform vec2 uS1;
uniform float uZ0;
uniform float uZ1;
uniform vec2 uO0;
uniform vec2 uO1;
uniform float uMix;
uniform vec2 uC;
uniform float uR;
uniform float uSwirl;
uniform float uRing;
uniform float uDim;
uniform float uDive;
uniform vec3 uA;
uniform vec3 uB;
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
/* Bruits allégés : 2 ou 3 octaves suffisent pour un fond flou, deux fois moins de calcul par pixel */
float fbm2(vec2 p) { return 0.62 * noise(p) + 0.38 * noise(mat2(1.6, 1.2, -1.2, 1.6) * p); }
float fbm3(vec2 p) {
  float v = 0.0; float a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v / 0.875;
}
vec2 mapUV(vec2 uv, vec2 img, float z, vec2 o) {
  float sr = uRes.x / uRes.y; float ir = img.x / img.y;
  vec2 s = sr > ir ? vec2(1.0, ir / sr) : vec2(sr / ir, 1.0);
  return (uv - 0.5) * s * z + 0.5 + o;
}
/* Hors de l'image (portail réduit), on fond doucement vers le bleu nuit */
const vec3 NUIT = vec3(0.09, 0.07, 0.18);
vec3 sampleImg(sampler2D t, vec2 p) {
  vec2 a = smoothstep(vec2(-0.02), vec2(0.24), p) * smoothstep(vec2(1.02), vec2(0.76), p);
  float m = a.x * a.y;
  return mix(NUIT, texture2D(t, clamp(p, 0.0, 1.0)).rgb, m * m * (3.0 - 2.0 * m));
}
mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }

void main() {
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 uv = vUv;
  vec2 d = (uv - uC) * asp;
  float r = length(d);
  // Plongée : on s'approche du portail (zoom doux, sans torsion) ; l'anneau d'énergie grandit avec l'image
  float zoom = 1.0 - uDive * 0.3;
  float R = max(uR, 0.02) / zoom;
  d *= zoom;
  // Tourbillon liquide autour du portail
  float fall = smoothstep(R * 2.2, 0.0, r);
  float ang = uSwirl * fall * (0.35 * sin(uTime * 0.55 + r * 9.0) + 0.25 * sin(uTime * 0.31));
  d = rot(ang) * d;
  vec2 w = vec2(fbm2(uv * 3.0 + uTime * 0.05), fbm2(uv * 3.0 - uTime * 0.04 + 11.3)) - 0.5;
  vec2 suv = uC + d / asp + w * 0.012 * (0.4 + fall) + uMouse * 0.004;

  vec3 col = sampleImg(uT0, mapUV(suv, uS0, uZ0, uO0));

  // Dissolution lumineuse entre deux mondes (calculée seulement pendant une transition)
  if (uMix > 0.001 && uMix < 0.999) {
    vec3 c1 = sampleImg(uT1, mapUV(suv, uS1, uZ1, uO1));
    float n = fbm3(uv * 3.5 + vec2(0.0, uTime * 0.05));
    float edge = smoothstep(n - 0.08, n + 0.08, uMix * 1.16 - 0.08);
    col = mix(col, c1, edge);
    float front = exp(-pow((uMix * 1.16 - 0.08 - n) * 14.0, 2.0));
    col += mix(uA, uB, n) * front * 1.2;
  } else if (uMix >= 0.999) {
    col = sampleImg(uT1, mapUV(suv, uS1, uZ1, uO1));
  }

  // Anneau d'énergie et étincelles (ignorés quand l'anneau est éteint)
  if (uRing > 0.01) {
    // Bruit échantillonné sur un cercle : périodique, donc sans raccord visible à gauche de l'anneau
    vec2 dir = d / max(length(d), 1e-4);
    float ringN = fbm2(dir * 1.7 + vec2(r * 6.0 - uTime * 0.6, uTime * 0.4));
    float dist = abs(r - R - (ringN - 0.5) * R * 0.18);
    float ring = exp(-dist * dist / (R * R * 0.004 + 0.00002)) * 0.9 + 0.006 * R / (dist + 0.004);
    vec3 ringCol = mix(uA, uB, smoothstep(0.3, 0.8, ringN));
    col += ringCol * ring * uRing;
    if (r < R * 2.4) {
      float sparks = pow(noise(d * 55.0 / max(R, 0.1) + vec2(uTime * 1.5, -uTime)), 22.0) * smoothstep(R * 2.4, R * 0.6, r);
      col += uB * sparks * 2.4 * uRing;
    }
  }

  // Lisibilité : assombrissement + vignette, teinte du monde dans les ombres
  col *= uDim;
  col += uA * 0.035 * (1.0 - uv.y);
  float vig = 1.0 - 0.45 * pow(length((uv - 0.5) * vec2(1.0, 1.2)), 1.6);
  col *= vig;
  gl_FragColor = vec4(col, 1.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function createPortal(container, { calm = false } = {}) {
  const state = { cx: 0.66, cy: 0.52, r: 0.3, ring: 1, swirl: 1, dim: 1, dive: 0, mix: 0 };
  /* ready : résolue quand la première image du fond est affichée (les animations d'ouverture l'attendent) */
  let markReady;
  const api = { state, ok: false, hidden: false, setScene: () => {}, render: () => {}, preload: () => {}, ready: new Promise((r) => { markReady = r; }) };
  const portrait = () => window.innerWidth / window.innerHeight < 0.85;

  let gl, renderer, program, mesh;
  /* Test discret avant de créer le rendu : évite une erreur en console sans WebGL */
  const canGL = (() => {
    try { const c = document.createElement('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); g?.getExtension('WEBGL_lose_context')?.loseContext(); return !!g; } catch { return false; }
  })();
  if (!canGL) return fallback(container, api, portrait);
  /* Résolution du fond : réduite (image floue par nature), puis ajustée en continu selon la fluidité réelle */
  const baseDpr = Math.min(window.devicePixelRatio || 1, 1.5) * (matchMedia('(pointer: coarse)').matches ? 0.5 : 0.6);
  let quality = 1;
  try {
    renderer = new Renderer({ dpr: baseDpr, alpha: false, antialias: false, powerPreference: 'default' });
    gl = renderer.gl;
    if (!gl) throw new Error('webgl');
  } catch (e) {
    return fallback(container, api, portrait);
  }
  api.ok = true;
  container.appendChild(gl.canvas);
  gl.clearColor(0.09, 0.07, 0.18, 1);

  const blank = new Texture(gl, { image: new Uint8Array([23, 18, 46, 255]), width: 1, height: 1, generateMipmaps: false });
  const cache = new Map();
  const load = (key) => {
    if (cache.has(key)) return cache.get(key);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const done = () => {
        const t = new Texture(gl, { image: img, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
        try { t.update(); } catch { /* envoi au premier affichage */ }
        resolve({ t, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => resolve({ t: blank, w: 1, h: 1 });
      img.src = `assets/img/${key}.webp`;
      // decode() évite un décodage bloquant au moment de l'envoi de la texture
      (img.decode ? img.decode() : new Promise((r, j) => { img.onload = r; img.onerror = j; })).then(done, () => { if (img.complete && img.naturalWidth) done(); });
    });
    cache.set(key, p);
    return p;
  };

  const world = hex(WORLDS.portail.a);
  const world2 = hex(WORLDS.portail.b);
  program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uTime: { value: 0 }, uRes: { value: [1, 1] }, uMouse: { value: [0, 0] },
      uT0: { value: blank }, uT1: { value: blank }, uS0: { value: [1, 1] }, uS1: { value: [1, 1] },
      uZ0: { value: 1 }, uZ1: { value: 1 }, uO0: { value: [0, 0] }, uO1: { value: [0, 0] },
      uMix: { value: 0 }, uC: { value: [0.66, 0.52] }, uR: { value: 0.3 }, uSwirl: { value: 1 }, uRing: { value: 1 },
      uDim: { value: 1 }, uDive: { value: 0 }, uA: { value: world }, uB: { value: world2 },
    },
  });
  mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const u = program.uniforms;

  let anchor = { x: 0.66, y: 0.48, r: 0.3, w: 1, h: 1 };
  /* Taille du fond : celle du conteneur (100lvh), stable quand la barre d'adresse mobile bouge */
  const size = () => [container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight];
  /* Milieu vertical de la partie visible de l'ouverture (sous l'en-tête), en fraction de la hauteur du fond */
  const stageY = () => {
    const [, sh] = size();
    // Mobile : le portail se pose dans l'espace qui lui est réservé au-dessus du titre
    const spot = document.querySelector('.hero__portal-space');
    if (spot && portrait()) {
      const b = spot.getBoundingClientRect();
      if (b.height > 40) return Math.min(0.5, Math.max(0.2, (b.top + window.scrollY + b.height / 2) / sh));
    }
    const hero = document.querySelector('main > section');
    const head = document.querySelector('.header');
    if (!hero) return 0.5;
    const top = Math.max(head ? head.getBoundingClientRect().bottom + window.scrollY : 0, hero.getBoundingClientRect().top + window.scrollY);
    const bottom = Math.min(hero.getBoundingClientRect().bottom + window.scrollY, window.innerHeight);
    return Math.min(0.72, Math.max(0.4, (top + bottom) / 2 / sh));
  };
  const place = () => {
    const [sw, sh] = size();
    const sr = sw / sh, ir = anchor.w / anchor.h;
    const s = sr > ir ? [1, ir / sr] : [sr / ir, 1];
    const st = anchor.stage;
    if (st && (portrait() || sr >= 1.15)) {
      const P = [st.x, 1 - (st.y ?? stageY())];
      const A = [anchor.x, 1 - anchor.y];
      const z = anchor.r / (s[1] * st.r);
      state.cx = P[0]; state.cy = P[1]; state.r = st.r;
      return { z, o: [A[0] - 0.5 - (P[0] - 0.5) * s[0] * z, A[1] - 0.5 - (P[1] - 0.5) * s[1] * z] };
    }
    state.cx = (anchor.x - 0.5) / s[0] + 0.5;
    state.cy = ((1 - anchor.y) - 0.5) / s[1] + 0.5;
    state.r = anchor.r / s[1];
    return { z: 1, o: [0, 0] };
  };

  let lastW = 0, lastH = 0;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const resize = () => {
    const [w, h] = size();
    // Sur mobile, seule une vraie rotation ou un vrai changement de taille redimensionne le rendu
    if (coarse && w === lastW && Math.abs(h - lastH) < 160) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h);
    u.uRes.value = [gl.canvas.width, gl.canvas.height];
    if (wanted) show(wanted);
    if (calm) draw(0);
  };

  const colorTo = (name) => {
    const wd = WORLDS[name] || WORLDS.portail;
    u.uA.value = hex(wd.a);
    u.uB.value = hex(wd.b);
  };

  /* Changement de monde : dissolution lumineuse de 1,5 s.
     Si une nouvelle scène est demandée pendant une dissolution, celle-ci s'achève en accéléré
     puis enchaîne : plus de saut brutal d'image quand on défile vite. */
  let transitionTween = null;
  let shown = null;
  let wanted = null;
  let loading = false;
  const texFor = async (name) => {
    const sc = SCENES[name] || SCENES.hero;
    const [key, x, y, r] = portrait() ? sc.port : sc.land;
    const tex = await load(key);
    return { sc, tex, x, y, r, stage: sc.stage ? (portrait() ? sc.stage.port : sc.stage.land) : null };
  };
  async function show(name) {
    const { sc, tex, x, y, r, stage } = await texFor(name);
    if (wanted !== name) return;
    if (transitionTween) { transitionTween.kill(); transitionTween = null; }
    u.uT0.value = tex.t; u.uS0.value = [tex.w, tex.h]; state.mix = 0; u.uMix.value = 0;
    colorTo(sc.world);
    anchor = { x, y, r, stage, w: tex.w, h: tex.h };
    const m = place();
    u.uZ0.value = m.z; u.uO0.value = m.o;
    shown = name;
    draw(0);
    requestAnimationFrame(() => markReady());
    // Première image prête : le fond apparaît en fondu au lieu de surgir
    if (!container.classList.contains('is-ready')) requestAnimationFrame(() => container.classList.add('is-ready'));
  }
  async function dissolve(name) {
    loading = true;
    const { sc, tex, x, y, r, stage } = await texFor(name);
    loading = false;
    if (wanted !== name) { if (wanted && wanted !== shown) dissolve(wanted); return; }
    u.uT1.value = tex.t; u.uS1.value = [tex.w, tex.h];
    colorTo(sc.world);
    const prev = { cx: state.cx, cy: state.cy, r: state.r };
    anchor = { x, y, r, stage, w: tex.w, h: tex.h };
    const m = place();
    u.uZ1.value = m.z; u.uO1.value = m.o;
    const next = { cx: state.cx, cy: state.cy, r: state.r };
    Object.assign(state, prev);
    transitionTween = window.gsap.timeline({
      onComplete() {
        u.uT0.value = tex.t; u.uS0.value = [tex.w, tex.h]; u.uZ0.value = m.z; u.uO0.value = m.o; state.mix = 0;
        shown = name; transitionTween = null;
        if (wanted && wanted !== shown) dissolve(wanted);
      },
    })
      .to(state, { mix: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(state, { ...next, duration: 1.5, ease: 'power3.inOut' }, 0);
  }
  function setScene(name, instant = false) {
    wanted = name;
    if (instant || calm || !window.gsap || shown === null) return show(name);
    if (transitionTween) { transitionTween.timeScale(3.5); return; }
    if (loading || name === shown) return;
    dissolve(name);
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2; mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });

  let running = !calm;
  let last = performance.now();
  let t = 0;
  function draw(dt) {
    t += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    u.uTime.value = t;
    u.uMouse.value = [mouse.x, mouse.y];
    u.uC.value = [state.cx, state.cy];
    u.uR.value = state.r;
    u.uSwirl.value = state.swirl;
    u.uRing.value = state.ring;
    u.uDim.value = state.dim;
    u.uDive.value = state.dive;
    u.uMix.value = state.mix;
    renderer.render({ scene: mesh });
  }
  /* Fluidité : 60 images/s au plus (écrans 120 Hz), et résolution baissée si les images arrivent en retard */
  let avg = 16.7, frames = 0, good = 0, covered = 0, lastScroll = 0;
  window.addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  const setQuality = (q) => {
    quality = q;
    renderer.dpr = baseDpr * quality;
    const [w, h] = size();
    renderer.setSize(w, h);
    u.uRes.value = [gl.canvas.width, gl.canvas.height];
  };
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    const raw = now - last;
    if (raw < 11.5) return; // écran 120 Hz : une image sur deux suffit au fond (60 Hz : toutes)
    last = now;
    if (raw < 100) {
      avg += (raw - avg) * 0.06;
      if (++frames % 90 === 0) {
        // Un changement de résolution se voit : seulement après 3 constats de lenteur, jamais pendant un défilement
        if (avg > 22 && quality > 0.6 && now - lastScroll > 800) { if (++good >= 3) { setQuality(Math.max(0.6, quality - 0.2)); good = 0; } }
        else good = 0;
      }
    }
    if (api.hidden && (++covered % 3)) return;
    draw(Math.min(0.05, raw / 1000 * (api.hidden ? 3 : 1)));
  }
  document.addEventListener('visibilitychange', () => {
    if (calm) return;
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(loop); }
  });

  window.addEventListener('resize', resize);
  resize();
  if (running) requestAnimationFrame(loop);
  api.setScene = setScene;
  api.render = () => draw(0);
  api.preload = (names) => {
    const keys = [...new Set(names.map((n) => { const sc = SCENES[n] || SCENES.hero; return (portrait() ? sc.port : sc.land)[0]; }))];
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    const next = () => { const k = keys.shift(); if (!k) return; load(k).then(() => idle(next, { timeout: 2500 })); };
    idle(next, { timeout: 2500 });
  };
  return api;
}

function fallback(container, api, portrait) {
  container.classList.add('portal--css');
  api.ready = Promise.resolve();
  const layers = [document.createElement('div'), document.createElement('div')];
  layers.forEach((l) => { l.className = 'portal__layer'; container.appendChild(l); });
  let front = 0;
  api.setScene = (name) => {
    const sc = SCENES[name] || SCENES.hero;
    const key = (portrait() ? sc.port : sc.land)[0];
    const next = layers[1 - front];
    next.style.backgroundImage = `url(assets/img/${key}.webp)`;
    next.classList.add('is-on');
    layers[front].classList.remove('is-on');
    front = 1 - front;
    const wd = WORLDS[sc.world] || WORLDS.portail;
    container.style.setProperty('--w', wd.a);
  };
  return api;
}
