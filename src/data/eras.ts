// Contenu editorial de la section Histoire. Ecrit a la main : aucune API ne
// fournit ca, et c'est un recit, pas un jeu de donnees.
//
// Les textes sont calibres court (~45 mots) : ils doivent tenir dans un panneau
// de la frise sans deborder, sur un ecran d'ordinateur portable.

export interface Era {
  id: string
  years: string
  title: string
  /** La rupture technique qui definit la periode. */
  breakthrough: string
  /** Le duel qui l'a racontee. */
  rivalry: string
  text: string
  /** Chiffre marquant, affiche en grand. */
  figure: { value: string; label: string }
  image?: { src: string; alt: string; credit: string; licence: string }
}

export const ERAS: Era[] = [
  {
    id: 'pionniers',
    years: '1950 — 1957',
    title: 'Les pionniers',
    breakthrough: 'Moteur à l’avant, châssis tubulaire',
    rivalry: 'Juan Manuel Fangio — Stirling Moss',
    text: "Le premier championnat s'ouvre à Silverstone le 13 mai 1950, remporté par Giuseppe Farina sur une Alfa Romeo conçue avant la guerre. Fangio devient vite la mesure de tous les autres. La discipline est somptueuse et meurtrière : après Le Mans 1955, Mercedes se retire pour trente ans.",
    figure: { value: '5', label: 'titres pour Fangio, avec 4 écuries' },
  },
  {
    id: 'moteur-arriere',
    years: '1958 — 1967',
    title: 'Le moteur passe derrière',
    breakthrough: 'Moteur central arrière, châssis monocoque',
    rivalry: 'Jim Clark — John Surtees',
    text: "Cooper place le moteur derrière le pilote ; l'establishment ricane. Jack Brabham gagne deux titres, et en trois saisons toute la grille a copié. Chez Lotus, Colin Chapman pousse la légèreté jusqu'à la monocoque. En 1966, Brabham devient le seul homme titré sur une voiture portant son nom.",
    figure: { value: '1', label: 'seul champion sur sa propre voiture' },
  },
  {
    id: 'ailerons',
    years: '1968 — 1976',
    title: 'L’appui aérodynamique',
    breakthrough: 'Ailerons, puis effet de sol',
    rivalry: 'Niki Lauda — James Hunt',
    text: "En 1968, des ailerons apparaissent sur les Lotus : une F1 peut être plaquée au sol par l'air qu'elle traverse. La même année, les couleurs nationales cèdent aux livrées de sponsors. La vitesse grimpe plus vite que la sécurité, jusqu'à ce que Jackie Stewart impose le sujet au paddock.",
    figure: { value: '1', label: 'point d’écart entre Hunt et Lauda en 1976' },
  },
  {
    id: 'turbo',
    years: '1977 — 1988',
    title: 'L’ère turbo',
    breakthrough: 'Suralimentation, jusqu’à 1 400 ch en qualification',
    rivalry: 'Ayrton Senna — Alain Prost',
    text: "Renault engage un turbo de 1,5 litre en 1977. On l'appelle la théière jaune, tant il fume au bord de la piste. Cinq ans plus tard, personne ne gagne sans turbo. En qualification 1986, certains blocs dépassent 1 400 chevaux, sans la moindre assistance électronique.",
    figure: { value: '15/16', label: 'victoires McLaren en 1988' },
  },
  {
    id: 'electronique',
    years: '1989 — 2005',
    title: 'Atmosphériques et électronique',
    breakthrough: 'Suspension active, antipatinage, V10 à 19 000 tr/min',
    rivalry: 'Michael Schumacher — Mika Häkkinen',
    text: "Les turbos interdits, le V10 atmosphérique devient le son d'une génération. La Williams FW14B de 1992 embarque une suspension active qui la met hors de portée ; les assistances seront bannies dès 1994. Le 1er mai de cette année-là, Imola coûte la vie à Ratzenberger puis à Senna.",
    figure: { value: '19 000', label: 'tr/min des V10 de la période' },
  },
  {
    id: 'aero',
    years: '2006 — 2013',
    title: 'V8 et aérodynamique extrême',
    breakthrough: 'Double diffuseur, échappements soufflés, DRS',
    rivalry: 'Sebastian Vettel — Fernando Alonso',
    text: "Le V8 remplace le V10, mais la bataille s'est déplacée sous la voiture. En 2009, Brawn exploite une faille du règlement et remporte le titre dès sa première saison. Red Bull souffle ensuite ses gaz d'échappement dans le diffuseur, et Adrian Newey signe quatre doublés consécutifs.",
    figure: { value: '4', label: 'titres consécutifs pour Vettel' },
  },
  {
    id: 'hybride',
    years: '2014 — 2021',
    title: 'L’ère hybride',
    breakthrough: 'V6 turbo hybride, récupération thermique et cinétique',
    rivalry: 'Lewis Hamilton — Max Verstappen',
    text: "Le règlement de 2014 impose un V6 turbo dont un moteur électrique récupère l'énergie des gaz d'échappement. C'est l'unité de puissance la plus efficiente jamais engagée en compétition, et Mercedes la comprend avant tout le monde : huit titres constructeurs d'affilée.",
    figure: { value: '8', label: 'titres constructeurs consécutifs' },
  },
  {
    id: 'effet-de-sol',
    years: '2022 — 2025',
    title: 'Le retour de l’effet de sol',
    breakthrough: 'Fonds plats à tunnels Venturi',
    rivalry: 'Max Verstappen — Lando Norris',
    text: "Pour permettre aux voitures de se suivre, la F1 rappelle l'effet de sol quarante ans après l'avoir interdit. Le premier hiver ramène le marsouinage, ces rebonds qui secouent les pilotes en ligne droite. Le problème réglé, Red Bull signe la saison la plus dominatrice de l'ère moderne.",
    figure: { value: '21/22', label: 'victoires Red Bull en 2023' },
  },
  {
    id: 'nouvelle-donne',
    years: '2026 — ',
    title: 'La nouvelle donne',
    breakthrough: 'Puissance 50 % électrique, carburants durables, aéro active',
    rivalry: 'Une grille rebattue',
    text: "Le règlement 2026 répartit la puissance à parts égales entre thermique et électrique, supprime le MGU-H et impose un carburant entièrement durable. Les voitures rétrécissent, l'aérodynamique devient active. Une rupture pareille rebat les cartes : Audi reprend Hinwil, Cadillac rejoint la grille.",
    figure: { value: '11', label: 'écuries au départ de 2026' },
  },
]
