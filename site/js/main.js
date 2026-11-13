// DAI! — comportements de la page. Chaque bloc est indépendant : si l'un échoue, le reste fonctionne.

// 1. Le nom « DAI! » s'incline vers le pointeur.
(function tiltTitle() {
  const hero = document.querySelector('.hero');
  const title = document.getElementById('titre');
  if (!hero || !title) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) return;
  if (!fine) { title.classList.add('is-idle'); return; } // au doigt : un léger balancement
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    title.style.setProperty('--ry', (x * 34).toFixed(2) + 'deg');
    title.style.setProperty('--rx', (-y * 18).toFixed(2) + 'deg');
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    title.style.removeProperty('--ry');
    title.style.removeProperty('--rx');
  });
})();

// 2. Les stages viennent de data/stages.json. Si le fichier ne se charge pas,
//    les cartes déjà écrites dans index.html restent affichées.
(async function loadStages() {
  const list = document.getElementById('liste-stages');
  if (!list) return;
  try {
    const res = await fetch('data/stages.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !Array.isArray(data.stages) || !data.stages.length) return;
    const frag = document.createDocumentFragment();
    for (const s of data.stages) {
      const li = document.createElement('li');
      li.className = s.vedette ? 'card card--featured' : 'card';
      const add = (tag, cls, text) => {
        if (!text) return null;
        const el = document.createElement(tag);
        el.className = cls;
        el.textContent = text;
        li.appendChild(el);
        return el;
      };
      add('p', 'card__num', s.numero);
      add('h3', 'card__title', s.titre);
      add('p', 'card__when', s.quand);
      add('p', 'card__where', s.lieu);
      add('p', 'card__what', s.pratiques);
      add('p', 'card__details', s.details);
      add('p', 'card__who', s.intervenant);
      const open = s.statut === 'ouvert' && /^https:\/\//.test(s.inscription || '');
      if (open) {
        const a = document.createElement('a');
        a.className = 'btn btn--solid card__cta';
        a.href = s.inscription;
        a.rel = 'noopener';
        a.textContent = "S'inscrire";
        li.appendChild(a);
      } else {
        add('p', 'card__status', s.statut);
      }
      frag.appendChild(li);
    }
    list.replaceChildren(frag);
  } catch (e) { /* on garde les cartes écrites dans la page */ }
})();

// 3. La scène 3D, chargée à part pour ne jamais bloquer le texte.
(async function scene() {
  const canvas = document.getElementById('scene');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  try {
    const { startScene } = await import('./scene.js');
    startScene(canvas, hero);
  } catch (e) { /* pas de 3D : le fond bleu suffit */ }
})();

// 4. Le mini-jeu de tir au but, chargé seulement quand on s'en approche.
(function game() {
  const canvas = document.getElementById('terrain');
  if (!canvas) return;
  let started = false;
  const start = async () => {
    if (started) return; started = true;
    try {
      const { startGame } = await import('./game.js');
      startGame(canvas, document.getElementById('buts'), document.getElementById('tirs'), document.getElementById('jeu-annonce'));
    } catch (e) { /* pas de jeu : la page reste complète */ }
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '600px' });
    io.observe(canvas);
  } else start();
})();
