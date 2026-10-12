// src/Components/staff/OrderSearch.jsx
// Recherche transverse : n'importe quel service retrouve une commande et voit
// immédiatement CHEZ QUI elle se trouve. Le résultat s'ouvre en lecture seule
// — chercher une commande ne donne pas le droit d'agir dessus.
// Seule exception : la confirmatrice peut ANNULER une commande d'ici, même
// partie dans un autre service (c'est elle qui a le client au téléphone).

import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Loader2, X } from 'lucide-react'
import staffApi from '../../utils/staffApi'
import OrderDetailModal from './OrderDetailModal'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { NAVY, PURPLE, whereIs, shortRef, thumb, canAct, ORDERS_CHANGED } from './staffConfig'

const isPdf = (url) => /\.pdf($|\?)/i.test(url || '')

// Pages du service confirmation (autonome, et dans le hub /staff)
const PAGES_CONFIRMATRICE = ['/confirmatrice', '/staff/confirmation']

function ResultRow({ order, onOpen }) {
  const c   = order.customerInfo || {}
  const loc = whereIs(order)
  const img = (c.logoUrls || []).find(u => !isPdf(u))

  return (
    <button onClick={() => onOpen(order)}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-purple-50">
      {img
        ? <img src={thumb(img, 80)} alt="" width={36} height={36} loading="lazy"
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        : <span className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: '#f5f3ff' }} />}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-bold truncate" style={{ color: NAVY }}>
            {c.firstName} {c.lastName}
          </span>
          <span className="text-[10px] text-gray-300 font-mono flex-shrink-0">
            #{shortRef(order._id)}
          </span>
        </span>
        <span className="block text-xs text-gray-400 truncate">{c.phone}</span>
      </span>

      {/* Le service qui détient la commande */}
      <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 text-right"
        style={{ background: loc.bg, color: loc.color }}>
        {loc.label}
      </span>
    </button>
  )
}

function OrderSearch({ compact = false }) {
  const [q, setQ]           = useState('')
  const [results, setResults] = useState(null)   // null = pas de recherche en cours
  const [loading, setLoading] = useState(false)
  const [open, setOpen]     = useState(false)
  const [selected, setSelected] = useState(null)
  const boxRef = useRef(null)

  const { role }     = useStaffAuth()
  const { pathname } = useLocation()
  const canCancel = PAGES_CONFIRMATRICE.includes(pathname) && canAct(role, 'confirmation')

  /* Après annulation : la fiche ouverte et la ligne de résultat reflètent le
     nouvel état, et la page derrière est prévenue pour rafraîchir ses listes.
     On ne reprend que l'état de la commande — la réponse du serveur ne porte
     ni les produits ni les étiquettes détaillés. */
  const handleCancelled = (upd) => {
    if (!upd?._id) return
    const merge = (o) => (o && o._id === upd._id ? {
      ...o, status: upd.status,
      pipeline: { ...o.pipeline, ...upd.pipeline, customTags: o.pipeline?.customTags },
    } : o)
    setSelected(merge)
    setResults(r => (r ? r.map(merge) : r))
    window.dispatchEvent(new Event(ORDERS_CHANGED))
  }

  /* Fermer le volet en cliquant à côté */
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  /* Recherche débouncée — une requête par pause de frappe, pas par lettre */
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setResults(null); setLoading(false); return }

    setLoading(true)
    const t = setTimeout(() => {
      staffApi.get('/workflow/search', { params: { q: term } })
        .then(r => setResults(r.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div ref={boxRef} className={`relative ${compact ? 'w-full sm:w-72' : 'w-full'}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: PURPLE }} />
      <input value={q} onFocus={() => setOpen(true)}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        placeholder="Chercher une commande (nom, téléphone, réf.)"
        className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors bg-white focus:border-purple-400"
        style={{ borderColor: '#e5e7eb', color: NAVY }} />
      {q && (
        <button onClick={() => { setQ(''); setResults(null) }} title="Effacer"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <X size={14} />
        </button>
      )}

      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-white overflow-hidden z-50"
          style={{ border: '2px solid rgba(124,58,237,0.2)', boxShadow: '0 8px 32px rgba(124,58,237,0.15)' }}>
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-5 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" /> Recherche…
            </p>
          ) : !results || results.length === 0 ? (
            <p className="py-5 text-center text-sm text-gray-400">Aucune commande trouvée.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {results.map(o => (
                <ResultRow key={o._id} order={o}
                  onOpen={ord => { setSelected(ord); setOpen(false) }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* La recherche sert à situer la commande, pas à la faire avancer : pas
          d'actions d'étape. Les notes, elles, restent ouvertes — un service
          doit pouvoir signaler quelque chose sur une commande déjà partie. */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          summaryOpts={{ service: 'chef' }}
          notesReadOnly={false}
          onTagsChanged={upd => upd?._id && setSelected(upd)}
          /* Une commande livrée (« terminée ») n'est plus chez aucun service */
          onCancelled={canCancel && selected.pipeline?.stage !== 'termine' ? handleCancelled : undefined}
        />
      )}
    </div>
  )
}

export default OrderSearch
