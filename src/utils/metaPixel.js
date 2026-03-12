/**
 * metaPixel.js — Meta Pixel + Conversions API (double tracking avec déduplication)
 *
 * Architecture :
 *  1. On génère un event_id unique par événement
 *  2. Le Pixel navigateur envoie l'événement avec cet event_id  → côté client
 *  3. On appelle le backend /api/meta/event avec le même event_id → côté serveur (CAPI)
 *  Meta déduplique automatiquement grâce à l'event_id identique.
 *
 * Variables d'environnement requises :
 *  VITE_META_PIXEL_ID   → votre Pixel ID (ex: "123456789012345")
 *  VITE_API_URL         → URL de l'API backend
 *
 * CHANGELOG :
 *  ✅ FIX  — Bug typeof fbq (HighQualityVisitor / ScrollToForm) → vérification window.fbq
 *  ✅ NEW  — getMetaCookies() : lecture _fbp et _fbc pour le matching CAPI
 *  ✅ NEW  — sendCAPIEvent inclut automatiquement fbp / fbc
 *  ✅ NEW  — trackAddPaymentInfo() : signal fort juste avant soumission
 *  ✅ NEW  — trackFormEngagement() envoie aussi Lead en CAPI
 *  ✅ FIX  — AddToCart CAPI inclut maintenant le tableau contents avec item_price
 *  ✅ FIX  — InitiateCheckout CAPI inclut maintenant le tableau contents
 */

const PIXEL_ID  = import.meta.env.VITE_META_PIXEL_ID || 'VOTRE_PIXEL_ID'
const API_BASE  = import.meta.env.VITE_API_URL        || 'http://localhost:5000/api'

/* ─────────────────────────────────────────────
   Génère un event_id unique (UUID v4 ou fallback)
───────────────────────────────────────────────*/
export function generateEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/* ─────────────────────────────────────────────
   Lit les cookies Meta _fbp et _fbc depuis le navigateur.
   Ces cookies permettent à Meta de faire le lien entre
   une pub cliquée et une conversion — améliore considérablement
   le matching côté CAPI.
   - _fbp : Facebook Browser ID (persistant ~90j)
   - _fbc  : Facebook Click ID (présent si l'user vient d'une pub)
───────────────────────────────────────────────*/
export function getMetaCookies() {
  if (typeof document === 'undefined') return {}
  const get = name => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : undefined
  }
  return {
    fbp: get('_fbp'),
    fbc: get('_fbc'),
  }
}

/* ─────────────────────────────────────────────
   Appel silencieux au backend CAPI (fire-and-forget)
   Ne bloque jamais l'UX en cas d'erreur réseau.
   Inclut automatiquement _fbp et _fbc pour le matching.
───────────────────────────────────────────────*/
async function sendCAPIEvent(eventName, eventId, payload = {}) {
  const { fbp, fbc } = getMetaCookies()
  try {
    await fetch(`${API_BASE}/meta/event`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name:       eventName,
        event_id:         eventId,
        event_source_url: window.location.href,
        user_agent:       navigator.userAgent,
        ...(fbp && { fbp }),
        ...(fbc && { fbc }),
        ...payload,
      }),
    })
  } catch {
    // Silencieux — on ne bloque jamais l'UX pour le tracking
  }
}

/* ─────────────────────────────────────────────
   fbq() helper sécurisé
───────────────────────────────────────────────*/
function fbq(type, eventName, data = {}, options = {}) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq(type, eventName, data, options)
}

/* ════════════════════════════════════════════
   ÉVÉNEMENTS PUBLICS
════════════════════════════════════════════ */

/**
 * PageView — déclenché à chaque changement de route
 */
export function trackPageView() {
  const eventId = generateEventId()
  fbq('track', 'PageView', {}, { eventID: eventId })
  sendCAPIEvent('PageView', eventId)
}

/**
 * ViewContent — visite d'une fiche produit
 * @param {object} product  - objet produit complet
 * @param {number} price    - prix unitaire calculé (avec options)
 */
export function trackViewContent(product, price = 0) {
  const eventId = generateEventId()

  fbq('track', 'ViewContent', {
    content_name: product.name,
    content_ids:  [product._id],
    content_type: 'product',
    value:        price,
    currency:     'DZD',
  }, { eventID: eventId })

  sendCAPIEvent('ViewContent', eventId, {
    content_ids:  [product._id],
    content_name: product.name,
    content_type: 'product',
    value:        price,
    currency:     'DZD',
  })
}

/**
 * AddToCart — ajout au panier
 * @param {object} product
 * @param {string} size
 * @param {number} quantity
 * @param {number} unitPrice  - prix unitaire (taille + options)
 */
export function trackAddToCart(product, size, quantity, unitPrice) {
  const eventId    = generateEventId()
  const totalValue = unitPrice * quantity

  fbq('track', 'AddToCart', {
    content_name: product.name,
    content_ids:  [product._id],
    content_type: 'product',
    value:        totalValue,
    currency:     'DZD',
    contents:     [{ id: product._id, quantity, item_price: unitPrice }],
  }, { eventID: eventId })

  sendCAPIEvent('AddToCart', eventId, {
    content_ids:  [product._id],
    content_name: product.name,
    content_type: 'product',
    value:        totalValue,
    currency:     'DZD',
    num_items:    quantity,
    contents:     [{ id: product._id, quantity, item_price: unitPrice }],
  })
}

/**
 * InitiateCheckout — ouverture du formulaire de commande
 * @param {Array}  items  - items du panier
 * @param {number} total  - total panier
 */
export function trackInitiateCheckout(items, total) {
  const eventId  = generateEventId()
  const numItems = items.reduce((s, i) => s + i.quantity, 0)

  fbq('track', 'InitiateCheckout', {
    content_ids:  items.map(i => i.productId),
    contents:     items.map(i => ({ id: i.productId, quantity: i.quantity })),
    num_items:    numItems,
    value:        total,
    currency:     'DZD',
  }, { eventID: eventId })

  sendCAPIEvent('InitiateCheckout', eventId, {
    content_ids: items.map(i => i.productId),
    contents:    items.map(i => ({ id: i.productId, quantity: i.quantity })),
    num_items:   numItems,
    value:       total,
    currency:    'DZD',
  })
}

/**
 * AddPaymentInfo — formulaire entièrement rempli, clic sur "Confirmer la commande"
 * Signal très fort : l'intention d'achat est maximale.
 * @param {Array}  items
 * @param {number} total
 */
export function trackAddPaymentInfo(items, total) {
  const eventId  = generateEventId()
  const numItems = items.reduce((s, i) => s + i.quantity, 0)

  fbq('track', 'AddPaymentInfo', {
    content_ids:  items.map(i => i.productId),
    contents:     items.map(i => ({ id: i.productId, quantity: i.quantity })),
    num_items:    numItems,
    value:        total,
    currency:     'DZD',
  }, { eventID: eventId })

  sendCAPIEvent('AddPaymentInfo', eventId, {
    content_ids:  items.map(i => i.productId),
    contents:     items.map(i => ({ id: i.productId, quantity: i.quantity })),
    num_items:    numItems,
    value:        total,
    currency:     'DZD',
  })
}

/**
 * Purchase — commande confirmée (côté Pixel uniquement)
 * Le CAPI Purchase est déclenché directement par le backend /api/orders
 * avec les données utilisateur complètes (phone, nom, wilaya…) pour
 * maximiser le matching. On passe l'event_id en paramètre pour la déduplication.
 *
 * @param {Array}  items
 * @param {number} total
 * @returns {string} eventId — à transmettre au backend avec la commande
 */
export function trackPurchase(items, total) {
  const eventId  = generateEventId()
  const numItems = items.reduce((s, i) => s + i.quantity, 0)

  // Meta Pixel (navigateur) n'accepte pas DZD pour Purchase
  // Les vraies valeurs DZD sont envoyées par le CAPI serveur
  fbq('track', 'Purchase', {
    content_ids:  items.map(i => i.productId),
    contents:     items.map(i => ({ id: i.productId, quantity: i.quantity })),
    num_items:    numItems,
    value:        0,
    currency:     'USD',
  }, { eventID: eventId })

  return eventId
}

/* ══════════════════════════════════════════════════════════════
   HIGH INTENT EVENTS — Signaux de qualité pour l'algorithme Meta

   Ces événements "chauffent" le Pixel plus vite en lui donnant
   des signaux comportementaux au-delà du simple Purchase.
   Côté Pixel uniquement (sauf FormEngagement qui envoie Lead en CAPI).
══════════════════════════════════════════════════════════════ */

/**
 * HighQualityVisitor — visiteur resté +30s sur la fiche produit
 * Signal : "cet utilisateur s'intéresse vraiment au produit"
 * @param {string} productId
 * @param {string} productName
 */
export function trackHighQualityVisitor(productId, productName) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('trackCustom', 'HighQualityVisitor', {
    content_ids:  [productId],
    content_name: productName,
    note:         'Stayed more than 30s on product page',
  })
}

/**
 * ScrollToForm — visiteur scrollé jusqu'au formulaire de commande
 * Signal fort : "il a lu la page ET cherché le formulaire"
 * @param {string} productId
 * @param {string} productName
 */
export function trackScrollToForm(productId, productName) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('trackCustom', 'ScrollToForm', {
    content_ids:  [productId],
    content_name: productName,
    note:         'Scrolled to checkout form section',
  })
}

/**
 * FormEngagement — visiteur a commencé à remplir le formulaire
 * Signal très fort : "il est en train de passer commande"
 * Déclenché sur le focus du premier champ (prénom).
 * ✅ Envoyé aussi en CAPI comme événement Lead pour maximiser le matching.
 */
export function trackFormEngagement() {
  const eventId = generateEventId()
  fbq('trackCustom', 'FormEngagement', {
    note: 'Started filling checkout form',
  }, { eventID: eventId })
  // Lead côté CAPI — signal fort d'intention d'achat avec matching fbp/fbc
  sendCAPIEvent('Lead', eventId, { content_name: 'checkout_form' })
}