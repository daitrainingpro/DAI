// Curseur : un attaquant en 3D (cubes CSS) qui suit la souris, ballon au pied.
// Il court quand la souris bouge ; au clic, il frappe et le ballon s'envole.
// Tout est ici (styles compris). Pour le retirer : supprimer l'import dans main.js.
export function startCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SIZE = 3.6; // taille du joueur : augmenter pour le grossir

  const css = document.createElement('style');
  css.textContent = `
    html.has-player, html.has-player * { cursor: none !important; }
    .player { position: fixed; left: 0; top: 0; z-index: 9999; pointer-events: none; opacity: 0; transition: opacity .2s; will-change: transform; }
    .player.on { opacity: 1; }
    .player__flip { transition: transform .12s steps(3); }
    .player__shadow { position: absolute; left: ${-17 * SIZE}px; top: ${1.2 * SIZE}px; width: ${15 * SIZE}px; height: ${3.4 * SIZE}px; border-radius: 50%; background: #09061a55; }
    .player__fig { position: absolute; left: ${-14 * SIZE}px; top: ${2.6 * SIZE}px; transform-style: preserve-3d; transform: scale(${SIZE}) rotateX(-16deg) rotateY(-34deg); }
    .player__fig * { position: absolute; transform-style: preserve-3d; }
    .player__fig i { display: block; box-shadow: inset 0 0 0 .4px #1f1140aa; }   /* contour de chaque volume */
    .player__ball { position: absolute; left: ${-3.6 * SIZE}px; top: ${-3.6 * SIZE}px; width: ${7.2 * SIZE}px; height: ${7.2 * SIZE}px; border-radius: 50%;
      background: radial-gradient(circle at 50% 50%, #fff 0 22%, transparent 23%), conic-gradient(from 18deg, #ff6fb1 0 60deg, #fff 60deg 120deg, #7a3df0 120deg 180deg, #fff 180deg 240deg, #ff6fb1 240deg 300deg, #7a3df0 300deg);
      box-shadow: 0 0 0 1.5px #1f1140, inset -3px -4px 0 #1f114033, 0 3px 0 #09061a66; }
    .player.run .player__ball { animation: p-roll .36s linear infinite; }
    .player.run .sw-a { animation: p-run .36s steps(6) infinite; }
    .player.run .sw-b { animation: p-run .36s steps(6) infinite reverse; }
    .player.run .player__fig { animation: p-bob .18s steps(2) infinite; }
    @keyframes p-run { 0%, 100% { transform: rotateZ(48deg); } 50% { transform: rotateZ(-48deg); } }
    @keyframes p-roll { to { rotate: 360deg; } }
    @keyframes p-bob { 50% { translate: 0 ${-0.5 * SIZE}px; } }
    .face { background:
      radial-gradient(circle at 26% 34%, #1f1140 0 .55px, #fff .6px 1.5px, transparent 1.6px),
      radial-gradient(circle at 74% 30%, #1f1140 0 .8px, #fff .85px 1.9px, transparent 2px),
      linear-gradient(#ff6fb1, #ff6fb1) 50% 92% / 1.6px 1.6px no-repeat,
      linear-gradient(#fff, #fff) 50% 70% / 4.2px .8px no-repeat,
      linear-gradient(#5a1230, #5a1230) 50% 80% / 4.6px 2.4px no-repeat; }
    .brow { background: linear-gradient(#3a2212, #3a2212) 12% 12% / 2.2px .7px no-repeat, linear-gradient(#3a2212, #3a2212) 88% 4% / 2.4px .7px no-repeat; }
  `;
  document.head.appendChild(css);

  // Un pavé : six faces, chacune éclairée différemment.
  const box = (w, h, d, color) => {
    const b = document.createElement('div');
    const faces = [
      [w, h, `translateZ(${d / 2}px)`, 1],
      [w, h, `rotateY(180deg) translateZ(${d / 2}px)`, .6],
      [d, h, `rotateY(90deg) translateZ(${w / 2}px)`, .82],
      [d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, .7],
      [w, d, `rotateX(90deg) translateZ(${h / 2}px)`, 1.15],
      [w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, .5],
    ];
    for (const [fw, fh, t, l] of faces) {
      const f = document.createElement('i');
      f.style.cssText = `width:${fw}px;height:${fh}px;left:${-fw / 2}px;top:${-fh / 2}px;background:${color};filter:brightness(${l});transform:${t};`;
      b.appendChild(f);
    }
    return b;
  };
  const part = (x, y, z, ...els) => { const p = document.createElement('div'); p.style.transform = `translate3d(${x}px,${y}px,${z}px)`; p.append(...els); return p; };
  const swing = (cls, ...els) => { const s = document.createElement('div'); s.className = cls; s.append(...els); return s; };
  // Un dessin plaqué sur la face avant (le joueur regarde vers +x).
  const decal = (cls, x, y, w, h) => { const d = document.createElement('div'); d.className = cls; d.style.cssText = `width:${w}px;height:${h}px;left:${-w / 2}px;top:${-h / 2}px;transform:translate3d(${x}px,${y}px,0) rotateY(90deg);`; return d; };

  const SKIN = '#f2c9a5', STRIPES = 'repeating-linear-gradient(90deg,#75aadb 0 1.6px,#ffffff 1.6px 3.2px)', SLEEVE = '#75aadb',
    SHORT = '#14143a', SOCK = '#2b3f8f', BOOT = '#ff5fa8', BAND = 'linear-gradient(#e0263c,#e0263c) 50% 50% / 2.6px .9px no-repeat, linear-gradient(#e0263c,#e0263c) 50% 50% / .9px 2.6px no-repeat, repeating-linear-gradient(0deg,#ffffff 0 1.2px,#dcd6f0 1.2px 1.5px)', HAIR = '#3a2212';

  const root = document.createElement('div'); root.className = 'player'; root.setAttribute('aria-hidden', 'true');
  const flip = document.createElement('div'); flip.className = 'player__flip';
  const shadow = document.createElement('div'); shadow.className = 'player__shadow';
  const fig = document.createElement('div'); fig.className = 'player__fig';
  // y = 0 au sol, négatif vers le haut. Profondeur = z (épaules larges).
  fig.append(
    part(0, -31, 0, box(8, 8, 8, SKIN)),                                   // tête
    decal('face', 4.05, -30.6, 8, 8), decal('brow', 4.08, -32.4, 8, 3),    // la tête marrante : yeux de travers, grand sourire
    part(-.5, -35.4, 0, box(9, 2.6, 8.8, HAIR)),                           // cheveux : le dessus…
    part(-4.6, -26, 0, box(2.8, 15, 8.8, HAIR)),                           // …et la longueur dans le dos
    part(0, -34.2, 0, box(8.6, 1.3, 8.6, '#ff5fa8')),                      // bandeau
    part(0, -23.4, 0, box(7.4, 7, 13, STRIPES)),                           // pectoraux et épaules
    part(0, -17.6, 0, box(6, 5, 9.4, STRIPES)),                            // taille
    part(0, -27.2, 0, box(3.4, 1.4, 4, SKIN)),                             // cou
    part(3.72, -24.6, 0, box(.1, 3.4, 11, '#75aadb')),                     // ligne des pectoraux
  );
  const arm = (z, cls) => part(0, -26, z, swing(cls,
    part(0, 2.2, 0, box(4.4, 5, 4.2, SLEEVE)),                             // biceps
    part(.3, 7.2, 0, box(3.4, 5.4, 3.4, SKIN)),
    part(.3, 10.6, 0, box(3.8, 2, 3.8, SKIN))));
  const leg = (z, cls, bandage) => {                                       // jambe articulée à la hanche
    const s = swing(cls,
      part(0, 2, 0, box(5, 4.4, 4.6, SHORT)),
      part(0, 6, 0, box(4.6, 4, 4.2, SKIN)),                               // cuisse
      part(0, 11.4, 0, box(3.8, 7, 3.8, SOCK)),
      part(1, 14.4, 0, box(6, 2.2, 4, BOOT)));                             // crampon
    if (bandage) s.appendChild(part(0, 6, 0, box(7, 5.2, 6.8, BAND)));   // le gros bandage à la cuisse
    return [part(0, -15.4, z, s), s];
  };
  const [legA] = leg(-2.6, 'sw-a', false);
  const [legB, kick] = leg(2.6, 'sw-b', true);
  fig.append(arm(-8.4, 'sw-b'), arm(8.4, 'sw-a'), legA, legB);
  const ball = document.createElement('div'); ball.className = 'player__ball';
  flip.append(shadow, fig, ball); root.appendChild(flip); document.body.appendChild(root);
  document.documentElement.classList.add('has-player');

  let x = 0, y = 0, lastX = 0, dir = 1, queued = false, stop = 0;
  const place = () => { queued = false; root.style.transform = `translate3d(${x}px,${y}px,0)`; };
  addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (Math.abs(x - lastX) > 14) { dir = x > lastX ? 1 : -1; lastX = x; flip.style.transform = `scaleX(${dir})`; }
    root.classList.add('on');
    if (!calm) { root.classList.add('run'); clearTimeout(stop); stop = setTimeout(() => root.classList.remove('run'), 160); }
    if (!queued) { queued = true; requestAnimationFrame(place); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => root.classList.remove('on'));

  addEventListener('pointerdown', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    root.classList.remove('run');
    kick.animate([
      { transform: 'rotateZ(60deg)' },
      { transform: 'rotateZ(-85deg)', offset: .45 },
      { transform: 'rotateZ(0deg)' },
    ], { duration: 320, easing: 'steps(6)' });
    if (calm) return;
    const u = SIZE * 10;
    ball.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${3 * u}px,${-2.9 * u}px) scale(.8)`, offset: .4 },
      { transform: `translate(${5.2 * u}px,${-1.9 * u}px) scale(.55)`, opacity: 1, offset: .7 },
      { transform: `translate(${6.2 * u}px,${.3 * u}px) scale(.4)`, opacity: 0, offset: .9 },
      { transform: 'translate(0,0) scale(1)', opacity: 0, offset: .91 },
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
    ], { duration: 640, easing: 'linear' });
  }, { passive: true });
}
