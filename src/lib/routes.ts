// Le site est construit en multi-pages : chaque partie est un vrai document
// HTML, servi tel quel par l'hebergement statique. Pas de routeur client, donc
// pas de lien profond casse faute de reecriture cote serveur.

export interface Route {
  /** Chemin relatif a la base, '' pour l'accueil. */
  path: string
  label: string
  index: string
}

export const ROUTES: Route[] = [
  { path: 'ecuries/', label: 'Écuries', index: '01' },
  { path: 'calendrier/', label: 'Calendrier', index: '02' },
  { path: 'histoire/', label: 'Histoire', index: '03' },
]

/** BASE_URL vaut '/f1/' en production et en dev : les liens suivent la base. */
export const href = (path: string): string => `${import.meta.env.BASE_URL}${path}`

/** Route courante, deduite de l'URL. null sur l'accueil. */
export function currentRoute(pathname: string = location.pathname): Route | null {
  return ROUTES.find((r) => pathname.endsWith(`/${r.path}`) || pathname.endsWith(`/${r.path}index.html`)) ?? null
}
