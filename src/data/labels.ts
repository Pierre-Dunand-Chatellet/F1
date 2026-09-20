// Jolpica publie ses libelles en anglais. Le site est en francais : sans cette
// table, "Azerbaijan Grand Prix — Baku, Azerbaijan" s'affiche au milieu d'une
// interface francaise.
//
// Table par circuitId plutot que par nom de course : le nom peut changer d'une
// annee a l'autre (le GP de Bahrein 2026 se court a Sepang), l'identifiant du
// circuit non. Un circuit absent retombe sur le libelle de l'API.

import type { Race } from '../lib/types.ts'

interface Label {
  gp: string
  country: string
  locality?: string
}

const LABELS: Record<string, Label> = {
  albert_park: { gp: "Grand Prix d'Australie", country: 'Australie' },
  shanghai: { gp: 'Grand Prix de Chine', country: 'Chine' },
  suzuka: { gp: 'Grand Prix du Japon', country: 'Japon' },
  miami: { gp: 'Grand Prix de Miami', country: 'États-Unis' },
  villeneuve: { gp: 'Grand Prix du Canada', country: 'Canada', locality: 'Montréal' },
  monaco: { gp: 'Grand Prix de Monaco', country: 'Monaco', locality: 'Monte-Carlo' },
  catalunya: { gp: 'Grand Prix de Barcelone', country: 'Espagne', locality: 'Barcelone' },
  red_bull_ring: { gp: "Grand Prix d'Autriche", country: 'Autriche' },
  silverstone: { gp: 'Grand Prix de Grande-Bretagne', country: 'Royaume-Uni' },
  spa: { gp: 'Grand Prix de Belgique', country: 'Belgique' },
  hungaroring: { gp: 'Grand Prix de Hongrie', country: 'Hongrie' },
  zandvoort: { gp: 'Grand Prix des Pays-Bas', country: 'Pays-Bas' },
  monza: { gp: "Grand Prix d'Italie", country: 'Italie' },
  madring: { gp: "Grand Prix d'Espagne", country: 'Espagne' },
  baku: { gp: "Grand Prix d'Azerbaïdjan", country: 'Azerbaïdjan', locality: 'Bakou' },
  sepang: { gp: 'Grand Prix de Bahreïn en Malaisie', country: 'Malaisie' },
  marina_bay: { gp: 'Grand Prix de Singapour', country: 'Singapour' },
  americas: { gp: 'Grand Prix des États-Unis', country: 'États-Unis' },
  rodriguez: { gp: 'Grand Prix de Mexico', country: 'Mexique', locality: 'Mexico' },
  interlagos: { gp: 'Grand Prix du Brésil', country: 'Brésil' },
  vegas: { gp: 'Grand Prix de Las Vegas', country: 'États-Unis' },
  losail: { gp: 'Grand Prix du Qatar', country: 'Qatar' },
  yas_marina: { gp: "Grand Prix d'Abu Dhabi", country: 'Émirats arabes unis' },
}

/** Libelles francais d'un Grand Prix, avec repli sur ceux de l'API. */
export function localise(race: Race): { name: string; country: string; locality: string } {
  const label = LABELS[race.Circuit.circuitId]
  return {
    name: label?.gp ?? race.raceName,
    country: label?.country ?? race.Circuit.Location.country,
    locality: label?.locality ?? race.Circuit.Location.locality,
  }
}

/**
 * Jolpica donne les nationalites sous forme d'adjectif anglais ("German").
 * On affiche le pays plutot qu'un adjectif francais : "Allemagne" evite
 * l'accord de genre, qui differe entre une ecurie (allemande) et un pilote
 * (allemand) pour une seule et meme valeur d'API.
 *
 * Liste etablie sur les valeurs reellement presentes dans les donnees 2026 ;
 * une nationalite inconnue s'affiche telle quelle.
 */
const NATIONALITIES: Record<string, string> = {
  American: 'États-Unis',
  Argentine: 'Argentine',
  Australian: 'Australie',
  Austrian: 'Autriche',
  Belgian: 'Belgique',
  Brazilian: 'Brésil',
  British: 'Royaume-Uni',
  Canadian: 'Canada',
  Danish: 'Danemark',
  Dutch: 'Pays-Bas',
  Finnish: 'Finlande',
  French: 'France',
  German: 'Allemagne',
  Italian: 'Italie',
  Japanese: 'Japon',
  Mexican: 'Mexique',
  Monegasque: 'Monaco',
  'New Zealander': 'Nouvelle-Zélande',
  Spanish: 'Espagne',
  Swiss: 'Suisse',
  Thai: 'Thaïlande',
}

export const nationality = (value: string): string => NATIONALITIES[value] ?? value
