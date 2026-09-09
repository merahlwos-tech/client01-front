// src/Components/staff/retraitReversible.js
// Le retrait réversible (la commande quitte les listes mais reste dans
// l'historique) n'existe que sur le serveur à jour. Sur l'ancien, la même
// route EFFACE définitivement, logos compris.
//
// L'interface promet désormais qu'on peut restaurer : tant que le serveur ne
// sait pas le faire, mieux vaut refuser l'action que détruire des commandes
// sur la foi d'une promesse que le serveur ne tiendra pas.

import staffApi from '../../utils/staffApi'

let connu = null   // null = pas encore sondé

export async function retraitReversible() {
  if (connu !== null) return connu
  try {
    /* Sonde inoffensive : la route de restauration refuse une liste vide.
       Un 400 prouve donc qu'elle existe ; un 404 qu'on parle à l'ancien
       serveur, qui n'a que la suppression définitive. */
    await staffApi.post('/workflow/orders/bulk-restore', { ids: [] })
    connu = true
  } catch (err) {
    connu = err.response?.status === 400
  }
  return connu
}

export const MESSAGE_SERVEUR_ANCIEN =
  'Serveur pas encore à jour : le retrait effacerait définitivement les '
  + 'commandes. Réessayez une fois le déploiement passé.'
