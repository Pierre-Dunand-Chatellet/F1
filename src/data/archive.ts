// Photos d'archive de la section Histoire.
//
// Liste tenue a la main, et c'est deliberé : `npm run fetch-images` interroge
// Wikimedia Commons par mots-cles et se trompe souvent — sur sept resultats, il
// avait rapporte une remise de trophees sans rapport, une Porsche de 1962 pour
// l'ere electronique, une course de Formule 3 etiquetee turbo, et un logo
// d'ecurie sous marque deposee. Seules les images verifiees a l'oeil, dont le
// titre d'origine atteste le sujet, figurent ici.
//
// Licences CC0 uniquement : aucune attribution n'est juridiquement exigee, on
// credite quand meme.

export interface ArchivePhoto {
  src: string
  alt: string
  caption: string
  credit: string
  licence: string
  source: string
}

export const ARCHIVE: ArchivePhoto[] = [
  {
    src: 'img/pionniers.jpg',
    alt: "Juan Manuel Fangio en discussion avec Alfred Neubauer, directeur de l'équipe Mercedes, dans le paddock du Grand Prix des Pays-Bas 1955",
    caption: 'Fangio et Alfred Neubauer, Grand Prix des Pays-Bas, 1955',
    credit: 'Joop van Bilsen / Anefo',
    licence: 'CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Juan_Manuel_Fangio_and_Alfred_Neubauer_1955_Dutch_GP.jpg',
  },
  {
    src: 'img/moteur-arriere.jpg',
    alt: 'Jim Clark au volant de sa Lotus à moteur central arrière, en action sur le circuit de Zandvoort',
    caption: 'Jim Clark en Lotus à Zandvoort — le moteur est passé derrière',
    credit: 'Eric Koch / Anefo',
    licence: 'CC0',
    source: 'https://commons.wikimedia.org/wiki/Category:Anefo',
  },
]
