// src/Components/staff/staffConfig.js
// Configuration partagée de la plateforme interne : rôles, étapes, permissions.

/* ═══════════════════════════════════════════════════════════════════════════
   ⚠️  ACCÈS LIBRE À L'ATELIER — SÉCURITÉ DÉSACTIVÉE
   ───────────────────────────────────────────────────────────────────────────
   Quand OPEN_ACCESS vaut true, /staff est accessible SANS connexion et tous
   les panels sont visibles par n'importe qui.

   👉 POUR RÉACTIVER LA SÉCURITÉ : mettre `false` ci-dessous
      ET côté back : STAFF_OPEN_ACCESS=false (voir back/middleware/auth.js)
   ═══════════════════════════════════════════════════════════════════════════ */
export const OPEN_ACCESS = true

export const NAVY   = '#1e1b4b'
export const PURPLE = '#7c3aed'

// Libellés lisibles des rôles
export const ROLE_LABELS = {
  superadmin:      'Super Admin',
  chef_production: 'Chef de production',
  confirmatrice:   'Confirmatrice',
  designer:        'Designer',
  insolation:      'Insolation',
  production:      'Production',
  emballage:       'Emballage',
  admin:           'Propriétaire',   // compte .env legacy = superadmin
}

// Étapes du pipeline (doit correspondre au backend Order.PIPELINE_STAGES)
export const STAGES = {
  confirmation: { label: 'Confirmation', color: '#f59e0b', bg: '#fffbeb' },
  design:       { label: 'Design',       color: '#8b5cf6', bg: '#f5f3ff' },
  production:   { label: 'Production',   color: '#3b82f6', bg: '#eff6ff' },
  emballage:    { label: 'Emballage',    color: '#06b6d4', bg: '#ecfeff' },
  livraison:    { label: 'Livraison',    color: '#10b981', bg: '#ecfdf5' },
  termine:      { label: 'Terminé',      color: '#22c55e', bg: '#f0fdf4' },
  annulee:      { label: 'Annulée',      color: '#ef4444', bg: '#fef2f2' },
}

// Statut public d'une commande (géré par la confirmatrice).
// L'ordre des clés est celui d'affichage : confirmé, en attente, annulé.
export const ORDER_STATUS = {
  'confirmé':   { label: 'Confirmé',   color: '#10b981', bg: '#ecfdf5' },
  'en attente': { label: 'En attente', color: '#f59e0b', bg: '#fffbeb' },
  'annulé':     { label: 'Annulé',     color: '#ef4444', bg: '#fef2f2' },
}
export const STATUS_KEYS = Object.keys(ORDER_STATUS)

// Étiquette d'urgence posée par la confirmatrice
export const URGENCY = {
  normal:      { label: 'Normal',       short: 'Normal', color: '#6b7280', bg: '#f3f4f6' },
  urgent:      { label: 'Urgent',       short: 'Urgent', color: '#f59e0b', bg: '#fffbeb' },
  tres_urgent: { label: 'Super urgent', short: 'Super',  color: '#ef4444', bg: '#fef2f2' },
}
export const URGENCY_KEYS = Object.keys(URGENCY)

// Statuts du service insolation
export const INSOLATION_STATUS = {
  en_attente: { label: 'En attente', color: '#f59e0b', bg: '#fffbeb' },
  confirme:   { label: 'Confirmé',   color: '#10b981', bg: '#ecfdf5' },
}

// Étiquette posée par le designer
export const DESIGNER_TAGS = {
  aucun:           { label: 'Aucune',         color: '#6b7280', bg: '#f3f4f6' },
  // Orange franc, distinct de l'ambre de l'urgence pour éviter la confusion
  reponses_lentes: { label: 'Réponses lentes', color: '#ea580c', bg: '#fff7ed' },
}
export const DESIGNER_TAG_KEYS = Object.keys(DESIGNER_TAGS)

// Délai accordé à l'atelier après confirmation (doit rester aligné
// avec DEADLINE_DAYS côté back)
export const DEADLINE_DAYS = 6

/* Reste à courir avant l'échéance.
   → { days, hours, expired, label, color, bg } ou null si pas de compte à rebours */
export function getCountdown(deadlineAt) {
  if (!deadlineAt) return null
  const ms = new Date(deadlineAt).getTime() - Date.now()
  const expired = ms <= 0
  const abs   = Math.abs(ms)
  const days  = Math.floor(abs / 86400000)
  const hours = Math.floor((abs % 86400000) / 3600000)

  let color = '#10b981', bg = '#ecfdf5'          // large
  if (expired)        { color = '#ef4444'; bg = '#fef2f2' }
  else if (days < 1)  { color = '#ef4444'; bg = '#fef2f2' }  // moins d'un jour
  else if (days < 3)  { color = '#f59e0b'; bg = '#fffbeb' }  // ça se resserre

  const label = expired
    ? (days > 0 ? `Retard ${days}j` : `Retard ${hours}h`)
    : (days > 0 ? `${days}j ${hours}h` : `${hours}h`)

  return { days, hours, expired, label, color, bg }
}

/* ── Planification de la fabrication ────────────────────────────────────────
   Les dates sont manipulées en LOCAL (fuseau de l'atelier) et transmises au
   serveur sous forme « YYYY-MM-DD », ce qui évite tout décalage de jour.   */

// Indexé par getDay() : 0 = dimanche … 6 = samedi. Sert aux recherches
// WEEKDAYS[date.getDay()] — ne pas réordonner ce tableau.
export const WEEKDAYS = [
  { day: 0, label: 'Dimanche', short: 'Dim' },
  { day: 1, label: 'Lundi',    short: 'Lun' },
  { day: 2, label: 'Mardi',    short: 'Mar' },
  { day: 3, label: 'Mercredi', short: 'Mer' },
  { day: 4, label: 'Jeudi',    short: 'Jeu' },
  { day: 5, label: 'Vendredi', short: 'Ven' },
  { day: 6, label: 'Samedi',   short: 'Sam' },
]

// La semaine de l'atelier va du SAMEDI au VENDREDI
export const WEEK_START = 6                       // samedi (getDay)
export const WEEKDAYS_ORDERED = [6, 0, 1, 2, 3, 4, 5].map(i => WEEKDAYS[i])

// Date locale au format YYYY-MM-DD (sans passer par UTC)
export function toDateStr(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const todayStr = () => toDateStr(new Date())

// Prochaine occurrence d'un jour de la semaine (aujourd'hui compte)
export function nextDateForWeekday(weekday) {
  const now = new Date()
  const diff = (weekday - now.getDay() + 7) % 7
  const target = new Date(now)
  target.setDate(now.getDate() + diff)
  return toDateStr(target)
}

// « Lundi 24 août » — libellé lisible d'une date YYYY-MM-DD
export function formatDayLabel(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const label = WEEKDAYS[date.getDay()]?.label || ''
  return `${label} ${d}/${String(m).padStart(2, '0')}`
}

/* ── Quels états chaque service voit-il ? ────────────────────────────────────
   Un statut appartient au service qui le pose : « Confirmé » est la décision
   de la confirmatrice, elle n'a pas à s'afficher chez le designer. L'urgence,
   le compte à rebours et les notes restent visibles partout : ce sont des
   signaux communs à l'atelier.                                              */
const TOUT = {
  orderStatus: true, designValidated: true, insolation: true,
  productionDate: true, slowClient: true,
}
const RIEN = {
  orderStatus: false, designValidated: false, insolation: false,
  productionDate: false, slowClient: false,
}

export const SERVICE_BADGES = {
  confirmatrice: { ...RIEN, orderStatus: true },
  designer:      { ...RIEN, designValidated: true, productionDate: true, slowClient: true },
  insolation:    { ...RIEN, insolation: true },
  production:    { ...RIEN, productionDate: true },
  emballage:     { ...RIEN },
  livraison:     { ...RIEN },
  chef:          { ...TOUT },   // supervision : il voit tout
}

// Sans service précisé (vue superadmin / hub), on montre tout
export const badgesFor = (service) => SERVICE_BADGES[service] || TOUT

// Qui AGIT sur chaque étape
export const STAGE_ACTOR = {
  confirmation: 'confirmatrice',
  design:       'designer',
  production:   'production',
  emballage:    'emballage',
  livraison:    'chef_production',
}

export const isSuperadmin = (role) => role === 'superadmin' || role === 'admin'

// L'utilisateur peut-il AGIR sur cette étape ?
export const canAct = (role, stage) =>
  isSuperadmin(role) || STAGE_ACTOR[stage] === role

// L'utilisateur peut-il VOIR cette étape ? (chef + superadmin voient tout)
export const canView = (role, stage) =>
  isSuperadmin(role) || role === 'chef_production' || STAGE_ACTOR[stage] === role

// Peut ajouter/modifier du stock (chef + superadmin)
export const canWriteStock = (role) =>
  isSuperadmin(role) || role === 'chef_production'

/* Vignette Cloudinary générée à la volée.
   Les logos clients pèsent souvent près d'un Mo : les charger en pleine
   résolution pour une vignette de 48 px bloque le rendu. Cloudinary sait
   redimensionner et convertir côté serveur — quelques Ko suffisent alors.
   Les URLs non-Cloudinary (ou les PDF) sont laissées intactes. */
export function thumb(url, size = 96) {
  if (!url || typeof url !== 'string') return url
  if (!url.includes('/image/upload/')) return url          // PDF, raw, autre hébergeur
  if (/\/upload\/[a-z]+_/.test(url)) return url            // transformation déjà présente
  return url.replace(
    '/image/upload/',
    `/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`
  )
}

// Référence courte d'une commande (8 derniers caractères de l'_id)
export const shortRef = (id) => (id ? String(id).slice(-8).toUpperCase() : '—')
