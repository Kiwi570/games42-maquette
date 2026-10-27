/* Visuels provisoires dessinés en code, un par monde.
   Ils remplissent chaque emplacement tant que la vraie photo n'est pas livrée. */

let uid = 0;
const id = (p) => `${p}${++uid}`;

export function gearPath(cx, cy, r, teeth, depth = 0.16) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const r1 = r, r2 = r * (1 + depth);
    const w = step * 0.22;
    pts.push([a - step / 2 + w, r1], [a - w, r2], [a + w, r2], [a + step / 2 - w, r1]);
  }
  return 'M' + pts.map(([a, rr]) => `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`).join('L') + 'Z';
}

function stars(n, seed, w = 400, h = 500, maxY = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h * maxY, r = rnd() * 1.4 + 0.3, o = (rnd() * 0.6 + 0.3).toFixed(2);
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${o}"/>`;
  }
  return out;
}

const svg = (body, defs = '') =>
  `<svg class="ph-svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;

const ART = {
  sorcier() {
    const g = id('s'), l = id('l');
    const defs = `<radialGradient id="${g}" cx="50%" cy="62%" r="70%"><stop offset="0" stop-color="#5a33c7"/><stop offset=".55" stop-color="#2a1a63"/><stop offset="1" stop-color="#140f2b"/></radialGradient>
      <linearGradient id="${l}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c8ff"/><stop offset="1" stop-color="#8E5CFF"/></linearGradient>`;
    const flask = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      <path d="M-14,-70 L14,-70 L14,-30 C44,-18 56,8 56,30 C56,62 30,84 0,84 C-30,84 -56,62 -56,30 C-56,8 -44,-18 -14,-30 Z" fill="rgba(255,255,255,.06)" stroke="rgba(230,220,255,.55)" stroke-width="2.5"/>
      <path d="M-50,34 C-30,22 -12,42 8,30 C28,18 42,30 50,34 C50,62 28,80 0,80 C-28,80 -50,62 -50,34 Z" fill="url(#${l})" opacity=".92"/>
      <rect x="-18" y="-80" width="36" height="12" rx="4" fill="#3b2a7a"/>
      <circle cx="-12" cy="44" r="5" fill="#fff" opacity=".7"/><circle cx="14" cy="58" r="3" fill="#fff" opacity=".6"/></g>`;
    return svg(`<rect width="400" height="500" fill="url(#${g})"/>${stars(70, 7, 400, 500, 0.7)}
      <ellipse cx="200" cy="430" rx="190" ry="40" fill="#8E5CFF" opacity=".25"/>
      ${flask(200, 300, 1.35, 0)}${flask(95, 360, 0.75, -8)}${flask(310, 350, 0.85, 10)}
      <g fill="#C9B2FF">${[...Array(14)].map((_, i) => `<circle cx="${150 + (i * 37) % 110}" cy="${170 - i * 9}" r="${2 + (i % 3)}" opacity="${0.25 + (i % 4) * 0.15}"/>`).join('')}</g>`, defs);
  },
  temps() {
    const g = id('t');
    const defs = `<radialGradient id="${g}" cx="55%" cy="45%" r="75%"><stop offset="0" stop-color="#3a2a1a"/><stop offset=".5" stop-color="#1f1a2e"/><stop offset="1" stop-color="#120f22"/></radialGradient>`;
    const ticks = [...Array(60)].map((_, i) => {
      const a = (i / 60) * Math.PI * 2, r1 = i % 5 ? 118 : 108, r2 = 126;
      return `<line x1="${200 + Math.cos(a) * r1}" y1="${230 + Math.sin(a) * r1}" x2="${200 + Math.cos(a) * r2}" y2="${230 + Math.sin(a) * r2}" stroke="#E3A33B" stroke-width="${i % 5 ? 1 : 3}" opacity=".85"/>`;
    }).join('');
    return svg(`<rect width="400" height="500" fill="url(#${g})"/>
      <path class="ph-gear ph-gear--a" d="${gearPath(90, 420, 70, 14)}" fill="#2FA38F" opacity=".55"/>
      <path class="ph-gear ph-gear--b" d="${gearPath(330, 110, 56, 12)}" fill="#E3A33B" opacity=".45"/>
      <path class="ph-gear ph-gear--c" d="${gearPath(340, 440, 40, 10)}" fill="#E3A33B" opacity=".6"/>
      <circle cx="200" cy="230" r="140" fill="#1a1530" stroke="#E3A33B" stroke-width="5"/>
      <circle cx="200" cy="230" r="128" fill="none" stroke="#2FA38F" stroke-width="1.5" opacity=".7"/>${ticks}
      <line x1="200" y1="230" x2="200" y2="140" stroke="#F3EFFA" stroke-width="6" stroke-linecap="round"/>
      <line x1="200" y1="230" x2="262" y2="262" stroke="#E3A33B" stroke-width="4" stroke-linecap="round"/>
      <circle cx="200" cy="230" r="9" fill="#E3A33B"/>`, defs);
  },
  pirate() {
    const g = id('p');
    const defs = `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1d3d"/><stop offset=".55" stop-color="#0c3b5e"/><stop offset="1" stop-color="#0a2240"/></linearGradient>`;
    const wave = (y, amp, op, c) => {
      let d = `M0,${y}`;
      for (let x = 0; x <= 400; x += 20) d += ` Q${x + 10},${y + (x % 40 ? amp : -amp)} ${x + 20},${y}`;
      return `<path d="${d} L400,500 L0,500 Z" fill="${c}" opacity="${op}"/>`;
    };
    const rose = [...Array(8)].map((_, i) => `<path d="M0,0 L${i % 2 ? 9 : 14},0 L0,${i % 2 ? -46 : -78} Z" transform="rotate(${i * 45})" fill="${i % 2 ? '#7FD8F5' : '#F3EFFA'}" opacity=".85"/>`).join('');
    return svg(`<rect width="400" height="500" fill="url(#${g})"/>${stars(60, 3, 400, 500, 0.5)}
      <circle cx="300" cy="110" r="38" fill="#F3EFFA" opacity=".9"/><circle cx="316" cy="100" r="34" fill="#0c1d3d" opacity=".25"/>
      <path d="M300,300 L300,170" stroke="#7FD8F5" stroke-width="40" opacity=".08"/>
      ${wave(330, 10, 0.5, '#1E9BD7')}${wave(370, 12, 0.6, '#0f5f8f')}${wave(420, 9, 0.9, '#0a2a4a')}
      <g transform="translate(120 210)"><circle r="74" fill="none" stroke="#7FD8F5" stroke-width="2" opacity=".6"/><circle r="60" fill="rgba(30,155,215,.12)"/>${rose}<circle r="6" fill="#1E9BD7"/></g>`, defs);
  },
  cirque() {
    const g = id('c');
    const defs = `<radialGradient id="${g}" cx="50%" cy="10%" r="90%"><stop offset="0" stop-color="#3a1630"/><stop offset="1" stop-color="#150f26"/></radialGradient>`;
    let stripes = '';
    for (let i = 0; i < 12; i++) {
      const x1 = -40 + i * 40, x2 = x1 + 40;
      stripes += `<path d="M200,40 L${x1},500 L${x2},500 Z" fill="${i % 2 ? '#F0504F' : '#F7E9D7'}" opacity="${i % 2 ? 0.9 : 0.85}"/>`;
    }
    const bulbs = [...Array(13)].map((_, i) => { const t = i / 12; const x = 20 + t * 360; const y = 150 + Math.sin(t * Math.PI) * 50; return `<circle cx="${x}" cy="${y}" r="5" fill="#FFD23F"/><circle cx="${x}" cy="${y}" r="12" fill="#FFD23F" opacity=".18"/>`; }).join('');
    return svg(`<rect width="400" height="500" fill="url(#${g})"/>${stripes}
      <rect width="400" height="500" fill="#150f26" opacity=".35"/>
      <circle cx="200" cy="40" r="46" fill="#150f26"/>${stars(20, 11, 400, 80, 1)}
      <path d="M214,14 A30,30 0 1 0 214,66 A24,24 0 1 1 214,14 Z" fill="#FFD23F"/>
      <path d="M20,150 Q200,250 380,150" fill="none" stroke="#F7E9D7" stroke-width="1.5" opacity=".5"/>${bulbs}
      <ellipse cx="200" cy="470" rx="170" ry="34" fill="#FFD23F" opacity=".18"/>`, defs);
  },
  serpent() {
    const g = id('e'), d = id('d');
    const defs = `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2f2a"/><stop offset=".5" stop-color="#0F6E5B"/><stop offset="1" stop-color="#d79a2b"/></linearGradient>
      <linearGradient id="${d}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9B949"/><stop offset="1" stop-color="#9a6b1c"/></linearGradient>`;
    let coil = 'M200,330';
    for (let i = 0; i < 64; i++) { const a = i * 0.32, r = 14 + i * 1.35; coil += ` L${(200 + Math.cos(a) * r).toFixed(1)},${(250 + Math.sin(a) * r * 0.62).toFixed(1)}`; }
    return svg(`<rect width="400" height="500" fill="url(#${g})"/>${stars(30, 5, 400, 500, 0.35)}
      <circle cx="200" cy="250" r="96" fill="#E9B949" opacity=".16"/>
      <path d="${coil}" fill="none" stroke="#E9B949" stroke-width="9" stroke-linecap="round" opacity=".9"/>
      <path d="M0,390 C80,350 150,380 220,360 C300,338 350,360 400,350 L400,500 L0,500 Z" fill="url(#${d})"/>
      <path d="M0,440 C90,410 170,440 260,420 C330,404 370,418 400,412 L400,500 L0,500 Z" fill="#b27c22"/>
      <g fill="#FFE7A3">${[...Array(18)].map((_, i) => `<circle cx="${(i * 53) % 400}" cy="${300 + ((i * 29) % 120)}" r="${1 + (i % 3)}" opacity=".6"/>`).join('')}</g>`, defs);
  },
  portail() {
    const g = id('o'), r = id('r');
    const defs = `<radialGradient id="${g}" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#0d0a1c"/><stop offset=".42" stop-color="#17122E"/><stop offset=".5" stop-color="#8E5CFF"/><stop offset=".56" stop-color="#E3A33B"/><stop offset=".64" stop-color="#1E9BD7" stop-opacity=".5"/><stop offset="1" stop-color="#17122E"/></radialGradient>`;
    return svg(`<rect width="400" height="500" fill="#17122E"/>${stars(80, 13)}<circle cx="200" cy="250" r="190" fill="url(#${g})" opacity=".95"/>`, defs);
  },
  porte() {
    const g = id('q');
    const defs = `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFD98A" stop-opacity=".9"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></linearGradient>`;
    return svg(`<rect width="400" height="500" fill="#17122E"/>
      <path d="M170,90 L230,90 L400,500 L0,500 Z" fill="url(#${g})" opacity=".35"/>
      <rect x="130" y="60" width="140" height="300" rx="70" ry="70" fill="#FFD98A" opacity=".85"/>
      <path d="M130,130 A70,70 0 0 1 200,60 L200,360 L130,360 Z" fill="#3b2a1a"/>
      <path d="M200,60 L250,74 L250,372 L200,360 Z" fill="#5a3c22"/>
      <circle cx="238" cy="220" r="5" fill="#E3A33B"/>`, defs);
  },
  fete() {
    const g = id('f');
    const defs = `<radialGradient id="${g}" cx="50%" cy="70%" r="80%"><stop offset="0" stop-color="#4a2a6b"/><stop offset="1" stop-color="#17122E"/></radialGradient>`;
    const candle = (x, h, c) => `<g transform="translate(${x} ${400 - h})"><rect x="-7" y="0" width="14" height="${h}" rx="4" fill="${c}"/><path class="ph-flame" d="M0,-30 C10,-16 8,-6 0,-2 C-8,-6 -10,-16 0,-30 Z" fill="#FFD23F"/><circle cy="-14" r="18" fill="#FFD23F" opacity=".18"/></g>`;
    const conf = [...Array(40)].map((_, i) => `<rect x="${(i * 61) % 400}" y="${(i * 37) % 300}" width="6" height="12" rx="2" transform="rotate(${i * 23} ${(i * 61) % 400} ${(i * 37) % 300})" fill="${['#8E5CFF', '#E9B949', '#F0504F', '#1E9BD7'][i % 4]}" opacity=".7"/>`).join('');
    return svg(`<rect width="400" height="500" fill="url(#${g})"/>${conf}
      ${candle(130, 110, '#8E5CFF')}${candle(175, 140, '#F3EFFA')}${candle(220, 125, '#E9B949')}${candle(265, 100, '#1E9BD7')}
      <rect x="70" y="400" width="260" height="20" rx="10" fill="#2a1f55"/>`, defs);
  },
  cadeau() {
    return svg(`<rect width="400" height="500" fill="#221A45"/>${stars(40, 17)}
      <g transform="translate(200 250) rotate(-8)"><rect x="-150" y="-90" width="300" height="180" rx="18" fill="#8E5CFF"/>
      <circle cx="-150" cy="0" r="18" fill="#221A45"/><circle cx="150" cy="0" r="18" fill="#221A45"/>
      <line x1="60" y1="-80" x2="60" y2="80" stroke="#F3EFFA" stroke-dasharray="6 8" stroke-width="2" opacity=".6"/>
      <rect x="-130" y="-60" width="160" height="16" rx="8" fill="#F3EFFA" opacity=".9"/><rect x="-130" y="-30" width="110" height="10" rx="5" fill="#F3EFFA" opacity=".5"/>
      <path d="${gearPath(108, 0, 22, 10)}" fill="#E9B949"/></g>`);
  },
  ecole() {
    const piece = (x, y, c, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-40,-40 L-10,-40 C-10,-56 10,-56 10,-40 L40,-40 L40,-10 C56,-10 56,10 40,10 L40,40 L-40,40 Z" fill="${c}"/></g>`;
    return svg(`<rect width="400" height="500" fill="#221A45"/>${piece(130, 180, '#8E5CFF', -12)}${piece(250, 210, '#E9B949', 8)}${piece(170, 320, '#1E9BD7', 20)}${piece(290, 340, '#F0504F', -6)}`);
  },
};

export function art(world) {
  return (ART[world] || ART.portail)();
}

/* SVG d'une clé (clés cachées). */
export const KEY_SVG = `<svg viewBox="0 0 64 28" aria-hidden="true" focusable="false"><circle cx="12" cy="14" r="9" fill="none" stroke="currentColor" stroke-width="4"/><path d="M21 14 H60 M50 14 V23 M42 14 V21" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/></svg>`;
