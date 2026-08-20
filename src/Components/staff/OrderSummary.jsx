// src/Components/staff/OrderSummary.jsx
// Bloc de détail d'une commande, réutilisé par tous les panels de l'atelier.
import { useState, useEffect } from 'react'
import {
  Phone, MapPin, Truck, User, FileText, Image as ImageIcon,
  Package, History, ChevronDown, Palette, Timer, Clock, CalendarDays,
  MessageSquare,
} from 'lucide-react'
import {
  NAVY, PURPLE, STAGES, URGENCY, ORDER_STATUS, DESIGNER_TAGS, ROLE_LABELS,
  getCountdown, formatDayLabel, shortRef,
} from './staffConfig'

/* Compte à rebours de l'atelier — se met à jour tout seul chaque minute */
function Countdown({ deadlineAt }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const cd = getCountdown(deadlineAt)
  if (!cd) return null

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full"
      style={{ background: cd.bg, color: cd.color }}
      title={`Échéance : ${new Date(deadlineAt).toLocaleString('fr-DZ')}`}>
      {cd.expired ? <Clock size={11} /> : <Timer size={11} />}
      {cd.label}
    </span>
  )
}

const isPdf = (url) => /\.pdf($|\?)/i.test(url || '')

// Vignette d'un fichier (image ou PDF)
function FileThumb({ url }) {
  if (isPdf(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-xl border-2 text-xs font-bold transition-all hover:opacity-80"
        style={{ borderColor: 'rgba(124,58,237,0.25)', background: '#faf9ff', color: PURPLE }}>
        <FileText size={22} /> PDF
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border-2"
      style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
      <img src={url} alt="fichier" className="w-full h-full object-cover" loading="lazy" />
    </a>
  )
}

function Row({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-2 text-sm" style={{ color: '#374151' }}>
      <Icon size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#9ca3af' }} />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}

function OrderSummary({
  order, showDesign = false, showMaterials = false, showHistory = false,
  showNotes = false,
}) {
  const [openHistory, setOpenHistory] = useState(false)
  const c = order.customerInfo || {}
  const stage      = STAGES[order.pipeline?.stage] || {}
  const urgencyCfg  = URGENCY[order.pipeline?.urgency]
  const statusCfg   = ORDER_STATUS[order.status]
  const designerCfg = DESIGNER_TAGS[order.pipeline?.designerTag]
  const logos = c.logoUrls || []
  const design = order.pipeline?.design
  const materials = order.pipeline?.materialsUsed || []

  return (
    <div className="space-y-4">
      {/* En-tête : réf + étape + urgence + statut + total */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-black text-sm" style={{ color: NAVY }}>#{shortRef(order._id)}</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: stage.bg, color: stage.color }}>
            {stage.label || order.pipeline?.stage}
          </span>
          {/* Étiquette d'urgence posée par la confirmatrice */}
          {urgencyCfg && order.pipeline?.urgency !== 'normal' && (
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: urgencyCfg.color, color: 'white' }}>
              {urgencyCfg.label}
            </span>
          )}
          {statusCfg && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: statusCfg.bg, color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          )}
          {/* Étiquette du designer (ex. client lent à répondre) */}
          {designerCfg && order.pipeline?.designerTag !== 'aucun' && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: designerCfg.bg, color: designerCfg.color }}>
              {designerCfg.label}
            </span>
          )}
          {/* Design validé par le designer */}
          {order.pipeline?.designValidated && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#ecfdf5', color: '#10b981' }}>
              Validé
            </span>
          )}
          {/* Jour de fabrication planifié */}
          {order.pipeline?.productionDate && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#eff6ff', color: '#2563eb' }}>
              <CalendarDays size={11} /> {formatDayLabel(order.pipeline.productionDate)}
            </span>
          )}
          {/* Compte à rebours démarré à la confirmation */}
          <Countdown deadlineAt={order.pipeline?.deadlineAt} />
        </div>
        <div className="text-right">
          <p className="font-black text-sm" style={{ color: PURPLE }}>
            {Number(order.total || 0).toLocaleString('fr-DZ')} DA
          </p>
          <p className="text-[11px] text-gray-400">
            {new Date(order.createdAt).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Client */}
      <div className="space-y-1.5 p-3 rounded-xl" style={{ background: '#f9fafb' }}>
        <Row icon={User}>{c.firstName} {c.lastName}</Row>
        <Row icon={Phone}><a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a></Row>
        <Row icon={MapPin}>{c.wilaya}{c.commune ? ` — ${c.commune}` : ''}</Row>
        <Row icon={Truck}>{c.deliveryMethod || 'Domicile'}{c.deliveryFee != null ? ` (${c.deliveryFee} DA)` : ''}</Row>
        {c.description && <Row icon={FileText}>{c.description}</Row>}
      </div>

      {/* Articles */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Articles</p>
        <div className="space-y-2">
          {(order.items || []).map((it, i) => (
            <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border" style={{ borderColor: '#f0f0f4' }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: NAVY }}>{it.name}</p>
                <p className="text-xs text-gray-400">
                  {it.size ? `Taille ${it.size}` : ''}
                  {it.doubleSided ? ' · Recto-verso' : ''}
                  {it.numberOfColors ? ` · ${it.numberOfColors} couleur(s)` : ''}
                  {Array.isArray(it.selectedColors) && it.selectedColors.length ? ` · ${it.selectedColors.join(', ')}` : ''}
                </p>
              </div>
              <span className="flex-shrink-0 text-sm font-black px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>×{it.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logos / fichiers client */}
      {logos.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#9ca3af' }}>
            <ImageIcon size={13} /> Logo(s) client
          </p>
          <div className="flex flex-wrap gap-2">
            {logos.map((url, i) => <FileThumb key={i} url={url} />)}
          </div>
        </div>
      )}

      {/* Passage du designer (le designer n'envoie pas de fichier :
          on affiche sa note et la date, plus d'éventuels fichiers hérités) */}
      {showDesign && (design?.submittedAt || design?.files?.length > 0 || design?.notes) && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: PURPLE }}>
            <Palette size={13} /> Design terminé
            {design.submittedAt && (
              <span className="font-medium normal-case tracking-normal text-gray-400">
                — {new Date(design.submittedAt).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
                {design.by ? ` par ${design.by}` : ''}
              </span>
            )}
          </p>
          {design.files?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {design.files.map((url, i) => <FileThumb key={i} url={url} />)}
            </div>
          )}
          {design.notes && <p className="text-xs text-gray-500 mt-1 italic">« {design.notes} »</p>}
        </div>
      )}

      {/* Matières consommées */}
      {showMaterials && materials.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#9ca3af' }}>
            <Package size={13} /> Matières consommées
          </p>
          <div className="flex flex-wrap gap-2">
            {materials.map((m, i) => (
              <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#eff6ff', color: '#2563eb' }}>
                {m.name} ×{m.quantity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes de l'équipe (lecture seule — l'ajout se fait dans le détail) */}
      {showNotes && order.pipeline?.notes?.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#9ca3af' }}>
            <MessageSquare size={13} /> Notes de l'équipe
          </p>
          <div className="space-y-1.5">
            {order.pipeline.notes.map(n => (
              <div key={n._id} className="p-2 rounded-lg text-xs" style={{ background: '#f9fafb' }}>
                <p className="whitespace-pre-wrap break-words" style={{ color: NAVY }}>{n.text}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {ROLE_LABELS[n.role] || n.role}{n.by ? ` · ${n.by}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      {showHistory && order.pipeline?.history?.length > 0 && (
        <div>
          <button onClick={() => setOpenHistory(o => !o)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-70"
            style={{ color: '#9ca3af' }}>
            <History size={13} /> Historique ({order.pipeline.history.length})
            <ChevronDown size={13} className="transition-transform" style={{ transform: openHistory ? 'rotate(180deg)' : 'none' }} />
          </button>
          {openHistory && (
            <div className="mt-2 space-y-1.5 pl-2 border-l-2" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
              {order.pipeline.history.slice().reverse().map((h, i) => (
                <div key={i} className="text-xs text-gray-500">
                  <span className="font-semibold" style={{ color: NAVY }}>{STAGES[h.stage]?.label || h.stage}</span>
                  {h.by ? ` · ${h.by}` : ''} · {new Date(h.at).toLocaleString('fr-DZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {h.note ? <span className="block text-gray-400">{h.note}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default OrderSummary
