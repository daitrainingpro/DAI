// Labo 3D de DAI! — trois propositions, une par section de lab/index.html.
//   1. nebula() : une nébuleuse où flottent les objets de la création « Foot »
//   2. shot()   : un tir au but en vraie 3D
//   3. docs()   : des documents présentés en cercle dans l'espace
// Chaque scène ne tourne que lorsqu'elle est à l'écran.
import * as THREE from '../js/vendor/three.module.min.js';

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = { night: 0x090b22, plum: 0x1f1140, ember: 0xff7d5c, lilac: 0xb7a6ff, pearl: 0xf4efff, moon: 0xffe7a3, pink: 0xff5fa8, violet: 0x7a3df0, sky: 0x75aadb, navy: 0x2b3f8f, skin: 0xf2c9a5, hair: 0x3a2212 };
let pixel = true;            // rendu en gros pixels (bouton en haut à droite)
const stages = [];

// --- Outils communs ---------------------------------------------------------
function makeStage(canvas, fov, coarse = 1) {   // coarse < 1 : pixels plus fins (texte à lire)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(C.night);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 400);
  const st = { renderer, scene, camera, canvas, visible: false, tick: null, onResize: null, aspect: 1 };
  st.resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setPixelRatio(pixel ? 1 / Math.max(1.5, (innerWidth < 700 ? 3 : 4) * coarse) : Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(r.width, r.height, false);
    canvas.style.imageRendering = pixel ? 'pixelated' : 'auto';
    st.aspect = camera.aspect = r.width / r.height;
    st.onResize && st.onResize();
    camera.updateProjectionMatrix();
  };
  let raf = 0, last = 0;
  const loop = (t) => {
    raf = 0;
    if (!st.visible || document.hidden) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    st.tick && st.tick(dt, t / 1000);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  st.kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver((e) => { st.visible = e[0].isIntersecting; st.kick(); }, { threshold: 0.05 }).observe(canvas);
  addEventListener('resize', st.resize);
  document.addEventListener('visibilitychange', st.kick);
  stages.push(st);
  return st;
}
const ndc = (e, canvas, out) => { const r = canvas.getBoundingClientRect(); return out.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
const flat = (color, extra) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...extra });
const cube = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
const paint = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t; };
function lights(scene) {
  scene.add(new THREE.AmbientLight(0xb7a6ff, 1.1));
  const a = new THREE.DirectionalLight(0xffe7d0, 2.2); a.position.set(4, 8, 6); scene.add(a);
  const b = new THREE.PointLight(C.pink, 60, 60); b.position.set(-6, 2, 4); scene.add(b);
}
function stars(count, radius) {
  const p = new Float32Array(count * 3), col = new Float32Array(count * 3), tint = [C.pearl, C.lilac, C.moon, C.pink].map((h) => new THREE.Color(h));
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.55 + Math.random() * 0.45));
    p.set([v.x, v.y, v.z], i * 3); const k = tint[i % 4]; col.set([k.r, k.g, k.b], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: radius / 70, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
}

// --- Les objets de la création ----------------------------------------------
function makeBall(r = 1) {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(r, 1);
  const cols = [C.pearl, C.pink, C.violet].map((h) => new THREE.Color(h)), arr = new Float32Array(geo.attributes.position.count * 3);
  for (let f = 0; f < arr.length / 9; f++) { const k = cols[(f * 7) % 5 < 3 ? 0 : (f % 2) + 1]; for (let v = 0; v < 3; v++) arr.set([k.r, k.g, k.b], f * 9 + v * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6 })));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: C.plum })));
  return g;
}
function makeGoal(w = 7.32, h = 2.44, d = 1.6) {
  const g = new THREE.Group(), post = flat(C.pearl, { emissive: C.pearl, emissiveIntensity: 0.35 }), t = 0.14;
  g.add(cube(t, h, t, post, -w / 2, h / 2, 0), cube(t, h, t, post, w / 2, h / 2, 0), cube(w + t, t, t, post, 0, h, 0));
  const pts = [];
  for (let i = 0; i <= 14; i++) { const x = -w / 2 + (w * i) / 14; pts.push(x, 0, -d, x, h, -d, x, h, -d, x, h, 0); }
  for (let j = 0; j <= 5; j++) { const y = (h * j) / 5; pts.push(-w / 2, y, -d, w / 2, y, -d, -w / 2, y, 0, -w / 2, y, -d, w / 2, y, 0, w / 2, y, -d); }
  const net = new THREE.BufferGeometry(); net.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(net, new THREE.LineBasicMaterial({ color: C.lilac, transparent: true, opacity: 0.55 })));
  return g;
}
// L'attaquant en cubes : maillot rayé ciel et blanc, cheveux longs, bandage à la cuisse.
function makeStriker() {
  const g = new THREE.Group(), u = 0.1;
  const stripes = paint(32, 32, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#75aadb'; x.fillRect(i * 4, 0, 4, 32); } });
  const face = paint(32, 32, (x) => {
    x.fillStyle = '#f2c9a5'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#fff'; x.fillRect(5, 9, 8, 8); x.fillRect(19, 7, 10, 10);
    x.fillStyle = '#1f1140'; x.fillRect(9, 12, 3, 3); x.fillRect(22, 11, 4, 4);
    x.fillStyle = '#3a2212'; x.fillRect(4, 5, 9, 2); x.fillRect(19, 3, 10, 2);
    x.fillStyle = '#5a1230'; x.fillRect(7, 21, 18, 8); x.fillStyle = '#fff'; x.fillRect(8, 21, 16, 3); x.fillStyle = '#ff6fb1'; x.fillRect(13, 26, 6, 3);
  });
  const band = paint(32, 32, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#dcd6f0'; for (let i = 0; i < 32; i += 6) x.fillRect(0, i, 32, 1); x.fillStyle = '#e0263c'; x.fillRect(13, 6, 6, 20); x.fillRect(6, 13, 20, 6); });
  const skin = flat(C.skin), shirt = new THREE.MeshStandardMaterial({ map: stripes, flatShading: true, roughness: 0.85 }), hair = flat(C.hair), sock = flat(C.navy), boot = flat(C.pink), short = flat(0x14143a);
  const head = cube(8 * u, 8 * u, 8 * u, [skin, skin, skin, skin, new THREE.MeshStandardMaterial({ map: face, roughness: 0.85 }), skin], 0, 31 * u, 0);
  g.add(head, cube(9 * u, 2.6 * u, 9 * u, hair, 0, 35.4 * u, -0.5 * u), cube(8.8 * u, 15 * u, 2.8 * u, hair, 0, 26 * u, -4.6 * u), cube(8.6 * u, 1.3 * u, 8.6 * u, flat(C.pink), 0, 34.2 * u, 0),
    cube(13 * u, 7 * u, 7.4 * u, shirt, 0, 23.4 * u, 0), cube(9.4 * u, 5 * u, 6 * u, shirt, 0, 17.6 * u, 0));
  const limb = (x, y, parts) => { const p = new THREE.Group(); p.position.set(x, y, 0); parts.forEach((m) => p.add(m)); g.add(p); return p; };
  const armL = limb(-8.4 * u, 26 * u, [cube(4.2 * u, 5 * u, 4.4 * u, flat(C.sky), 0, -2.2 * u, 0), cube(3.4 * u, 7 * u, 3.4 * u, skin, 0, -8 * u, 0)]);
  const armR = limb(8.4 * u, 26 * u, [cube(4.2 * u, 5 * u, 4.4 * u, flat(C.sky), 0, -2.2 * u, 0), cube(3.4 * u, 7 * u, 3.4 * u, skin, 0, -8 * u, 0)]);
  const leg = (x, bandage) => limb(x, 15.4 * u, [cube(4.6 * u, 4.4 * u, 5 * u, short, 0, -2 * u, 0), cube(4.2 * u, 4 * u, 4.6 * u, skin, 0, -6 * u, 0), cube(3.8 * u, 7 * u, 3.8 * u, sock, 0, -11.4 * u, 0), cube(4 * u, 2.2 * u, 6 * u, boot, 0, -14.4 * u, 1 * u),
    ...(bandage ? [cube(6.8 * u, 5.2 * u, 7 * u, new THREE.MeshStandardMaterial({ map: band, roughness: 0.9 }), 0, -6 * u, 0)] : [])]);
  const legL = leg(-2.6 * u, false), legR = leg(2.6 * u, true);
  g.userData = { armL, armR, legL, legR };
  return g;
}
function makeBandage() {
  const g = new THREE.Group();
  const tex = paint(64, 16, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 16); x.fillStyle = '#dcd6f0'; for (let i = 0; i < 64; i += 5) x.fillRect(i, 0, 1, 16); x.fillStyle = '#e0263c'; x.fillRect(28, 3, 8, 10); });
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = 3;
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.9, 10, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, flatShading: true })));
  const tail = cube(0.04, 0.9, 1.6, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }), 0.8, 0, 0.8); g.add(tail);
  return g;
}

// --- 1. Nébuleuse -----------------------------------------------------------
function nebula() {
  const canvas = document.getElementById('c-nebula'), tag = document.getElementById('tag');
  if (!canvas) return;
  const st = makeStage(canvas, 55), { scene, camera } = st;
  st.onResize = () => { camera.position.set(0, 1.5, st.aspect < 1 ? 26 : 17); camera.lookAt(0, 0, 0); };
  lights(scene);
  const col = (h) => ({ value: new THREE.Color(h) });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uT: { value: 0 }, uNight: col(C.night), uPlum: col(0x2a1458), uPink: col(C.pink), uViolet: col(C.violet), uEmber: col(C.ember) },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec3 vDir; uniform float uT; uniform vec3 uNight, uPlum, uPink, uViolet, uEmber;
      float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.02 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vDir);
        float n = fbm(d * 2.2 + vec3(0.0, uT * 0.02, 0.0));
        float m = fbm(d * 4.6 - vec3(uT * 0.015));
        float cloud = smoothstep(0.40, 0.74, n);
        vec3 c = mix(uNight, uPlum, n);
        c = mix(c, uPink, cloud * m * 1.25);
        c = mix(c, uViolet, smoothstep(0.45, 0.85, m) * cloud * 0.75);
        c += uEmber * pow(cloud * n, 3.0) * 1.1;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  scene.add(sky, stars(2600, 150));

  // Poussière de la nébuleuse : un disque spiralé autour duquel tournent les objets.
  const N = 5200, p = new Float32Array(N * 3), cl = new Float32Array(N * 3), tints = [C.pink, C.violet, C.ember, C.pearl, C.lilac].map((h) => new THREE.Color(h));
  for (let i = 0; i < N; i++) {
    const r = 1.5 + Math.pow(Math.random(), 0.7) * 12, a = r * 0.55 + (i % 3) * 2.094 + (Math.random() - 0.5) * 0.9;
    p.set([Math.cos(a) * r, (Math.random() - 0.5) * (2.6 - r * 0.14), Math.sin(a) * r], i * 3);
    const k = tints[Math.floor(Math.random() * tints.length)]; cl.set([k.r, k.g, k.b], i * 3);
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(p, 3)); dg.setAttribute('color', new THREE.BufferAttribute(cl, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  const world = new THREE.Group(); world.rotation.x = 0.32; world.add(dust); scene.add(world);

  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), flat(C.moon, { emissive: C.moon, emissiveIntensity: 0.7 }));
  const striker = makeStriker(); striker.scale.setScalar(0.85);
  const goal = makeGoal(); goal.scale.setScalar(0.62);
  const things = [
    { name: 'La lune', obj: moon, r: 0, y: 0, speed: 0, spin: 0.15 },
    { name: 'Le ballon', obj: makeBall(1.05), r: 5.2, y: 0.6, speed: 0.34, spin: 0.9 },
    { name: "L'attaquant", obj: striker, r: 7.6, y: -1.6, speed: 0.2, spin: 0.35, run: true },
    { name: 'La cage', obj: goal, r: 10.2, y: -0.8, speed: 0.13, spin: 0.22 },
    { name: 'Le bandage', obj: makeBandage(), r: 3.4, y: 1.3, speed: 0.52, spin: 1.2 },
    { name: 'Le deuxième ballon', obj: makeBall(0.6), r: 12, y: 1.6, speed: 0.1, spin: 0.7 },
  ];
  things.forEach((t, i) => { t.a = i * 1.7; t.pulse = 0; t.obj.userData.thing = t; world.add(t.obj); });

  // Glisser pour tourner, avec un peu d'élan.
  let yaw = 0, pitch = 0.32, vy = 0, down = null, moved = 0, hover = null;
  const ray = new THREE.Raycaster(), m = new THREE.Vector2();
  const pick = (e) => { ray.setFromCamera(ndc(e, canvas, m), camera); const hit = ray.intersectObjects(things.map((t) => t.obj), true)[0]; let o = hit && hit.object; while (o && !o.userData.thing) o = o.parent; return o ? o.userData.thing : null; };
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; moved = 0; });
  addEventListener('pointerup', (e) => { if (down && moved < 6) { const t = pick(e); if (t) t.pulse = 1; } down = null; });
  canvas.addEventListener('pointermove', (e) => {
    if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; moved += Math.abs(dx) + Math.abs(dy); vy = dx * 0.006; yaw += vy; pitch = Math.max(-0.5, Math.min(1.1, pitch + dy * 0.004)); down = { x: e.clientX, y: e.clientY }; }
    hover = e.pointerType === 'mouse' ? pick(e) : null;
    canvas.style.cursor = hover ? 'pointer' : 'grab';
    if (hover) { const r = canvas.getBoundingClientRect(); tag.textContent = hover.name; tag.style.left = e.clientX - r.left + 'px'; tag.style.top = e.clientY - r.top + 'px'; }
    tag.hidden = !hover;
  });
  canvas.addEventListener('pointerleave', () => { tag.hidden = true; hover = null; });

  st.tick = (dt, t) => {
    const k = calm ? 0.15 : 1;
    sky.material.uniforms.uT.value = t * k;
    if (!down) { yaw += vy; vy *= 0.94; yaw += dt * 0.05 * k; }
    world.rotation.set(pitch, yaw, 0);
    dust.rotation.y -= dt * 0.03 * k;
    for (const th of things) {
      th.a += dt * th.speed * k;
      th.obj.position.set(Math.cos(th.a) * th.r, th.y + Math.sin(t * 0.6 + th.r) * 0.3 * k, Math.sin(th.a) * th.r);
      th.obj.rotation.y += dt * th.spin * k; if (!th.run) th.obj.rotation.x += dt * th.spin * 0.4 * k;
      th.pulse = Math.max(0, th.pulse - dt * 1.8);
      const base = th.obj === striker ? 0.85 : th.obj === goal ? 0.62 : 1;
      th.obj.scale.setScalar(base * (1 + Math.sin(th.pulse * Math.PI) * 0.45) * (hover === th ? 1.12 : 1));
      if (th.run) { const s = Math.sin(t * 7) * 0.9 * k, d = th.obj.userData; d.legL.rotation.x = s; d.legR.rotation.x = -s; d.armL.rotation.x = -s; d.armR.rotation.x = s; }
    }
  };
  st.resize();
}

// --- 2. Tir au but ----------------------------------------------------------
function shot() {
  const canvas = document.getElementById('c-shot'), elScore = document.getElementById('score'), elShout = document.getElementById('shout');
  if (!canvas) return;
  const st = makeStage(canvas, 46), { scene, camera } = st;
  const GZ = -11, GW = 7.32, GH = 2.44;
  st.onResize = () => { const tall = st.aspect < 1; camera.fov = tall ? 72 : 46; camera.position.set(0, tall ? 2.3 : 1.7, tall ? 6.4 : 5.2); camera.lookAt(0, 1.15, GZ); };
  scene.fog = new THREE.Fog(C.plum, 18, 70); st.renderer.setClearColor(C.plum);
  lights(scene); scene.add(stars(900, 90));
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), flat(0x2a1458)); pitch.rotation.x = -Math.PI / 2; scene.add(pitch);
  const grid = new THREE.GridHelper(80, 40, C.pink, 0x5d2885); grid.position.y = 0.01; scene.add(grid);
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 1), flat(C.moon, { emissive: C.moon, emissiveIntensity: 0.8, fog: false })); moon.position.set(9, 10, -40); scene.add(moon);
  const goal = makeGoal(GW, GH); goal.position.z = GZ; scene.add(goal);
  const keeper = makeStriker(); keeper.scale.setScalar(0.52); keeper.position.set(0, 0, GZ + 0.5); scene.add(keeper);
  const ball = makeBall(0.22); scene.add(ball);
  const aimMark = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.24, 4), new THREE.MeshBasicMaterial({ color: C.moon, side: THREE.DoubleSide, transparent: true, opacity: 0.95, fog: false })); scene.add(aimMark);
  const sparkGeo = new THREE.BufferGeometry(), SP = 90, sp = new Float32Array(SP * 3), sv = [];
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: C.moon, size: 0.14, transparent: true, opacity: 0, fog: false })); scene.add(sparks);

  const START = new THREE.Vector3(0, 0.22, 0), aim = new THREE.Vector3(0, 1.2, GZ), from = new THREE.Vector3(), to = new THREE.Vector3();
  let goals = 0, shots = 0, phase = 'aim', k = 0, wait = 0, keeperTo = 0, sparkLife = 0;
  const ray = new THREE.Raycaster(), m = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -GZ), hit = new THREE.Vector3();
  const clampAim = () => { aim.x = Math.max(-5, Math.min(5, aim.x)); aim.y = Math.max(0.2, Math.min(3.7, aim.y)); };
  const say = (txt) => { elShout.textContent = txt; };
  const score = () => { elScore.textContent = `${goals} but${goals > 1 ? 's' : ''} · ${shots} tir${shots > 1 ? 's' : ''}`; };
  const shoot = () => {
    if (phase !== 'aim') return;
    phase = 'fly'; k = 0; shots++; from.copy(START); to.copy(aim); say('');
    const err = Math.max(1.2, 5 - goals * 0.6);       // le gardien lit de mieux en mieux
    keeperTo = Math.max(-3.2, Math.min(3.2, to.x + (Math.random() - 0.5) * err));
  };
  canvas.addEventListener('pointermove', (e) => { if (phase !== 'aim') return; ray.setFromCamera(ndc(e, canvas, m), camera); if (ray.ray.intersectPlane(plane, hit)) { aim.copy(hit); clampAim(); } });
  canvas.addEventListener('click', (e) => { ray.setFromCamera(ndc(e, canvas, m), camera); if (phase === 'aim' && ray.ray.intersectPlane(plane, hit)) { aim.copy(hit); clampAim(); } shoot(); });
  canvas.addEventListener('keydown', (e) => {
    const step = 0.35, keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (keys[e.key]) { aim.x += keys[e.key][0]; aim.y += keys[e.key][1]; clampAim(); e.preventDefault(); }
    if (e.key === ' ' || e.key === 'Enter') { shoot(); e.preventDefault(); }
  });

  st.tick = (dt, t) => {
    const d = keeper.userData, speed = 1.1 + goals * 0.22;
    if (phase === 'aim') {
      keeper.position.x = Math.sin(t * speed) * 2.5; keeper.rotation.z = 0;
      const s = Math.sin(t * 9) * 0.5; d.legL.rotation.x = s; d.legR.rotation.x = -s; d.armL.rotation.z = -1.1; d.armR.rotation.z = 1.1;
      ball.position.copy(START);
    } else if (phase === 'fly') {
      k = Math.min(1, k + dt / 0.55);
      ball.position.lerpVectors(from, to, k); ball.position.y += Math.sin(k * Math.PI) * 0.55; ball.rotation.x -= dt * 16;
      const dx = keeperTo - keeper.position.x; keeper.position.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 5.2);
      keeper.rotation.z = -Math.sign(dx) * Math.min(1, Math.abs(dx)) * 0.9; d.armL.rotation.z = -2.6; d.armR.rotation.z = 2.6;
      if (k === 1) {
        const inside = Math.abs(to.x) < GW / 2 - 0.15 && to.y < GH - 0.12, saved = inside && Math.abs(to.x - keeper.position.x) < 0.8 && to.y < 2.1;
        if (inside && !saved) { goals++; say('But !'); sparkLife = 1; for (let i = 0; i < SP; i++) { sp.set([to.x, to.y, GZ], i * 3); sv[i] = new THREE.Vector3().randomDirection().multiplyScalar(2 + Math.random() * 5); } }
        else say(saved ? 'Arrêté' : 'À côté');
        score(); phase = 'done'; wait = 1.1;
      }
    } else {
      wait -= dt; if (inside(to) && elShout.textContent === 'But !') ball.position.z = Math.max(GZ - 1.2, ball.position.z - dt * 3);
      if (wait <= 0) { phase = 'aim'; say(''); }
    }
    aimMark.position.copy(aim).z += 0.05; aimMark.rotation.z = t * 2; aimMark.visible = phase === 'aim';
    if (sparkLife > 0) { sparkLife -= dt * 0.9; for (let i = 0; i < SP; i++) { sv[i].y -= dt * 6; sp[i * 3] += sv[i].x * dt; sp[i * 3 + 1] += sv[i].y * dt; sp[i * 3 + 2] += sv[i].z * dt; } sparkGeo.attributes.position.needsUpdate = true; }
    sparks.material.opacity = Math.max(0, sparkLife);
  };
  const inside = (v) => Math.abs(v.x) < GW / 2 - 0.15 && v.y < GH - 0.12;
  score(); st.resize();
}

// --- 3. Documents dans l'espace ---------------------------------------------
// Pour changer les cartes : modifier ce tableau. Ce sont des exemples, sans vrai document derrière.
const DOCS = [
  { type: 'Dossier', title: 'Foot', sub: "Note d'intention", color: '#ff5fa8', text: "Exemple : le dossier de création, à lire ou à télécharger en PDF." },
  { type: 'Workshop', title: 'Otto Ramstad', sub: '10 – 15 mai 2027 · Cabasse', color: '#7a3df0', text: "Exemple : le programme des six jours, les horaires et les infos pratiques." },
  { type: 'Images', title: 'Résidence', sub: 'Strasbourg · novembre 2026', color: '#ff7d5c', text: "Exemple : une série de photos ou une vidéo de la résidence." },
  { type: 'Source', title: 'Lectures', sub: 'Ce qui nourrit le projet', color: '#2b3f8f', text: "Exemple : une liste de livres, films et liens qui servent de sources." },
  { type: 'Son', title: 'Écoutes', sub: 'Playlist de travail', color: '#b7a6ff', text: "Exemple : des morceaux ou des enregistrements de studio." },
  { type: 'Asso', title: 'Adhérer', sub: '5 € par année civile', color: '#ffe7a3', text: "Exemple : le bulletin d'adhésion et le lien de paiement." },
  { type: 'Presse', title: 'On en parle', sub: 'Articles et retours', color: '#75aadb', text: "Exemple : des articles, des citations, des retours de participants." },
];
async function docs() {
  const canvas = document.getElementById('c-docs');
  if (!canvas) return;
  try { await Promise.all([document.fonts.load('96px Anton'), document.fonts.load('28px "Instrument Sans"')]); } catch (e) { /* polices de secours */ }
  const st = makeStage(canvas, 42, 0.5), { scene, camera } = st;
  st.onResize = () => { camera.position.set(0, 0.3, st.aspect < 1 ? 13.5 : 9.4); camera.lookAt(0, 0, 0); };
  scene.add(new THREE.AmbientLight(0xffffff, 2.4), stars(1400, 80));
  const R = 4.3, step = (Math.PI * 2) / DOCS.length, ring = new THREE.Group(); ring.position.y = 0.75; scene.add(ring);
  const cards = DOCS.map((d, i) => {
    const dark = d.color === '#ffe7a3' || d.color === '#b7a6ff' || d.color === '#75aadb';
    const tex = paint(512, 704, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, d.color); g.addColorStop(1, '#1f1140'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#09061a33'; for (let y = 0; y < h; y += 8) x.fillRect(0, y, w, 1);
      const ink = dark ? '#090b22' : '#f4efff';
      x.fillStyle = ink; x.font = '28px ui-monospace, Menlo, monospace'; x.fillText(d.type.toUpperCase(), 40, 70); x.fillText(String(i + 1).padStart(2, '0'), w - 80, 70);
      x.font = '96px Anton, Impact, sans-serif'; let y = 380; for (const line of d.title.toUpperCase().split(' ')) { x.fillText(line, 40, y); y += 100; }
      x.fillStyle = '#f4efff'; x.font = '28px "Instrument Sans", sans-serif'; x.fillText(d.sub, 40, h - 50);
      x.strokeStyle = ink; x.lineWidth = 6; x.strokeRect(14, 14, w - 28, h - 28);
    });
    tex.magFilter = THREE.LinearFilter;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    const a = i * step; m.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); m.rotation.y = a; m.userData.i = i; ring.add(m); return m;
  });
  const panel = document.getElementById('panel'), pType = document.getElementById('panel-type'), pTitle = document.getElementById('panel-title'), pText = document.getElementById('panel-text'), pClose = document.getElementById('panel-close');
  let index = 0, rot = 0, drag = null, moved = 0;
  const mod = (n) => ((n % DOCS.length) + DOCS.length) % DOCS.length;
  const open = () => { const d = DOCS[mod(index)]; pType.textContent = d.type + ' · ' + d.sub; pTitle.textContent = d.title; pText.textContent = d.text; panel.hidden = false; pClose.focus(); };
  const close = () => { if (!panel.hidden) { panel.hidden = true; canvas.focus(); } };
  const go = (n) => { index += n; close(); };
  document.getElementById('prev').addEventListener('click', () => go(-1));
  document.getElementById('next').addEventListener('click', () => go(1));
  pClose.addEventListener('click', close);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  canvas.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'Enter' || e.key === ' ') { open(); e.preventDefault(); } });
  const ray = new THREE.Raycaster(), m = new THREE.Vector2();
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, rot }; moved = 0; });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x; moved = Math.max(moved, Math.abs(dx)); rot = drag.rot + dx * 0.006; });
  addEventListener('pointerup', (e) => {
    if (!drag) return; drag = null;
    if (moved > 8) { index = Math.round(-rot / step); return; }
    ray.setFromCamera(ndc(e, canvas, m), camera); const hit = ray.intersectObjects(cards)[0]; if (!hit) return;
    const i = hit.object.userData.i; if (i === mod(index)) open(); else { let d = i - mod(index); if (d > DOCS.length / 2) d -= DOCS.length; if (d < -DOCS.length / 2) d += DOCS.length; go(d); }
  });
  st.tick = (dt, t) => {
    if (!drag) rot += (-index * step - rot) * Math.min(1, dt * (calm ? 30 : 6));
    ring.rotation.y = rot;
    cards.forEach((c, i) => { const front = i === mod(index); c.position.y = calm ? 0 : Math.sin(t * 0.8 + i) * 0.12; c.scale.setScalar(c.scale.x + ((front ? 1.14 : 0.92) - c.scale.x) * Math.min(1, dt * 8)); });
  };
  st.resize();
}

// --- Démarrage --------------------------------------------------------------
const btn = document.getElementById('pixel');
btn && btn.addEventListener('click', () => { pixel = !pixel; btn.textContent = 'Pixel : ' + (pixel ? 'oui' : 'non'); btn.setAttribute('aria-pressed', String(pixel)); stages.forEach((s) => s.resize()); });
for (const start of [nebula, shot, docs]) { try { start(); } catch (e) { console.error(e); } }
