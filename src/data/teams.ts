// Identite visuelle par ecurie. Les couleurs viennent d'OpenF1 au runtime ;
// ce qui est ici, c'est ce qu'aucune API ne donne.

/**
 * team_name OpenF1 -> constructorId Jolpica.
 * Ecrit a la main : un slug automatique ferait correspondre
 * "Red Bull Racing" a `red_bull_racing`, alors que Jolpica dit `red_bull`.
 */
export const TEAM_NAME_TO_ID: Record<string, string> = {
  Alpine: 'alpine',
  'Aston Martin': 'aston_martin',
  Audi: 'audi',
  'Cadillac F1 Team': 'cadillac',
  Cadillac: 'cadillac',
  Ferrari: 'ferrari',
  'Haas F1 Team': 'haas',
  McLaren: 'mclaren',
  Mercedes: 'mercedes',
  'Racing Bulls': 'rb',
  'RB F1 Team': 'rb',
  'Red Bull Racing': 'red_bull',
  'Red Bull': 'red_bull',
  Williams: 'williams',
}

/**
 * Couleur de secours si OpenF1 est injoignable. Teintes officielles 2026,
 * ecrasees par `team_colour` des que l'API repond.
 */
export const FALLBACK_COLOURS: Record<string, string> = {
  alpine: '#0093CC',
  aston_martin: '#229971',
  audi: '#00505C',
  cadillac: '#B3A369',
  ferrari: '#E8002D',
  haas: '#B6BABD',
  mclaren: '#F47600',
  mercedes: '#27F4D2',
  rb: '#6692FF',
  red_bull: '#3671C6',
  williams: '#64C4FF',
}

/** Nom court affiche dans la marque typographique des cartes. */
export const TEAM_SHORT: Record<string, string> = {
  alpine: 'Alpine',
  aston_martin: 'Aston Martin',
  audi: 'Audi',
  cadillac: 'Cadillac',
  ferrari: 'Ferrari',
  haas: 'Haas',
  mclaren: 'McLaren',
  mercedes: 'Mercedes',
  rb: 'Racing Bulls',
  red_bull: 'Red Bull',
  williams: 'Williams',
}
