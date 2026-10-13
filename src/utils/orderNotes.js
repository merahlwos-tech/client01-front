// src/utils/orderNotes.js
// Une commande de plusieurs articles porte, pour chacun, son logo et ses
// consignes. Le serveur les reporte aussi au niveau de la commande (logos
// réunis, consignes résumées en un texte) pour que tout ce qui la lisait
// « comme avant » continue de fonctionner. Ces fonctions font le tri à
// l'affichage, pour ne rien montrer en double.

/* Consignes de tous les articles réunies en un seul texte.
   (La même fonction existe côté serveur : back/models/Order.js.) */
export const combinedNotes = (items = []) => items
  .filter(i => String(i.notes || '').trim())
  .map(i => `${i.name}${i.size ? ` ${i.size}` : ''} : ${String(i.notes).trim()}`)
  .join('\n')

// La description générale n'est-elle que ce résumé automatique ?
export const isAutoDescription = (order) => {
  const d = String(order?.customerInfo?.description || '').trim()
  return !!d && d === combinedNotes(order?.items || [])
}

// Logos de la commande qui n'appartiennent à aucun article en particulier
export const generalLogos = (order) => {
  const own = new Set((order?.items || []).flatMap(i => i.logoUrls || []))
  return (order?.customerInfo?.logoUrls || []).filter(u => !own.has(u))
}
