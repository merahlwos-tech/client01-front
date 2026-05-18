import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronDown, ChevronUp, Search, X, Trash2, AlertTriangle, Eye, Tag } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const STATUS_FILTERS = ['Tous', 'en attente', 'confirmé', 'annulé']
const STATUS_LABELS  = { 'en attente': 'En attente', confirmé: 'Confirmé', annulé: 'Annulé' }
const STATUS_COLORS  = { 'en attente': '#9ca3af', confirmé: '#10b981', annulé: '#ef4444' }
const STATUS_OPTIONS = [
  { value: 'en attente', label: 'En attente', color: '#9ca3af' },
  { value: 'confirmé',   label: 'Confirmé',   color: '#10b981' },
  { value: 'annulé',     label: 'Annulé',     color: '#ef4444' },
]

/* ─────────────────────────── CARD MOBILE ─────────────────────────── */
function OrderCard({ order, selected, onToggle, onDetail }) {
  const currentStatus = STATUS_OPTIONS.find(o => o.value === order.status)
  const dateStr = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border transition-all"
      style={{
        borderColor: selected ? PURPLE : '#f0f0f5',
        background: selected ? 'rgba(124,58,237,0.02)' : 'white',
      }}>

      {/* Ligne 1 : checkbox + nom + œil */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox" checked={selected} onChange={onToggle}
          className="mt-0.5 w-4 h-4 flex-shrink-0 accent-purple-600 cursor-pointer" />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight" style={{ color: NAVY }}>
            {order.customerInfo.firstName} {order.customerInfo.lastName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.customerInfo.phone}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {order.customerInfo.wilaya} · {order.customerInfo.commune}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-gray-400">{dateStr}</span>
          <button
            onClick={onDetail}
            className="p-2 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.08)', color: PURPLE }}>
            <Eye size={15} />
          </button>
        </div>
      </div>

      {/* Ligne 2 : articles résumé */}
      {order.items?.length > 0 && (
        <p className="text-xs text-gray-400 mt-2.5 truncate">
          {order.items.map(i => `${i.quantity.toLocaleString()}× ${i.name}`).join(' · ')}
        </p>
      )}

      {/* Tags */}
      {order.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {order.tags.map(tag => (
            <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
              # {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ligne 3 : statut + total */}
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: '1px solid #f3f4f6' }}>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
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
  const navigate                          = useNavigate()
  const [orders, setOrders]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('Tous')
  const [tagFilter, setTagFilter]         = useState('Tous')
  const [allTags, setAllTags]             = useState([])
  const [sortField, setSortField]         = useState('createdAt')
  const [sortDir, setSortDir]             = useState('desc')
  const [selected, setSelected]           = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const [ordersRes, tagsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/admin/tags'),
      ])
      setOrders(ordersRes.data || [])
      setAllTags(tagsRes.data || [])
    } catch {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const toggleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = orders
    .filter(o => {
      const matchStatus = statusFilter === 'Tous' || o.status === statusFilter
      const matchTag    = tagFilter === 'Tous' || (o.tags || []).includes(tagFilter)
      const matchSearch = !search.trim() ||
        `${o.customerInfo.firstName} ${o.customerInfo.lastName} ${o.customerInfo.phone} ${o.customerInfo.wilaya}`
          .toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchTag && matchSearch
    })
    .sort((a, b) => {
      const va = sortField === 'total' ? a.total : new Date(a.createdAt)
      const vb = sortField === 'total' ? b.total : new Date(b.createdAt)
      return sortDir === 'asc' ? va - vb : vb - va
    })

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o._id))
  const toggleAll   = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map(o => o._id)))
  const toggleOne   = id => {
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
    } catch {
      toast.error('Erreur suppression')
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const counts   = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  const SortIcon = ({ field }) => sortField !== field
    ? <ChevronDown size={12} className="opacity-30" />
    : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: PURPLE }}>
            Suivi
          </p>
          <h1 className="text-2xl sm:text-3xl font-black italic" style={{ color: NAVY }}>
            Commandes
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white font-bold text-xs bg-red-500">
              <Trash2 size={13} />
              Supprimer ({selected.size})
            </button>
          )}
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} / {orders.length}
          </p>
        </div>
      </div>

      {/* ── Filtres statut ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border-2 transition-all flex-shrink-0 whitespace-nowrap"
            style={{
              background:  statusFilter === s ? PURPLE : 'white',
              borderColor: statusFilter === s ? PURPLE : '#e5e7eb',
              color:       statusFilter === s ? 'white' : (STATUS_COLORS[s] || NAVY),
            }}>
            {s === 'Tous'
              ? `Tous (${orders.length})`
              : `${STATUS_LABELS[s]} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* ── Filtre par tag ── */}
      {allTags.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {['Tous', ...allTags].map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-xl border-2 transition-all flex-shrink-0 whitespace-nowrap"
              style={{
                background:  tagFilter === tag ? PURPLE : 'white',
                borderColor: tagFilter === tag ? PURPLE : '#e5e7eb',
                color:       tagFilter === tag ? 'white' : NAVY,
              }}>
              {tag !== 'Tous' && <Tag size={9} />}
              {tag === 'Tous' ? 'Tous les tags' : tag}
            </button>
          ))}
        </div>
      )}

      {/* ── Recherche ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nom, téléphone, wilaya..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm outline-none focus:border-purple-400 transition-all" />
        {search && (
          <button
            onClick={() => setSearch('')}
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
          {/* ── MOBILE (< 768px) : cartes ── */}
          <div className="md:hidden space-y-3">
            {filtered.length > 1 && (
              <label className="flex items-center gap-2 px-1 cursor-pointer">
                <input
                  type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="w-4 h-4 accent-purple-600" />
                <span className="text-xs text-gray-400 font-medium select-none">
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </span>
              </label>
            )}
            {filtered.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                selected={selected.has(order._id)}
                onToggle={() => toggleOne(order._id)}
                onDetail={() => navigate(`/admin/orders/${order._id}`)} />
            ))}
          </div>

          {/* ── TABLET / DESKTOP (≥ 768px) : tableau ── */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6', background: 'rgba(124,58,237,0.03)' }}>
                    <th className="px-3 lg:px-4 py-3 w-10">
                      <input
                        type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-4 h-4 rounded cursor-pointer accent-purple-600" />
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: PURPLE }}>
                      Client
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest hidden lg:table-cell" style={{ color: PURPLE }}>
                      Wilaya
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest hidden xl:table-cell" style={{ color: PURPLE }}>
                      Articles
                    </th>
                    <th
                      className="px-3 lg:px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer select-none text-right"
                      style={{ color: PURPLE }}
                      onClick={() => toggleSort('total')}>
                      <span className="flex items-center justify-end gap-1">
                        Total <SortIcon field="total" />
                      </span>
                    </th>
                    <th
                      className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest cursor-pointer select-none"
                      style={{ color: PURPLE }}
                      onClick={() => toggleSort('createdAt')}>
                      <span className="flex items-center gap-1">
                        Date <SortIcon field="createdAt" />
                      </span>
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: PURPLE }}>
                      Statut
                    </th>
                    <th className="px-3 lg:px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const cs = STATUS_OPTIONS.find(o => o.value === order.status)
                    return (
                      <tr
                        key={order._id}
                        className="transition-colors hover:bg-gray-50"
                        style={{
                          borderBottom: '1px solid #f9fafb',
                          background: selected.has(order._id) ? 'rgba(124,58,237,0.03)' : 'transparent',
                        }}>
                        <td className="px-3 lg:px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(order._id)}
                            onChange={() => toggleOne(order._id)}
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
                          {new Date(order.createdAt).toLocaleDateString('fr-DZ', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                          })}
                        </td>
                        <td className="px-3 lg:px-4 py-3">
                          <span
                            className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                            style={{ background: `${cs?.color}15`, color: cs?.color }}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                          {order.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {order.tags.map(tag => (
                                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 lg:px-4 py-3">
                          <button
                            onClick={() => navigate(`/admin/orders/${order._id}`)}
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

      {/* ── Confirmation suppression ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(30,27,75,0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}>
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
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Supprimer
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
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
