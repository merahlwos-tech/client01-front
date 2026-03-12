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
 * CHANGELOG v2 :
 *  ✅ NEW  — getFbc() : capture fbclid depuis l'URL et le persiste en localStorage
 *  ✅ NEW  — ensureFbp() : génère _fbp manuellement si bloqué par le navigateur
 *  ✅ UPD  — getMetaCookies() utilise getFbc() et ensureFbp() en fallback
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
   getFbc() — Capture et persiste le fbclid Meta
   
   Quand un utilisateur clique sur une pub Meta, l'URL contient
   un paramètre ?fbclid=XXXX. On le convertit en _fbc et on le
   persiste dans localStorage pour les visites suivantes.
   
   Format Meta attendu : fb.{version}.{timestamp}.{fbclid}
───────────────────────────────────────────────*/
export function getFbc() {
  if (typeof window === 'undefined') return undefined

  // 1. Chercher fbclid dans l'URL actuelle
  const urlParams = new URLSearchParams(window.location.search)
  const fbclid = urlParams.get('fbclid')

  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`
    try {
      localStorage.setItem('_fbc_manual', fbc)
    } catch { /* localStorage bloqué (mode privé strict) */ }
    return fbc
  }

  // 2. Fallback : cookie _fbc natif du Pixel
  const cookieMatch = document.cookie.match(/(^| )_fbc=([^;]+)/)
  if (cookieMatch) return cookieMatch[2]

  // 3. Fallback : valeur sauvegardée en localStorage
  try {
    return localStorage.getItem('_fbc_manual') || undefined
  } catch {
    return undefined
  }
}

/* ─────────────────────────────────────────────
   ensureFbp() — Génère _fbp si le Pixel est bloqué
   
   Certains navigateurs (Firefox, Brave, Safari ITP) bloquent
   le cookie _fbp du Pixel. Cette fonction le génère manuellement
   avec le même format que Meta et le persiste 90 jours.
   
   Format Meta : fb.{version}.{timestamp}.{random}
───────────────────────────────────────────────*/
export function ensureFbp() {
  if (typeof document === 'undefined') return

  // Si le cookie existe déjà (créé par le Pixel), ne rien faire
  if (document.cookie.includes('_fbp=')) return

  // Vérifier si on a déjà généré un _fbp manuellement
  try {
    const stored = localStorage.getItem('_fbp_manual')
    if (stored) {
      // Remettre en cookie si expiré
      document.cookie = `_fbp=${stored};max-age=7776000;path=/;SameSite=Lax`
      return
    }
  } catch { /* localStorage indisponible */ }

  // Générer un nouveau _fbp
  const fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 10000000000)}`
  document.cookie = `_fbp=${fbp};max-age=7776000;path=/;SameSite=Lax`

  try {
    localStorage.setItem('_fbp_manual', fbp)
  } catch { /* localStorage bloqué */ }
}

/* ─────────────────────────────────────────────
   getMetaCookies() — Lit _fbp et _fbc avec fallbacks
   
   Ordre de priorité pour chaque valeur :
   1. Cookie natif (créé par le Pixel Meta)
   2. Valeur générée/capturée manuellement
───────────────────────────────────────────────*/
export function getMetaCookies() {
  if (typeof document === 'undefined') return {}

  const getCookie = name => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : undefined
  }

  const fbp = getCookie('_fbp') || (() => {
    try { return localStorage.getItem('_fbp_manual') || undefined } catch { return undefined }
  })()

  const fbc = getFbc()

  return { fbp, fbc }
}

/* ─────────────────────────────────────────────
   Appel silencieux au backend CAPI (fire-and-forget)
   Ne bloque jamais l'UX en cas d'erreur réseau.
   Inclut automatiquement fbp et fbc pour le matching.
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

export function trackPageView() {
  const eventId = generateEventId()
  fbq('track', 'PageView', {}, { eventID: eventId })
  sendCAPIEvent('PageView', eventId)
}

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
 * Purchase — côté Pixel uniquement.
 * @returns {string} eventId — à transmettre au backend
 */
export function trackPurchase(items, total) {
  const eventId  = generateEventId()
  const numItems = items.reduce((s, i) => s + i.quantity, 0)
  fbq('track', 'Purchase', {
    content_ids:  items.map(i => i.productId),
    contents:     items.map(i => ({ id: i.productId, quantity: i.quantity })),
    num_items:    numItems,
    value:        0,
    currency:     'USD',
  }, { eventID: eventId })
  return eventId
}

/* ════════════════════════════════════════════
   HIGH INTENT EVENTS
════════════════════════════════════════════ */

export function trackHighQualityVisitor(productId, productName) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('trackCustom', 'HighQualityVisitor', {
    content_ids:  [productId],
    content_name: productName,
    note:         'Stayed more than 30s on product page',
  })
}

export function trackScrollToForm(productId, productName) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('trackCustom', 'ScrollToForm', {
    content_ids:  [productId],
    content_name: productName,
    note:         'Scrolled to checkout form section',
  })
}

export function trackFormEngagement() {
  const eventId = generateEventId()
  fbq('trackCustom', 'FormEngagement', {
    note: 'Started filling checkout form',
  }, { eventID: eventId })
  sendCAPIEvent('Lead', eventId, { content_name: 'checkout_form' })
}