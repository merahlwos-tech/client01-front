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

// Statut public d'une commande (géré par la confirmatrice)
export const ORDER_STATUS = {
  'en attente': { label: 'En attente', color: '#f59e0b', bg: '#fffbeb' },
  'confirmé':   { label: 'Confirmé',   color: '#10b981', bg: '#ecfdf5' },
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

// Référence courte d'une commande (8 derniers caractères de l'_id)
export const shortRef = (id) => (id ? String(id).slice(-8).toUpperCase() : '—')
