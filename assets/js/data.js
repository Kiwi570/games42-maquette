/* Games 42 : toutes les données du site au même endroit.
   Chaque chiffre vient du site actuel (games42.fr, relevé du 27/10/2026).
   « null » = information absente du site : affichée « à compléter ». */

export const SITE = {
  name: 'Games 42',
  phone: '06 31 56 40 24',
  phoneHref: 'tel:+33631564024',
  email: 'contact@games42.fr',
  booking: 'https://games42.4escape.io/',
  shop: 'https://games42.4escape.io/shop',
  address: ['1130, boulevard Jean Rostand', '42650 Saint-Jean-Bonnefonds'],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Games%2042%201130%20boulevard%20Jean%20Rostand%2042650%20Saint-Jean-Bonnefonds',
  rating: 4.9,
  reviews: 1300,
  reviewsUrl: 'https://www.google.com/search?q=Games%2042%20Saint-Etienne#lrd=0x47f5af166943c223:0xf9547d7c66f54df7,1',
  social: [
    { label: 'Facebook', url: 'https://www.facebook.com/gamesescapegame' },
    { label: 'Instagram', url: 'https://www.instagram.com/games42escapegame/' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@gamesescapegame' },
    { label: 'Avis Google', url: 'https://g.page/r/Cfd39Tj5RnSyEBM/review' },
  ],
  legal: [
    { label: 'Conditions générales de vente', url: 'https://www.games42.fr/cgv' },
    { label: 'Mentions légales', url: 'https://www.games42.fr/mentions-legales' },
    { label: 'Politique de confidentialité', url: 'https://www.games42.fr/politique-de-confidentialit%C3%A9' },
  ],
  payments: ['Carte bancaire', 'Espèces', 'Chèques', 'Chèques vacances papier et connectés'],
};

/* Horaires hors vacances scolaires (pied de page du site actuel).
   La page « Informations » donne d'autres horaires : à harmoniser avec le client. */
export const HOURS = {
  days: [
    { d: 1, label: 'Lundi', closed: true },
    { d: 2, label: 'Mardi', closed: true },
    { d: 3, label: 'Mercredi', open: '14:00', close: '21:15' },
    { d: 4, label: 'Jeudi', onRequest: true },
    { d: 5, label: 'Vendredi', open: '14:00', close: '21:15' },
    { d: 6, label: 'Samedi', open: '10:00', close: '21:15' },
    { d: 0, label: 'Dimanche', open: '10:00', close: '21:15' },
  ],
  /* Bandeau saisonnier : texte du site actuel, affiché jusqu'à la date indiquée (à vérifier). */
  notice: { text: 'Vacances de la Toussaint : nous sommes ouverts du mercredi au dimanche.', until: '2026-11-01' },
};

export const WORLDS = {
  sorcier: { a: '#8E5CFF', b: '#C9B2FF', label: 'Violet potion' },
  temps: { a: '#E3A33B', b: '#2FA38F', label: 'Laiton et patine' },
  pirate: { a: '#1E9BD7', b: '#7FD8F5', label: 'Lagon' },
  cirque: { a: '#F0504F', b: '#FFD23F', label: 'Piste et lune' },
  serpent: { a: '#E9B949', b: '#0F6E5B', label: 'Or et émeraude' },
  portail: { a: '#8E5CFF', b: '#E3A33B', label: 'Portail' },
};

/* Grilles de prix par joueur, TTC, relevées sur les pages du site. */
const grid = (rows) => (n) => {
  const r = rows.find(([min, max]) => n >= min && n <= max);
  return r ? r[2] : null;
};

export const PRICES = {
  /* Grille « Les tarifs de nos salles » (image sans date, pages Apprenti Sorcier) : à confirmer pour 2026 et pour 3 joueurs. */
  sorcier: grid([[4, 4, 28], [5, 5, 25], [6, 6, 23], [7, 8, 21]]),
  /* Grille « 2026, les tarifs de nos salles » (page Machine, mode famille). */
  machine: grid([[3, 3, 30], [4, 4, 28], [5, 5, 24], [6, 6, 22]]),
  bozo: grid([[4, 4, 24], [5, 5, 22], [6, 6, 20]]),
  pirateGouter: grid([[4, 4, 24], [5, 5, 22], [6, 6, 20], [7, 12, 18]]),
  pirateApero: grid([[4, 4, 30], [5, 5, 28], [6, 6, 26], [7, 9, 24], [10, 13, 22], [14, 18, 20]]),
  mercredi: 27,
  gouterWeekend: 6,
  serpentLocation: 69,
  serpentCaution: 300,
  seniors: { ht: 13.64, ttc: 15, min: 15 },
};

export const MISSIONS = [
  {
    id: 'sorcier', world: 'sorcier', kind: 'Salle', name: 'L’Apprenti Sorcier',
    pitch: 'Explorez l’école de magie, décodez les grimoires secrets et préparez la potion qui sauvera Henri, le meilleur apprenti stéphanois.',
    facts: ['60 min', '3 à 8 joueurs', 'Enfants dès 9 ans, familles dès 7 ans', 'Difficulté adultes 7/10'],
    plus: 'Le maître des apprentis reste avec vous pendant toute la partie et joue un personnage de l’école.',
    image: 'sorcier-grimoires', bg: 'monde-sorcier', priceLine: 'De 21 à 28 € par joueur',
    flag: 'Grille de prix sans date et sans tarif à 3 joueurs ; difficulté annoncée 6/10 sur une autre page : à confirmer.',
  },
  {
    id: 'machine', world: 'temps', kind: 'Salle', name: 'La Machine à remonter le temps',
    pitch: 'L’horloge ne fonctionne plus. Retrouvez une pièce en or, un parchemin et un engrenage dans trois époques différentes pour la remettre en marche.',
    facts: ['60 min', '3 à 6 joueurs', 'En famille dès 7 ans', 'Difficulté famille 5,5/10'],
    plus: 'Nouvelle salle, ouverte le 3 octobre 2026. Diplôme remis en fin de mission.',
    image: 'machine-blason', bg: 'monde-temps', url: 'machine-a-remonter-le-temps.html',
    priceLine: 'De 22 à 30 € par joueur (tarifs 2026)',
  },
  {
    id: 'pirate', world: 'pirate', kind: 'Coffre', name: 'Le Coffre du Pirate',
    pitch: 'Trouvez comment ouvrir le coffre de Black Sam, puis ses cachettes et ses mécanismes secrets : le trésor est un goûter ou un apéritif.',
    facts: ['1 h de jeu', '4 à 6 joueurs par coffre, jusqu’à 18', 'Enfants dès 9 ans, mode ados', 'Difficulté 5/10 enfants, 7/10 ados'],
    plus: 'Pas de pression du chrono : un classeur d’indices et un animateur à proximité.',
    image: 'pirate-black-sam', bg: 'monde-pirate', priceLine: 'Dès 18 € par joueur, goûter compris',
  },
  {
    id: 'bozo', world: 'cirque', kind: 'Coffre', name: 'Bozo le clown',
    pitch: 'Panique au Cirque de la Lune : Bozo a disparu juste avant le spectacle. Ouvrez son coffre magique et menez l’enquête avec les parents.',
    facts: ['1 h de jeu + 45 min de goûter', '4 à 6 enfants', 'De 5 à 8 ans, avec un parent', 'Difficulté 5/10'],
    plus: 'Le premier escape game idéal : beaucoup de manipulations, un univers coloré et amusant.',
    image: 'bozo-clown', bg: 'monde-cirque', priceLine: 'De 20 à 24 € par enfant, goûter compris',
  },
  {
    id: 'serpent', world: 'serpent', kind: 'Coffre à emporter', name: 'Le Mystère du Serpent d’Or',
    pitch: 'La malle de l’aventurier Max Sullivane cacherait le Serpent d’Or de Cléopâtre. Personne n’a réussi à l’ouvrir. Emportez-la chez vous.',
    facts: ['1 h 20 à 1 h 40 en moyenne', '3 à 6 joueurs par coffre', 'Dès 12 ans', 'Difficulté adultes 9/10'],
    plus: 'Location 69 € le coffre, caution de 300 € et pièce d’identité au retrait.',
    image: 'serpent-coffre', bg: 'monde-serpent', priceLine: 'Location : 69 € le coffre',
  },
];

export const INVITATIONS = [
  { name: 'L’Apprenti Sorcier', note: '4 invitations par feuille A4', world: 'sorcier', url: 'https://www.games42.fr/_files/ugd/0a3faa_152cb467b0514a8c899d491603b9987c.pdf' },
  { name: 'Le Coffre du Pirate', note: 'À imprimer', world: 'pirate', url: 'https://www.games42.fr/_files/ugd/0a3faa_56fec88b1d1844b1ad3c833f84c493af.pdf' },
  { name: 'Bozo le clown', note: 'À imprimer', world: 'cirque', url: 'https://www.games42.fr/_files/ugd/0a3faa_df8c2dc21f0c4a2f8f5bbe7a16be2f15.pdf' },
  { name: 'Le Mystère du Serpent d’Or', note: 'À imprimer', world: 'serpent', url: 'https://www.games42.fr/_files/ugd/0a3faa_8000291440054f229f1f7ab44cd39f17.pdf' },
  { name: 'Tous les escape games', note: '4 invitations par feuille A4', world: 'portail', url: 'https://www.games42.fr/_files/ugd/0a3faa_d7dbef91be44461f85ec34ad52b8e7c6.pdf' },
];
