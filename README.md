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

## Version 2 (audit)

- Chrono 60:00 : fil vertical dans la marge droite sur grand écran ; sur mobile, barre d'actions en bas (chrono, Appeler, Réserver).
- Couloir des mondes : pastilles cliquables, ancres `#monde-sorcier`, `#monde-machine`, `#monde-pirate`, `#monde-bozo`, `#monde-serpent` (aussi depuis les autres pages), aimantation douce sur chaque monde.
- Nouveau coffre illustré (couvercle, intérieur, lumière, étincelles) et porte en photo avec lumière progressive.
- Statut « ouvert maintenant » : pendant les vacances (dates dans `data.js`, `HOURS.notice`), aucune heure n'est annoncée tant que les horaires de vacances ne sont pas fournis.
- Référencement : la maquette est en `noindex` (à retirer à la mise en ligne définitive). Images de partage `assets/img/og-*.jpg`, données structurées dans `index.html`.

## Version 3 (effets et transitions)

- Script d'amorce dans chaque page (`<head>`) : aucune image parasite avant l'intro, le titre ou à l'arrivée d'une page.
- Transition entre pages : le voile garde la couleur du monde de départ et couvre la page d'arrivée dès le premier affichage.
- Fond animé : choix du monde par position (plus d'erreur après un saut d'ancre), scènes épinglées calculées en premier, dissolutions enchaînées sans saut, plongée de l'ouverture sans à-coup, taille stable sur mobile.
- Positions recalculées automatiquement quand la page change de hauteur (cadenas ouvert, FAQ, bandeau fermé).
- Titres animés sans jambages coupés, menu mobile qui s'ouvre depuis son bouton, FAQ et bandeau animés, navigation au clavier dans le couloir.
