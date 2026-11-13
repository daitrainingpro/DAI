// Curseur : un petit joueur en 3D (cubes CSS) qui suit la souris, ballon au pied.
// Au clic, il frappe : la jambe part, le ballon s'envole puis revient.
// Tout est ici (styles compris). Pour le retirer : supprimer l'import dans main.js.
export function startCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = document.createElement('style');
  css.textContent = `
    html.has-player, html.has-player * { cursor: none !important; }
    .player { position: fixed; left: 0; top: 0; z-index: 9999; pointer-events: none; opacity: 0; transition: opacity .2s; will-change: transform; }
    .player.on { opacity: 1; }
    .player__flip { transition: transform .12s steps(3); }
    .player__fig { position: absolute; left: -22px; top: 2px; transform-style: preserve-3d; transform: scale(1.5) rotateX(-18deg) rotateY(-32deg); }
    .player__fig * { position: absolute; transform-style: preserve-3d; }
    .player__ball { position: absolute; left: -7px; top: -7px; width: 14px; height: 14px; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #fff 0 22%, #ffd1ea 23% 45%, #b7a6ff 46% 70%, #5d2885 71%); box-shadow: 0 0 0 1.5px #1f1140, 0 3px 0 #09061a66; }
  `;
  document.head.appendChild(css);

  // Un pavé : six faces, chacune un peu plus sombre que la précédente.
  const box = (w, h, d, color) => {
    const b = document.createElement('div');
    const faces = [
      [w, h, `translateZ(${d / 2}px)`, 1],
      [w, h, `rotateY(180deg) translateZ(${d / 2}px)`, .6],
      [d, h, `rotateY(90deg) translateZ(${w / 2}px)`, .8],
      [d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, .7],
      [w, d, `rotateX(90deg) translateZ(${h / 2}px)`, 1.15],
      [w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, .5],
    ];
    for (const [fw, fh, t, l] of faces) {
      const f = document.createElement('div');
      f.style.cssText = `width:${fw}px;height:${fh}px;left:${-fw / 2}px;top:${-fh / 2}px;background:${color};filter:brightness(${l});transform:${t};`;
      b.appendChild(f);
    }
    return b;
  };
  const part = (x, y, z, el) => { const p = document.createElement('div'); p.style.transform = `translate3d(${x}px,${y}px,${z}px)`; p.appendChild(el); return p; };

  const root = document.createElement('div'); root.className = 'player'; root.setAttribute('aria-hidden', 'true');
  const flip = document.createElement('div'); flip.className = 'player__flip';
  const fig = document.createElement('div'); fig.className = 'player__fig';
  const SKIN = '#f2c9a5', SHIRT = '#ff5fa8', SHORT = '#5d2885', SOCK = '#f4efff';
  // Le joueur regarde vers la droite (+x). y = 0 au sol, négatif vers le haut.
  fig.appendChild(part(0, -27, 0, box(7, 7, 7, SKIN)));       // tête
  fig.appendChild(part(0, -18, 0, box(6, 10, 9, SHIRT)));     // buste
  fig.appendChild(part(0, -18, -6, box(3, 9, 3, SKIN)));      // bras
  fig.appendChild(part(0, -18, 6, box(3, 9, 3, SKIN)));
  const leg = (z) => {                                         // jambe articulée à la hanche
    const hip = part(0, -13, z, document.createElement('div'));
    hip.appendChild(part(0, 3, 0, box(4, 6, 4, SHORT)));
    hip.appendChild(part(0, 9.5, 0, box(3.4, 7, 3.4, SOCK)));
    return hip;
  };
  const legBack = leg(-2.4), legKick = leg(2.4);
  fig.append(legBack, legKick);
  const ball = document.createElement('div'); ball.className = 'player__ball';
  flip.append(fig, ball); root.appendChild(flip); document.body.appendChild(root);
  document.documentElement.classList.add('has-player');

  let x = 0, y = 0, lastX = 0, dir = 1, queued = false;
  const place = () => { queued = false; root.style.transform = `translate3d(${x}px,${y}px,0)`; };
  addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (Math.abs(x - lastX) > 14) { dir = x > lastX ? 1 : -1; lastX = x; flip.style.transform = `scaleX(${dir})`; }
    root.classList.add('on');
    if (!queued) { queued = true; requestAnimationFrame(place); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => root.classList.remove('on'));

  addEventListener('pointerdown', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const hipT = (z) => `translate3d(0px,-13px,${z}px)`;
    legKick.animate([
      { transform: hipT(2.4) + ' rotateZ(55deg)' },
      { transform: hipT(2.4) + ' rotateZ(-80deg)', offset: .45 },
      { transform: hipT(2.4) + ' rotateZ(0deg)' },
    ], { duration: 300, easing: 'steps(6)' });
    if (calm) return;
    ball.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: 'translate(48px,-46px) scale(.8)', offset: .4 },
      { transform: 'translate(82px,-30px) scale(.55)', opacity: 1, offset: .7 },
      { transform: 'translate(96px,4px) scale(.4)', opacity: 0, offset: .9 },
      { transform: 'translate(0,0) scale(1)', opacity: 0, offset: .91 },
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
    ], { duration: 620, easing: 'linear' });
  }, { passive: true });
}
