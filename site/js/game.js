// Mini-jeu « Tir au but » de la section Foot. Dessiné sur un canvas, sans dépendance.
// Souris ou doigt : on vise en cliquant dans la cage. Clavier : flèches pour viser, Espace ou Entrée pour tirer.

export function startGame(canvas, elGoals, elShots, elMsg) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = 720, H = 420;
  const GOAL = { x: 170, y: 58, w: 380, h: 138 };          // la cage
  const START = { x: W / 2, y: 372 };                        // point de penalty
  const C = { night: '#090b22', plum: '#1f1140', ember: '#ff7d5c', lilac: '#b7a6ff', pearl: '#f4efff', moon: '#ffe7a3', rose: '#d9508a' };

  let dpr = 1;
  function fit() {
    dpr = 1 / 3; // un pixel du jeu = trois pixels d'écran ou plus
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  fit();
  window.addEventListener('resize', fit);

  const state = {
    goals: 0, shots: 0,
    aim: { x: W / 2 + 90, y: GOAL.y + 60 },
    ball: { x: START.x, y: START.y, r: 22, spin: 0 },
    shot: null,          // { from, to, t }
    keeper: { x: W / 2, r: 30 },
    flash: null,         // { text, color, t }
    sparks: [],
    time: 0,
    usingKeys: false,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function shoot(target) {
    if (state.shot || state.flash) return;
    state.shots++;
    state.shot = { from: { ...START }, to: { x: clamp(target.x, 40, W - 40), y: clamp(target.y, 24, 250) }, t: 0 };
    render();
    report();
  }
  function report() {
    elGoals.textContent = String(state.goals);
    elShots.textContent = String(state.shots);
  }
  function say(text) { if (elMsg) elMsg.textContent = text; }

  canvas.addEventListener('pointermove', (e) => {
    state.usingKeys = false;
    const p = toCanvas(e);
    state.aim.x = clamp(p.x, 40, W - 40); state.aim.y = clamp(p.y, 24, 250);
  });
  canvas.addEventListener('pointerdown', (e) => { const p = toCanvas(e); state.aim = { x: clamp(p.x, 40, W - 40), y: clamp(p.y, 24, 250) }; shoot(p); });
  canvas.addEventListener('keydown', (e) => {
    const step = 22;
    if (e.key === 'ArrowLeft') { state.aim.x = clamp(state.aim.x - step, 40, W - 40); }
    else if (e.key === 'ArrowRight') { state.aim.x = clamp(state.aim.x + step, 40, W - 40); }
    else if (e.key === 'ArrowUp') { state.aim.y = clamp(state.aim.y - step, 24, 250); }
    else if (e.key === 'ArrowDown') { state.aim.y = clamp(state.aim.y + step, 24, 250); }
    else if (e.key === ' ' || e.key === 'Enter') { shoot(state.aim); }
    else return;
    state.usingKeys = true;
    e.preventDefault();
  });

  function keeperX(time) {
    const speed = 0.9 + Math.min(state.goals, 8) * 0.14;      // le gardien s'échauffe à chaque but
    const span = GOAL.w / 2 - 44;
    return W / 2 + Math.sin(time * speed) * span * (0.75 + 0.25 * Math.sin(time * 0.37));
  }

  function resolve() {
    const b = state.ball;
    const inGoal = b.x > GOAL.x + 8 && b.x < GOAL.x + GOAL.w - 8 && b.y > GOAL.y + 8 && b.y < GOAL.y + GOAL.h;
    const kx = state.keeper.x, ky = GOAL.y + GOAL.h - 34;
    const saved = Math.hypot(b.x - kx, b.y - ky) < state.keeper.r + b.r * 0.9;
    if (inGoal && !saved) {
      state.goals++;
      state.flash = { text: 'BUT !', color: C.moon, t: 0 };
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 240;
        state.sparks.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.7 + Math.random() * 0.6, c: [C.moon, C.ember, C.lilac, C.pearl][i % 4] });
      }
      say('But ! ' + state.goals + ' sur ' + state.shots + '.');
    } else if (inGoal) {
      state.flash = { text: 'ARRÊTÉ', color: C.lilac, t: 0 };
      say('Arrêté par le gardien.');
    } else {
      state.flash = { text: 'À CÔTÉ', color: C.pearl, t: 0 };
      say('À côté.');
    }
    report();
  }

  function update(dt) {
    state.time += dt;
    state.keeper.x = keeperX(state.time);
    const b = state.ball;
    if (state.shot) {
      const s = state.shot;
      s.t = Math.min(1, s.t + dt / 0.5);
      const e = 1 - Math.pow(1 - s.t, 2.2);
      b.x = s.from.x + (s.to.x - s.from.x) * e;
      b.y = s.from.y + (s.to.y - s.from.y) * e - Math.sin(s.t * Math.PI) * 26;
      b.r = 22 - 11 * e;
      b.spin += dt * 14;
      if (s.t >= 1) { state.shot = null; resolve(); }
    } else if (state.flash) {
      state.flash.t += dt;
      if (state.flash.t > 0.95) { state.flash = null; b.x = START.x; b.y = START.y; b.r = 22; }
    } else {
      b.spin += dt * 0.6;
    }
    for (const p of state.sparks) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt; }
    state.sparks = state.sparks.filter((p) => p.life > 0);
  }

  function drawBall(x, y, r, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = '#b7a6ffaa'; ctx.shadowBlur = r * 0.9;
    ctx.fillStyle = C.pearl;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.rotate(spin);
    ctx.fillStyle = C.plum; ctx.strokeStyle = C.plum; ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const px = Math.cos(a) * r * 0.36, py = Math.sin(a) * r * 0.36;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36);
      ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    // ciel
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, C.night); sky.addColorStop(0.45, '#241255'); sky.addColorStop(0.78, '#7a2a72'); sky.addColorStop(1, '#e0607a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // étoiles fixes
    ctx.fillStyle = '#f4efff';
    for (let i = 0; i < 40; i++) {
      const x = (i * 97.3) % W, y = (i * 53.7) % 150;
      ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(state.time * 0.8 + i));
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
    // pelouse en perspective
    const turf = ctx.createLinearGradient(0, 196, 0, H);
    turf.addColorStop(0, '#2a1650'); turf.addColorStop(1, '#3d1d6e');
    ctx.fillStyle = turf;
    ctx.beginPath(); ctx.moveTo(60, 196); ctx.lineTo(W - 60, 196); ctx.lineTo(W + 80, H); ctx.lineTo(-80, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b7a6ff66'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(110, 196); ctx.lineTo(W - 110, 196); ctx.stroke();               // ligne de but
    ctx.beginPath(); ctx.moveTo(150, 196); ctx.lineTo(70, 330); ctx.lineTo(W - 70, 330); ctx.lineTo(W - 150, 196); ctx.stroke(); // surface
    ctx.beginPath(); ctx.ellipse(START.x, START.y + 18, 26, 7, 0, 0, Math.PI * 2); ctx.fillStyle = '#09061a66'; ctx.fill();

    // filet
    ctx.strokeStyle = '#f4efff2e'; ctx.lineWidth = 1;
    for (let x = GOAL.x; x <= GOAL.x + GOAL.w; x += 19) { ctx.beginPath(); ctx.moveTo(x, GOAL.y); ctx.lineTo(x, GOAL.y + GOAL.h); ctx.stroke(); }
    for (let y = GOAL.y; y <= GOAL.y + GOAL.h; y += 17.25) { ctx.beginPath(); ctx.moveTo(GOAL.x, y); ctx.lineTo(GOAL.x + GOAL.w, y); ctx.stroke(); }
    // poteaux
    ctx.save();
    ctx.shadowColor = '#ffe7a3'; ctx.shadowBlur = 18;
    ctx.strokeStyle = C.pearl; ctx.lineWidth = 7; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(GOAL.x, GOAL.y + GOAL.h); ctx.lineTo(GOAL.x, GOAL.y); ctx.lineTo(GOAL.x + GOAL.w, GOAL.y); ctx.lineTo(GOAL.x + GOAL.w, GOAL.y + GOAL.h); ctx.stroke();
    ctx.restore();

    // gardien : une lune qui glisse sur la ligne
    const kx = state.keeper.x, ky = GOAL.y + GOAL.h - 34;
    ctx.save();
    ctx.shadowColor = '#ffe7a3'; ctx.shadowBlur = 30;
    ctx.fillStyle = C.moon;
    ctx.beginPath(); ctx.arc(kx, ky, state.keeper.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f5cf7a';
    ctx.beginPath(); ctx.arc(kx - 9, ky - 7, 6, 0, Math.PI * 2); ctx.arc(kx + 11, ky + 6, 4, 0, Math.PI * 2); ctx.arc(kx + 4, ky - 14, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // viseur
    if (!state.shot && !state.flash) {
      ctx.strokeStyle = C.ember; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(state.aim.x, state.aim.y, 13, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(state.aim.x - 20, state.aim.y); ctx.lineTo(state.aim.x - 7, state.aim.y); ctx.moveTo(state.aim.x + 7, state.aim.y); ctx.lineTo(state.aim.x + 20, state.aim.y);
      ctx.moveTo(state.aim.x, state.aim.y - 20); ctx.lineTo(state.aim.x, state.aim.y - 7); ctx.moveTo(state.aim.x, state.aim.y + 7); ctx.lineTo(state.aim.x, state.aim.y + 20); ctx.stroke();
    }

    drawBall(state.ball.x, state.ball.y, state.ball.r, state.ball.spin);

    for (const p of state.sparks) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (state.flash) {
      const k = Math.min(1, state.flash.t / 0.18);
      ctx.save();
      ctx.translate(W / 2, 286);
      ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
      ctx.font = '400 84px Anton, Impact, "Arial Narrow Bold", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = C.plum; ctx.fillText(state.flash.text, 5, 6);
      ctx.fillStyle = state.flash.color; ctx.fillText(state.flash.text, 0, 0);
      ctx.restore();
    }
  }

  let last = performance.now(), running = false, onScreen = true;
  function loop(now) {
    running = false;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); render();
    if (onScreen && !document.hidden) { running = true; requestAnimationFrame(loop); }
  }
  function wake() { if (!running && onScreen && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(loop); } }
  new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; wake(); }, { rootMargin: '120px' }).observe(canvas);
  document.addEventListener('visibilitychange', wake);
  render(); report(); wake();
}
