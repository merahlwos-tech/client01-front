// src/utils/pricing.js
// Règles de prix de la boutique, partagées avec la saisie de commande de
// l'atelier : une commande passée par la confirmatrice doit aboutir au même
// montant que la même commande passée par le client lui-même.

/* Prix unitaire du palier atteint par la quantité.
   `baseUnitPrice` peut déjà contenir les suppléments (recto-verso, couleurs) :
   on les conserve en repartant de son écart avec le prix de la taille. */
export function getPriceForQty(qty, baseUnitPrice, sizePrice, priceTiers = []) {
  if (!priceTiers.length) return baseUnitPrice
  const sorted = [...priceTiers].sort((a, b) => a.qty - b.qty)
  let tierPrice = sizePrice
  for (const t of sorted) { if (qty >= t.qty) tierPrice = t.price }
  return tierPrice + (baseUnitPrice - sizePrice)
}

/* Décomposition du prix d'un article, à l'identique de la fiche produit :
   palier de quantité + recto-verso + couleurs supplémentaires du design. */
export function priceBreakdown(product, size, quantity, doubleSided, numberOfColors) {
  const sizeObj   = product?.sizes?.find(s => String(s.size) === String(size))
  const sizePrice = sizeObj?.price ?? 0
  const tiers     = sizeObj?.priceTiers ?? []
  const qty       = Number(quantity) || 0

  const tierPrice   = getPriceForQty(qty, sizePrice, sizePrice, tiers)
  const extraDouble = (doubleSided && product?.doubleSided)
    ? (product.doubleSidedPrice ?? 0) : 0
  const nbColors    = Math.max(1, Number(numberOfColors) || 1)
  const extraColors = (product?.colorDesignEnabled && nbColors > 1)
    ? (nbColors - 1) * (product.colorDesignPricePerColor ?? 0) : 0

  const unitPrice = tierPrice + extraDouble + extraColors
  return {
    sizePrice, tierPrice, extraDouble, extraColors, nbColors,
    unitPrice, total: unitPrice * qty,
    hasTiers: tiers.length > 0,
  }
}
