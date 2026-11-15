// Jeux fantaisistes du Labo : « Têtes lunaires » et « Pluie de ballons ».
// Les deux se jouent de profil : on déplace quelque chose de gauche à droite
// (souris, doigt ou flèches). Les objets viennent de lab.js.
import * as THREE from '../js/vendor/three.module.min.js';
import { C, calm, makeStage, ndc, flat, lights, stars, glow, shadowed, makeBall, makeGoal, makeStriker, makeBandage } from './lab.js';

const W = 6; // demi-largeur du terrain

// Une arène vue de face : renvoie la position x visée par le joueur.
function arena(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const st = makeStage(canvas, 50), { scene, camera } = st;
  st.onResize = () => { const z = Math.max(13.4 / (0.933 * st.aspect), 10.2 / 0.933); camera.position.set(0, 4.3, z); camera.lookAt(0, 4.3, 0); };
  st.renderer.setClearColor(C.night);
  lights(scene); scene.add(stars(1200, 90));
  const ctl = { st, scene, x: 0, keys: {} };
  const ray = new THREE.Raycaster(), m = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  canvas.addEventListener('pointermove', (e) => { ray.setFromCamera(ndc(e, canvas, m), camera); if (ray.ray.intersectPlane(plane, hit)) ctl.x = Math.max(-W, Math.min(W, hit.x)); });
  canvas.addEventListener('pointerdown', (e) => { ray.setFromCamera(ndc(e, canvas, m), camera); if (ray.ray.intersectPlane(plane, hit)) ctl.x = Math.max(-W, Math.min(W, hit.x)); });
  canvas.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { ctl.keys[e.key] = true; e.preventDefault(); } });
  canvas.addEventListener('keyup', (e) => { ctl.keys[e.key] = false; });
  ctl.steer = (dt) => { const d = (ctl.keys.ArrowRight ? 1 : 0) - (ctl.keys.ArrowLeft ? 1 : 0); if (d) ctl.x = Math.max(-W, Math.min(W, ctl.x + d * dt * 9)); };
  return ctl;
}
const shouter = (id) => { const el = document.getElementById(id); let t = 0; return { say(txt, s = 0.9) { el.textContent = txt; t = s; }, tick(dt) { if (t > 0 && (t -= dt) <= 0) el.textContent = ''; } }; };

// --- Jeu 04 : Têtes lunaires ------------------------------------------------
function tetes() {
  const a = arena('c-tetes'); if (!a) return;
  const hud = document.getElementById('tetes-score'), shout = shouter('tetes-shout');
  // Le sol : le dos rond d'une très grosse lune.
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(40, 4), flat(C.moon, { emissive: C.moon, emissiveIntensity: 0.25 })); moon.position.y = -40; moon.receiveShadow = true; a.scene.add(moon);
  const halo = glow(C.moon, 60, 0.35); halo.position.set(0, -6, -12); a.scene.add(halo);
  const striker = makeStriker(); striker.scale.setScalar(0.6); a.scene.add(striker);
  const ball = makeBall(0.42); a.scene.add(ball);
  const bonus = makeBandage(); bonus.scale.setScalar(0.55); bonus.add(glow(C.pink, 5, 0.5)); a.scene.add(bonus);
  const HEAD = 2.2, G = -5.2;
  let bx = 0, by = 7.5, vx = 1.2, vy = 0, score = 0, best = 0, sx = 0, pause = 0;
  const show = () => { hud.textContent = `${score} tête${score > 1 ? 's' : ''} · record ${best}`; };
  const place = () => bonus.position.set((Math.random() - 0.5) * 9, 4.4 + Math.random() * 3, 0);
  const serve = () => { bx = (Math.random() - 0.5) * 6; by = 8.6; vx = (Math.random() - 0.5) * 3; vy = 0; };
  place(); show();
  a.st.tick = (dt, t) => {
    a.steer(dt); shout.tick(dt);
    const dx = a.x - sx, move = Math.sign(dx) * Math.min(Math.abs(dx), dt * 10); sx += move;
    striker.position.x = sx; striker.rotation.y += ((Math.abs(dx) > 0.15 ? Math.sign(dx) * 1.2 : 0) - striker.rotation.y) * Math.min(1, dt * 12);
    const run = Math.abs(dx) > 0.15 ? Math.sin(t * 16) * 0.9 : 0, d = striker.userData; d.legL.rotation.x = run; d.legR.rotation.x = -run; d.armL.rotation.x = -run; d.armR.rotation.x = run;
    bonus.rotation.y += dt * 2; bonus.rotation.x += dt;
    if (pause > 0) { pause -= dt; if (pause <= 0) serve(); ball.visible = false; return; }
    ball.visible = true;
    vy += G * dt; bx += vx * dt; by += vy * dt;
    if (Math.abs(bx) > W) { bx = Math.sign(bx) * W; vx = -vx * 0.9; }
    if (vy < 0 && by - 0.42 <= HEAD && by > HEAD - 0.5 && Math.abs(bx - sx) < 0.85) {         // tête !
      vy = 5.6 + Math.min(score, 12) * 0.12; vx = (bx - sx) * 3.2 + (Math.random() - 0.5) * 1.6; score++; best = Math.max(best, score); show();
      striker.position.y = 0.25;
    }
    striker.position.y = Math.max(0, striker.position.y - dt * 1.5);
    if (ball.position.distanceTo(bonus.position) < 0.95) { score += 3; best = Math.max(best, score); show(); shout.say('+3', 0.6); place(); }
    if (by < 0.42) { shout.say(score ? 'Raté' : 'Encore'); score = 0; show(); pause = calm ? 1.4 : 0.8; }
    ball.position.set(bx, by, 0); ball.rotation.z -= vx * dt * 2; ball.rotation.x += dt * 3;
  };
  a.st.resize();
}

// --- Jeu 05 : Pluie de ballons ----------------------------------------------
function pluie() {
  const a = arena('c-pluie'); if (!a) return;
  const hud = document.getElementById('pluie-score'), shout = shouter('pluie-shout');
  const floor = new THREE.GridHelper(60, 30, C.pink, 0x5d2885); floor.position.y = -0.2; a.scene.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), flat(0x2a1458)); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.22; ground.receiveShadow = true; a.scene.add(ground);
  const cage = shadowed(makeGoal(3, 1.2, 1.3)); cage.rotation.x = -Math.PI / 2; cage.position.y = 1.5; a.scene.add(cage);   // la cage couchée sert de panier
  const pool = [];
  for (let i = 0; i < 9; i++) {
    const moon = i % 3 === 2, mesh = moon ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), flat(C.moon, { emissive: C.moon, emissiveIntensity: 0.8 })) : makeBall(0.42);
    if (moon) { mesh.castShadow = true; mesh.add(glow(C.moon, 3.2, 0.6)); } mesh.visible = false; a.scene.add(mesh); pool.push({ mesh, moon, on: false, vy: 0, spin: 0 });
  }
  let score = 0, lives = 3, next = 0.6, cx = 0, over = 0;
  const show = () => { hud.textContent = `${score} ballon${score > 1 ? 's' : ''} · ${'♥'.repeat(lives)}${'·'.repeat(3 - lives)}`; };
  const lose = () => { lives--; show(); if (lives <= 0) { shout.say(`Fini · ${score}`, 1.8); over = 1.8; pool.forEach((p) => { p.on = false; p.mesh.visible = false; }); } };
  show();
  a.st.tick = (dt, t) => {
    a.steer(dt); shout.tick(dt);
    cx += (a.x - cx) * Math.min(1, dt * 14); cage.position.x = cx; cage.rotation.z = (a.x - cx) * -0.12;
    if (over > 0) { over -= dt; if (over <= 0) { score = 0; lives = 3; next = 0.6; show(); } return; }
    next -= dt;
    if (next <= 0) {
      const wantMoon = Math.random() < 0.24, p = pool.find((q) => !q.on && q.moon === wantMoon) || pool.find((q) => !q.on);
      if (p) { p.on = true; p.mesh.visible = true; p.mesh.position.set((Math.random() - 0.5) * 2 * (W - 0.6), 10.2, 0); p.vy = -(2.6 + Math.min(score, 30) * 0.09) * (calm ? 0.7 : 1); p.spin = (Math.random() - 0.5) * 6; }
      next = Math.max(0.42, 1.15 - score * 0.02);
    }
    for (const p of pool) {
      if (!p.on) continue;
      const y0 = p.mesh.position.y; p.mesh.position.y += p.vy * dt; p.mesh.rotation.z += p.spin * dt; p.mesh.rotation.x += dt * 2;
      if (p.moon) p.mesh.position.x += Math.sin(t * 3 + p.spin) * dt * 1.4;                    // les lunes zigzaguent
      const y = p.mesh.position.y, caught = y0 > 1.7 && y <= 1.7 && Math.abs(p.mesh.position.x - cx) < 1.45;
      if (caught) { p.on = false; p.mesh.visible = false; if (p.moon) { shout.say('Aïe', 0.6); lose(); } else { score++; show(); if (score % 10 === 0) shout.say(String(score), 0.6); } }
      else if (y < -0.4) { p.on = false; p.mesh.visible = false; if (!p.moon) lose(); }
    }
  };
  a.st.resize();
}

for (const start of [tetes, pluie]) { try { start(); } catch (e) { console.error(e); } }
