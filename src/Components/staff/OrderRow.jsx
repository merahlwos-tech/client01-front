// src/Components/staff/OrderRow.jsx
// Ligne compacte d'une commande : logo client, nom, notes tronquées et
// pastilles d'état. Un clic ouvre le détail complet.

import { ImageIcon, ChevronRight, FileText, Package } from 'lucide-react'
import {
  NAVY, PURPLE, URGENCY, ORDER_STATUS, DESIGNER_TAGS, INSOLATION_STATUS,
  getCountdown, formatDayLabel, shortRef, thumb, badgesFor,
} from './staffConfig'

const isPdf = (url) => /\.pdf($|\?)/i.test(url || '')

/* Vignette du logo client (première image non-PDF) */
function LogoThumb({ logoUrls = [] }) {
  const img = logoUrls.find(u => !isPdf(u))

  /* La vignette est demandée en 160 px pour rester nette sur les écrans
     à forte densité (72 px affichés). */
  if (img) {
    return (
      <img src={thumb(img, 160)} alt="" loading="lazy" decoding="async"
        width={72} height={72}
        className="w-[72px] h-[72px] rounded-xl object-cover flex-shrink-0 border"
        style={{ borderColor: 'rgba(124,58,237,0.2)' }} />
    )
  }
  return (
    <div className="w-[72px] h-[72px] rounded-xl flex-shrink-0 flex items-center justify-center border"
      style={{ background: '#f5f3ff', borderColor: 'rgba(124,58,237,0.15)' }}>
      {logoUrls.length > 0
        ? <FileText size={26} style={{ color: PURPLE }} />
        : <ImageIcon size={26} style={{ color: 'rgba(124,58,237,0.35)' }} />}
    </div>
  )
}

/* Petite pastille */
function Pill({ children, color, bg, solid }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: solid ? color : bg, color: solid ? 'white' : color }}>
      {children}
    </span>
  )
}

/* `tagScope` : les étiquettes sont PRIVÉES à chaque service. On n'affiche que
   celles du service qui regarde ; sans scope, aucune n'est montrée.
   `showQuantity` : l'insolation n'a pas besoin des quantités. */
function OrderRow({
  order, onOpen, tagScope = null, showQuantity = true, service = null,
  showPrice = true,   // production et insolation n'ont pas à voir les montants
  /* Mode sélection (suppression manuelle) : la case vit HORS du bouton,
     un élément interactif ne pouvant en contenir un autre. */
  selectable = false, selected = false, onToggleSelect,
  purge = null,       // compte à rebours avant suppression d'une annulée
}) {
  const badges = badgesFor(service)
  const c        = order.customerInfo || {}
  const urgency  = URGENCY[order.pipeline?.urgency]
  const status   = ORDER_STATUS[order.status]
  const slow     = DESIGNER_TAGS[order.pipeline?.designerTag]
  const cd       = getCountdown(order.pipeline?.deadlineAt)
  const custom   = tagScope
    ? (order.pipeline?.customTags || []).filter(t => t?.scope === tagScope)
    : []
  const isUrgent = order.pipeline?.urgency && order.pipeline.urgency !== 'normal'
  const decided  = !!order.pipeline?.statusSetAt   // la confirmatrice a tranché
  const items    = order.items || []

  const row = (
    <button onClick={() => onOpen(order)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border-2 text-left transition-all hover:shadow-md"
      style={{ borderColor: selected ? PURPLE : isUrgent ? urgency.color + '55' : '#f0f0f4' }}>

      <LogoThumb logoUrls={c.logoUrls} />

      <div className="min-w-0 flex-1">
        {/* Nom + référence */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold truncate" style={{ color: NAVY }}>
            {c.firstName} {c.lastName}
          </p>
          <span className="text-[10px] text-gray-300 font-mono flex-shrink-0">
            #{shortRef(order._id)}
          </span>
        </div>

        {/* Articles : produit, taille et quantité */}
        {items.length > 0 && (
          <p className="text-xs truncate mt-0.5 flex items-center gap-1" style={{ color: '#4b5563' }}>
            <Package size={11} className="flex-shrink-0" style={{ color: PURPLE }} />
            {items.map((it, i) => (
              <span key={i}>
                {i > 0 && <span className="text-gray-300"> — </span>}
                <span className="font-semibold">{it.name}</span>
                {it.size && <span className="text-gray-400"> · {it.size}</span>}
                {showQuantity && it.quantity != null && (
                  <span className="font-bold" style={{ color: PURPLE }}> ×{it.quantity}</span>
                )}
              </span>
            ))}
          </p>
        )}

        {/* Notes du client, tronquées sur une ligne */}
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {c.description?.trim() || <span className="italic text-gray-300">Aucune note</span>}
        </p>

        {/* Pastilles d'état */}
        <div className="flex items-center gap-1 flex-wrap mt-1.5">
          {/* L'urgence est un signal commun : elle reste visible partout */}
          {isUrgent && <Pill color={urgency.color} solid>{urgency.short}</Pill>}

          {/* Décision de la confirmatrice — visible d'elle seule */}
          {badges.orderStatus && (!decided
            ? <Pill color={PURPLE} bg="rgba(124,58,237,0.1)">Nouveau</Pill>
            : status && <Pill color={status.color} bg={status.bg}>{status.label}</Pill>)}

          {badges.designValidated && order.pipeline?.designValidated &&
            <Pill color="#10b981" bg="#ecfdf5">Traité</Pill>}
          {badges.slowClient && order.pipeline?.designerTag === 'reponses_lentes' &&
            <Pill color={slow.color} bg={slow.bg}>Lent</Pill>}
          {badges.productionDate && order.pipeline?.productionDate &&
            <Pill color="#2563eb" bg="#eff6ff">{formatDayLabel(order.pipeline.productionDate)}</Pill>}
          {badges.insolation && order.pipeline?.insolation?.status === 'confirme' && (
            <Pill color={INSOLATION_STATUS.confirme.color} bg={INSOLATION_STATUS.confirme.bg}>
              Insolé
            </Pill>
          )}
          {(order.pipeline?.notes?.length > 0) && (
            <Pill color="#6b7280" bg="#f3f4f6">{order.pipeline.notes.length} note{order.pipeline.notes.length > 1 ? 's' : ''}</Pill>
          )}
          {cd && <Pill color={cd.color} bg={cd.bg}>{cd.label}</Pill>}
          {/* Commande annulée : dans combien de temps disparaît-elle ? */}
          {purge && <Pill color={purge.color} bg={purge.bg}>{purge.label}</Pill>}
          {custom.map(t => (
            <Pill key={t._id} color={t.color} bg={t.color + '1a'}>{t.name}</Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {showPrice && (
          <span className="text-sm font-black" style={{ color: PURPLE }}>
            {Number(order.total || 0).toLocaleString('fr-DZ')}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300" />
      </div>
    </button>
  )

  if (!selectable) return row

  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" checked={selected}
        onChange={() => onToggleSelect?.(order._id)}
        aria-label="Sélectionner cette commande"
        className="w-5 h-5 flex-shrink-0 accent-purple-600 cursor-pointer" />
      <div className="min-w-0 flex-1">{row}</div>
    </div>
  )
}

export default OrderRow
