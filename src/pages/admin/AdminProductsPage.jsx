import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, X, AlertTriangle, Loader2, Search, GripVertical, ChevronDown } from 'lucide-react'
import api from '../../utils/api'
import AdminProductForm from '../../Components/admin/AdminProductForm'
import toast from 'react-hot-toast'

const NAVY      = '#1e1b4b'
const PURPLE    = '#7c3aed'
const CAT_ORDER = ['Board', 'Bags', 'Autocollants', 'Paper']
const CAT_LABELS = { Board: 'Boites', Bags: 'Sacs', Autocollants: 'Cartes et Autocollants', Paper: 'Papier' }

/* ─────────────────────────────────────────────
   Groupe drag-and-drop pour une catégorie
───────────────────────────────────────────── */
function CategoryGroup({ category, products, onEdit, onDelete, deletingId, onReorder }) {
  const [open, setOpen]           = useState(true)
  const [items, setItems]         = useState(products)
  const [saving, setSaving]       = useState(false)
  const dragIdx                   = useRef(null)
  const dragOverIdx               = useRef(null)

  useEffect(() => { setItems(products) }, [products])

  const minPrice = p => p.sizes?.length ? Math.min(...p.sizes.map(s => s.price ?? 0)) : 0

  /* ── Drag handlers ── */
  const onDragStart = (i) => { dragIdx.current = i }
  const onDragEnter = (i) => {
    dragOverIdx.current = i
    if (dragIdx.current === i) return
    const next = [...items]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(i, 0, moved)
    dragIdx.current = i
    setItems(next)
  }
  const onDragEnd = async () => {
    dragIdx.current   = null
    dragOverIdx.current = null
    // Sauvegarde l'ordre en BDD
    setSaving(true)
    try {
      await api.put('/products/reorder', items.map((p, idx) => ({ id: p._id, position: idx })))
      onReorder(category, items)
      toast.success('Ordre sauvegardé')
    } catch { toast.error('Erreur sauvegarde ordre') }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header catégorie */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-black px-3 py-1 rounded-full text-white"
            style={{ background: PURPLE }}>
            {CAT_LABELS[category]}
          </span>
          <span className="text-xs text-gray-400 font-medium">{items.length} produit{items.length !== 1 ? 's' : ''}</span>
          {saving && <Loader2 size={13} className="animate-spin text-purple-400" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">Glisser pour réordonner</span>
          <ChevronDown size={16} className={`transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Grille produits */}
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((product, i) => (
            <div
              key={product._id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
              className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group
                         transition-all hover:shadow-md cursor-grab active:cursor-grabbing active:opacity-70"
              style={{ userSelect: 'none' }}
            >
              {/* Badge position */}
              <div className="relative">
                <div className="w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  }
                </div>
                {/* Poignée drag */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center shadow"
                  style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <GripVertical size={14} style={{ color: PURPLE }} />
                </div>
                {/* Position badge */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow"
                  style={{ background: PURPLE, color: 'white' }}>
                  {i + 1}
                </div>
              </div>

              <div className="p-3">
                <p className="font-bold text-sm truncate mb-1" style={{ color: NAVY }}>{product.name}</p>
                <p className="font-black text-base mb-3" style={{ color: PURPLE }}>
                  {minPrice(product).toLocaleString('fr-DZ')}
                  <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={() => onEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                               text-xs font-bold border-2 transition-all"
                    style={{ borderColor: PURPLE, color: PURPLE }}
                    onMouseEnter={e => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = PURPLE }}>
                    <Edit2 size={11} /> Modifier
                  </button>
                  <button onClick={() => onDelete(product)}
                    className="px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-all">
                    {deletingId === product._id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Page principale
───────────────────────────────────────────── */
function AdminProductsPage() {
  const [products, setProducts]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [showForm, setShowForm]             = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingId, setDeletingId]         = useState(null)
  const [deleteConfirm, setDeleteConfirm]   = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    try { const res = await api.get('/products'); setProducts(res.data || []) }
    catch { toast.error('Erreur chargement produits') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async id => {
    setDeletingId(id)
    try { await api.delete(`/products/${id}`); toast.success('Produit supprimé'); setProducts(p => p.filter(x => x._id !== id)) }
    catch { toast.error('Erreur suppression') }
    finally { setDeletingId(null); setDeleteConfirm(null) }
  }

  const handleFormSuccess = () => { setShowForm(false); setEditingProduct(null); fetchProducts() }
  const openEdit = p => { setEditingProduct(p); setShowForm(true) }

  /* Met à jour l'ordre local après drag */
  const handleReorder = (category, newItems) => {
    setProducts(prev => [
      ...prev.filter(p => p.category !== category),
      ...newItems,
    ])
  }

  /* Grouper par catégorie dans l'ordre défini */
  const byCat = CAT_ORDER.map(cat => ({
    cat,
    items: products
      .filter(p => p.category === cat &&
        (!search || p.name?.toLowerCase().includes(search.toLowerCase())))
      .sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999)),
  })).filter(g => g.items.length > 0 || !search)

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PURPLE }}>Catalogue</p>
          <h1 className="text-3xl font-black italic" style={{ color: NAVY }}>Produits</h1>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowForm(true) }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: PURPLE }}>
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm
                     outline-none focus:border-purple-400 transition-all" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={12} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: PURPLE }} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border-2 border-dashed border-gray-200">
          <p className="text-5xl mb-3">📦</p>
          <p className="font-bold text-gray-400">Aucun produit</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byCat.map(({ cat, items }) => (
            <CategoryGroup
              key={cat}
              category={cat}
              products={items}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              deletingId={deletingId}
              onReorder={handleReorder}
            />
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: 'rgba(30,27,75,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditingProduct(null) } }}>
          <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '92dvh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
              style={{ background: NAVY }}>
              <h2 className="text-white font-black italic text-sm sm:text-base">
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingProduct(null) }}
                className="p-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
              <AdminProductForm initialData={editingProduct} onSuccess={handleFormSuccess}
                onCancel={() => { setShowForm(false); setEditingProduct(null) }} />
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteConfirm && (
        <div className="fixed z-50 flex items-center justify-center p-4"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: 'rgba(30,27,75,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <h3 className="font-black text-base" style={{ color: NAVY }}>Supprimer ?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-bold text-gray-700">{deleteConfirm.name}</span> sera supprimé définitivement.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm._id)} disabled={deletingId === deleteConfirm._id}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500 hover:opacity-90">
                {deletingId === deleteConfirm._id && <Loader2 size={14} className="animate-spin" />}
                Supprimer
              </button>
              <button onClick={() => setDeleteConfirm(null)}
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

export default AdminProductsPage
