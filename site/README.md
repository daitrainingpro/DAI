# dai.training

Site de l'association DAI!. HTML, CSS et JavaScript simples : aucun outil à installer, aucune étape de construction.

- `index.html` : le texte de la page.
- `css/style.css` : l'apparence. Les couleurs et les polices sont en haut, dans `:root`.
- `js/main.js` : inclinaison du titre, chargement des stages, lancement de la 3D.
- `js/scene.js` : la scène 3D de l'ouverture (Three.js, copié dans `js/vendor/`).
- `data/stages.json` : les stages. Pour ouvrir une inscription : `"statut": "ouvert"` et le lien HelloAsso dans `"inscription"`.
- `fonts/` : polices Anton et Instrument Sans (licence SIL OFL), servies depuis le site.
- `CNAME` : le domaine pour GitHub Pages.

Pour voir le site en local : `python3 -m http.server` dans ce dossier, puis ouvrir http://localhost:8000.
