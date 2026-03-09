import { useState, useEffect } from 'react'
import { Loader2, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import api from '../../utils/api'
import AdminOrderRow from '../../Components/admin/AdminOrderRow'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const STATUS_FILTERS = ['Tous', 'en attente', 'confirmé', 'en livraison', 'livré', 'retour', 'annulé']
const STATUS_LABELS  = { 'en attente': 'En attente', confirmé: 'Confirmé', 'en livraison': 'En livraison', livré: 'Livré', retour: 'Retour', annulé: 'Annulé' }
const STATUS_COLORS  = { 'en attente': '#9ca3af', confirmé: '#3b82f6', 'en livraison': '#f59e0b', livré: '#10b981', retour: '#f97316', annulé: '#ef4444' }

function AdminOrdersPage() {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [sortField, setSortField]     = useState('createdAt')
  const [sortDir, setSortDir]         = useState('desc')

  const fetchOrders = async () => {
    setLoading(true)
    try { const res = await api.get('/orders'); setOrders(res.data || []) }
    catch { toast.error('Erreur chargement commandes') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleUpdated = updated => setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))

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

  const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})

  const SortIcon = ({ field }) => sortField !== field
    ? <ChevronDown size={12} className="opacity-30" />
    : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* En-tête */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PURPLE }}>Suivi</p>
          <h1 className="text-3xl font-black italic" style={{ color: NAVY }}>Commandes</h1>
        </div>
        <p className="text-sm text-gray-400">{filtered.length} / {orders.length} commande{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filtres statut */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl
                       border-2 transition-all"
            style={{
              background:   statusFilter === s ? PURPLE : 'white',
              borderColor:  statusFilter === s ? PURPLE : '#e5e7eb',
              color:        statusFilter === s ? 'white' : (s === 'Tous' ? NAVY : STATUS_COLORS[s] || NAVY),
            }}>
            {s === 'Tous' ? `Tous (${orders.length})` : `${STATUS_LABELS[s]} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nom, téléphone, wilaya..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm
                     outline-none focus:border-purple-400 transition-all" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Tableau */}
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
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {[
                    { label: 'Client',      field: null,        cls: '' },
                    { label: 'Localisation',field: null,        cls: 'hidden md:table-cell' },
                    { label: 'Articles',    field: null,        cls: 'hidden lg:table-cell' },
                    { label: 'Total',       field: 'total',     cls: 'text-right' },
                    { label: 'Date',        field: 'createdAt', cls: 'hidden sm:table-cell' },
                    { label: 'Statut',      field: null,        cls: '' },
                  ].map(({ label, field, cls }) => (
                    <th key={label}
                      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-widest
                                  ${cls} ${field ? 'cursor-pointer select-none' : ''}`}
                      style={{ color: PURPLE }}
                      onClick={() => field && toggleSort(field)}>
                      <span className="flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <AdminOrderRow key={order._id} order={order} onUpdated={handleUpdated} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrdersPage