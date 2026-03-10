import { useState, useEffect } from 'react'
import { Loader2, ChevronDown, ChevronUp, Search, X, Trash2, AlertTriangle, Eye, Download } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const STATUS_FILTERS = ['Tous', 'en attente', 'confirmé', 'en livraison', 'livré', 'retour', 'annulé']
const STATUS_LABELS  = { 'en attente': 'En attente', confirmé: 'Confirmé', 'en livraison': 'En livraison', livré: 'Livré', retour: 'Retour', annulé: 'Annulé' }
const STATUS_COLORS  = { 'en attente': '#9ca3af', confirmé: '#3b82f6', 'en livraison': '#f59e0b', livré: '#10b981', retour: '#f97316', annulé: '#ef4444' }
const STATUS_OPTIONS = [
  { value: 'en attente',   label: 'En attente',   color: '#9ca3af' },
  { value: 'confirmé',     label: 'Confirmé',     color: '#3b82f6' },
  { value: 'en livraison', label: 'En livraison', color: '#f59e0b' },
  { value: 'livré',        label: 'Livré',        color: '#10b981' },
  { value: 'retour',       label: 'Retour',       color: '#f97316' },
  { value: 'annulé',       label: 'Annulé',       color: '#ef4444' },
]

/* ─────────────────────────── MODAL DÉTAIL ─────────────────────────── */
function OrderDetailModal({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/orders/${order._id}`, { status })
      toast.success('Statut mis à jour')
      setDirty(false)
      onUpdated({ ...order, status })
    } catch { toast.error('Erreur mise à jour') }
    finally { setSaving(false) }
  }

  const downloadLogo = async (url, idx) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `logo-${order._id}-${idx + 1}.jpg`
      a.click()
    } catch { toast.error('Erreur téléchargement') }
  }

  const createdAt = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const currentOpt = STATUS_OPTIONS.find(o => o.value === status)

  return (
    /* Backdrop — 100% inline styles pour max compatibilité Android */
    <div
      style={{
        position: 'fixed', zIndex: 50,
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(30,27,75,0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      {/* Sheet — toujours bottom sheet, 92vh max */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -8px 40px rgba(30,27,75,0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          minHeight: 0,
          flexShrink: 0,
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header — ne rétrécit jamais */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(124,58,237,0.1)',
          flexShrink: 0,
        }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest truncate" style={{ color: PURPLE }}>
              #{order._id.slice(-6).toUpperCase()}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{createdAt}</p>
          </div>
          {/* Statut badge dans le header */}
          <span className="mx-3 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
            style={{ background: `${currentOpt?.color}18`, color: currentOpt?.color }}>
            {STATUS_LABELS[status]}
          </span>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={18} style={{ color: NAVY }} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          flex: 1,
          overscrollBehavior: 'contain',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>

          {/* Client — 2×2 grid */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.1)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: PURPLE }}>Client</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5">Nom</p>
                <p className="font-bold text-sm truncate" style={{ color: NAVY }}>
                  {order.customerInfo.firstName} {order.customerInfo.lastName}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5">Téléphone</p>
                <a href={`tel:${order.customerInfo.phone}`}
                  className="font-bold text-sm block truncate" style={{ color: PURPLE }}>
                  {order.customerInfo.phone}
                </a>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5">Wilaya</p>
                <p className="font-semibold text-sm truncate" style={{ color: NAVY }}>{order.customerInfo.wilaya}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5">Commune</p>
                <p className="font-semibold text-sm truncate" style={{ color: NAVY }}>{order.customerInfo.commune}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {order.customerInfo.description && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: PURPLE }}>
                Instructions
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
                {order.customerInfo.description}
              </div>
            </div>
          )}

          {/* Logos */}
          {order.customerInfo.logoUrls?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: PURPLE }}>Logo client</p>
              <div className="flex gap-3 flex-wrap">
                {order.customerInfo.logoUrls.map((url, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    <img src={url} alt={`logo ${idx + 1}`}
                      className="w-20 h-20 object-contain rounded-xl border-2 bg-gray-50"
                      style={{ borderColor: 'rgba(124,58,237,0.2)' }} />
                    <button onClick={() => downloadLogo(url, idx)}
                      className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold shadow"
                      style={{ background: PURPLE }}>
                      <Download size={10} /> DL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: PURPLE }}>Articles</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate" style={{ color: NAVY }}>{item.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.size}{item.doubleSided && <span className="ml-2 text-purple-500">• Recto-verso</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-gray-400">{item.quantity.toLocaleString()} u.</p>
                    <p className="font-black text-sm" style={{ color: PURPLE }}>
                      {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center px-4 py-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <span className="font-bold text-sm" style={{ color: NAVY }}>Total commande</span>
            <span className="font-black text-2xl" style={{ color: PURPLE }}>
              {(order.total ?? 0).toLocaleString('fr-DZ')}
              <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
            </span>
          </div>

          {/* Statut */}
          <div className="pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: PURPLE }}>
              Changer le statut
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { setStatus(opt.value); setDirty(opt.value !== order.status) }}
                  className="py-2 px-1 rounded-xl text-[11px] font-bold border-2 transition-all text-center leading-tight"
                  style={{
                    background:  status === opt.value ? opt.color : 'white',
                    borderColor: status === opt.value ? opt.color : '#e5e7eb',
                    color:       status === opt.value ? 'white'  : opt.color,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {dirty && (
              <button onClick={handleSave} disabled={saving}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: PURPLE }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Enregistrer le statut
              </button>
            )}
          </div>

        </div>{ /* fin body */ }
      </div>
    </div>
  )
}

/* ─────────────────────────── CARD MOBILE ─────────────────────────── */
function OrderCard({ order, selected, onToggle, onDetail }) {
  const currentStatus = STATUS_OPTIONS.find(o => o.value === order.status)
  const dateStr = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border transition-all"
      style={{
        borderColor: selected ? PURPLE : '#f3f4f6',
        background: selected ? 'rgba(124,58,237,0.02)' : 'white',
      }}>
      {/* Ligne 1 : checkbox + nom + date + œil */}
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={selected} onChange={onToggle}
          className="w-4 h-4 flex-shrink-0 accent-purple-600 cursor-pointer" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: NAVY }}>
            {order.customerInfo.firstName} {order.customerInfo.lastName}
          </p>
          <p className="text-xs text-gray-400 truncate">{order.customerInfo.phone} · {order.customerInfo.wilaya}</p>
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{dateStr}</span>
        <button onClick={onDetail}
          className="p-2 rounded-xl flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.08)', color: PURPLE }}>
          <Eye size={15} />
        </button>
      </div>

      {/* Ligne 2 : statut + total */}
      <div className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: '1px solid #f3f4f6' }}>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${currentStatus?.color}18`, color: currentStatus?.color }}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
        <span className="font-black text-base" style={{ color: PURPLE }}>
          {(order.total ?? 0).toLocaleString('fr-DZ')}
          <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────── PAGE PRINCIPALE ─────────────────────── */
function AdminOrdersPage() {
  const [orders, setOrders]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [sortField, setSortField]       = useState('createdAt')
  const [sortDir, setSortDir]           = useState('desc')
  const [selected, setSelected]         = useState(new Set())
  const [detailOrder, setDetailOrder]   = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting]         = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try { const res = await api.get('/orders'); setOrders(res.data || []) }
    catch { toast.error('Erreur chargement commandes') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleUpdated = updated => {
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
    if (detailOrder?._id === updated._id) setDetailOrder(updated)
  }

  const toggleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = orders
    .filter(o => {
      const matchStatus = statusFilter === 'Tous' || o.status === statusFilter
      const matchSearch = !search ||
        `${o.customerInfo.firstName} ${o.customerInfo.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        o.customerInfo.phone.includes(search) ||
        o.customerInfo.wilaya.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
    .sort((a, b) => {
      const va = sortField === 'total' ? a.total : new Date(a.createdAt)
      const vb = sortField === 'total' ? b.total : new Date(b.createdAt)
      return sortDir === 'asc' ? va - vb : vb - va
    })

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o._id))
  const toggleAll   = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map(o => o._id)))
  }
  const toggleOne = id => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const handleDeleteSelected = async () => {
    setDeleting(true)
    try {
      await Promise.all([...selected].map(id => api.delete(`/orders/${id}`)))
      setOrders(prev => prev.filter(o => !selected.has(o._id)))
      setSelected(new Set())
      toast.success(`${selected.size} commande(s) supprimée(s)`)
    } catch { toast.error('Erreur suppression') }
    finally { setDeleting(false); setDeleteConfirm(false) }
  }

  const counts    = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  const SortIcon  = ({ field }) => sortField !== field
    ? <ChevronDown size={12} className="opacity-30" />
    : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: PURPLE }}>Suivi</p>
          <h1 className="text-2xl sm:text-3xl font-black italic" style={{ color: NAVY }}>Commandes</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white font-bold text-xs bg-red-500">
              <Trash2 size={13} /> Supprimer ({selected.size})
            </button>
          )}
          <p className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} / {orders.length}</p>
        </div>
      </div>

      {/* ── Filtres statut — scroll horizontal ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border-2 transition-all flex-shrink-0"
            style={{
              background:  statusFilter === s ? PURPLE : 'white',
              borderColor: statusFilter === s ? PURPLE : '#e5e7eb',
              color:       statusFilter === s ? 'white' : (STATUS_COLORS[s] || NAVY),
            }}>
            {s === 'Tous' ? `Tous (${orders.length})` : `${STATUS_LABELS[s]} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* ── Recherche ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nom, téléphone, wilaya..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm
                     outline-none focus:border-purple-400 transition-all" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: PURPLE }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border-2 border-dashed border-gray-200">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-bold text-gray-400">Aucune commande trouvée</p>
        </div>
      ) : (
        <>
          {/* ── MOBILE : cartes ── */}
          <div className="md:hidden space-y-3">
            {/* Sélectionner tout (mobile) */}
            {filtered.length > 1 && (
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="w-4 h-4 accent-purple-600 cursor-pointer" />
                <span className="text-xs text-gray-400 font-medium">
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </span>
              </div>
            )}
            {filtered.map(order => (
              <OrderCard key={order._id}
                order={order}
                selected={selected.has(order._id)}
                onToggle={() => toggleOne(order._id)}
                onDetail={() => setDetailOrder(order)} />
            ))}
          </div>

          {/* ── TABLET/DESKTOP : tableau ── */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <th className="px-3 lg:px-4 py-3 w-10">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-4 h-4 rounded cursor-pointer accent-purple-600" />
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Client</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest hidden lg:table-cell" style={{ color: PURPLE }}>Wilaya</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest hidden xl:table-cell" style={{ color: PURPLE }}>Articles</th>
                    <th className="px-3 lg:px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer select-none text-right"
                      style={{ color: PURPLE }} onClick={() => toggleSort('total')}>
                      <span className="flex items-center justify-end gap-1">Total <SortIcon field="total" /></span>
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest cursor-pointer select-none"
                      style={{ color: PURPLE }} onClick={() => toggleSort('createdAt')}>
                      <span className="flex items-center gap-1">Date <SortIcon field="createdAt" /></span>
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Statut</th>
                    <th className="px-3 lg:px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const currentStatus = STATUS_OPTIONS.find(o => o.value === order.status)
                    return (
                      <tr key={order._id}
                        className="transition-colors hover:bg-gray-50"
                        style={{ borderBottom: '1px solid #f9fafb', background: selected.has(order._id) ? 'rgba(124,58,237,0.03)' : 'transparent' }}>
                        <td className="px-3 lg:px-4 py-3">
                          <input type="checkbox" checked={selected.has(order._id)} onChange={() => toggleOne(order._id)}
                            className="w-4 h-4 rounded cursor-pointer accent-purple-600" />
                        </td>
                        <td className="px-3 lg:px-4 py-3">
                          <p className="font-bold text-sm" style={{ color: NAVY }}>
                            {order.customerInfo.firstName} {order.customerInfo.lastName}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">{order.customerInfo.phone}</p>
                        </td>
                        <td className="px-3 lg:px-4 py-3 hidden lg:table-cell text-sm text-gray-600">
                          {order.customerInfo.wilaya}
                        </td>
                        <td className="px-3 lg:px-4 py-3 hidden xl:table-cell">
                          <div className="space-y-0.5 max-w-[200px]">
                            {order.items.map((item, i) => (
                              <p key={i} className="text-xs text-gray-500 truncate">
                                {item.quantity.toLocaleString()}× {item.name}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-black text-base lg:text-lg" style={{ color: PURPLE }}>
                            {(order.total ?? 0).toLocaleString('fr-DZ')}
                            <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
                          </span>
                        </td>
                        <td className="px-3 lg:px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="px-3 lg:px-4 py-3">
                          <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                            style={{ background: `${currentStatus?.color}15`, color: currentStatus?.color }}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-3 lg:px-4 py-3">
                          <button onClick={() => setDetailOrder(order)}
                            className="p-2 rounded-xl transition-all hover:scale-110"
                            style={{ background: 'rgba(124,58,237,0.08)', color: PURPLE }}>
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal détail */}
      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} onUpdated={handleUpdated} />
      )}

      {/* Modal suppression */}
      {deleteConfirm && (
        <div className="fixed z-50 flex items-center justify-center p-4"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%',
                   background: 'rgba(30,27,75,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <h3 className="font-black text-base" style={{ color: NAVY }}>
                Supprimer {selected.size} commande{selected.size > 1 ? 's' : ''} ?
              </h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteSelected} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Supprimer
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrdersPage