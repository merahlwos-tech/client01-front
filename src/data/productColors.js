// src/data/productColors.js
// Couleurs proposées sur les fiches produit. La commande enregistre le NOM de
// la couleur (pas son code) : l'atelier réutilise donc cette même table pour
// que la saisie de la confirmatrice soit identique à celle du client.

export const COLOR_NAMES = {
  '#000000': { fr: 'Noir',        ar: 'أسود' },
  '#FFFFFF': { fr: 'Blanc',       ar: 'أبيض' },
  '#EF4444': { fr: 'Rouge',       ar: 'أحمر' },
  '#3B82F6': { fr: 'Bleu',        ar: 'أزرق' },
  '#22C55E': { fr: 'Vert',        ar: 'أخضر' },
  '#EAB308': { fr: 'Jaune',       ar: 'أصفر' },
  '#F97316': { fr: 'Orange',      ar: 'برتقالي' },
  '#EC4899': { fr: 'Rose',        ar: 'وردي' },
  '#A855F7': { fr: 'Violet',      ar: 'بنفسجي' },
  '#92400E': { fr: 'Marron',      ar: 'بني' },
  '#6B7280': { fr: 'Gris',        ar: 'رمادي' },
  '#D97706': { fr: 'Doré',        ar: 'ذهبي' },
  '#94A3B8': { fr: 'Argenté',     ar: 'فضي' },
  '#1E3A8A': { fr: 'Bleu marine', ar: 'أزرق داكن' },
  '#7F1D1D': { fr: 'Bordeaux',    ar: 'بوردو' },
  '#0D9488': { fr: 'Turquoise',   ar: 'تركوازي' },
  '#F5E6C8': { fr: 'Beige',       ar: 'بيج' },
  '#8B5CF6': { fr: 'Lavande',     ar: 'لافندر' },
}

// Nom lisible d'une couleur ; le code brut sert de repli s'il est inconnu
export const colorName = (hex, lang = 'fr') =>
  COLOR_NAMES[hex]?.[lang] || COLOR_NAMES[hex]?.fr || hex
