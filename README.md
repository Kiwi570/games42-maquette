# Games 42 : maquette « Les Portails »

Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

## Pages

- `index.html` : accueil (portail, cadenas des missions, couloir des cinq mondes, coffres, anniversaires, pros, bon cadeau, infos pratiques, FAQ)
- `machine-a-remonter-le-temps.html` : fiche de la nouvelle salle
- `anniversaire.html` : formules, déroulé du mercredi, calculateur, invitations

## Modifier le contenu

- Tarifs, horaires, missions, invitations : `assets/js/data.js` (un seul fichier).
- Images : `assets/img/` en WebP ; la liste et les textes alternatifs sont dans `assets/js/images.js`.
- Couleurs et typographies : en tête de `assets/css/main.css`.

## Bibliothèques incluses

GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3, OGL (WebGL). Polices Fraunces et Figtree (licence OFL) hébergées avec le site.

## Accessibilité

Bouton « Mode calme » (et préférence système « réduire les animations ») : animations coupées, défilement natif, couloir en colonne. Le fond WebGL a une version CSS si WebGL est indisponible.
