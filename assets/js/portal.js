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
   et rayon du portail en fraction de la hauteur de l'image. */
const SCENES = {
  hero: { land: ['hero-portail', 0.665, 0.48, 0.30], port: ['hero-portail-portrait', 0.5, 0.29, 0.13], world: 'portail' },
  sorcier: { land: ['monde-sorcier', 0.62, 0.55, 0.22], port: ['monde-sorcier-portrait', 0.58, 0.42, 0.14], world: 'sorcier' },
  temps: { land: ['monde-temps', 0.82, 0.5, 0.36], port: ['monde-temps-portrait', 0.5, 0.42, 0.2], world: 'temps' },
  pirate: { land: ['monde-pirate', 0.66, 0.42, 0.2], port: ['monde-pirate-portrait', 0.5, 0.5, 0.15], world: 'pirate' },
  cirque: { land: ['monde-cirque', 0.5, 0.18, 0.12], port: ['monde-cirque-portrait', 0.5, 0.15, 0.1], world: 'cirque' },
  serpent: { land: ['monde-serpent', 0.38, 0.62, 0.22], port: ['monde-serpent-portrait', 0.42, 0.45, 0.18], world: 'serpent' },
  machine: { land: ['machine-hero', 0.7, 0.5, 0.34], port: ['machine-hero-portrait', 0.5, 0.21, 0.13], world: 'temps' },
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
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
vec2 cover(vec2 uv, vec2 img) {
  float sr = uRes.x / uRes.y; float ir = img.x / img.y;
  vec2 s = sr > ir ? vec2(1.0, ir / sr) : vec2(sr / ir, 1.0);
  return (uv - 0.5) * s + 0.5;
}
mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }

void main() {
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 uv = vUv;
  vec2 d = (uv - uC) * asp;
  float r = length(d);
  float R = max(uR, 0.02);

  // Plongée : on zoome vers le centre du portail
  d *= 1.0 - uDive * 0.55;
  // Tourbillon liquide autour du portail
  float fall = smoothstep(R * 2.2, 0.0, r);
  float ang = uSwirl * fall * (0.35 * sin(uTime * 0.55 + r * 9.0) + 0.25 * sin(uTime * 0.31)) + uDive * fall * 1.2;
  d = rot(ang) * d;
  vec2 w = vec2(fbm(uv * 3.0 + uTime * 0.05), fbm(uv * 3.0 - uTime * 0.04)) - 0.5;
  vec2 suv = uC + d / asp + w * 0.012 * (0.4 + fall) + uMouse * 0.008;

  vec3 c0 = texture2D(uT0, cover(suv, uS0)).rgb;
  vec3 c1 = texture2D(uT1, cover(suv, uS1)).rgb;

  // Dissolution lumineuse entre deux mondes
  float n = fbm(uv * 3.5 + vec2(0.0, uTime * 0.05));
  float edge = smoothstep(n - 0.08, n + 0.08, uMix * 1.16 - 0.08);
  vec3 col = mix(c0, c1, edge);
  float front = exp(-pow((uMix * 1.16 - 0.08 - n) * 14.0, 2.0)) * step(0.001, uMix) * step(uMix, 0.999);
  col += mix(uA, uB, n) * front * 1.2;

  // Anneau d'énergie et étincelles
  float ringN = fbm(vec2(atan(d.y, d.x) * 2.0 + uTime * 0.4, r * 6.0 - uTime * 0.6));
  float dist = abs(r - R - (ringN - 0.5) * R * 0.18);
  float ring = exp(-dist * dist / (R * R * 0.004 + 0.00002)) * 0.9 + 0.006 * R / (dist + 0.004);
  vec3 ringCol = mix(uA, uB, smoothstep(0.3, 0.8, ringN));
  col += ringCol * ring * uRing;
  float sparks = pow(noise(d * 55.0 / max(R, 0.1) + vec2(uTime * 1.5, -uTime)), 22.0) * smoothstep(R * 2.4, R * 0.6, r);
  col += uB * sparks * 2.4 * uRing;

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
  const api = { state, ok: false, hidden: false, setScene: () => {}, render: () => {} };
  const portrait = () => window.innerWidth / window.innerHeight < 0.85;
  let current = null;
  let pending = null;

  let gl, renderer, program, mesh;
  try {
    renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5) * (matchMedia('(pointer: coarse)').matches ? 0.5 : 0.62), alpha: false, antialias: false, powerPreference: 'high-performance' });
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
      img.onload = () => {
        const t = new Texture(gl, { image: img, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
        resolve({ t, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => resolve({ t: blank, w: 1, h: 1 });
      img.src = `assets/img/${key}.webp`;
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
      uMix: { value: 0 }, uC: { value: [0.66, 0.52] }, uR: { value: 0.3 }, uSwirl: { value: 1 }, uRing: { value: 1 },
      uDim: { value: 1 }, uDive: { value: 0 }, uA: { value: world }, uB: { value: world2 },
    },
  });
  mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const u = program.uniforms;

  let anchor = { x: 0.66, y: 0.48, r: 0.3, w: 1, h: 1 };
  const place = () => {
    const sw = window.innerWidth, sh = window.innerHeight;
    const sr = sw / sh, ir = anchor.w / anchor.h;
    const s = sr > ir ? [1, ir / sr] : [sr / ir, 1];
    state.cx = (anchor.x - 0.5) / s[0] + 0.5;
    state.cy = ((1 - anchor.y) - 0.5) / s[1] + 0.5;
    state.r = anchor.r / s[1];
  };

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    u.uRes.value = [gl.canvas.width, gl.canvas.height];
    if (current) setScene(current, true);
    if (calm) draw(0);
  };

  const colorTo = (name) => {
    const wd = WORLDS[name] || WORLDS.portail;
    u.uA.value = hex(wd.a);
    u.uB.value = hex(wd.b);
  };

  let transitionTween = null;
  async function setScene(name, instant = false) {
    const sc = SCENES[name] || SCENES.hero;
    const [key, x, y, r] = portrait() ? sc.port : sc.land;
    const same = current === name;
    current = name;
    pending = name;
    const tex = await load(key);
    if (pending !== name) return;
    anchor = { x, y, r, w: tex.w, h: tex.h };
    if (same || instant || calm || !window.gsap) {
      u.uT0.value = tex.t; u.uS0.value = [tex.w, tex.h]; u.uMix.value = 0; state.mix = 0;
      colorTo(sc.world);
      if (!same) place();
      if (calm) draw(0);
      return;
    }
    if (transitionTween) transitionTween.progress(1);
    u.uT1.value = tex.t; u.uS1.value = [tex.w, tex.h];
    colorTo(sc.world);
    const prev = { cx: state.cx, cy: state.cy, r: state.r };
    place();
    const next = { cx: state.cx, cy: state.cy, r: state.r };
    Object.assign(state, prev);
    transitionTween = window.gsap.timeline({
      onComplete() { u.uT0.value = tex.t; u.uS0.value = [tex.w, tex.h]; state.mix = 0; transitionTween = null; },
    })
      .to(state, { mix: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(state, { ...next, duration: 1.5, ease: 'power3.inOut' }, 0);
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
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!api.hidden) draw(dt);
    requestAnimationFrame(loop);
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
  return api;
}

function fallback(container, api, portrait) {
  container.classList.add('portal--css');
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
