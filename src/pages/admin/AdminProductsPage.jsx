import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, AlertTriangle, Loader2, Search } from 'lucide-react'
import api from '../../utils/api'
import AdminProductForm from '../../Components/admin/AdminProductForm'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const CAT_LABELS = { Board: 'Boites', Bags: 'Sacs', Autocollants: 'Cartes', Paper: 'Papier' }

function AdminProductsPage() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showForm, setShowForm]   = useState(false)
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
  const openCreate = () => { setEditingProduct(null); setShowForm(true) }
  const openEdit   = p  => { setEditingProduct(p);   setShowForm(true) }

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()))
  const minPrice = p => p.sizes?.length ? Math.min(...p.sizes.map(s => s.price ?? 0)) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PURPLE }}>Catalogue</p>
          <h1 className="text-3xl font-black italic" style={{ color: NAVY }}>Produits</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg"
          style={{ background: PURPLE }}>
          <Plus size={16} /> Ajouter un produit
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border-2 border-dashed border-gray-200">
          <p className="text-5xl mb-3">📦</p>
          <p className="font-bold text-gray-400">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(product => (
            <div key={product._id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md
                         transition-all border border-gray-100 group">
              {/* Image pleine largeur */}
              <div className="w-full overflow-hidden bg-gray-50" style={{ aspectRatio: '4/3' }}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm truncate flex-1" style={{ color: NAVY }}>{product.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ background: PURPLE }}>
                    {CAT_LABELS[product.category] || product.category}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-lg" style={{ color: PURPLE }}>
                    {minPrice(product).toLocaleString('fr-DZ')}
                    <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
                  </span>
                  <span className="text-xs text-gray-400">{product.sizes?.length ?? 0} taille{product.sizes?.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  {product.colors?.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                      {product.colors.length} couleur{product.colors.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {product.doubleSided && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                      Recto-verso
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                               text-xs font-bold border-2 transition-all"
                    style={{ borderColor: PURPLE, color: PURPLE }}
                    onMouseEnter={e => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = PURPLE }}>
                    <Edit2 size={12} /> Modifier
                  </button>
                  <button onClick={() => setDeleteConfirm(product)}
                    className="flex items-center justify-center px-3 py-2 rounded-xl border-2
                               border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: 'rgba(30,27,75,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditingProduct(null) } }}>
          <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '92dvh', minHeight: 0 }}
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
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: 'rgba(30,27,75,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                           text-white font-bold text-sm bg-red-500 hover:opacity-90">
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