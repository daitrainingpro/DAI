// Scène 3D de l'ouverture : un ruban de particules qui ondule comme une trace de mouvement.
// Isolée ici : si WebGL manque ou si ce fichier échoue, la page reste entière et lisible.
import * as THREE from './vendor/three.module.min.js';

export function startScene(canvas, hero) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 700px)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (e) {
    return null; // pas de WebGL : on garde le fond bleu uni
  }
  renderer.setClearColor(0x000000, 0);
  // Basse résolution volontaire : un pixel de la scène vaut plusieurs pixels d'écran (voir image-rendering dans le CSS).
  const PIXEL = small ? 3 : 4;
  renderer.setPixelRatio(1 / PIXEL);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);

  const COUNT = small ? 1500 : 3200;
  const aT = new Float32Array(COUNT);
  const aOff = new Float32Array(COUNT * 3);
  const aSize = new Float32Array(COUNT);
  const aTone = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    aT[i] = Math.random();
    // décalage autour du ruban : resserré au centre, quelques grains plus loin
    const r = Math.pow(Math.random(), 2.2);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    aOff[i * 3] = r * Math.sin(ph) * Math.cos(th);
    aOff[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    aOff[i * 3 + 2] = r * Math.cos(ph);
    aSize[i] = 0.6 + Math.random() * 1.6;
    aTone[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  geo.setAttribute('aOff', new THREE.BufferAttribute(aOff, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geo.setAttribute('aTone', new THREE.BufferAttribute(aTone, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uA: { value: new THREE.Color('#f4efff') },   // perle
      uB: { value: new THREE.Color('#ff9a78') },   // braise
      uC: { value: new THREE.Color('#b7a6ff') },   // lilas
    },
    vertexShader: /* glsl */`
      attribute float aT; attribute vec3 aOff; attribute float aSize; attribute float aTone;
      uniform float uTime; uniform float uScale;
      varying float vTone; varying float vFade;
      vec3 path(float t, float time) {
        float a = t * 6.2831853;
        return vec3(
          sin(a + time * 0.21) * 2.9 + sin(a * 3.0 - time * 0.13) * 0.55,
          sin(a * 2.0 + time * 0.31) * 1.15 + cos(a * 5.0 + time * 0.17) * 0.28,
          cos(a * 3.0 + time * 0.17) * 1.5
        );
      }
      void main() {
        float t = aT + uTime * 0.012;
        float a = t * 6.2831853;
        float spread = 0.10 + 0.34 * (0.5 + 0.5 * sin(a * 4.0 + uTime * 0.6 + aOff.x * 5.0));
        vec3 p = path(t, uTime) + aOff * spread;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale * (9.0 / -mv.z);
        vTone = aTone;
        vFade = smoothstep(-11.0, -4.5, mv.z);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
      varying float vTone; varying float vFade;
      void main() {
        float alpha = 1.0; // grain carré, pas de disque adouci
        vec3 col = vTone < 0.45 ? uA : (vTone < 0.75 ? uC : uB);
        gl_FragColor = vec4(col, alpha * (0.45 + 0.55 * vFade));
      }
    `,
  });

  const points = new THREE.Points(geo, mat);

  // Lucioles : de grandes lueurs floues, peu nombreuses, qui dérivent lentement devant et derrière le ruban.
  const ORBS = small ? 14 : 26;
  const oPos = new Float32Array(ORBS * 3), oSeed = new Float32Array(ORBS), oSize = new Float32Array(ORBS), oTone = new Float32Array(ORBS);
  for (let i = 0; i < ORBS; i++) {
    oPos[i * 3] = (Math.random() - 0.5) * 11;
    oPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    oPos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
    oSeed[i] = Math.random() * 100;
    oSize[i] = 5 + Math.random() * 12;
    oTone[i] = Math.random();
  }
  const oGeo = new THREE.BufferGeometry();
  oGeo.setAttribute('position', new THREE.BufferAttribute(oPos, 3));
  oGeo.setAttribute('aSeed', new THREE.BufferAttribute(oSeed, 1));
  oGeo.setAttribute('aSize', new THREE.BufferAttribute(oSize, 1));
  oGeo.setAttribute('aTone', new THREE.BufferAttribute(oTone, 1));
  oGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
  const oMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: mat.uniforms.uTime, uScale: mat.uniforms.uScale, uA: mat.uniforms.uA, uB: mat.uniforms.uB, uC: mat.uniforms.uC },
    vertexShader: /* glsl */`
      attribute float aSeed; attribute float aSize; attribute float aTone;
      uniform float uTime; uniform float uScale;
      varying float vTone; varying float vPulse;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.11 + aSeed) * 0.7;
        p.y += cos(uTime * 0.09 + aSeed * 1.7) * 0.5 + sin(uTime * 0.05 + aSeed) * 0.3;
        p.z += sin(uTime * 0.07 + aSeed * 0.6) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale * (7.0 / -mv.z);
        vTone = aTone;
        vPulse = 0.55 + 0.45 * sin(uTime * 0.5 + aSeed * 3.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
      varying float vTone; varying float vPulse;
      void main() {
        vec2 q = abs(gl_PointCoord - 0.5);
        float d = max(q.x, q.y);              // lueur carrée, en paliers
        float glow = floor((1.0 - d * 2.0) * 4.0) / 4.0;
        vec3 col = vTone < 0.4 ? uC : (vTone < 0.8 ? uB : uA);
        gl_FragColor = vec4(col, glow * 0.22 * vPulse);
      }
    `,
  });
  const orbs = new THREE.Points(oGeo, oMat);
  scene.add(orbs);

  // Le ballon : une sphère sombre gainée de lignes claires. Un clic dans l'ouverture le fait bondir.
  const ball = new THREE.Group();
  const ico = new THREE.IcosahedronGeometry(0.62, 1);
  ball.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 3), new THREE.MeshBasicMaterial({ color: 0x2a1650, transparent: true, opacity: 0.92 })));
  ball.add(new THREE.LineSegments(new THREE.EdgesGeometry(ico), new THREE.LineBasicMaterial({ color: 0xf4efff, transparent: true, opacity: 0.9 })));
  ball.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.66, 0)), new THREE.LineBasicMaterial({ color: 0xff9a78, transparent: true, opacity: 0.55 })));
  scene.add(ball);
  const ballState = { baseX: 2.3, baseY: -0.5, y: 0, vy: 0, spin: 0.4 };
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    ballState.vy = 5.2; ballState.spin = 7;
    wake();
  });
  // on décale le ruban vers la droite sur grand écran, pour laisser le texte respirer à gauche
  scene.add(points);

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    mat.uniforms.uScale.value = 1.15;
    points.position.x = w > 900 ? 1.6 : 0.2;
    points.position.y = w > 900 ? 0.2 : 0.9;
    points.scale.setScalar(w > 900 ? 1 : 0.72);
    ballState.baseX = w > 900 ? 2.5 : 1.15;
    ballState.baseY = w > 900 ? -0.9 : 1.75;
    ball.scale.setScalar(w > 900 ? 1 : 0.62);
  }
  resize();
  new ResizeObserver(resize).observe(hero);

  // le ruban pivote doucement vers le pointeur
  const target = { x: 0, y: 0 };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });

  const clock = new THREE.Clock();
  let t = 14; // on démarre « en cours de route » : la première image est déjà belle
  let visible = true, raf = 0;

  function frame() {
    raf = 0;
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    mat.uniforms.uTime.value = t;
    points.rotation.y += (target.x * 0.45 - points.rotation.y) * 0.04;
    points.rotation.x += (target.y * 0.25 - points.rotation.x) * 0.04;
    ballState.vy -= 12 * dt; ballState.y += ballState.vy * dt;
    if (ballState.y < 0) { ballState.y = 0; ballState.vy = ballState.vy < -1.2 ? -ballState.vy * 0.45 : 0; }
    ballState.spin += (0.4 - ballState.spin) * 0.02;
    ball.position.set(ballState.baseX + Math.sin(t * 0.4) * 0.12, ballState.baseY + ballState.y + Math.sin(t * 0.9) * 0.08, 1.4);
    ball.rotation.x += ballState.spin * dt; ball.rotation.y += ballState.spin * dt * 0.7;
    const sc = Math.min(1, window.scrollY / Math.max(1, hero.clientHeight));
    camera.position.y = -sc * 1.2;
    points.rotation.z = sc * 0.35;
    orbs.rotation.y = points.rotation.y * 0.5;
    renderer.render(scene, camera);
    if (visible && !document.hidden && !reduce) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && visible && !document.hidden) { clock.getDelta(); raf = requestAnimationFrame(frame); } }

  mat.uniforms.uTime.value = t;
  ball.position.set(ballState.baseX, ballState.baseY, 1.4);
  renderer.render(scene, camera); // image fixe immédiate (et seule image si « réduire les animations »)

  if (!reduce) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; wake(); }).observe(hero);
    document.addEventListener('visibilitychange', wake);
    wake();
  }
  return { renderer };
}
