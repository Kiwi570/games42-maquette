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

## Version 4 (fluidité du défilement)

- Plus aucun flou d'arrière-plan ni mode de fusion au-dessus du fond animé (recalculés à chaque image, cause principale des saccades).
- Fond WebGL : calcul par pixel divisé par deux, 60 images/s au plus, résolution qui baisse toute seule si l'ordinateur peine.
- Plus de recalcul des positions en plein défilement ; titres animés sans graisse variable ; barres et aiguilles animées par transformation.
- Couloir : aimantation douce vers le monde le plus proche, annulée dès que l'on reprend la main ; en-tête masqué pendant les scènes épinglées.

## Version 5 (démarrage et arrivées)

- Ouverture orchestrée : polices chargées, scènes calculées et première image du fond affichée avant toute animation (plus de saccade au démarrage).
- Images du fond décodées hors du fil principal, préchargées pendant les temps morts : aucun à-coup quand un nouveau monde arrive.
- Le fond ne se fige plus sous les sections claires (il ralentit) : plus de saut quand une section sombre arrive.
- Titres d'ouverture animés par transformation seulement ; « 4,9 » et ses étoiles ne se chevauchent plus.

## Version 6 (défilement natif sur Mac)

- Sur Mac, iPhone et iPad, le défilement est désormais celui du système (calculé hors du fil principal, il ne peut plus saccader). Le lissage Lenis reste pour les molettes à crans (Windows, Linux). Forcer : `?lenis=1` ou `?lenis=0`.
- `vercel.json` : scripts et styles toujours revérifiés après une mise en ligne (pas de version périmée en cache).
