// src/Components/staff/OrderRow.jsx
// Ligne compacte d'une commande : logo client, nom, notes tronquées et
// pastilles d'état. Un clic ouvre le détail complet.

import { ImageIcon, ChevronRight, FileText } from 'lucide-react'
import {
  NAVY, PURPLE, URGENCY, ORDER_STATUS, DESIGNER_TAGS, INSOLATION_STATUS,
  getCountdown, formatDayLabel, shortRef,
} from './staffConfig'

const isPdf = (url) => /\.pdf($|\?)/i.test(url || '')

/* Vignette du logo client (première image non-PDF) */
function LogoThumb({ logoUrls = [] }) {
  const img = logoUrls.find(u => !isPdf(u))

  if (img) {
    return (
      <img src={img} alt="" loading="lazy"
        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border"
        style={{ borderColor: 'rgba(124,58,237,0.2)' }} />
    )
  }
  return (
    <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border"
      style={{ background: '#f5f3ff', borderColor: 'rgba(124,58,237,0.15)' }}>
      {logoUrls.length > 0
        ? <FileText size={18} style={{ color: PURPLE }} />
        : <ImageIcon size={18} style={{ color: 'rgba(124,58,237,0.35)' }} />}
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

function OrderRow({ order, onOpen }) {
  const c        = order.customerInfo || {}
  const urgency  = URGENCY[order.pipeline?.urgency]
  const status   = ORDER_STATUS[order.status]
  const slow     = DESIGNER_TAGS[order.pipeline?.designerTag]
  const cd       = getCountdown(order.pipeline?.deadlineAt)
  const custom   = order.pipeline?.customTags || []
  const isUrgent = order.pipeline?.urgency && order.pipeline.urgency !== 'normal'
  const decided  = !!order.pipeline?.statusSetAt   // la confirmatrice a tranché

  return (
    <button onClick={() => onOpen(order)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border-2 text-left transition-all hover:shadow-md"
      style={{ borderColor: isUrgent ? urgency.color + '55' : '#f0f0f4' }}>

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

        {/* Notes du client, tronquées sur une ligne */}
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {c.description?.trim() || <span className="italic text-gray-300">Aucune note</span>}
        </p>

        {/* Pastilles d'état */}
        <div className="flex items-center gap-1 flex-wrap mt-1.5">
          {isUrgent && <Pill color={urgency.color} solid>{urgency.short}</Pill>}
          {/* Tant que la confirmatrice n'a rien décidé, la commande est
              « nouvelle » : afficher « En attente » serait trompeur. */}
          {!decided
            ? <Pill color={PURPLE} bg="rgba(124,58,237,0.1)">Nouveau</Pill>
            : status && <Pill color={status.color} bg={status.bg}>{status.label}</Pill>}
          {order.pipeline?.designValidated && <Pill color="#10b981" bg="#ecfdf5">Validé</Pill>}
          {order.pipeline?.designerTag === 'reponses_lentes' &&
            <Pill color={slow.color} bg={slow.bg}>Lent</Pill>}
          {order.pipeline?.productionDate &&
            <Pill color="#2563eb" bg="#eff6ff">{formatDayLabel(order.pipeline.productionDate)}</Pill>}
          {order.pipeline?.insolation?.status === 'confirme' && (
            <Pill color={INSOLATION_STATUS.confirme.color} bg={INSOLATION_STATUS.confirme.bg}>
              Insolé
            </Pill>
          )}
          {(order.pipeline?.notes?.length > 0) && (
            <Pill color="#6b7280" bg="#f3f4f6">{order.pipeline.notes.length} note{order.pipeline.notes.length > 1 ? 's' : ''}</Pill>
          )}
          {cd && <Pill color={cd.color} bg={cd.bg}>{cd.label}</Pill>}
          {custom.map(t => (
            <Pill key={t._id} color={t.color} bg={t.color + '1a'}>{t.name}</Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-black" style={{ color: PURPLE }}>
          {Number(order.total || 0).toLocaleString('fr-DZ')}
        </span>
        <ChevronRight size={16} className="text-gray-300" />
      </div>
    </button>
  )
}

export default OrderRow
